import prisma from "../dbConnect/prismaClient.js";
import { generateEmbedding } from "../utils/agent.js";
import {
  semanticSearch,
  semanticSearchKnowledgeChunks,
} from "./RAGService.js";
import { getRelevantMemories } from "../services/longTermMemoryService.js";

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

const formatLongTermMemoryContext = (memories = []) => {
  if (!memories.length) {
    return "";
  }

  return memories
    .map((m, i) => {
      const type = m.memoryType || "UNKNOWN";
      const category = m.category || "";
      const score = m.score != null ? ` (relevance: ${Number(m.score).toFixed(3)})` : "";
      return `[${i + 1}] ${type}/${category}${score}: ${m.content}`;
    })
    .join("\n");
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

  // Retrieve relevant long-term memories based on user message
  try {
    const memories = await getRelevantMemories(userId, userMessage, {
      limit: 5,
      minSimilarity: 0.6,
    });

    if (memories.length > 0) {
      const memoryContext = formatLongTermMemoryContext(memories);
      promptText += `\n\n--- Long-Term Memory Context ---\nThe following are relevant memories about the user from previous conversations. Use them to personalize your response, but do not explicitly mention that you are recalling memories unless asked.\n${memoryContext}`;
    }
  } catch (err) {
    console.error("Long-term memory retrieval error:", err.message);
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
