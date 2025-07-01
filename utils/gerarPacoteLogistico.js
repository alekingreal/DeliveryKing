const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Versão adaptada para transação.
 * Recebe o TX (instância da transação do Prisma).
 */
const gerarPacoteLogistico = async (tx, pedidoId, cidadeOrigem, cidadeDestino, pesoKg) => {
  // Busca os Hubs de origem e destino usando o TX
  const hubOrigem = await tx.hubDK.findFirst({ where: { cidade: cidadeOrigem } });
  const hubDestino = await tx.hubDK.findFirst({ where: { cidade: cidadeDestino } });

  if (!hubOrigem || !hubDestino) {
    throw new Error('Hubs de origem ou destino não encontrados.');
  }

  const pacote = await tx.pacoteLogisticoDK.create({
    data: {
      pedidoId,
      hubOrigemId: hubOrigem.id,
      hubDestinoId: hubDestino.id,
      pesoKg,
      status: 'aguardando_coleta'
    }
  });

  return pacote;
};

module.exports = { gerarPacoteLogistico };
