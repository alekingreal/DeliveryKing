const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigirModos() {
  await prisma.partner.updateMany({
    data: { modoAtual: 'motoTaxi' }
  });

  console.log('🚀 Todos os entregadores atualizados com modoAtual: motoTaxi');
  await prisma.$disconnect();
}

corrigirModos();
