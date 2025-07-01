const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const criarTransferencia = async (req, res) => {
  const { hubOrigemId, hubDestinoId, motoristaId, dataColeta, quantidadePacotes } = req.body;

  const novaTransferencia = await prisma.transferenciaIntermunicipal.create({
    data: {
      hubOrigemId,
      hubDestinoId,
      motoristaId,
      dataColeta: new Date(dataColeta),
      quantidadePacotes,
      status: 'agendado'
    }
  });

  res.json(novaTransferencia);
};

const listarTransferencias = async (req, res) => {
  const transferencias = await prisma.transferenciaIntermunicipal.findMany({
    include: {
      hubOrigem: true,
      hubDestino: true,
      motorista: true
    }
  });

  res.json(transferencias);
};

module.exports = { criarTransferencia, listarTransferencias };
