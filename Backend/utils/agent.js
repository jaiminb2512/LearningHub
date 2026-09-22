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
import {
  startChatTrace,
  endTrace,
  recordError,
  flushObservability,
  messagePreview,
  getLangfuseCallbackHandler,
} from "../services/observabilityService.js";

dotenv.config();

/** Shared in-process checkpointer so HITL resume works across requests. */
const checkpointer = new MemorySaver();

const buildTools = (userId, threadId, knowledgeRagEnabled) => {
  if (knowledgeRagEnabled) {
    return [
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
    ]
  } else {
    return []
  }
};

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

const buildGraph = ({ model, options, userId, threadId, systemPrompt, knowledgeRagEnabled }) => {
  const tools = buildTools(userId, threadId, knowledgeRagEnabled);
  const modelName = model || DEFAULT_AI_SETTINGS.model;

  const chat = new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: process.env.GEMINI_API_KEY,
    streamUsage: true,
    temperature: options.temperature ?? DEFAULT_AI_SETTINGS.temperature,
    maxOutputTokens: options.maxOutputTokens ?? DEFAULT_AI_SETTINGS.maxOutputTokens,
  }).bindTools(tools);

  // LLM calls are auto-instrumented via the Langfuse CallbackHandler passed
  // in the graph invoke config (see streamMessage/resumeMessage), so no
  // manual generation tracking is needed here.
  const callModel = async (state) => {
    const inputMessages = normalizeMessagesForGemini(
      state.messages,
      systemPrompt
    );
    const response = await chat.invoke(inputMessages);
    return { messages: [response] };
  };

  const toolNode = new ToolNode(tools);

  const shouldContinue = (state) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage.tool_calls?.length) {
      return "tools";
    }
    return END;
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
  threadId
) {
  const trace = startChatTrace({
    name: "learninghub-chat",
    userId,
    threadId,
    input: messagePreview(messages),
    metadata: {
      model,
      flow: "stream",
      ragEnabled: options.ragEnabled,
    },
  });

  try {
    const graph = buildGraph({
      model,
      options,
      userId,
      threadId,
      systemPrompt,
      knowledgeRagEnabled: options.knowledgeRagEnabled
    });

    const langfuseHandler = getLangfuseCallbackHandler({
      userId,
      threadId,
      metadata: { model, flow: "stream" },
    });
    const config = {
      configurable: {
        thread_id: threadId,
      },
      callbacks: langfuseHandler ? [langfuseHandler] : undefined,
    };

    // Keep system prompt out of graph state; inject only when calling Gemini.
    const result = await graph.invoke({ messages }, config);
    const interruptPayload = extractInterruptPayload(result);

    if (interruptPayload) {
      endTrace(trace, {
        output: {
          status: "interrupted",
          interrupt: {
            type: interruptPayload.type,
            action: interruptPayload.action,
            message: interruptPayload.message,
          },
        },
        metadata: { status: "interrupted" },
      });
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
    endTrace(trace, {
      output: content,
      metadata: { status: "completed" },
    });
    if (content) {
      yield { type: "content", content };
    }
  } catch (error) {
    recordError(trace, error);
    throw error;
  } finally {
    await flushObservability();
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
}) {
  const normalizedDecision = normalizeHitlDecision(decision);
  const trace = startChatTrace({
    name: "learninghub-chat-resume",
    userId,
    threadId,
    input: {
      decision: {
        approved: normalizedDecision.approved,
        redirected: normalizedDecision.redirected,
        selected: normalizedDecision.selected,
        hasUserMessage: Boolean(normalizedDecision.userMessage),
      },
    },
    metadata: {
      model,
      flow: "resume",
    },
  });

  try {
    const graph = buildGraph({
      model,
      options,
      userId,
      threadId,
      systemPrompt,
    });

    const langfuseHandler = getLangfuseCallbackHandler({
      userId,
      threadId,
      metadata: { model, flow: "resume" },
    });
    const config = {
      configurable: {
        thread_id: threadId,
      },
      callbacks: langfuseHandler ? [langfuseHandler] : undefined,
    };

    const result = await graph.invoke(
      new Command({ resume: normalizedDecision }),
      config
    );

    const interruptPayload = extractInterruptPayload(result);
    if (interruptPayload) {
      endTrace(trace, {
        output: {
          status: "interrupted",
          interrupt: {
            type: interruptPayload.type,
            action: interruptPayload.action,
            message: interruptPayload.message,
          },
        },
        metadata: { status: "interrupted" },
      });
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
    endTrace(trace, {
      output: content,
      metadata: { status: "completed" },
    });
    if (content) {
      yield { type: "content", content };
    }
  } catch (error) {
    recordError(trace, error);
    throw error;
  } finally {
    await flushObservability();
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
