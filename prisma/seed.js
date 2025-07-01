const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Criar 3 usuários com perfis de entregador
  await prisma.user.createMany({
    data: [
      {
        name: 'Carlos Motoqueiro 1',
        email: 'moto1@example.com',
        password: '45c4771dcd1cbd65babf3dd8cd70fed56d428fe708183ba1d146f0ad153773d7',
        cpf: '00000000001',
        phone: '79900000001'
      },
      {
        name: 'Carlos Motoqueiro 2',
        email: 'moto2@example.com',
        password: '2649f5d6935e520287c37da599ba031b9b19244e98718121de58f8739feacfbd',
        cpf: '00000000002',
        phone: '79900000002'
      },
      {
        name: 'Carlos Motoqueiro 3',
        email: 'moto3@example.com',
        password: '0c11c71f626ba3de8c9a9a29c3e762ce0c42dfc622113f92a3cc6953d3071c73',
        cpf: '00000000003',
        phone: '79900000003'
      }
    ]
  });
  

  const usuariosCriados = await prisma.user.findMany({
    where: {
      email: {
        in: ['moto1@example.com', 'moto2@example.com', 'moto3@example.com']
      }
    }
  });

  // Criar os DeliveryPersons associados
  for (let i = 0; i < usuariosCriados.length; i++) {
    await prisma.deliveryPerson.create({
      data: {
        userId: usuariosCriados[i].id,
        name: usuariosCriados[i].name,
        cpf: usuariosCriados[i].cpf,
        phone: usuariosCriados[i].phone,
        vehicle: 'moto',
        locationLat: -10.94 + i * 0.001,
        locationLng: -37.07 + i * 0.001,
        podeMotoTaxi: true,
        modoAtual: 'motoTaxi',
        aprovado: true
      }
    });
  }



  // Criar usuários para delivery-king
await prisma.user.createMany({
    data: [
      {
        name: 'Carlos Entregador 1',
        email: 'delivery1@example.com',
        password: 'c1a1c7016a8f1e8208dd0f15245c0975c8f25ea938f98953c47cc6ebed5f410b', // exemplo
        cpf: '00000000004',
        phone: '79900000004'
      },
      {
        name: 'Carlos Entregador 2',
        email: 'delivery2@example.com',
        password: 'c1a1c7016a8f1e8208dd0f15245c0975c8f25ea938f98953c47cc6ebed5f410b',
        cpf: '00000000005',
        phone: '79900000005'
      },
      {
        name: 'Carlos Entregador 3',
        email: 'delivery3@example.com',
        password: 'c1a1c7016a8f1e8208dd0f15245c0975c8f25ea938f98953c47cc6ebed5f410b',
        cpf: '00000000006',
        phone: '79900000006'
      }
    ]
  });
  
  // Buscar os 3 novos usuários
  const usuariosDelivery = await prisma.user.findMany({
    where: {
      email: {
        in: ['delivery1@example.com', 'delivery2@example.com', 'delivery3@example.com']
      }
    }
  });
  
  // Criar os DeliveryPersons para delivery-king
  for (let i = 0; i < usuariosDelivery.length; i++) {
    await prisma.deliveryPerson.create({
      data: {
        userId: usuariosDelivery[i].id,
        name: usuariosDelivery[i].name,
        cpf: usuariosDelivery[i].cpf,
        phone: usuariosDelivery[i].phone,
        vehicle: 'moto',
        locationLat: -10.945 + i * 0.001,
        locationLng: -37.075 + i * 0.001,
        podeDelivery: true,
        modoAtual: 'delivery',
        aprovado: true
      }
    });
  }
  

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch(e => {
    console.error('❌ Erro no seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
