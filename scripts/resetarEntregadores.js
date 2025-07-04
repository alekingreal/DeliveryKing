// scripts/resetarEntregadores.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetarEntregadores() {
  try {
    const resultado = await prisma.partner.updateMany({
      data: {
        available: true,
        punishmentLevel: 0,
        blockUntil: null,
        pending: 0
      }
    });

    console.log(`✅ Reset concluído para ${resultado.count} entregadores.`);
  } catch (error) {
    console.error('❌ Erro ao resetar entregadores:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetarEntregadores();
