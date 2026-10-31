-- CreateTable
CREATE TABLE "LongTermMemory" (
    "longTermMemoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "normalizedContent" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "metadata" JSONB,
    "confidence" DOUBLE PRECISION,
    "importance" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sourceThreadId" TEXT,
    "sourceMessageId" TEXT,
    "embedding" vector(3072),
    "embeddingModel" TEXT,
    "embeddingDimensions" INTEGER NOT NULL DEFAULT 3072,
    "embeddedAt" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LongTermMemory_pkey" PRIMARY KEY ("longTermMemoryId")
);

-- CreateTable
CREATE TABLE "MemoryGenerationTask" (
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "longTermMemoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceMessageId" TEXT,
    "outcome" TEXT,

    CONSTRAINT "MemoryGenerationTask_pkey" PRIMARY KEY ("taskId")
);

-- CreateIndex
CREATE INDEX "LongTermMemory_userId_status_idx" ON "LongTermMemory"("userId", "status");

-- CreateIndex
CREATE INDEX "LongTermMemory_userId_memoryType_status_idx" ON "LongTermMemory"("userId", "memoryType", "status");

-- CreateIndex
CREATE INDEX "LongTermMemory_userId_category_status_idx" ON "LongTermMemory"("userId", "category", "status");

-- CreateIndex
CREATE INDEX "LongTermMemory_sourceThreadId_idx" ON "LongTermMemory"("sourceThreadId");

-- CreateIndex
CREATE INDEX "LongTermMemory_sourceMessageId_idx" ON "LongTermMemory"("sourceMessageId");

-- CreateIndex
CREATE INDEX "LongTermMemory_updatedAt_idx" ON "LongTermMemory"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LongTermMemory_userId_fingerprint_key" ON "LongTermMemory"("userId", "fingerprint");

-- CreateIndex
CREATE INDEX "MemoryGenerationTask_userId_idx" ON "MemoryGenerationTask"("userId");

-- CreateIndex
CREATE INDEX "MemoryGenerationTask_threadId_idx" ON "MemoryGenerationTask"("threadId");

-- CreateIndex
CREATE INDEX "MemoryGenerationTask_status_idx" ON "MemoryGenerationTask"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryGenerationTask_sourceMessageId_key" ON "MemoryGenerationTask"("sourceMessageId");

-- AddForeignKey
ALTER TABLE "LongTermMemory" ADD CONSTRAINT "LongTermMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongTermMemory" ADD CONSTRAINT "LongTermMemory_sourceThreadId_fkey" FOREIGN KEY ("sourceThreadId") REFERENCES "Thread"("threadId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongTermMemory" ADD CONSTRAINT "LongTermMemory_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "Message"("messageId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryGenerationTask" ADD CONSTRAINT "MemoryGenerationTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryGenerationTask" ADD CONSTRAINT "MemoryGenerationTask_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("threadId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryGenerationTask" ADD CONSTRAINT "MemoryGenerationTask_longTermMemoryId_fkey" FOREIGN KEY ("longTermMemoryId") REFERENCES "LongTermMemory"("longTermMemoryId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryGenerationTask" ADD CONSTRAINT "MemoryGenerationTask_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "Message"("messageId") ON DELETE SET NULL ON UPDATE CASCADE;
