-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "aiSettingId" TEXT,
ADD COLUMN     "promptText" TEXT;

-- CreateIndex
CREATE INDEX "Message_aiSettingId_idx" ON "Message"("aiSettingId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_aiSettingId_fkey" FOREIGN KEY ("aiSettingId") REFERENCES "AiSetting"("aiSettingId") ON DELETE SET NULL ON UPDATE CASCADE;
