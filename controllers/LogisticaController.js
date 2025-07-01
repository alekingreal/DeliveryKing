const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { agendarTransferencia } = require('../utils/logisticaUtils');

// Consulta geral de pacotes logísticos
const listarPacotes = async (req, res) => {
  const pacotes = await prisma.pacoteLogisticoDK.findMany({
    include: {
      hubOrigem: true,
      hubDestino: true
    }
  });
  res.json(pacotes);
};

// Consulta de transferências agendadas
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

// Endpoint manual para agendar transferência (para testes iniciais)
const agendar = async (req, res) => {
  try {
    const { origem, destino, quantidadePacotes } = req.body;
    const transferencia = await agendarTransferencia(origem, destino, quantidadePacotes);
    res.json({ message: 'Transferência agendada com sucesso!', transferencia });
  } catch (error) {
    console.error('Erro ao agendar transferência:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { listarPacotes, listarTransferencias, agendar };
