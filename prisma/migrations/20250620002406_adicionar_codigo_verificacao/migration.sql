-- CreateTable
CREATE TABLE "CodigoVerificacao" (
    "userId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,

    CONSTRAINT "CodigoVerificacao_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "CodigoVerificacao" ADD CONSTRAINT "CodigoVerificacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
