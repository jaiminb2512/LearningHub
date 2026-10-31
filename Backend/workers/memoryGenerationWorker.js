import prisma from "../dbConnect/prismaClient.js";
import { createLongTermMemory } from "../services/longTermMemoryService.js";

const QUEUE_NAME = "memory-generation";

async function processMemoryJob(job) {
  const { userId, messageId, threadId } = job.data;

  if (!userId || !messageId) {
    console.warn(
      `[memory-worker] Skipping job ${job.id}: missing userId or messageId`,
    );
    return;
  }

  const message = await prisma.message.findFirst({
    where: { messageId, ...(threadId ? { threadId } : {}) },
    select: { messageId: true, content: true, role: true, threadId: true },
  });

  if (!message) {
    console.warn(
      `[memory-worker] Message not found for job ${job.id} (messageId=${messageId})`,
    );
    return;
  }

  // Only extract memories from user messages
  if (message.role !== "user") {
    return;
  }

  if (!message.content || message.content.trim().length === 0) {
    return;
  }

  const result = await createLongTermMemory({
    userId,
    message: message.content,
    sourceThreadId: message.threadId || null,
    sourceMessageId: message.messageId,
  });
}

export async function registerMemoryGenerationWorker(boss) {
  await boss.createQueue(QUEUE_NAME);

  await boss.work(QUEUE_NAME, { localConcurrency: 1 }, async (jobs) => {
    for (const job of jobs) {
      try {
        await processMemoryJob(job);
      } catch (err) {
        console.error(`[memory-worker] job=${job.id} failed:`, err.message);
        throw err;
      }
    }
  });
}
