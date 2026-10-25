
const QUEUE_NAME = "memory-generation";

export async function registerMemoryGenerationWorker(boss) {
    await boss.createQueue(QUEUE_NAME);

    await boss.work(
        QUEUE_NAME,
        { localConcurrency: 2 },
        async (jobs) => {
            for (const job of jobs) {
                console.log("Processing memory job:", job.id);
                console.log("Job data:", job.data);
            }
        }
    );
}
