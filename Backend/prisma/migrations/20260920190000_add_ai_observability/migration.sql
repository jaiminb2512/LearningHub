-- CreateTable
CREATE TABLE "AiTrace" (
    "traceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT,
    "messageId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'learninghub-ai',
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "model" TEXT,
    "provider" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "inputPreview" TEXT,
    "outputPreview" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AiTrace_pkey" PRIMARY KEY ("traceId")
);

-- CreateTable
CREATE TABLE "AiTraceSpan" (
    "spanId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "parentSpanId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "latencyMs" INTEGER,
    "input" JSONB,
    "output" JSONB,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AiTraceSpan_pkey" PRIMARY KEY ("spanId")
);

CREATE INDEX "AiTrace_userId_startedAt_idx" ON "AiTrace"("userId", "startedAt");
CREATE INDEX "AiTrace_threadId_startedAt_idx" ON "AiTrace"("threadId", "startedAt");
CREATE INDEX "AiTrace_status_startedAt_idx" ON "AiTrace"("status", "startedAt");
CREATE INDEX "AiTraceSpan_traceId_startedAt_idx" ON "AiTraceSpan"("traceId", "startedAt");
CREATE INDEX "AiTraceSpan_type_startedAt_idx" ON "AiTraceSpan"("type", "startedAt");

ALTER TABLE "AiTrace" ADD CONSTRAINT "AiTrace_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiTrace" ADD CONSTRAINT "AiTrace_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "Thread"("threadId") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiTrace" ADD CONSTRAINT "AiTrace_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "Message"("messageId") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiTraceSpan" ADD CONSTRAINT "AiTraceSpan_traceId_fkey"
  FOREIGN KEY ("traceId") REFERENCES "AiTrace"("traceId") ON DELETE CASCADE ON UPDATE CASCADE;
