import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";
import { DEFAULT_AI_SETTINGS } from "./aiConfig.js";
import { createBookTool, listBooksTool, getBookTool, updateBookTool, deleteBookTool, createNoteTool, listNotesTool, getNoteTool, updateNoteTool, deleteNoteTool, reorderNotesTool } from "./aiTools.js";
import { GoogleGenAI } from "@google/genai";
import {
  StateGraph,
  MessagesAnnotation,
  START,
  END,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

dotenv.config();

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

export const streamMessage = async function* (
  systemPrompt,
  messages,
  model,
  options = {},
  userId,
  threadId
) {
  const tools = [
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

  const chat = new ChatGoogleGenerativeAI({
    model: model || DEFAULT_AI_SETTINGS.model,
    apiKey: process.env.GEMINI_API_KEY,
    streamUsage: true,
    temperature:
      options.temperature ?? DEFAULT_AI_SETTINGS.temperature,
    maxOutputTokens:
      options.maxOutputTokens ??
      DEFAULT_AI_SETTINGS.maxOutputTokens,
  }).bindTools(tools);

  const callModel = async (state) => {
    const response = await chat.invoke(state.messages);

    return {
      messages: [response],
    };
  };

  const toolNode = new ToolNode(tools);

  const shouldContinue = (state) => {
    const lastMessage =
      state.messages[state.messages.length - 1];

    console.log("state", state);

    return lastMessage.tool_calls?.length
      ? "tools"
      : END;
  };

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "agent")
    .compile();

  const initialMessages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...messages,
  ];

  const result = await graph.invoke({
    messages: initialMessages,
  });

  // final response
  const finalMessage =
    result.messages[result.messages.length - 1];

  yield finalMessage;
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