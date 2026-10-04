-- Design becomes the parent record of its components (Punching Master rows).
CREATE TABLE "Design" (
    "designNo" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Design_pkey" PRIMARY KEY ("designNo")
);

-- One Design per existing design number, keeping its product name
-- (if rows disagreed, the alphabetically first name is kept).
INSERT INTO "Design" ("designNo", "productName")
SELECT "designNo", MIN("productName") FROM "PunchingItem" GROUP BY "designNo";

-- Product name now lives on the design only.
ALTER TABLE "PunchingItem" DROP COLUMN "productName";

ALTER TABLE "PunchingItem" ADD CONSTRAINT "PunchingItem_designNo_fkey"
    FOREIGN KEY ("designNo") REFERENCES "Design"("designNo") ON DELETE RESTRICT ON UPDATE CASCADE;
