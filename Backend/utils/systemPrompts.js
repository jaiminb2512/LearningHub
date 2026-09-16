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

  if (!useKnowledge && !useChatMemory) {
    return promptText;
  }

  const userMessageQueryEmbedding = await generateEmbedding(userMessage);

  const [knowledgeChunks, chatDocuments] = await Promise.all([
    useKnowledge
      ? semanticSearchKnowledgeChunks(userId, threadId, userMessageQueryEmbedding, 5)
      : Promise.resolve([]),
    useChatMemory
      ? semanticSearch(userId, userMessageQueryEmbedding, 3)
      : Promise.resolve([]),
  ]);

  let ragSection = "";

  if (useKnowledge) {
    const knowledgeContext = formatKnowledgeContext(knowledgeChunks);
    ragSection +=
      "\n\nHere are related excerpts from attached knowledge files:\n" +
      (knowledgeContext || "No related knowledge file excerpts found.");
  }

  if (useChatMemory) {
    const chatMemoryContext = formatChatMemoryContext(chatDocuments);
    if (chatMemoryContext) {
      ragSection +=
        "\n\nHere are related chat-memory documents:\n" + chatMemoryContext;
    }
  }

  return (
    promptText +
    ragSection +
    "\n\nUser message:\n" +
    userMessage
  );
};
