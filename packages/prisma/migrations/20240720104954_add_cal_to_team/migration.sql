-- AlterEnum
ALTER TYPE "TeamMemberInviteStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "cal" BOOLEAN NOT NULL DEFAULT false;
