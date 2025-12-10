-- CreateEnum
CREATE TYPE "AdminLevel" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminLevel" "AdminLevel",
ADD COLUMN     "createdBy" INTEGER,
ADD COLUMN     "permissions" JSONB;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
