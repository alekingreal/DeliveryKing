const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar saques pendentes
exports.listarPendentes = async (req, res) => {
  try {
    const saques = await prisma.saqueDK.findMany({
      where: { status: 'pendente' },
      include: { User: true },
      orderBy: { solicitacao: 'asc' }
    });

    res.json(saques);
  } catch (err) {
    console.error('Erro ao listar saques:', err);
    res.status(500).json({ message: 'Erro interno.' });
  }
};

// Aprovar ou recusar
exports.atualizarSaque = async (req, res) => {
  const { saqueId, acao } = req.body;

  if (!saqueId || !['aprovado', 'recusado'].includes(acao)) {
    return res.status(400).json({ message: 'Dados inválidos.' });
  }

  try {
    const saque = await prisma.saqueDK.findUnique({ where: { id: saqueId } });

    if (!saque || saque.status !== 'pendente') {
      return res.status(400).json({ message: 'Saque não encontrado ou já processado.' });
    }

    await prisma.$transaction([
      prisma.saqueDK.update({
        where: { id: saqueId },
        data: { status: acao }
      }),

      ...(acao === 'recusado' ? [
        prisma.carteiraDK.update({
          where: { userId: saque.userId },
          data: {
            saldo: { increment: saque.valorDK },
            bloqueado: { decrement: saque.valorDK }
          }
        }),
        prisma.transacaoDK.create({
          data: {
            userId: saque.userId,
            tipo: 'estorno',
            valorDK: saque.valorDK,
            descricao: 'Estorno de saque recusado'
          }
        })
      ] : [
        prisma.carteiraDK.update({
          where: { userId: saque.userId },
          data: { bloqueado: { decrement: saque.valorDK } }
        })
      ])
    ]);

    res.json({ message: 'Saque processado.' });
  } catch (err) {
    console.error('Erro ao processar saque:', err);
    res.status(500).json({ message: 'Erro interno.' });
  }
};
