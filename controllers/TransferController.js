const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.transferir = async (req, res) => {
  const remetenteId = req.user.userId; // do token
  const { destinatarioCpf, valor } = req.body;

  if (!destinatarioCpf || !valor) {
    return res.status(400).json({ message: 'Informe o CPF do destinatário e o valor.' });
  }

  try {
    const remetente = await prisma.carteiraDK.findUnique({
      where: { userId: remetenteId }
    });

    if (!remetente || remetente.saldo < valor) {
      return res.status(400).json({ message: 'Saldo insuficiente.' });
    }

    const destinatario = await prisma.user.findUnique({
      where: { cpf: destinatarioCpf }
    });

    if (!destinatario) {
      return res.status(404).json({ message: 'Destinatário não encontrado.' });
    }

    // Transação atômica
    await prisma.$transaction([
      prisma.carteiraDK.update({
        where: { userId: remetenteId },
        data: { saldo: { decrement: valor } }
      }),
      prisma.carteiraDK.update({
        where: { userId: destinatario.id },
        data: { saldo: { increment: valor } }
      }),
      prisma.transacaoDK.createMany({
        data: [
          {
            userId: remetenteId,
            tipo: 'envio',
            valorDK: -valor,
            descricao: `Transferência para ${destinatarioCpf}`
          },
          {
            userId: destinatario.id,
            tipo: 'recebimento',
            valorDK: valor,
            descricao: `Recebido de transferência`
          }
        ]
      })
    ]);

    res.json({ message: 'Transferência concluída com sucesso!' });

  } catch (err) {
    console.error('Erro na transferência:', err);
    res.status(500).json({ message: 'Erro interno.' });
  }
};
