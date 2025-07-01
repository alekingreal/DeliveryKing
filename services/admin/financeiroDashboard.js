const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardFinanceiro() {
  const tesouraria = await prisma.tesourariaDK.aggregate({
    _sum: {
      entradaBruta: true,
      taxasGateway: true,
      comissaoPlataforma: true,
      reservadoClientes: true,
      saldoLiquidoEmpresa: true
    }
  });

  const recebiveis = await prisma.recebivel.aggregate({
    where: { status: 'pendente' },
    _sum: { valorLiquido: true }
  });

  const saques = await prisma.saqueDK.aggregate({
    where: { status: 'pendente' },
    _sum: { valor: true }
  });

  const supply = await prisma.supplyDK.findFirst({ where: { id: 1 } });

  return {
    tesouraria: tesouraria._sum,
    recebiveisPendentes: recebiveis._sum.valorLiquido || 0,
    saquesPendentes: saques._sum.valor || 0,
    dkCoinEmitido: supply ? supply.circulating : 0,
  };
}

module.exports = { getDashboardFinanceiro };
