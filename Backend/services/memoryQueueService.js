
import boss from "../config/pgBoss.js";

const QUEUE_NAME = "memory-generation";

export async function enqueueMemoryGeneration({
    userId,
    messageId,
    threadId,
}) {
    const jobId = await boss.send(QUEUE_NAME, {
        userId,
        messageId,
        threadId,
    });

    if (!jobId) {
        throw new Error("Failed to enqueue memory generation job");
    }

    return jobId;
}
