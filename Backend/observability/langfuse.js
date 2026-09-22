import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import dotenv from "dotenv";

dotenv.config();

const stripQuotes = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export const isLangfuseEnabled = () => {
  if (process.env.LANGFUSE_ENABLED === "false") return false;
  const publicKey = stripQuotes(process.env.LANGFUSE_PUBLIC_KEY);
  const secretKey = stripQuotes(process.env.LANGFUSE_SECRET_KEY);
  return Boolean(publicKey && secretKey);
};

let sdk = null;
let spanProcessor = null;

/**
 * Boots the OpenTelemetry NodeSDK with a Langfuse span processor.
 * Must be called once, as early as possible (before any tracing calls) —
 * import and call this at the very top of the app entrypoint.
 * No-op when Langfuse is disabled/misconfigured.
 */
export const initLangfuse = () => {
  if (!isLangfuseEnabled()) return null;
  if (sdk) return spanProcessor;

  spanProcessor = new LangfuseSpanProcessor({
    publicKey: stripQuotes(process.env.LANGFUSE_PUBLIC_KEY),
    secretKey: stripQuotes(process.env.LANGFUSE_SECRET_KEY),
    baseUrl:
      stripQuotes(process.env.LANGFUSE_BASE_URL) || "http://localhost:3000",
  });

  sdk = new NodeSDK({
    spanProcessors: [spanProcessor],
  });
  sdk.start();

  return spanProcessor;
};

/** Returns the active span processor (for manual flush), or null if disabled/not started. */
export const getLangfuseSpanProcessor = () => spanProcessor;

export default initLangfuse;
