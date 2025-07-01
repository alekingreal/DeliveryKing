const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.solicitarSaque = async (req, res) => {
  const userId = req.user.userId;
  const { valor, pixKey } = req.body;

  if (!valor || !pixKey) return res.status(400).json({ message: 'Informe o valor e chave Pix.' });

  try {
    const carteira = await prisma.carteiraDK.findUnique({ where: { userId } });

    if (!carteira || carteira.saldo < valor) {
      return res.status(400).json({ message: 'Saldo insuficiente.' });
    }

    await prisma.$transaction([
      prisma.carteiraDK.update({
        where: { userId },
        data: {
          saldo: { decrement: valor },
          bloqueado: { increment: valor }
        }
      }),
      prisma.saqueDK.create({
        data: { userId, valorDK: valor, pixKey }
      }),
      prisma.transacaoDK.create({
        data: {
          userId,
          tipo: 'saque',
          valorDK: -valor,
          descricao: 'Saque solicitado'
        }
      })
    ]);

    res.json({ message: 'Saque solicitado com sucesso!' });

  } catch (err) {
    console.error('Erro ao solicitar saque:', err);
    res.status(500).json({ message: 'Erro interno.' });
  }
};
