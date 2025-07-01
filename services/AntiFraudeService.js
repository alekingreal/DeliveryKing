const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LIMITE_MOVIMENTACAO = 50000; // valor limite configurável

exports.analisarTransacao = async (userId, valorDK, tipo) => {
  if (valorDK > LIMITE_MOVIMENTACAO) {
    await prisma.flagSuspeita.create({
      data: {
        userId,
        tipo: 'ALTA_MOVIMENTACAO',
        descricao: `Movimentação anormal de ${valorDK} DK (${tipo})`
      }
    });
  }
};
