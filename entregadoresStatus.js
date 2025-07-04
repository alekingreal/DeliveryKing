const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checarEntregadores() {
  const todos = await prisma.partner.findMany();

  console.log('📋 Após punição, todos os entregadores:', todos.map(e => ({
    id: e.id,
    nome: e.name,
    available: e.available,
    blockUntil: e.blockUntil,
    modo: e.modoAtual
  })));

  await prisma.$disconnect();
}

checarEntregadores();
