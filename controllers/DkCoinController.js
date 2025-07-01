const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTaxaCambioUSD_BRL } = require('../utils/cotacaoUtils');
const { registrarReceita } = require('../utils/receitaUtils');

// Configuração das taxas
const AJUSTE_COMPRA_PERCENT = 0.005;
const AJUSTE_GASTO_PERCENT = 0.001;
const CASHBACK_PERCENT = 0.02;
const TAXA_MASTER_PERCENT = 0.002;  // 0.2% para a plataforma
const ID_MASTER = 999; // id fixo da sua carteira master

// Atualiza a cotação na tabela de histórico
const atualizarCotacao = async (tipo) => {
  const cotacaoAtual = await prisma.cotacaoDK.findFirst({ orderBy: { data: 'desc' } });
  let novoValor = cotacaoAtual?.valorAtual || 1.0;

  if (tipo === 'compra') novoValor *= (1 + AJUSTE_COMPRA_PERCENT);
  if (tipo === 'gasto') novoValor *= (1 - AJUSTE_GASTO_PERCENT);

  await prisma.cotacaoDK.create({
    data: {
      valorAtual: novoValor,
      variacao: novoValor - (cotacaoAtual?.valorAtual || 1.0)
    }
  });

  return novoValor;
};

const getCotacaoAtualUSD = async () => {
  const cotacao = await prisma.cotacaoDK.findFirst({ orderBy: { data: 'desc' } });
  return cotacao || { valorAtual: 1.0, variacao: 0 };
};

const comprarDK = async (req, res) => {
  const userId = Number(req.headers['userid']);
  if (!userId) return res.status(400).json({ error: 'userId inválido.' });

  const { valorReais } = req.body;
  const cotacaoUSD = await getCotacaoAtualUSD();
  const taxaCambio = await getTaxaCambioUSD_BRL();

  const valorUSD = valorReais / taxaCambio;
  const valorDK = valorUSD / cotacaoUSD.valorAtual;

  const supply = await prisma.supplyDK.findFirst();
  const disponivel = supply.totalSupply - supply.reserved;

  if (valorDK > disponivel) {
    return res.status(400).json({ error: 'Supply esgotado. Não há DK Coin disponível.' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.supplyDK.update({
      where: { id: supply.id },
      data: { reserved: { increment: valorDK } }
    });

    await tx.transacaoDK.create({
      data: {
        userId,
        tipo: 'compra',
        valorDK,
        valorReal: valorReais,
        descricao: 'Compra via reais'
      }
    });

    await tx.carteiraDK.upsert({
      where: { userId },
      update: { saldo: { increment: valorDK } },
      create: { userId, saldo: valorDK }
    });

    // Aqui registramos a receita do sistema (exemplo 0.5% fixo)
    await registrarReceita(tx, valorReais, 'compra_dkcoin');
    
    await atualizarCotacao('compra');
  });

  res.json({ message: 'Compra realizada!', dkComprado: valorDK });
};


const gastarDK = async (req, res) => {
  const userId = Number(req.headers['userid']);
  const { valorDK } = req.body;

  const carteira = await prisma.carteiraDK.findUnique({ where: { userId } });
  if (!carteira || carteira.saldo < valorDK) return res.status(400).json({ error: 'Saldo insuficiente' });

  await prisma.$transaction(async (tx) => {
    await tx.carteiraDK.update({
      where: { userId },
      data: { saldo: { decrement: valorDK } }
    });

    await tx.transacaoDK.create({
      data: {
        userId,
        tipo: 'gasto',
        valorDK,
        descricao: 'Compra com DK Coin'
      }
    });

    // Registrar a receita da plataforma no gasto também (exemplo 0.3% fixo)
    const valorReais = await converterDKEmReais(valorDK);
    await registrarReceita(tx, valorReais, 'gasto_dkcoin');

    await atualizarCotacao('gasto');
  });

  res.json({ message: 'Compra concluída!', saldoRestante: carteira.saldo - valorDK });
};


const aplicarCashback = async (userId, valorReais) => {
  const cotacaoUSD = await getCotacaoAtualUSD();
  const taxaCambio = await getTaxaCambioUSD_BRL();

  const valorUSD = valorReais / taxaCambio;
  const cashbackDK = (valorUSD / cotacaoUSD.valorAtual) * CASHBACK_PERCENT;

  const supply = await prisma.supplyDK.findFirst();
  const disponivel = supply.totalSupply - supply.reserved;

  if (cashbackDK > disponivel) {
    return 0;
  }

  await prisma.$transaction(async (tx) => {
    await tx.supplyDK.update({
      where: { id: supply.id },
      data: { reserved: { increment: cashbackDK } }
    });

    await tx.transacaoDK.create({
      data: {
        userId,
        tipo: 'cashback',
        valorDK: cashbackDK,
        descricao: 'Cashback de compra'
      }
    });

    await tx.carteiraDK.upsert({
      where: { userId },
      update: { saldo: { increment: cashbackDK } },
      create: { userId, saldo: cashbackDK }
    });
  });

  return cashbackDK;
};

const getCarteira = async (req, res) => {
  const userId = Number(req.headers['userid']);
  const carteira = await prisma.carteiraDK.findUnique({ where: { userId } }) || { saldo: 0 };
  const cotacaoUSD = await getCotacaoAtualUSD();
  const taxaCambio = await getTaxaCambioUSD_BRL();

  const saldoEmReais = carteira.saldo * cotacaoUSD.valorAtual * taxaCambio;
  const saldoEmUSD = carteira.saldo * cotacaoUSD.valorAtual;

  res.json({
    saldoDK: carteira.saldo,
    saldoUSD: saldoEmUSD.toFixed(2),
    saldoBRL: saldoEmReais.toFixed(2)
  });
};

const getCotacao = async (req, res) => {
  const cotacao = await getCotacaoAtualUSD();
  res.json(cotacao);
};

const getHistorico = async (req, res) => {
  const userId = Number(req.headers['userid']);
  const transacoes = await prisma.transacaoDK.findMany({
    where: { userId },
    orderBy: { data: 'desc' }
  });
  res.json(transacoes);
};

module.exports = {
  comprarDK,
  gastarDK,
  getCarteira,
  getCotacao,
  getHistorico,
  aplicarCashback
};
