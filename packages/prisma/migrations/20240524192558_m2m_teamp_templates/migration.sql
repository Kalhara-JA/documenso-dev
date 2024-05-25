/*
  Warnings:

  - You are about to drop the column `teamId` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `teamPendingId` on the `Template` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_teamPendingId_fkey";

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "teamId",
DROP COLUMN "teamPendingId";

-- CreateTable
CREATE TABLE "TeamTemplate" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "teamPendingId" INTEGER,

    CONSTRAINT "TeamTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamTemplate_teamId_templateId_key" ON "TeamTemplate"("teamId", "templateId");

-- AddForeignKey
ALTER TABLE "TeamTemplate" ADD CONSTRAINT "TeamTemplate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamTemplate" ADD CONSTRAINT "TeamTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamTemplate" ADD CONSTRAINT "TeamTemplate_teamPendingId_fkey" FOREIGN KEY ("teamPendingId") REFERENCES "TeamPending"("id") ON DELETE SET NULL ON UPDATE CASCADE;
