const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Conectado com sucesso no banco de dados.");
  } catch (e) {
    console.error("❌ Falha na conexão:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
