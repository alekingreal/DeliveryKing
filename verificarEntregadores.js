const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const entregadores = await prisma.deliveryPerson.findMany({
    where: {
      modoAtual: { not: 'delivery' }
    },
    select: {
      id: true,
      modoAtual: true,
      podeDelivery: true,
      available: true,
      locationLat: true,
      locationLng: true
    }
  });

  console.log('📋 Entregadores com modoAtual diferente de delivery:');
  console.table(entregadores);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
