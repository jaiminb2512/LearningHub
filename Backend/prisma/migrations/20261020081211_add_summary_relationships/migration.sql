-- CreateTable
CREATE TABLE "Summary" (
    "summaryId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "lastSummarizedMessageId" TEXT NOT NULL,
    "lastSummarizedMessageCount" INTEGER NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("summaryId")
);

-- CreateIndex
CREATE INDEX "Summary_threadId_idx" ON "Summary"("threadId");

-- CreateIndex
CREATE INDEX "Summary_lastSummarizedMessageId_idx" ON "Summary"("lastSummarizedMessageId");

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("threadId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_lastSummarizedMessageId_fkey" FOREIGN KEY ("lastSummarizedMessageId") REFERENCES "Message"("messageId") ON DELETE CASCADE ON UPDATE CASCADE;
