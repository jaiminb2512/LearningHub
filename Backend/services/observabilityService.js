import { startObservation } from "@langfuse/tracing";
import { CallbackHandler } from "@langfuse/langchain";
import { isLangfuseEnabled, getLangfuseSpanProcessor } from "../observability/langfuse.js";

const environment =
  process.env.LANGFUSE_ENVIRONMENT ||
  process.env.NODE_ENV ||
  "development";

const safeSerialize = (value, maxLength = 8000) => {
  try {
    if (value == null) return value;
    if (typeof value === "string") {
      return value.length > maxLength
        ? `${value.slice(0, maxLength)}…[truncated]`
        : value;
    }
    const json = JSON.stringify(value);
    return json.length > maxLength
      ? `${json.slice(0, maxLength)}…[truncated]`
      : value;
  } catch {
    return "[unserializable]";
  }
};

const messagePreview = (messages = []) => {
  return (Array.isArray(messages) ? messages : []).map((m) => {
    const role =
      typeof m?.getType === "function"
        ? m.getType()
        : m?.role || m?._getType?.() || "unknown";
    const content =
      typeof m?.content === "string"
        ? m.content
        : m?.content != null
          ? JSON.stringify(m.content)
          : "";
    return {
      role,
      content:
        content.length > 500 ? `${content.slice(0, 500)}…[truncated]` : content,
    };
  });
};

/**
 * Start a top-level chat trace for one user turn / resume.
 * Returns null when Langfuse is disabled so callers stay no-op safe.
 */
export function startChatTrace({
  name = "learninghub-chat",
  userId,
  threadId,
  input,
  metadata = {},
} = {}) {
  if (!isLangfuseEnabled()) return null;

  try {
    const trace = startObservation(name, {
      input: safeSerialize(input),
      metadata: {
        environment,
        threadId,
        ...metadata,
      },
    });
    trace.update({
      userId: userId || undefined,
      sessionId: threadId || undefined,
      tags: ["learninghub", "chat", environment].filter(Boolean),
    });
    return trace;
  } catch (error) {
    console.warn("[observability] startChatTrace failed:", error.message);
    return null;
  }
}

/**
 * Returns a LangChain/LangGraph CallbackHandler bound to this trace, so the
 * graph's own node/LLM calls are auto-instrumented as nested observations
 * instead of being tracked manually.
 */
export function getLangfuseCallbackHandler({ userId, threadId, metadata = {} } = {}) {
  if (!isLangfuseEnabled()) return null;
  try {
    return new CallbackHandler({
      sessionId: threadId,
      userId,
      metadata: { environment, ...metadata },
      tags: ["learninghub", "chat", environment].filter(Boolean),
    });
  } catch (error) {
    console.warn("[observability] getLangfuseCallbackHandler failed:", error.message);
    return null;
  }
}

export function startGeneration(
  trace,
  {
    name = "agent-generation",
    model,
    input,
    metadata = {},
  } = {}
) {
  if (!trace) return null;
  try {
    return trace.startObservation(
      name,
      {
        model: model || undefined,
        input: safeSerialize(input),
        metadata: {
          environment,
          ...metadata,
        },
      },
      { asType: "generation" }
    );
  } catch (error) {
    console.warn("[observability] startGeneration failed:", error.message);
    return null;
  }
}

export function endGeneration(generation, { output, usage, level, statusMessage } = {}) {
  if (!generation) return;
  try {
    generation.update({
      output: safeSerialize(output),
      usageDetails: usage,
      level,
      statusMessage,
    });
    generation.end();
  } catch (error) {
    console.warn("[observability] endGeneration failed:", error.message);
  }
}

export function recordSpan(
  trace,
  {
    name,
    input,
    output,
    metadata = {},
    level,
    statusMessage,
  } = {}
) {
  if (!trace) return null;
  try {
    const span = trace.startObservation(name, {
      input: safeSerialize(input),
      metadata: {
        environment,
        ...metadata,
      },
    });
    span.update({
      output: safeSerialize(output),
      level,
      statusMessage,
    });
    span.end();
    return span;
  } catch (error) {
    console.warn("[observability] recordSpan failed:", error.message);
    return null;
  }
}

export function endTrace(trace, { output, metadata = {}, level } = {}) {
  if (!trace) return;
  try {
    trace.update({
      output: safeSerialize(output),
      metadata: {
        environment,
        ...metadata,
      },
      level,
    });
    trace.end();
  } catch (error) {
    console.warn("[observability] endTrace failed:", error.message);
  }
}

export function recordError(trace, error, { name = "error" } = {}) {
  if (!trace) return;
  try {
    const message = error?.message || String(error);
    trace.update({
      output: { error: message },
      level: "ERROR",
      statusMessage: message,
      metadata: {
        environment,
        errorName: error?.name,
        event: name,
      },
    });
  } catch (err) {
    console.warn("[observability] recordError failed:", err.message);
  }
}

export async function flushObservability() {
  if (!isLangfuseEnabled()) return;
  const spanProcessor = getLangfuseSpanProcessor();
  if (!spanProcessor) return;
  try {
    await spanProcessor.forceFlush();
  } catch (error) {
    console.warn("[observability] flush failed:", error.message);
  }
}

export { isLangfuseEnabled, messagePreview, safeSerialize };
