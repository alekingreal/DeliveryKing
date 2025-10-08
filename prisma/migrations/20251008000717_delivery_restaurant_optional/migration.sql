-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_restaurantId_fkey";

-- AlterTable
ALTER TABLE "Delivery" ALTER COLUMN "restaurantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
