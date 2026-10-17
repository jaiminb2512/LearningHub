import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

let checkpointer;

export async function initializeCheckpointer() {
  if (checkpointer) {
    return checkpointer;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  checkpointer = PostgresSaver.fromConnString(databaseUrl, {
    schema: "langgraph",
  });

  await checkpointer.setup();

  console.log("LangGraph PostgreSQL checkpointer initialized");

  return checkpointer;
}

export function getCheckpointer() {
  if (!checkpointer) {
    throw new Error("Checkpointer has not been initialized");
  }

  return checkpointer;
}
