const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTaxaCambioUSD_BRL } = require('../utils/cotacaoUtils');  // já vamos usar tua função existente

const registrarPagamentoEntrega = async (req, res) => {
  const { deliveryPersonId } = req.body;

  try {
    const entregador = await prisma.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
      include: {
        deliveries: {
          where: { status: 'finalizada' },
          include: { orders: true }
        }
      }
    });

    if (!entregador) return res.status(404).json({ error: 'Entregador não encontrado' });

    const taxaCambio = await getTaxaCambioUSD_BRL();  // buscamos o dólar atual

    for (const delivery of entregador.deliveries) {
      for (const order of delivery.orders) {
        const comissao = order.total * 0.10;
        const repasseLojista = order.total - comissao;

        // CALCULA PROPORÇÃO DE CADA MOEDA
        const proporcaoReal = order.valorPagoReal / order.total;
        const proporcaoDK = order.valorPagoDK / order.total;

        // ==== REAL ====

        const repasseReal = repasseLojista * proporcaoReal;
        const comissaoReal = comissao * proporcaoReal;

        if (repasseReal > 0) {
          await prisma.carteiraReal.upsert({
            where: { userId: order.userId },
            create: { userId: order.userId, saldo: repasseReal },
            update: { saldo: { increment: repasseReal } }
          });

          await prisma.carteiraReal.upsert({
            where: { userId: 999 },
            create: { userId: 999, saldo: comissaoReal },
            update: { saldo: { increment: comissaoReal } }
          });
        }

        // ==== DKCOIN ====

        const repasseDK = repasseLojista * proporcaoDK;
        const comissaoDK = comissao * proporcaoDK;

        if (repasseDK > 0) {
          const quantidadeDKCoinRepasse = repasseDK / taxaCambio;
          const quantidadeDKCoinComissao = comissaoDK / taxaCambio;

          await prisma.carteiraDK.upsert({
            where: { userId: order.userId },
            create: { userId: order.userId, saldo: quantidadeDKCoinRepasse },
            update: { saldo: { increment: quantidadeDKCoinRepasse } }
          });

          await prisma.carteiraDK.upsert({
            where: { userId: 999 },
            create: { userId: 999, saldo: quantidadeDKCoinComissao },
            update: { saldo: { increment: quantidadeDKCoinComissao } }
          });

          // Atualiza o supply total de DKCoin
          await prisma.supplyDK.update({
            where: { id: 1 },
            data: {
              circulating: { increment: quantidadeDKCoinRepasse + quantidadeDKCoinComissao }
            }
          });
        }

        // ==== PAGAMENTO DO ENTREGADOR (sempre em real) ====

        const valorEntregador = order.deliveryFee * 0.90;

        await prisma.carteiraReal.upsert({
          where: { userId: entregador.userId },
          create: { userId: entregador.userId, saldo: valorEntregador },
          update: { saldo: { increment: valorEntregador } }
        });

        await prisma.carteiraReal.upsert({
          where: { userId: 999 },
          create: { userId: 999, saldo: order.deliveryFee * 0.10 },
          update: { saldo: { increment: order.deliveryFee * 0.10 } }
        });
      }
    }

    res.json({ message: 'Pagamento híbrido registrado com sucesso!' });

  } catch (err) {
    console.error('Erro no financeiro híbrido entrega:', err);
    res.status(500).json({ error: 'Erro interno no processamento financeiro.' });
  }
};

module.exports = { registrarPagamentoEntrega };
