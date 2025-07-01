const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LIMITE_DIARIO_DK = 300;

const buscarTransferenciasHoje = async (userId) => {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const totalHoje = await prisma.transacaoDK.aggregate({
    _sum: { valorDK: true },
    where: {
      userId,
      tipo: 'transferencia',
      data: { gte: inicioDia }
    }
  });

  return totalHoje._sum.valorDK || 0;
};

const transferirDK = async (req, res) => {
  const remetenteId = Number(req.headers['userid']);
  const { destinatarioId, valorDK } = req.body;

  if (!remetenteId || !destinatarioId || !valorDK || valorDK <= 0) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  if (remetenteId === destinatarioId) {
    return res.status(400).json({ error: 'Não pode transferir para si mesmo.' });
  }

  const carteiraRemetente = await prisma.carteiraDK.findUnique({ where: { userId: remetenteId } });
  if (!carteiraRemetente || carteiraRemetente.saldo < valorDK) {
    return res.status(400).json({ error: 'Saldo insuficiente' });
  }

  const totalHoje = await buscarTransferenciasHoje(remetenteId);
  if (totalHoje + valorDK > LIMITE_DIARIO_DK) {
    return res.status(400).json({ error: 'Limite diário de transferência atingido.' });
  }

  // Inicia transação atômica no banco (blindado contra problemas simultâneos)
  await prisma.$transaction(async (tx) => {
    await tx.carteiraDK.update({
      where: { userId: remetenteId },
      data: { saldo: { decrement: valorDK } }
    });

    await tx.carteiraDK.upsert({
      where: { userId: destinatarioId },
      update: { saldo: { increment: valorDK } },
      create: { userId: destinatarioId, saldo: valorDK }
    });

    await tx.transacaoDK.createMany({
      data: [
        { userId: remetenteId, tipo: 'transferencia', valorDK: -valorDK, descricao: `Enviado para ${destinatarioId}` },
        { userId: destinatarioId, tipo: 'transferencia', valorDK: valorDK, descricao: `Recebido de ${remetenteId}` }
      ]
    });

    // Agora registrando no TransferenciaDK
    await tx.transferenciaDK.create({
      data: {
        remetenteId,
        destinatarioId,
        valorDK
      }
    });
  });

  res.json({ message: 'Transferência realizada com sucesso!' });
};

module.exports = { transferirDK };
