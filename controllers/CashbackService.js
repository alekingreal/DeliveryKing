const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Ajustável:
const PERCENTUAL_CASHBACK = 0.05;  // 5% de cashback

exports.gerarCashback = async (userId, valorPedido) => {
  const valorCashback = valorPedido * PERCENTUAL_CASHBACK;

  const supply = await prisma.supplyDK.findFirst();

  if (!supply || supply.reserved < valorCashback) {
    console.warn('⚠ Supply insuficiente para cashback!');
    return;  // não gera se não tem saldo reservado
  }

  await prisma.$transaction([
    prisma.supplyDK.update({
      where: { id: supply.id },
      data: {
        reserved: { decrement: valorCashback },
        circulating: { increment: valorCashback }
      }
    }),
    prisma.carteiraDK.update({
      where: { userId },
      data: { saldo: { increment: valorCashback } }
    }),
    prisma.transacaoDK.create({
      data: {
        userId,
        tipo: 'cashback',
        valorDK: valorCashback,
        descricao: 'Cashback recebido'
      }
    })
  ]);

  console.log(`✅ Cashback de ${valorCashback.toFixed(4)} DK gerado para user ${userId}`);
};
