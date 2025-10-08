const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTaxaCambioUSD_BRL } = require('../utils/cotacaoUtils');

// Conta "da casa" para receber comissões (ajuste se usar outra)
const HOUSE_ACCOUNT_USER_ID = 999;

// Utilitário simples para evitar NaN
const n = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);

// Zerador seguro
const z = (v) => (isFinite(v) ? v : 0);

// ---------------------------
// GET /financeiro-entrega/painel
// ---------------------------
const obterPainelEntrega = async (req, res) => {
  try {
    const { partnerId } = req.query;
    if (!partnerId) {
      return res.status(400).json({ message: 'partnerId obrigatório' });
    }

    // Pega o parceiro para descobrir o userId (carteiras)
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true, userId: true },
    });

    if (!partner) {
      return res.status(404).json({ message: 'Partner não encontrado' });
    }

    // Saldos
    const [carteiraReal, carteiraDK] = await Promise.all([
      prisma.carteiraReal.findUnique({ where: { userId: partner.userId } }),
      prisma.carteiraDK.findUnique({ where: { userId: partner.userId } }),
    ]);

    const saldoReal = z(carteiraReal?.saldo) || 0;
    const saldoDKCoin = z(carteiraDK?.saldo) || 0;

    // Janela de "hoje"
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Pedidos finalizados hoje (assumindo relação Order -> Delivery)
    // e que Delivery tem partnerId + status finalizada e updatedAt na janela.
    const pedidosHoje = await prisma.order.findMany({
      where: {
        delivery: {
          partnerId: partnerId,
          status: 'finalizada',
          updatedAt: { gte: start, lte: end },
        },
      },
      select: { deliveryFee: true, createdAt: true, updatedAt: true },
    });

    const entregasHoje = pedidosHoje.length;

    // Ganho do entregador por pedido = 90% da taxa de entrega (ajuste se sua regra mudou)
    const ganhosHoje = pedidosHoje.reduce(
      (acc, o) => acc + n(o.deliveryFee) * 0.90,
      0
    );

    // Últimos 7 dias (inclui hoje)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);

    const pedidosSemana = await prisma.order.findMany({
      where: {
        delivery: {
          partnerId: partnerId,
          status: 'finalizada',
          updatedAt: { gte: sevenDaysAgo, lte: end },
        },
      },
      select: { deliveryFee: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });

    // Agrega por dia (Dom(0) .. Sáb(6) ou você pode normalizar para Segunda..Domingo)
    // Aqui vou devolver arrays de 7 posições (do mais antigo para hoje).
    const byDay = new Array(7).fill(null).map(() => ({ entregas: 0, ganhos: 0 }));

    pedidosSemana.forEach((o) => {
      const d = new Date(o.updatedAt);
      // índice relativo (0 = sevenDaysAgo, 6 = hoje)
      const diffDays = Math.floor((d - sevenDaysAgo) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        byDay[diffDays].entregas += 1;
        byDay[diffDays].ganhos += n(o.deliveryFee) * 0.90;
      }
    });

    const semanaEntregas = byDay.map((d) => d.entregas);
    const semanaGanhos = byDay.map((d) => Number(d.ganhos.toFixed(2)));

    // Nível/estrelas (placeholder — ajuste com sua lógica real)
    const nivel = 'Profissional';
    const estrelas = 3;

    return res.json({
      nivel,
      estrelas,
      saldoDKCoin: Number(saldoDKCoin.toFixed(6)),
      saldoReal: Number(saldoReal.toFixed(2)),
      ganhosHoje: Number(ganhosHoje.toFixed(2)),
      entregasHoje,
      semanaEntregas,
      semanaGanhos,
    });
  } catch (err) {
    console.error('Erro ao montar painel:', err);
    return res.status(500).json({ message: 'Erro ao montar painel' });
  }
};

// ---------------------------
// POST /financeiro-entrega/registrar
// ---------------------------
const registrarPagamentoEntrega = async (req, res) => {
  const { partnerId } = req.body;

  if (!partnerId) {
    return res.status(400).json({ error: 'partnerId obrigatório' });
  }

  try {
    const entregador = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        deliveries: {
          where: { status: 'finalizada' }, // ajuste se seu status é "entregue"
          include: { orders: true },
        },
      },
    });

    if (!entregador) return res.status(404).json({ error: 'Entregador não encontrado' });

    // Taxa de câmbio (para conversão DK ↔︎ BRL)
    const taxaCambio = await getTaxaCambioUSD_BRL().catch(() => null);
    // Se a cotação falhar, ainda podemos registrar apenas a parte em real.
    const cambio = taxaCambio && isFinite(taxaCambio) && taxaCambio > 0 ? taxaCambio : null;

    // Transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      for (const delivery of entregador.deliveries) {
        for (const order of delivery.orders) {
          const total = n(order.total);
          const deliveryFee = n(order.deliveryFee);

          // Proporções pagas em cada moeda
          const valorPagoReal = n(order.valorPagoReal);
          const valorPagoDK = n(order.valorPagoDK);
          const totalPago = valorPagoReal + valorPagoDK;

          // Evita divisão por zero
          const proporcaoReal = total > 0 ? valorPagoReal / total : (totalPago > 0 ? valorPagoReal / totalPago : 0);
          const proporcaoDK = total > 0 ? valorPagoDK / total : (totalPago > 0 ? valorPagoDK / totalPago : 0);

          // Comissão da plataforma (10%)
          const comissao = total * 0.10;
          const repasseLojista = total - comissao;

          // ====== REAL ======
          const repasseReal = repasseLojista * proporcaoReal;
          const comissaoReal = comissao * proporcaoReal;

          if (repasseReal > 0) {
            // Repasse para lojista (assumindo order.userId = lojista)
            await tx.carteiraReal.upsert({
              where: { userId: order.userId },
              create: { userId: order.userId, saldo: repasseReal },
              update: { saldo: { increment: repasseReal } },
            });
            // Comissão da casa
            await tx.carteiraReal.upsert({
              where: { userId: HOUSE_ACCOUNT_USER_ID },
              create: { userId: HOUSE_ACCOUNT_USER_ID, saldo: comissaoReal },
              update: { saldo: { increment: comissaoReal } },
            });
          }

          // ====== DKCOIN ======
          if (proporcaoDK > 0 && cambio) {
            const repasseDK = repasseLojista * proporcaoDK;
            const comissaoDK = comissao * proporcaoDK;

            const quantidadeDKCoinRepasse = repasseDK / cambio;
            const quantidadeDKCoinComissao = comissaoDK / cambio;

            if (quantidadeDKCoinRepasse > 0) {
              await tx.carteiraDK.upsert({
                where: { userId: order.userId },
                create: { userId: order.userId, saldo: quantidadeDKCoinRepasse },
                update: { saldo: { increment: quantidadeDKCoinRepasse } },
              });
            }
            if (quantidadeDKCoinComissao > 0) {
              await tx.carteiraDK.upsert({
                where: { userId: HOUSE_ACCOUNT_USER_ID },
                create: { userId: HOUSE_ACCOUNT_USER_ID, saldo: quantidadeDKCoinComissao },
                update: { saldo: { increment: quantidadeDKCoinComissao } },
              });
            }

            // Atualiza o supply circulante (tenta; se não houver registro id=1, ignore o erro)
            try {
              await tx.supplyDK.update({
                where: { id: 1 },
                data: {
                  circulating: {
                    increment: quantidadeDKCoinRepasse + quantidadeDKCoinComissao,
                  },
                },
              });
            } catch (_e) {
              // opcional: criar se não existir
              // await tx.supplyDK.create({ data: { circulating: quantidadeDKCoinRepasse + quantidadeDKCoinComissao, reserve: 0, burned: 0 } });
            }
          }

          // ====== PAGAMENTO DO ENTREGADOR (sempre em Real, 90% da taxa de entrega) ======
          const valorEntregador = deliveryFee * 0.90;
          if (valorEntregador > 0) {
            await tx.carteiraReal.upsert({
              where: { userId: entregador.userId },
              create: { userId: entregador.userId, saldo: valorEntregador },
              update: { saldo: { increment: valorEntregador } },
            });
            // 10% da taxa para a casa
            await tx.carteiraReal.upsert({
              where: { userId: HOUSE_ACCOUNT_USER_ID },
              create: { userId: HOUSE_ACCOUNT_USER_ID, saldo: deliveryFee * 0.10 },
              update: { saldo: { increment: deliveryFee * 0.10 } },
            });
          }
        }
      }
    });

    return res.json({ message: 'Pagamento híbrido registrado com sucesso!' });
  } catch (err) {
    console.error('Erro no financeiro híbrido entrega:', err);
    return res.status(500).json({ error: 'Erro interno no processamento financeiro.' });
  }
};

module.exports = {
  registrarPagamentoEntrega,
  obterPainelEntrega,
};
