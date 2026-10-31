import { registerMemoryGenerationWorker } from "./memoryGenerationWorker.js";
import { registerSummaryGenerationWorker } from "./summaryGenerationWorker.js";

export default async function registerWorkers(boss) {
    await registerMemoryGenerationWorker(boss);
    await registerSummaryGenerationWorker(boss);
}
