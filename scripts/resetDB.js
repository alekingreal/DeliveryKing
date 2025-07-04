const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  try {
    console.log("⚠️ Resetando banco de dados...");

    await prisma.transacaoDK.deleteMany();
    await prisma.carteiraDK.deleteMany();
    await prisma.order.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.partner.deleteMany();
    await prisma.user.deleteMany();

    console.log("✅ Banco limpo com sucesso.");
  } catch (err) {
    console.error("❌ Erro ao resetar banco:", err);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
