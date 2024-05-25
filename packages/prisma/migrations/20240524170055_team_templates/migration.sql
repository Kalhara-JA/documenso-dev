-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "teamPendingId" INTEGER;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_teamPendingId_fkey" FOREIGN KEY ("teamPendingId") REFERENCES "TeamPending"("id") ON DELETE CASCADE ON UPDATE CASCADE;
