// backend/scripts/adminCLI.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createOrAttachPartnerUser({ name, email, password, cpf, phone, city = 'Aracaju' }) {
  let user = await prisma.user.findFirst({
    where: { OR: [{ cpf }, { phone }, { email }] }
  });

  if (!user) {
    // Se não existir o usuário, cria normalmente:
    const hashedPassword = await bcrypt.hash(password, 10);

    user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf,
        phone,
        city,
        deliveryProfile: {
          create: {
            name,
            cpf,
            phone,
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
      },
      include: { deliveryProfile: true }
    });

    console.log('✅ Usuário e entregador criados com sucesso!');
  } else {
    console.log('⚠️ Usuário já existe, verificando Partner...');

    const existingPartner = await prisma.partner.findUnique({
      where: { userId: user.id }
    });

    if (existingPartner) {
      console.log('⚠️ Este usuário já possui Partner vinculado.');
    } else {
      await prisma.partner.create({
        data: {
          userId: user.id,
          name,
          cpf,
          phone,
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
      });

      console.log('✅ Partner criado e vinculado com sucesso!');
    }
  }

  await prisma.$disconnect();
}

// Executa via terminal

const args = process.argv.slice(2);

if (args.length < 5) {
  console.log(`
⚠️ Uso correto:
node scripts/adminCLI.js <name> <email> <password> <cpf> <phone>

Exemplo:
node scripts/adminCLI.js "Tester DK" teste@deliveryking.com senha123 00000000000 79999999999
  `);
  process.exit(1);
}

const [name, email, password, cpf, phone] = args;

createOrAttachPartnerUser({ name, email, password, cpf, phone });
