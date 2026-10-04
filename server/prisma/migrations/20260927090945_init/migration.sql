-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('SEQUENCE', 'BEAD', 'CORD');

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MaterialCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seqPerCd" INTEGER,
    "cdPerRoll" INTEGER,
    "cdPerRound" INTEGER,
    "pcsPerKg" INTEGER,
    "denier" INTEGER,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PunchingItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "stitch" INTEGER,
    "lesar" INTEGER,

    CONSTRAINT "PunchingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consumption" (
    "id" SERIAL NOT NULL,
    "punchingItemId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "qtyPerPiece" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "Consumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" SERIAL NOT NULL,
    "party" TEXT NOT NULL,
    "designNo" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "orderDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "punchingItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PunchingItem_name_size_key" ON "PunchingItem"("name", "size");

-- CreateIndex
CREATE UNIQUE INDEX "Consumption_punchingItemId_materialId_key" ON "Consumption"("punchingItemId", "materialId");

-- AddForeignKey
ALTER TABLE "Consumption" ADD CONSTRAINT "Consumption_punchingItemId_fkey" FOREIGN KEY ("punchingItemId") REFERENCES "PunchingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumption" ADD CONSTRAINT "Consumption_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_punchingItemId_fkey" FOREIGN KEY ("punchingItemId") REFERENCES "PunchingItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
