const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function criarAdminInicial() {
  const senhaHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.adminUser.create({
    data: {
      nome: 'Admin Master',
      email: 'admin@dk.com',
      password: senhaHash,
      role: 'ADMIN'
    }
  });

  await prisma.adminPermissao.createMany({
    data: [
      { adminId: admin.id, recurso: 'DASHBOARD', podeLer: true, podeGravar: true },
      { adminId: admin.id, recurso: 'USUARIOS', podeLer: true, podeGravar: true },
      { adminId: admin.id, recurso: 'TRANSFERENCIAS', podeLer: true, podeGravar: true },
      { adminId: admin.id, recurso: 'REWARDS', podeLer: true, podeGravar: true },
      { adminId: admin.id, recurso: 'AUDITORIA', podeLer: true, podeGravar: true },
      { adminId: admin.id, recurso: 'LOGS', podeLer: true, podeGravar: true },
      { adminId: admin.id, recurso: 'CONFIGURACAO', podeLer: true, podeGravar: true },
      { adminId: admin.id, recurso: 'PERMISSOES', podeLer: true, podeGravar: true }
    ]
  });

  console.log('✅ Admin inicial criado com sucesso!');
  process.exit();
}

criarAdminInicial();
