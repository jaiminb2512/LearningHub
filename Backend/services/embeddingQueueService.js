import boss from "../config/pgBoss.js";

const QUEUE_NAME = "embedding-generation";

export async function enqueueEmbeddingGeneration({
    userId,
    threadId,
    messageId,
}) {
    const jobId = await boss.send(QUEUE_NAME, { userId, threadId, messageId });

    if (!jobId) {
        throw new Error("Failed to enqueue embedding generation job");
    }

    return jobId;
}
