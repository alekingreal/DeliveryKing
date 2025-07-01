-- CreateEnum
CREATE TYPE "OrderClienteStatus" AS ENUM ('aguardando', 'em_producao', 'pronto', 'em_rota', 'entregue');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pendente', 'em_rota', 'entregue');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPORTE', 'FINANCEIRO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "city" TEXT,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "inviteCode" TEXT,
    "invitedBy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryPerson" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "pending" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "cpf" TEXT NOT NULL,
    "punishmentLevel" INTEGER NOT NULL DEFAULT 0,
    "violations" INTEGER NOT NULL DEFAULT 0,
    "blockUntil" TIMESTAMP(3),
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "certidaoCriminalUrl" TEXT,
    "cnhUrl" TEXT,
    "comprovanteResidenciaUrl" TEXT,
    "fotoMotoristaUrl" TEXT,
    "fotoVeiculoUrl" TEXT,
    "modoAtual" TEXT,
    "placaVeiculo" TEXT,
    "podeCarroTaxi" BOOLEAN NOT NULL DEFAULT false,
    "podeDelivery" BOOLEAN NOT NULL DEFAULT false,
    "podeFrete" BOOLEAN NOT NULL DEFAULT false,
    "podeMotoTaxi" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "lastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "DeliveryPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" SERIAL NOT NULL,
    "deliveryPersonId" INTEGER,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "deliveryPersonPayout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedDeliveryPersonId" INTEGER,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destinoLat" DOUBLE PRECISION,
    "destinoLng" DOUBLE PRECISION,
    "localPartidaLat" DOUBLE PRECISION NOT NULL,
    "localPartidaLng" DOUBLE PRECISION NOT NULL,
    "maxPessoas" INTEGER,
    "tipoRota" TEXT,
    "tipoServico" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dropoffLocation" TEXT,
    "pickupLocation" TEXT,
    "tempoParaIniciar" DOUBLE PRECISION,
    "restaurantId" INTEGER NOT NULL,
    "reservedUntil" TIMESTAMP(3),

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passageiro" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "deliveryId" INTEGER,
    "posicaoFila" INTEGER,
    "status" TEXT NOT NULL,
    "localPartidaLat" DOUBLE PRECISION NOT NULL,
    "localPartidaLng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Passageiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "deliveryId" INTEGER,
    "dropoffLocation" TEXT NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "entregaVia" TEXT NOT NULL DEFAULT 'manual',
    "platformCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "statusCliente" "OrderClienteStatus" NOT NULL DEFAULT 'aguardando',
    "status" "OrderStatus" NOT NULL,
    "deliveryFee" DOUBLE PRECISION,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "reservedDeliveryPersonId" INTEGER,
    "reservedUntil" TIMESTAMP(3),
    "restaurantId" INTEGER NOT NULL,
    "moedaPagamento" TEXT NOT NULL DEFAULT 'real',
    "valorPagoReal" DOUBLE PRECISION DEFAULT 0,
    "valorPagoDK" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarteiraDK" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarteiraDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardsDK" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "nivel" TEXT NOT NULL DEFAULT 'Bronze',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardsDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaqueDK" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chavePix" TEXT,
    "pixId" TEXT,
    "tentativas" INTEGER DEFAULT 0,
    "observacao" TEXT,

    CONSTRAINT "SaqueDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotacaoDK" (
    "id" SERIAL NOT NULL,
    "valorAtual" DOUBLE PRECISION NOT NULL,
    "variacao" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CotacaoDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransacaoDK" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorDK" DOUBLE PRECISION NOT NULL,
    "valorReal" DOUBLE PRECISION,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransacaoDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaDK" (
    "id" SERIAL NOT NULL,
    "remetenteId" INTEGER NOT NULL,
    "destinatarioId" INTEGER NOT NULL,
    "valorDK" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferenciaDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyDK" (
    "id" SERIAL NOT NULL,
    "totalSupply" DOUBLE PRECISION NOT NULL,
    "circulating" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reserved" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SupplyDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecompraDK" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "valorDK" DOUBLE PRECISION NOT NULL,
    "valorReal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagoEm" TIMESTAMP(3),

    CONSTRAINT "RecompraDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubDK" (
    "id" SERIAL NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotoristaFrotaDK" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "tipoVeiculo" TEXT NOT NULL,
    "cidadeBase" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MotoristaFrotaDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaIntermunicipal" (
    "id" SERIAL NOT NULL,
    "hubOrigemId" INTEGER NOT NULL,
    "hubDestinoId" INTEGER NOT NULL,
    "motoristaId" INTEGER NOT NULL,
    "dataColeta" TIMESTAMP(3) NOT NULL,
    "quantidadePacotes" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferenciaIntermunicipal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticaHub" (
    "id" SERIAL NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,

    CONSTRAINT "LogisticaHub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotoristaLogistica" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cidadeBase" TEXT NOT NULL,

    CONSTRAINT "MotoristaLogistica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PacoteLogisticoDK" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "hubOrigemId" INTEGER NOT NULL,
    "hubDestinoId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aguardando_coleta',
    "pesoKg" DOUBLE PRECISION NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PacoteLogisticoDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceitaPlataformaDK" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "origemId" INTEGER,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ReceitaPlataformaDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUPORTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nome" TEXT NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoDK" (
    "id" SERIAL NOT NULL,
    "taxaCompraPercent" DOUBLE PRECISION NOT NULL,
    "taxaVendaPercent" DOUBLE PRECISION NOT NULL,
    "taxaTransferencia" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlagSuspeita" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlagSuspeita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermissao" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "recurso" TEXT NOT NULL,
    "podeLer" BOOLEAN NOT NULL DEFAULT false,
    "podeGravar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdminPermissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoSistema" (
    "id" SERIAL NOT NULL,
    "cotacaoBase" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "limiteSaque" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "mensagemAviso" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DkCoinTransacao" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorDK" DOUBLE PRECISION NOT NULL,
    "valorReal" DOUBLE PRECISION,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DkCoinTransacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarteiraReal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bloqueado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarteiraReal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransacaoReal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransacaoReal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recebivel" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "userIdRecebedor" INTEGER NOT NULL,
    "valorBruto" DOUBLE PRECISION NOT NULL,
    "taxas" DOUBLE PRECISION NOT NULL,
    "valorLiquido" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "dataDisponivel" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recebivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimiteSaqueDK" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "limiteDiario" DOUBLE PRECISION DEFAULT 5000,
    "limiteMensal" DOUBLE PRECISION DEFAULT 30000,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimiteSaqueDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogFinanceiroDK" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "acao" TEXT,
    "valor" DOUBLE PRECISION,
    "data" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,

    CONSTRAINT "LogFinanceiroDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TesourariaDK" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "entradaBruta" DOUBLE PRECISION DEFAULT 0,
    "comissaoPlataforma" DOUBLE PRECISION DEFAULT 0,
    "taxasGateway" DOUBLE PRECISION DEFAULT 0,
    "reservadoClientes" DOUBLE PRECISION DEFAULT 0,
    "saldoLiquidoEmpresa" DOUBLE PRECISION DEFAULT 0,
    "observacao" TEXT,

    CONSTRAINT "TesourariaDK_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryPerson_userId_key" ON "DeliveryPerson"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CarteiraDK_userId_key" ON "CarteiraDK"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardsDK_userId_key" ON "RewardsDK"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MotoristaFrotaDK_cpf_key" ON "MotoristaFrotaDK"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermissao_adminId_recurso_key" ON "AdminPermissao"("adminId", "recurso");

-- CreateIndex
CREATE UNIQUE INDEX "CarteiraReal_userId_key" ON "CarteiraReal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LimiteSaqueDK_userId_key" ON "LimiteSaqueDK"("userId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryPerson" ADD CONSTRAINT "DeliveryPerson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_deliveryPersonId_fkey" FOREIGN KEY ("deliveryPersonId") REFERENCES "DeliveryPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_reservedDeliveryPersonId_fkey" FOREIGN KEY ("reservedDeliveryPersonId") REFERENCES "DeliveryPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passageiro" ADD CONSTRAINT "Passageiro_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passageiro" ADD CONSTRAINT "Passageiro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarteiraDK" ADD CONSTRAINT "CarteiraDK_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsDK" ADD CONSTRAINT "RewardsDK_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaqueDK" ADD CONSTRAINT "SaqueDK_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoDK" ADD CONSTRAINT "TransacaoDK_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecompraDK" ADD CONSTRAINT "RecompraDK_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaIntermunicipal" ADD CONSTRAINT "TransferenciaIntermunicipal_hubDestinoId_fkey" FOREIGN KEY ("hubDestinoId") REFERENCES "HubDK"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaIntermunicipal" ADD CONSTRAINT "TransferenciaIntermunicipal_hubOrigemId_fkey" FOREIGN KEY ("hubOrigemId") REFERENCES "HubDK"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaIntermunicipal" ADD CONSTRAINT "TransferenciaIntermunicipal_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "MotoristaFrotaDK"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlagSuspeita" ADD CONSTRAINT "FlagSuspeita_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPermissao" ADD CONSTRAINT "AdminPermissao_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DkCoinTransacao" ADD CONSTRAINT "DkCoinTransacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarteiraReal" ADD CONSTRAINT "CarteiraReal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoReal" ADD CONSTRAINT "TransacaoReal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recebivel" ADD CONSTRAINT "Recebivel_userIdRecebedor_fkey" FOREIGN KEY ("userIdRecebedor") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimiteSaqueDK" ADD CONSTRAINT "LimiteSaqueDK_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LogFinanceiroDK" ADD CONSTRAINT "LogFinanceiroDK_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
