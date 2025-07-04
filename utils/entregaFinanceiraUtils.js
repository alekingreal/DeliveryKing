const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTaxaCambioUSD_BRL } = require('./cotacaoUtils');

async function registrarRecebimentoRealV3({ pedidoId, valorProduto, valorFrete, entregadorUserId, lojistaUserId }) {
  const plataformaPercentProduto = 0.10;
  const plataformaPercentFrete = 0.10;

  const comissaoProduto = valorProduto * plataformaPercentProduto;
  const comissaoFrete = valorFrete * plataformaPercentFrete;

  const liquidoLojista = valorProduto - comissaoProduto;
  const liquidoEntregador = valorFrete - comissaoFrete;
  const receitaPlataforma = comissaoProduto + comissaoFrete;

  await prisma.$transaction(async (tx) => {
    // Lojista
    console.log('💡 ID do lojista (userId) usado na upsert:', lojistaUserId);

    await tx.carteiraReal.upsert({
      where: { userId: lojistaUserId },
      update: { saldo: { increment: liquidoLojista } },
      create: { userId: lojistaUserId, saldo: liquidoLojista }
    });

    await tx.transacaoReal.create({
      data: {
        userId: lojistaUserId,
        tipo: 'recebimento',
        valor: liquidoLojista,
        descricao: `Recebimento venda pedido #${pedidoId}`
      }
    });

    // Entregador
    await tx.carteiraReal.upsert({
      where: { userId: entregadorUserId },
      update: { saldo: { increment: liquidoEntregador } },
      create: { userId: entregadorUserId, saldo: liquidoEntregador }
    });

    await tx.transacaoReal.create({
      data: {
        userId: entregadorUserId,
        tipo: 'frete',
        valor: liquidoEntregador,
        descricao: `Recebimento frete pedido #${pedidoId}`
      }
    });

    // Plataforma
    await tx.carteiraReal.upsert({
      where: { userId: 999 },
      update: { saldo: { increment: receitaPlataforma } },
      create: { userId: 999, saldo: receitaPlataforma }
    });

    await tx.transacaoReal.create({
      data: {
        userId: 999,
        tipo: 'receita',
        valor: receitaPlataforma,
        descricao: `Receita da plataforma pedido #${pedidoId}`
      }
    });
  });
}

async function processarPagamentoEntrega(deliveryId) {
  const entrega = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      orders: true,
      partner: true
    }
  });

  if (!entrega || !entrega.partner) {
    throw new Error('Entrega ou entregador não encontrados.');
  }

  // 💰 Pagamento DK Coin (convertendo o valor total dos pedidos)
  const totalReais = entrega.orders.reduce((acc, order) => acc + (order.total || 0), 0);
  const cotacao = await prisma.cotacaoDK.findFirst({ orderBy: { data: 'desc' } });
  const taxaCambio = await getTaxaCambioUSD_BRL();
  const valorUSD = totalReais / taxaCambio;
  const valorDK = valorUSD / cotacao.valorAtual;

  await prisma.$transaction(async (tx) => {
    await tx.transacaoDK.create({
      data: {
        userId: entrega.partner.userId,
        tipo: 'pagamento_entrega',
        valorDK,
        valorReal: totalReais,
        descricao: `Pagamento por entrega #${deliveryId}`
      }
    });

    await tx.carteiraDK.upsert({
      where: { userId: entrega.partner.userId },
      update: { saldo: { increment: valorDK } },
      create: { userId: entrega.partner.userId, saldo: valorDK }
    });
  });

  // 🔄 Processa financeiro Real individual de cada pedido
  for (const order of entrega.orders) {

    console.log('🔍 Pedido:', order.id);
    console.log('➡️ userId (lojista):', order.userId);
    console.log('➡️ total do produto:', order.total);
    console.log('➡️ frete:', order.deliveryFee);
    console.log('➡️ entregador userId:', entrega.partner.userId);




    await registrarRecebimentoRealV3({
      pedidoId: order.id,
      valorProduto: order.total,
      valorFrete: order.deliveryFee,
      entregadorUserId: entrega.partner.userId,
      lojistaUserId: order.userId
    });
  }

  return { totalReais, valorDK };
}

module.exports = {
  processarPagamentoEntrega,
  registrarRecebimentoRealV3
};
