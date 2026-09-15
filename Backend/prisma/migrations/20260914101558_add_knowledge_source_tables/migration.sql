-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "knowledgeSourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("knowledgeSourceId")
);

-- CreateTable
CREATE TABLE "ThreadKnowledgeSource" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "knowledgeSourceId" TEXT NOT NULL,
    "attachedBy" TEXT,
    "attachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ThreadKnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "knowledgeChunkId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(3072),
    "embeddingModel" TEXT NOT NULL DEFAULT 'gemini-embedding-001',
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("knowledgeChunkId")
);

-- CreateIndex
CREATE INDEX "KnowledgeSource_userId_idx" ON "KnowledgeSource"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeSource_userId_status_idx" ON "KnowledgeSource"("userId", "status");

-- CreateIndex
CREATE INDEX "ThreadKnowledgeSource_threadId_idx" ON "ThreadKnowledgeSource"("threadId");

-- CreateIndex
CREATE INDEX "ThreadKnowledgeSource_knowledgeSourceId_idx" ON "ThreadKnowledgeSource"("knowledgeSourceId");

-- CreateIndex
CREATE INDEX "ThreadKnowledgeSource_threadId_isActive_idx" ON "ThreadKnowledgeSource"("threadId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadKnowledgeSource_threadId_knowledgeSourceId_key" ON "ThreadKnowledgeSource"("threadId", "knowledgeSourceId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_sourceId_idx" ON "KnowledgeChunk"("sourceId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_userId_idx" ON "KnowledgeChunk"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_sourceId_chunkIndex_idx" ON "KnowledgeChunk"("sourceId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadKnowledgeSource" ADD CONSTRAINT "ThreadKnowledgeSource_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("threadId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadKnowledgeSource" ADD CONSTRAINT "ThreadKnowledgeSource_knowledgeSourceId_fkey" FOREIGN KEY ("knowledgeSourceId") REFERENCES "KnowledgeSource"("knowledgeSourceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource"("knowledgeSourceId") ON DELETE CASCADE ON UPDATE CASCADE;
