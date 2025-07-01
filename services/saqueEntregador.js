const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function solicitarSaqueEntregador(userId, valorSolicitado) {
  const carteira = await prisma.carteiraReal.findUnique({
    where: { userId }
  });

  if (!carteira || carteira.saldo < valorSolicitado) {
    throw new Error("Saldo insuficiente.");
  }

  // Debita da carteira
  await prisma.carteiraReal.update({
    where: { userId },
    data: { saldo: { decrement: valorSolicitado } }
  });

  // Cria solicitação de saque
  await prisma.saqueDK.create({
    data: {
      userId,
      valor: valorSolicitado,
      status: 'pendente',
    }
  });

  console.log('Saque solicitado com sucesso.');
}

module.exports = { solicitarSaqueEntregador };
