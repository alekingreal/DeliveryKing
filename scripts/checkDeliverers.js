const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const todos = await prisma.deliveryPerson.findMany({
    select: {
      id: true,
      name: true,
      available: true,
      pending: true,
      punishmentLevel: true,
      blockUntil: true
    }
  });

  console.log('\n📦 ENTREGADORES REGISTRADOS:\n');
  todos.forEach(e => {
    console.log(`🧍 Entregador ${e.id} | disponível: ${e.available}`);
    console.log(`   pending: ${e.pending}`);
    console.log(`   punishmentLevel: ${e.punishmentLevel}`);
    console.log(`   blockUntil: ${e.blockUntil}`);
    console.log('-------------------------------------');
  });

  process.exit();
})();
