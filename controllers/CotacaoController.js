const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTaxaCambioUSD_BRL } = require('../utils/cotacaoUtils');

const getHistoricoCotacao = async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;

  const historico = await prisma.cotacaoDK.findMany({
    orderBy: { data: 'desc' },
    take: limit,
  });

  const taxaCambio = await getTaxaCambioUSD_BRL();

  const historicoConvertido = historico.map(item => ({
    data: item.data,
    valorUSD: item.valorAtual,
    valorBRL: (item.valorAtual * taxaCambio)
  }));

  res.json(historicoConvertido.reverse());
};

const getFullCotacao = async (req, res) => {
  const taxaCambio = await getTaxaCambioUSD_BRL();

  const cotacao = await prisma.cotacaoDK.findFirst({
    orderBy: { data: 'desc' }
  });

  res.json({
    cotacaoAtual: {
      data: cotacao.data,
      valorUSD: cotacao.valorAtual,
      valorBRL: cotacao.valorAtual * taxaCambio
    },
    historico: await prisma.cotacaoDK.findMany({
      orderBy: { data: 'desc' },
      take: 30,
      select: { data: true, valorAtual: true }
    }).then(hist => hist.map(item => ({
      data: item.data,
      valorUSD: item.valorAtual,
      valorBRL: item.valorAtual * taxaCambio
    }))).then(list => list.reverse())
  });
};

module.exports = {
  getHistoricoCotacao,
  getFullCotacao
};
