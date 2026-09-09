import prisma from "../dbConnect/prismaClient.js";
import { generateEmbedding } from "../utils/agent.js";
import { semanticSearch } from "./RAGService.js";

export const fetchSystemPrompt = async (name) => {
  const systemPrompt = await prisma.systemPrompt.findFirst({
    where: { name },
  });
  if (!systemPrompt) {
    return null;
  }
  return {
    name: systemPrompt.name,
    prompt: systemPrompt.prompt,
  };
};

/**
 * Build the system prompt for a turn.
 * When ragEnabled is false, skip embeddings/search and return base system prompt only.
 */
export const prompt = async (userId, threadId, userMessage, { ragEnabled = true } = {}) => {
  const threadData = await prisma.thread.findUnique({
    where: { threadId, userId },
    include: {
      systemPrompt: true,
    },
  });

  if (!threadData) return null;

  let promptText = threadData.systemPrompt?.prompt;
  if (!promptText) {
    return null;
  }

  if (!ragEnabled) {
    return promptText;
  }

  const userMessageQueryEmbedding = await generateEmbedding(userMessage);
  const documents = await semanticSearch(userId, userMessageQueryEmbedding, 5);

  const relatedDocs = documents
    .map((document) => document.content)
    .filter(Boolean)
    .join("\n\n");

  return (
    promptText +
    "\n\nHere are the related documents:\n" +
    (relatedDocs || "No related documents found.") +
    "\n\nUser message:\n" +
    userMessage
  );
};
