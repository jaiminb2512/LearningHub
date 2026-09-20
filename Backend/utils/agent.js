import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";
import { DEFAULT_AI_SETTINGS } from "./aiConfig.js";
import {
  createBookTool,
  listBooksTool,
  getBookTool,
  updateBookTool,
  deleteBookTool,
  createNoteTool,
  listNotesTool,
  getNoteTool,
  updateNoteTool,
  deleteNoteTool,
  reorderNotesTool,
} from "./aiTools.js";
import { GoogleGenAI } from "@google/genai";
import {
  StateGraph,
  MessagesAnnotation,
  START,
  END,
  MemorySaver,
  Command,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { normalizeHitlDecision } from "./hitl.js";
import { startSpan, finishSpan } from "../services/observabilityService.js";

dotenv.config();

/** Shared in-process checkpointer so HITL resume works across requests. */
const checkpointer = new MemorySaver();

const buildTools = (userId, threadId) => [
  createBookTool(userId, threadId),
  listBooksTool(userId),
  updateBookTool(userId),
  getBookTool(userId),
  deleteBookTool(userId),
  createNoteTool(userId),
  listNotesTool(userId),
  getNoteTool(userId),
  updateNoteTool(userId),
  deleteNoteTool(userId),
  reorderNotesTool(userId),
];

const isSystemMessage = (m) =>
  m?._getType?.() === "system" ||
  m?.getType?.() === "system" ||
  m?.role === "system";

/**
 * Gemini requires exactly one system message and it must be first.
 * LangGraph state can accumulate / reorder system entries across tool loops.
 */
const normalizeMessagesForGemini = (messages = [], fallbackSystemPrompt = "") => {
  const systemContents = [];
  const nonSystem = [];

  for (const message of messages) {
    if (isSystemMessage(message)) {
      const content =
        typeof message.content === "string"
          ? message.content
          : Array.isArray(message.content)
            ? message.content.map((c) => c?.text || "").join("")
            : message.content != null
              ? JSON.stringify(message.content)
              : "";
      if (content) systemContents.push(content);
      continue;
    }
    nonSystem.push(message);
  }

  const systemContent = systemContents[0] || fallbackSystemPrompt || "";
  if (!systemContent) {
    return nonSystem;
  }

  return [{ role: "system", content: systemContent }, ...nonSystem];
};

const buildGraph = ({ model, options, userId, threadId, systemPrompt, traceId }) => {
  const tools = buildTools(userId, threadId);

  const chat = new ChatGoogleGenerativeAI({
    model: model || DEFAULT_AI_SETTINGS.model,
    apiKey: process.env.GEMINI_API_KEY,
    streamUsage: true,
    temperature: options.temperature ?? DEFAULT_AI_SETTINGS.temperature,
    maxOutputTokens: options.maxOutputTokens ?? DEFAULT_AI_SETTINGS.maxOutputTokens,
  }).bindTools(tools);

  const callModel = async (state) => {
    const inputMessages = normalizeMessagesForGemini(
      state.messages,
      systemPrompt
    );
    const span = traceId ? await startSpan({
      traceId,
      name: "llm-generation",
      type: "generation",
      input: inputMessages,
      metadata: { model, temperature: options.temperature, maxOutputTokens: options.maxOutputTokens },
    }) : null;
    try {
      const response = await chat.invoke(inputMessages);
      const usage = response?.response_metadata?.tokenUsage || response?.usage_metadata || {};
      if (span) await finishSpan(span.spanId, {
        output: response?.content,
        metadata: {
          model,
          inputTokens: usage.promptTokens ?? usage.input_tokens ?? 0,
          outputTokens: usage.completionTokens ?? usage.output_tokens ?? 0,
          totalTokens: usage.totalTokens ?? usage.total_tokens ?? 0,
        },
      });
      return { messages: [response] };
    } catch (error) {
      if (span) await finishSpan(span.spanId, { status: "ERROR", errorMessage: error.message });
      throw error;
    }
  };

  const rawToolNode = new ToolNode(tools);
  const toolNode = async (state) => {
    const span = traceId ? await startSpan({
      traceId,
      name: "tool-execution",
      type: "tool",
      input: state.messages?.[state.messages.length - 1]?.tool_calls || [],
    }) : null;
    try {
      const result = await rawToolNode.invoke(state);
      if (span) await finishSpan(span.spanId, { output: result?.messages });
      return result;
    } catch (error) {
      if (span) await finishSpan(span.spanId, { status: "ERROR", errorMessage: error.message });
      throw error;
    }
  };

  const shouldContinue = (state) => {
    const lastMessage = state.messages[state.messages.length - 1];
    return lastMessage.tool_calls?.length ? "tools" : END;
  };

  return new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "agent")
    .compile({ checkpointer });
};

const extractInterruptPayload = (result) => {
  const interrupts = result?.__interrupt__;
  if (!Array.isArray(interrupts) || interrupts.length === 0) {
    return null;
  }
  const first = interrupts[0];
  return {
    id: first.id,
    ...(first.value && typeof first.value === "object" ? first.value : { value: first.value }),
  };
};

const extractAssistantText = (result) => {
  const messages = result?.messages || [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    const type = typeof msg?.getType === "function" ? msg.getType() : null;
    if (type === "ai" || msg?.role === "assistant") {
      if (typeof msg.content === "string") return msg.content;
      if (Array.isArray(msg.content)) {
        return msg.content
          .filter((c) => c?.type === "text")
          .map((c) => c.text)
          .join("");
      }
      if (msg.content != null) return JSON.stringify(msg.content);
    }
  }
  return "";
};

/**
 * Run the agent graph for a new user turn.
 * Yields { type: "interrupt", interrupt } when HITL pauses,
 * otherwise yields { type: "content", content }.
 */
export const streamMessage = async function* (
  systemPrompt,
  messages,
  model,
  options = {},
  userId,
  threadId,
  traceId
) {
  const graph = buildGraph({ model, options, userId, threadId, systemPrompt, traceId });

  const config = {
    configurable: {
      thread_id: threadId,
    },
  };

  // Keep system prompt out of graph state; inject only when calling Gemini.
  const result = await graph.invoke({ messages }, config);
  const interruptPayload = extractInterruptPayload(result);

  if (interruptPayload) {
    yield {
      type: "interrupt",
      interrupt: {
        ...interruptPayload,
        threadId,
      },
    };
    return;
  }

  const content = extractAssistantText(result);
  if (content) {
    yield { type: "content", content };
  }
};

/**
 * Resume a paused HITL graph for the same thread_id.
 */
export const resumeMessage = async function* ({
  threadId,
  userId,
  model,
  options = {},
  systemPrompt = "",
  decision,
  traceId,
}) {
  const graph = buildGraph({
    model,
    options,
    userId,
    threadId,
    systemPrompt,
    traceId,
  });

  const config = {
    configurable: {
      thread_id: threadId,
    },
  };

  const result = await graph.invoke(
    new Command({ resume: normalizeHitlDecision(decision) }),
    config
  );

  const interruptPayload = extractInterruptPayload(result);
  if (interruptPayload) {
    yield {
      type: "interrupt",
      interrupt: {
        ...interruptPayload,
        threadId,
      },
    };
    return;
  }

  const content = extractAssistantText(result);
  if (content) {
    yield { type: "content", content };
  }
};

export const generateMessage = async (
  systemPrompt,
  messages,
  provider,
  model,
  options = {}
) => {
  const chat = new ChatGoogleGenerativeAI({
    model: model || DEFAULT_AI_SETTINGS.model,
    apiKey: process.env.GEMINI_API_KEY,
    temperature: options.temperature ?? DEFAULT_AI_SETTINGS.temperature,
    maxOutputTokens: options.maxOutputTokens ?? DEFAULT_AI_SETTINGS.maxOutputTokens,
  });

  const response = await chat.invoke([
    { role: "system", content: systemPrompt },
    ...messages,
  ]);

  return response;
};

export const generateEmbedding = async (text) => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GEMINI_API_KEY,
  });
  const vector = await embeddings.embedQuery(text);
  return vector;
};

export const countTokens = async (text) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const tokenResult = await ai.models.countTokens({
    model: "gemini-embedding-001",
    contents: text,
  });
  return tokenResult;
};
