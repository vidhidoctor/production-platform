-- Punching Master is now keyed by Design + Component + Size (was Name + Size).
-- Columns are renamed, not dropped, so existing consumption data is kept.
DROP INDEX "PunchingItem_name_size_key";

ALTER TABLE "PunchingItem" RENAME COLUMN "name" TO "component";
ALTER TABLE "PunchingItem" RENAME COLUMN "lesar" TO "laser";
ALTER TABLE "PunchingItem" ADD COLUMN "designNo" TEXT;
ALTER TABLE "PunchingItem" ADD COLUMN "productName" TEXT;

-- Every row so far came from MATRIAL.xlsx: design 26-49, item CHOLI.
UPDATE "PunchingItem" SET "designNo" = '26-49', "productName" = 'CHOLI';

ALTER TABLE "PunchingItem" ALTER COLUMN "designNo" SET NOT NULL;
ALTER TABLE "PunchingItem" ALTER COLUMN "productName" SET NOT NULL;

CREATE UNIQUE INDEX "PunchingItem_designNo_component_size_key" ON "PunchingItem"("designNo", "component", "size");
