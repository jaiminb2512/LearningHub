import prisma from "../dbConnect/prismaClient.js";
import { randomUUID } from "node:crypto";

const preview = (value, max = 4000) => {
  if (value == null) return null;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text?.slice(0, max) || null;
};

const safeJson = (value) => {
  if (value == null) return null;
  try {
    JSON.stringify(value);
    return value;
  } catch {
    return { value: preview(value) };
  }
};

export const startTrace = async ({
  userId,
  threadId,
  messageId,
  name = "learninghub-ai",
  model,
  provider,
  input,
  metadata = {},
}) => prisma.aiTrace.create({
  data: {
    traceId: randomUUID(),
    userId,
    threadId: threadId || null,
    messageId: messageId || null,
    name,
    model: model || null,
    provider: provider || null,
    inputPreview: preview(input),
    metadata: safeJson(metadata),
  },
});

export const finishTrace = async (traceId, {
  status = "SUCCESS",
  output,
  inputTokens = 0,
  outputTokens = 0,
  errorMessage,
  metadata,
}) => {
  const trace = await prisma.aiTrace.findUnique({ where: { traceId }, select: { startedAt: true } });
  const latencyMs = trace ? Date.now() - trace.startedAt.getTime() : null;
  return prisma.aiTrace.update({
    where: { traceId },
    data: {
      status,
      outputPreview: preview(output),
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0,
      totalTokens: (inputTokens || 0) + (outputTokens || 0),
      latencyMs,
      errorMessage: errorMessage ? preview(errorMessage, 2000) : null,
      metadata: metadata ? safeJson(metadata) : undefined,
      endedAt: new Date(),
    },
  });
};

export const startSpan = async ({
  traceId,
  parentSpanId,
  name,
  type,
  input,
  metadata = {},
}) => prisma.aiTraceSpan.create({
  data: {
    spanId: randomUUID(),
    traceId,
    parentSpanId: parentSpanId || null,
    name,
    type,
    input: safeJson(input),
    metadata: safeJson(metadata),
  },
});

export const finishSpan = async (spanId, {
  status = "SUCCESS",
  output,
  errorMessage,
  metadata,
}) => {
  const span = await prisma.aiTraceSpan.findUnique({ where: { spanId }, select: { startedAt: true } });
  const latencyMs = span ? Date.now() - span.startedAt.getTime() : null;
  return prisma.aiTraceSpan.update({
    where: { spanId },
    data: {
      status,
      output: safeJson(output),
      errorMessage: errorMessage ? preview(errorMessage, 2000) : null,
      latencyMs,
      metadata: metadata ? safeJson(metadata) : undefined,
      endedAt: new Date(),
    },
  });
};

export const getOverview = async (userId, days = 7) => {
  const since = new Date(Date.now() - days * 86400000);
  const traces = await prisma.aiTrace.findMany({
    where: { userId, startedAt: { gte: since } },
    select: {
      status: true, latencyMs: true, inputTokens: true, outputTokens: true,
      totalTokens: true, model: true, provider: true, startedAt: true,
    },
    orderBy: { startedAt: "desc" },
  });
  const successful = traces.filter((t) => t.status === "SUCCESS");
  const latencyValues = successful.map((t) => t.latencyMs).filter(Number.isFinite);
  return {
    periodDays: days,
    requests: traces.length,
    successful: successful.length,
    failed: traces.filter((t) => t.status === "ERROR").length,
    interrupted: traces.filter((t) => t.status === "INTERRUPTED").length,
    successRate: traces.length ? Number(((successful.length / traces.length) * 100).toFixed(2)) : 0,
    avgLatencyMs: latencyValues.length
      ? Math.round(latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length)
      : 0,
    inputTokens: traces.reduce((a, t) => a + (t.inputTokens || 0), 0),
    outputTokens: traces.reduce((a, t) => a + (t.outputTokens || 0), 0),
    totalTokens: traces.reduce((a, t) => a + (t.totalTokens || 0), 0),
    recent: traces.slice(0, 20),
  };
};

export const listTraces = async (userId, { limit = 50, status, threadId } = {}) => prisma.aiTrace.findMany({
  where: {
    userId,
    ...(status ? { status } : {}),
    ...(threadId ? { threadId } : {}),
  },
  include: { spans: { orderBy: { startedAt: "asc" } } },
  orderBy: { startedAt: "desc" },
  take: Math.min(Number(limit) || 50, 100),
});

export const getTrace = async (userId, traceId) => prisma.aiTrace.findFirst({
  where: { traceId, userId },
  include: { spans: { orderBy: { startedAt: "asc" } } },
});
