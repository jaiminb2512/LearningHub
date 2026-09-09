-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "aiSettingId" TEXT;

-- CreateTable
CREATE TABLE "AiSetting" (
    "aiSettingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "settingsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSetting_pkey" PRIMARY KEY ("aiSettingId")
);

-- CreateIndex
CREATE INDEX "AiSetting_userId_idx" ON "AiSetting"("userId");

-- CreateIndex
CREATE INDEX "Thread_aiSettingId_idx" ON "Thread"("aiSettingId");

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_aiSettingId_fkey" FOREIGN KEY ("aiSettingId") REFERENCES "AiSetting"("aiSettingId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSetting" ADD CONSTRAINT "AiSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
