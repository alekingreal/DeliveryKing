const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔁 Deletando pedidos...');
    await prisma.order.deleteMany();

    console.log('👤 Deletando usuários...');
    await prisma.user.deleteMany();

    console.log('🚚 Deletando entregas sem pedidos...');
    await prisma.delivery.deleteMany({
      where: {
        orders: {
          none: {},
        },
      },
    });

    console.log('✅ Banco limpo com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error);
    process.exit(1);
  }
})();
