// controllers/RecompraController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTaxaCambioUSD_BRL } = require('../utils/cotacaoUtils');

const solicitarRecompra = async (req, res) => {
  const userId = Number(req.headers['userid']);
  const { valorDK } = req.body;

  if (!valorDK || valorDK <= 0) {
    return res.status(400).json({ message: 'Valor inválido' });
  }

  const carteira = await prisma.carteiraDK.findUnique({ where: { userId } });

  if (!carteira || carteira.saldo < valorDK) {
    return res.status(400).json({ message: 'Saldo insuficiente' });
  }

  const cotacao = await prisma.cotacaoDK.findFirst({ orderBy: { data: 'desc' } });
  const taxaCambio = await getTaxaCambioUSD_BRL();

  const valorReal = valorDK * cotacao.valorAtual * taxaCambio;

  await prisma.$transaction([
    prisma.carteiraDK.update({
      where: { userId },
      data: { saldo: { decrement: valorDK } }
    }),
    prisma.recompraDK.create({
      data: {
        userId,
        valorDK,
        valorReal,
      }
    })
  ]);

  res.json({ message: 'Solicitação enviada!', valorReal: valorReal.toFixed(2) });
};


module.exports = { solicitarRecompra };
