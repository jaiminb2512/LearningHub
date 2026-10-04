import prisma from "../dbConnect/prismaClient.js";
import { generateEmbedding } from "../utils/agent.js";
import {
  semanticSearch,
  semanticSearchKnowledgeChunks,
} from "./RAGService.js";

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

const formatKnowledgeContext = (chunks = []) => {
  if (!chunks.length) {
    return "";
  }

  return chunks
    .map((chunk, index) => {
      const sourceName = chunk.sourceName || "Uploaded file";
      const chunkNo =
        chunk.chunkIndex != null ? Number(chunk.chunkIndex) + 1 : index + 1;
      const score =
        chunk.similarity != null
          ? ` (similarity: ${Number(chunk.similarity).toFixed(3)})`
          : "";
      return `[${index + 1}] Source: ${sourceName} · chunk ${chunkNo}${score}\n${chunk.content}`;
    })
    .join("\n\n");
};

const formatChatMemoryContext = (documents = []) => {
  if (!documents.length) {
    return "";
  }

  return documents
    .map((document) => document.content)
    .filter(Boolean)
    .join("\n\n");
};

export const prompt = async (
  userId,
  threadId,
  userMessage,
  {
    ragEnabled = true,
    knowledgeRagEnabled = true,
  } = {}
) => {
  const threadData = await prisma.thread.findFirst({
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

  const useKnowledge = knowledgeRagEnabled !== false;
  const useChatMemory = ragEnabled !== false;

  if (useKnowledge) {
    return promptText + "\n\n you have access of rag to get user knowledge source if needed than call that tool and get knowledge source";
  }

  if (useChatMemory) {
    return promptText + "\n\n you have access of rag to get user chat memory if needed than call that tool and get chat memory";
  }

  return promptText;
};
