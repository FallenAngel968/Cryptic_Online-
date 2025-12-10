-- AlterTable
ALTER TABLE "PaymentCard" ADD COLUMN     "expirationMonth" INTEGER,
ADD COLUMN     "expirationYear" INTEGER,
ADD COLUMN     "securityCode" TEXT;
