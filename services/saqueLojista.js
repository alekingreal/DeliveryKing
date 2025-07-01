const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function solicitarSaqueLojista(userId, valorSolicitado) {
  const hoje = new Date();

  const recebiveisDisponiveis = await prisma.recebivel.findMany({
    where: {
      userIdRecebedor: userId,
      status: 'pendente',
      dataDisponivel: { lte: hoje }
    }
  });

  const totalDisponivel = recebiveisDisponiveis.reduce((acc, rec) => acc + rec.valorLiquido, 0);

  if (totalDisponivel < valorSolicitado) {
    throw new Error("Valor solicitado acima do disponível.");
  }

  // Marcar recebiveis como liquidados (ou fazer controle parcial se quiser granularidade)
  await prisma.recebivel.updateMany({
    where: {
      userIdRecebedor: userId,
      status: 'pendente',
      dataDisponivel: { lte: hoje }
    },
    data: { status: 'liquidado' }
  });

  // Registrar o saque
  await prisma.saqueDK.create({
    data: {
      userId,
      valor: valorSolicitado,
      status: 'pendente',
    }
  });

  console.log('Saque solicitado com sucesso.');
}

module.exports = { solicitarSaqueLojista };
