const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const verificarDisponibilidadeLogistica = async (cidadeOrigem, cidadeDestino) => {
  const hubOrigem = await prisma.hubDK.findFirst({ where: { cidade: cidadeOrigem } });
  const hubDestino = await prisma.hubDK.findFirst({ where: { cidade: cidadeDestino } });

  if (!hubOrigem || !hubDestino) {
    throw new Error('Hubs de origem ou destino não encontrados.');
  }

  const motoristaDisponivel = await prisma.motoristaFrotaDK.findFirst({
    where: { cidadeBase: cidadeOrigem, ativo: true }
  });

  if (!motoristaDisponivel) {
    throw new Error('Nenhum motorista disponível na cidade de origem.');
  }

  return { hubOrigem, hubDestino, motoristaDisponivel };
};

const agendarTransferencia = async (cidadeOrigem, cidadeDestino, quantidadePacotes) => {
  const { hubOrigem, hubDestino, motoristaDisponivel } = await verificarDisponibilidadeLogistica(
    cidadeOrigem,
    cidadeDestino
  );

  const novaTransferencia = await prisma.transferenciaIntermunicipal.create({
    data: {
      hubOrigemId: hubOrigem.id,
      hubDestinoId: hubDestino.id,
      motoristaId: motoristaDisponivel.id,
      dataColeta: new Date(),
      quantidadePacotes,
      status: 'agendado'
    }
  });

  return novaTransferencia;
};

module.exports = { verificarDisponibilidadeLogistica, agendarTransferencia };
