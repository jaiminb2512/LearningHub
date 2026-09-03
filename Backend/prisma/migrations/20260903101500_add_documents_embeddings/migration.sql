CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "embedding" vector(3072) NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "embeddingDimensions" INTEGER NOT NULL DEFAULT 3072,
    "embeddedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "documents_messageId_idx" ON "documents"("messageId");
CREATE INDEX IF NOT EXISTS "documents_embeddingModel_idx" ON "documents"("embeddingModel");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_messageId_fkey'
  ) THEN
    ALTER TABLE "documents"
      ADD CONSTRAINT "documents_messageId_fkey"
      FOREIGN KEY ("messageId") REFERENCES "Message"("messageId")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;