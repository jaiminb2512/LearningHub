
import boss from "./pgBoss.js";
import registerWorkers from "../workers/index.js";

export async function startPgBoss() {
    await boss.start();
    await registerWorkers(boss);

    console.log("pg-boss started successfully");

    return boss;
}
