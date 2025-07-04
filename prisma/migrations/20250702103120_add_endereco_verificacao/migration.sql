-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "enderecoAtualizadoEm" TIMESTAMP(3),
ADD COLUMN     "estado" TEXT;
