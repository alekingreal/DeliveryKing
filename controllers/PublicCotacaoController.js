const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTaxaCambioUSD_BRL } = require('../utils/cotacaoUtils');

const getCotacaoPublica = async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;

  const historico = await prisma.cotacaoDK.findMany({
    orderBy: { data: 'desc' },
    take: limit,
  });

  const taxaCambio = await getTaxaCambioUSD_BRL();

  const historicoConvertido = historico.reverse().map(item => ({
    data: item.data,
    valorUSD: item.valorAtual,
    valorBRL: item.valorAtual * taxaCambio
  }));

  res.json({
    cotacaoAtual: historicoConvertido[historicoConvertido.length - 1],
    historico: historicoConvertido
  });
};

module.exports = { getCotacaoPublica };
