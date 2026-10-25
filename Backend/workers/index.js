
import { registerMemoryGenerationWorker } from
    "./memoryGenerationWorker.js";

export default async function registerWorkers(boss) {
    await registerMemoryGenerationWorker(boss);
}
