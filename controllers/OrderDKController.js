const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { registrarReceita } = require('../utils/receitaUtils');
const { gerarPacoteLogistico } = require('../utils/gerarPacoteLogistico');

const getCotacaoAtual = async () => {
  const cotacao = await prisma.cotacaoDK.findFirst({
    orderBy: { data: 'desc' }
  });
  return cotacao || { valorAtual: 1.0, variacao: 0 };
};

const comprarComDK = async (req, res) => {
  const userId = Number(req.headers['userid']);
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: 'userId inválido ou ausente.' });
  }

  const { products, restaurantId } = req.body;

  if (!products || products.length === 0 || !restaurantId) {
    return res.status(400).json({ error: 'Dados incompletos: produtos e restaurante obrigatórios.' });
  }

  const produtosDoBanco = await prisma.product.findMany({
    where: { id: { in: products } }
  });

  if (produtosDoBanco.length !== products.length) {
    return res.status(400).json({ error: 'Algum produto inválido.' });
  }

  const precoTotalReais = produtosDoBanco.reduce((sum, p) => sum + p.price, 0);
  const cotacao = await getCotacaoAtual();
  const desconto = 0.10;
  const precoComDesconto = precoTotalReais * (1 - desconto);
  const valorEmDK = precoComDesconto / cotacao.valorAtual;

  const carteira = await prisma.carteiraDK.findUnique({ where: { userId } });

  if (!carteira || carteira.saldo < valorEmDK) {
    return res.status(400).json({ error: 'Saldo insuficiente na carteira DK Coin' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.carteiraDK.update({
      where: { userId },
      data: { saldo: { decrement: valorEmDK } }
    });
  
    await tx.transacaoDK.create({
      data: {
        userId,
        tipo: 'gasto',
        valorDK: valorEmDK,
        descricao: 'Compra de produtos no app com DK Coin'
      }
    });
  
    const novoPedido = await tx.order.create({
      data: {
        userId,
        restaurantId,
        total: precoComDesconto,
        status: 'pendente',
        statusCliente: 'aguardando',
        entregaVia: 'manual',
        pickupLocation: 'Aguardando configuração',
        dropoffLocation: 'Aguardando configuração',
        moedaPagamento: 'dkcoin' // <-- agora informando DK
      }
    });
    
  
    await registrarReceita(tx, precoComDesconto, 'pedido_com_dkcoin');
    await gerarPacoteLogistico(tx, novoPedido.id, 'Aracaju', 'Itabaiana', 2.5);
  
    res.json({
      message: 'Pedido criado com sucesso usando DK Coin!',
      pedidoId: novoPedido.id,
      saldoRestante: carteira.saldo - valorEmDK
    });
  });
};


module.exports = { comprarComDK };
