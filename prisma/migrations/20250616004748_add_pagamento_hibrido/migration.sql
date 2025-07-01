/*
  Warnings:

  - Made the column `valorPagoReal` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `valorPagoDK` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "valorPagoCartao" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "valorPagoReal" SET NOT NULL,
ALTER COLUMN "valorPagoDK" SET NOT NULL;
