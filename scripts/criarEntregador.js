const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Criando entregadores...');

  // Verifica se os usuários existem
  const user1 = await prisma.user.findUnique({ where: { id: 1 } });
  const user2 = await prisma.user.findUnique({ where: { id: 2 } });
  const user3 = await prisma.user.findUnique({ where: { id: 3 } });

  if (!user1 || !user2 || !user3) {
    throw new Error('❌ Um ou mais usuários (1, 2, 3) não existem no banco. Crie-os antes de continuar.');
  }

  await prisma.partner.create({
    data: {
      user: {
        create: {
          name: "Carlos Motoqueiro",
          email: "carlos@example.com",
          password: "$2b$12$e4Shv2A07tRzDoPlY3Kcse.k2tU7HAlBNkxjz2EqLTZxzDLF7VKjK", // senha criptografada
          cpf: "98765432100",
          phone: "79988888888",
          city: "Aracaju"
        }
      },
      name: "Carlos Motoqueiro",
      cpf: "98765432100",
      phone: "79988888888",
      vehicle: "moto",
      locationLat: -10.947,
      locationLng: -37.073,
      podeMotoTaxi: true,
      modoAtual: "motoTaxi",
      aprovado: true,
      available: true
    }
  });
  

  await prisma.partner.create({
    data: {
      user: {
        create: {
          name: "Marcela Cunha",
          email: "user2@example.com",
          password: "$2b$12$n4dBpGhK629AvDhlChUsp.kzQ6zXwozmRxpgXXIYdZjEBFtaQIFCe",
          cpf: "47395620143",
          phone: "4113386806",
          city: "Rodrigues de Martins"
        }
      },
      name: "Marcela Cunha",
      cpf: "47395620143",
      phone: "4113386806",
      vehicle: "moto",
      locationLat: -10.942,
      locationLng: -37.072,
      podeMotoTaxi: true,
      modoAtual: "motoTaxi",
      aprovado: true,
      available: true
    }
  });
  

  await prisma.partner.create({
    data: {
      user: {
        create: {
          name: "Vitor Hugo Campos",
          email: "user3@example.com",
          password: "$2b$12$FwQP.wlZ4rLMKFuEhkMvDeFkT9ulo9Udx5/5pQuGZsNHvvZ6ZW9t6",
          cpf: "17942086585",
          phone: "+553187510077",
          city: "Dias do Sul"
        }
      },
      name: "Vitor Hugo Campos",
      cpf: "17942086585",
      phone: "+553187510077",
      vehicle: "moto",
      locationLat: -10.943,
      locationLng: -37.073,
      podeMotoTaxi: true,
      modoAtual: "motoTaxi",
      aprovado: true,
      available: true
    }
  });
  
  

  console.log('✅ Todos os entregadores foram criados com sucesso!');
}

main()
  .catch(e => {
    console.error('❌ Erro ao criar entregadores:', e.message);
  })
  .finally(() => prisma.$disconnect());
