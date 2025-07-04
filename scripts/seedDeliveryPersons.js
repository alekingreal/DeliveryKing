// backend/scripts/seedPartners.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    await prisma.partner.createMany({
        data: [
          {
            name: "Carlos Silva",
            cpf: "12345678901",
            phone: "+5511999990001",
            vehicle: "Moto",
            locationLat: -23.55052,
            locationLng: -46.633308,
            available: true,
            pending: 0,
            balance: 0
          },
          {
            name: "Juliana Rocha",
            cpf: "98765432100",
            phone: "+5511999990002",
            vehicle: "Bike",
            locationLat: -23.5531,
            locationLng: -46.6388,
            available: true,
            pending: 0,
            balance: 0
          },
          {
            name: "Marcos Almeida",
            cpf: "45678912300",
            phone: "+5511999990003",
            vehicle: "Carro",
            locationLat: -23.5562,
            locationLng: -46.6305,
            available: true,
            pending: 0,
            balance: 0
          }
        ]
      });
      
      

    console.log('🚀 Entregadores criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar entregadores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
