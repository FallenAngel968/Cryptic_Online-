-- CreateTable
CREATE TABLE "CryptoPayment" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CryptoPayment_pkey" PRIMARY KEY ("id")
);
