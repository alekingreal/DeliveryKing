const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  const hashedPassword = await bcrypt.hash('senha123', 10);

  const user = await prisma.user.create({
    data: {
      name: 'Tester DK',
      email: 'teste@deliveryking.com',
      password: hashedPassword,
      cpf: '00000000000',
      phone: '79999999999',
      city: 'Aracaju',
      deliveryProfile: {
        create: {
          name: 'Tester DK',
          cpf: '00000000000',
          phone: '79999999999',
          vehicle: 'moto',
          available: true,
          balance: 0,
          pending: 0,
          punishmentLevel: 0,
          violations: 0,
          podeDelivery: true,
          podeMotoTaxi: false,
          podeCarroTaxi: false,
          podeFrete: false,
          aprovado: true
        }
      }
    }
  });

  console.log('✅ Usuário de teste inserido com sucesso:', user);
  await prisma.$disconnect();
}

seed();
