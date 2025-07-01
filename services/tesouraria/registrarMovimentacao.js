const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registrarMovimentacaoTesouraria(pedidoId, valorBruto, taxasGateway, comissaoPlataforma) {
  const reservadoClientes = valorBruto - taxasGateway - comissaoPlataforma;
  const saldoLiquidoEmpresa = comissaoPlataforma;

  await prisma.tesourariaDK.create({
    data: {
      entradaBruta: valorBruto,
      taxasGateway,
      comissaoPlataforma,
      reservadoClientes,
      saldoLiquidoEmpresa,
      observacao: `Pedido ${pedidoId}`
    }
  });

  console.log('Movimentação registrada na tesouraria.');
}

module.exports = { registrarMovimentacaoTesouraria };
