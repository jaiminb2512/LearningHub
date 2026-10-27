import boss from "../config/pgBoss.js";

const QUEUE_NAME = "summary-generation";

export async function enqueueSummaryGeneration({ userId, threadId, messageId }) {
    const jobId = await boss.send(QUEUE_NAME, { userId, threadId, messageId });

    if (!jobId) {
        throw new Error("Failed to enqueue summary generation job");
    }

    return jobId;
}
