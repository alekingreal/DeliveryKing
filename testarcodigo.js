const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testarEntregadores() {
  const entregadores = await prisma.partner.findMany({
    select: {
      id: true,
      modoAtual: true,
      podeDelivery: true,
      available: true,
    },
  });

  for (const e of entregadores) {
    console.log(`🧪 ID: ${e.id} | modoAtual: "${e.modoAtual}" | podeDelivery: ${e.podeDelivery}`);
  }

  await prisma.$disconnect();
}

testarEntregadores();
