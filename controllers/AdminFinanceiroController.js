const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTaxaCambioUSD_BRL } = require('../utils/cotacaoUtils');

const getRelatorioFinanceiro = async (req, res) => {
  const supply = await prisma.supplyDK.findFirst();
  const receitaMaster = await prisma.carteiraDK.findUnique({ where: { userId: 999 } });
  const cotacao = await prisma.cotacaoDK.findFirst({ orderBy: { data: 'desc' } });
  const taxaCambio = await getTaxaCambioUSD_BRL();

  const totalSupply = supply.totalSupply;
  const reserved = supply.reserved;
  const emCirculacao = reserved - (receitaMaster?.saldo || 0);
  const receita = receitaMaster?.saldo || 0;

  res.json({
    supply: {
      totalSupply,
      reserved,
      emCirculacao
    },
    receitaMasterDK: receita,
    receitaEmReais: (receita * cotacao.valorAtual * taxaCambio).toFixed(2),
    cotacaoUSD: cotacao.valorAtual,
    cotacaoBRL: (cotacao.valorAtual * taxaCambio).toFixed(2)
  });
};

module.exports = { getRelatorioFinanceiro };
