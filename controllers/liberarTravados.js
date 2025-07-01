// utils/liberarTravados.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function liberarTravados() {
  const agora = new Date();
  console.log("🔍 Checando desbloqueio de entregadores às", agora.toISOString());

  // ✅ 1. Liberar entregadores realmente punidos cujo tempo já acabou
  const punidosLiberados = await prisma.deliveryPerson.updateMany({
    where: {
      blockUntil: {
        lte: agora,
        not: null
      },
      available: false
    },
    data: {
      available: true,
      blockUntil: null
    }
  });

  // ✅ 2. Liberar apenas travados que NUNCA foram punidos
  const travadosNuncaPunidos = await prisma.deliveryPerson.updateMany({
    where: {
      blockUntil: null,
      punishmentLevel: 0,
      available: false
    },
    data: {
      available: true
    }
  });

  const total = punidosLiberados.count + travadosNuncaPunidos.count;

  if (total > 0) {
    console.log(`✅ Liberados ${total} entregadores: ${punidosLiberados.count} punidos + ${travadosNuncaPunidos.count} travados`);
  } else {
    console.log('🛑 Nenhum entregador para liberar.');
  }

  // 🔍 Mostrar quem ainda está punido
  const aindaPunidos = await prisma.deliveryPerson.findMany({
    where: {
      blockUntil: {
        gt: agora
      }
    },
    select: {
      id: true,
      name: true,
      blockUntil: true,
      punishmentLevel: true,
      available: true
    }
  });

  console.log("⚠️ Entregadores ainda punidos no sistema:", aindaPunidos);
}

module.exports = {
  liberarTravados
};
