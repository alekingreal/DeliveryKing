const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCotacaoAtual = async () => {
  const ultima = await prisma.cotacaoDK.findFirst({ orderBy: { data: 'desc' } });
  return ultima || { valorAtual: 1.0 };
};

const atualizarCotacao = async () => {
  const ultimasTransacoes = await prisma.transacaoDK.findMany({
    where: { data: { gte: new Date(Date.now() - 1000 * 60 * 60) } } // últimas 1h
  });

  let score = 0;
  const comprasComDK = ultimasTransacoes.filter(t => t.tipo === 'gasto').length;
  const comprasReais = ultimasTransacoes.filter(t => t.tipo === 'compra').reduce((acc, t) => acc + (t.valorReal || 0), 0);
  const cashbackDistribuido = ultimasTransacoes.filter(t => t.tipo === 'cashback').reduce((acc, t) => acc + t.valorDK, 0);

  score += comprasComDK * 0.003;
  score += comprasReais / 100 * 0.005;
  score -= cashbackDistribuido * 0.002;

  const ultimaCotacao = await getCotacaoAtual();
  let nova = ultimaCotacao.valorAtual + score;
  nova = Math.max(0.8, Math.min(1.5, nova)); // trava

  await prisma.cotacaoDK.create({
    data: { valorAtual: nova, variacao: nova - ultimaCotacao.valorAtual }
  });

  return nova;
};

module.exports = { atualizarCotacao, getCotacaoAtual };
