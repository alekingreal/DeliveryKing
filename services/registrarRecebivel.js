const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registrarRecebivel(orderId, userIdRecebedor, valorBruto) {
  const taxaAdquirente = 0.02; // 2%
  const taxaGateway = valorBruto * taxaAdquirente;

  const comissaoPlataforma = valorBruto * 0.10;
  const valorLiquido = valorBruto - taxaGateway - comissaoPlataforma;

  const dataDisponivel = new Date();
  dataDisponivel.setDate(dataDisponivel.getDate() + 1); // D+1

  await prisma.recebivel.create({
    data: {
      pedidoId: orderId,
      userIdRecebedor,
      valorBruto,
      taxas: taxaGateway + comissaoPlataforma,
      valorLiquido,
      status: 'pendente',
      dataDisponivel,
    }
  });

  console.log('Recebível registrado com sucesso.');
}

module.exports = { registrarRecebivel };
