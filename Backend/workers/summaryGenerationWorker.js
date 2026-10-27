import prisma from "../dbConnect/prismaClient.js";
import { generateConversationSummary, countTokens } from "../utils/agent.js";
import {
  createSummary,
  updateSummary,
  getSummaryByThreadId,
} from "../services/summaryService.js";

const QUEUE_NAME = "summary-generation";

async function processSummaryJob(job) {
  const { threadId } = job.data;

  if (!threadId) {
    console.warn(`[summary-worker] Skipping job ${job.id}: missing threadId`);
    return;
  }

  console.warn(
    `[summary-worker] Processing job ${job.id}: threadId=${threadId}`,
  );

  const messages = await prisma.message.findMany({
    where: { threadId },
    orderBy: { sequence: "asc" },
    select: { content: true, role: true },
  });

  if (messages.length === 0) {
    return;
  }

  const text = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

  const tokenResult = await countTokens(text);
  const tokenCount = tokenResult?.totalTokens || 0;

  if (tokenCount <= 10) {
    return;
  }

  const existing = await getSummaryByThreadId(threadId);

  const newSummary = await generateConversationSummary({
    previousSummary: existing?.summary || "",
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const summaryTokenResult = await countTokens(newSummary);
  const summaryTokens = summaryTokenResult?.totalTokens || 0;

  if (!existing) {
    await createSummary({
      threadId,
      summary: newSummary,
      tokenCount: summaryTokens,
    });
  } else {
    await updateSummary({
      threadId,
      summary: newSummary,
      tokenCount: summaryTokens,
    });
  }
}

export async function registerSummaryGenerationWorker(boss) {
  await boss.createQueue(QUEUE_NAME);

  await boss.work(QUEUE_NAME, { localConcurrency: 2 }, async (jobs) => {
    for (const job of jobs) {
      try {
        await processSummaryJob(job);
      } catch (err) {
        console.error(`[summary-worker] job=${job.id} failed:`, err.message);
        throw err;
      }
    }
  });
}
