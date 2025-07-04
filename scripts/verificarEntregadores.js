const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const entregadores = await prisma.partner.findMany({
    select: {
      id: true,
      name: true,
      available: true,
      blockUntil: true,
      violations: true
    }
  });

  console.log("📋 Entregadores registrados:");
  for (const e of entregadores) {
    console.log(`🧍 ID ${e.id} | disponível: ${e.available} | bloqueado até: ${e.blockUntil?.toISOString() || 'null'} | violações: ${e.violations}`);
  }

  process.exit();
})();
