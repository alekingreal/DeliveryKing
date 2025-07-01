// scripts/verificarPedidosComPickupFora.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const pedidos = await prisma.order.findMany({
    where: {
      pickupLat: { not: null },
      pickupLng: { not: null }
    },
    select: {
      id: true,
      pickupLat: true,
      pickupLng: true,
      dropoffLat: true,
      dropoffLng: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });

  console.log('📦 Pedidos com coordenadas de retirada:');
  pedidos.forEach(p => {
    console.log(
      `#${p.id} | Retirada: (${p.pickupLat}, ${p.pickupLng}) → Entrega: (${p.dropoffLat}, ${p.dropoffLng})`
    );
  });

  process.exit();
}

run().catch(e => {
  console.error('Erro:', e);
  process.exit(1);
});

