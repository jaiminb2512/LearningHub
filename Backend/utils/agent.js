import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";
import { DEFAULT_AI_SETTINGS } from "./aiConfig.js";

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

export const streamMessage = async (
  systemPrompt,
  messages,
  provider,
  model,
  options = {}
) => {
  const chat = new ChatGoogleGenerativeAI({
    model: model || DEFAULT_AI_SETTINGS.model,
    apiKey: process.env.GEMINI_API_KEY,
    streamUsage: true,
    temperature: options.temperature ?? DEFAULT_AI_SETTINGS.temperature,
    maxOutputTokens: options.maxOutputTokens ?? DEFAULT_AI_SETTINGS.maxOutputTokens,
  });

  return await chat.stream([
    { role: "system", content: systemPrompt },
    ...messages,
  ]);
};

export const generateEmbedding = async (text) => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GEMINI_API_KEY,
  });
  const vector = await embeddings.embedQuery(text);
  return vector;
};
