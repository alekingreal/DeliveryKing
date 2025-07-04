const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarEntregadores() {
  const entregadores = await prisma.partner.findMany({
    where: {
      vehicle: 'moto'
    },
    select: {
      id: true,
      name: true,
      available: true,
      aprovado: true,
      locationLat: true,
      locationLng: true,
      modoAtual: true,
      podeMotoTaxi: true
    }
  });

  console.log('📋 Entregadores (moto):');
  entregadores.forEach(e => {
    const status = (e.available && e.aprovado && e.locationLat && e.locationLng && e.modoAtual === 'motoTaxi' && e.podeMotoTaxi)
      ? '✅ OK'
      : '❌ FALTA AJUSTAR';
    console.log({
      id: e.id,
      nome: e.name,
      modoAtual: e.modoAtual,
      status
    });
  });

  await prisma.$disconnect();
}

verificarEntregadores();
