const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function liberarTodosPunidos() {
  try {
    const resultado = await prisma.partner.updateMany({
        where: {
          blockUntil: {
            not: null
          }
        },
        data: {
          blockUntil: null,
          punishmentLevel: 0,
          violations: 0,
          available: true,
          pending: 0
        }
      });

    console.log(`✅ ${resultado.count} entregadores punidos foram liberados com sucesso!`);
  } catch (error) {
    console.error('❌ Erro ao liberar entregadores punidos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

liberarTodosPunidos();
