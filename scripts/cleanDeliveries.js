// scripts/cleanDeliveries.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limparEntregasPendentes() {
  try {
    // Remove as entregas pendentes (ainda não aceitas)
    await prisma.order.updateMany({
      where: {
        delivery: {
          status: 'pendente',
        },
      },
      data: {
        deliveryId: null,
        statusCliente: 'aguardando',
      },
    });

    const deleted = await prisma.delivery.deleteMany({
      where: {
        status: 'pendente',
        deliveryPersonId: null,
      },
    });

    console.log(`✅ Entregas pendentes removidas com sucesso (${deleted.count})`);
  } catch (error) {
    console.error('❌ Erro ao limpar entregas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

limparEntregasPendentes();
