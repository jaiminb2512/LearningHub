import prisma from "../dbConnect/prismaClient.js";
import { generateEmbedding } from "../utils/agent.js";
import { randomUUID } from "node:crypto";

const QUEUE_NAME = "embedding-generation";

const saveDocumentEmbedding = async ({
  userId,
  threadId,
  messageId,
  embedding,
}) => {
  const vectorValue = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO "Document" (
      "id", "userId", "threadId", "messageId", "embedding",
      "embeddingModel", "embeddingDimensions", "embeddedAt"
    )
    VALUES (
      ${randomUUID()}, ${userId}, ${threadId}, ${messageId}, ${vectorValue}::vector,
      ${"gemini-embedding-001"}, ${embedding.length}, ${new Date()}
    )
  `;
};

async function processEmbeddingJob(job) {
  const { userId, threadId, messageId } = job.data;

  if (!userId || !messageId) {
    console.warn(
      `[embedding-worker] Skipping job ${job.id}: missing userId or messageId`,
    );
    return;
  }

  const message = await prisma.message.findFirst({
    where: { messageId, ...(threadId ? { threadId } : {}) },
    select: { messageId: true, content: true, threadId: true },
  });

  if (!message) {
    console.warn(
      `[embedding-worker] Message not found for job ${job.id} (messageId=${messageId})`,
    );
    return;
  }

  if (!message.content || message.content.trim().length === 0) {
    return;
  }

  const embedding = await generateEmbedding(message.content);

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Generated embedding is empty or invalid");
  }

  await saveDocumentEmbedding({
    userId,
    threadId: message.threadId,
    messageId: message.messageId,
    embedding,
  });
}

export async function registerEmbeddingGenerationWorker(boss) {
  await boss.createQueue(QUEUE_NAME);

  await boss.work(QUEUE_NAME, { localConcurrency: 2 }, async (jobs) => {
    for (const job of jobs) {
      try {
        await processEmbeddingJob(job);
      } catch (err) {
        console.error(`[embedding-worker] job=${job.id} failed:`, err.message);
        throw err;
      }
    }
  });
}
