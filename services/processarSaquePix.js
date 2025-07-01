const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function processarSaquePix(saqueId) {
  const saque = await prisma.saqueDK.findUnique({ where: { id: saqueId } });

  if (!saque) throw new Error("Saque não encontrado.");

  try {
    // Exemplo com API mockada:
    const response = await axios.post('https://sua-adquirente.com/api/pix/transfer', {
      chavePix: saque.chavePix,
      valor: saque.valor,
      identificador: saque.id
    });

    const { status, pixId } = response.data;

    if (status === 'sucesso') {
      await prisma.saqueDK.update({
        where: { id: saqueId },
        data: {
          status: 'aprovado',
          pixId,
          observacao: 'Transferência realizada com sucesso.'
        }
      });
    } else {
      throw new Error("Falha no saque");
    }

  } catch (err) {
    console.error(err);
    await prisma.saqueDK.update({
      where: { id: saqueId },
      data: {
        tentativas: { increment: 1 },
        observacao: err.message
      }
    });
  }
}

module.exports = { processarSaquePix };
