// utils/reservaManager.js - COMPLETO E AJUSTADO

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcularDistanciaKm } = require('./deliveryUtils');

const filasDeReserva = new Map();
const tentativasDeFila = new Map();

function iniciarFila(deliveryId, fila) {
  if (!fila.length) return;

  filasDeReserva.set(deliveryId, {
    fila: [...fila],
    timeoutId: null
  });

  return { proximo: fila[0], expiracao: new Date(Date.now() + 30 * 1000) };
}

function pegarFila(deliveryId) {
  return filasDeReserva.get(deliveryId);
}

function limparFila(deliveryId) {
  const info = filasDeReserva.get(deliveryId);
  if (info?.timeoutId) clearTimeout(info.timeoutId);
  filasDeReserva.delete(deliveryId);
  tentativasDeFila.delete(deliveryId);
}

async function processarFila(deliveryId) {
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery || delivery.deliveryPersonId) {
    console.log(`✅ Entrega ${deliveryId} já foi aceita, abortando fila`);
    limparFila(deliveryId);
    return;
  }

  const filaInfo = pegarFila(deliveryId);
  if (!filaInfo || filaInfo.fila.length === 0) {
    console.log(`❌ Fila vazia para delivery ${deliveryId}`);
    const tentativas = (tentativasDeFila.get(deliveryId) || 0) + 1;
    tentativasDeFila.set(deliveryId, tentativas);

    if (tentativas <= 10) {
      console.log(`🔁 Tentando reiniciar fila automaticamente para delivery ${deliveryId} (tentativa ${tentativas})`);
      setTimeout(() => tentarReiniciarFila(deliveryId), 60 * 1000);
    } else {
      console.log(`⛔ Máximo de tentativas de reinício alcançado para delivery ${deliveryId}`);
    }
    return;
  }

  if (filaInfo.timeoutId) {
    console.log(`⚠️ Timer já está ativo para delivery ${deliveryId}`);
    return;
  }

  const filaAtual = [...filaInfo.fila];
  const proximoId = filaAtual[0];
  console.log(`🎯 processarFila delivery ${deliveryId} - próximo ID:`, proximoId);
  const novaExp = new Date(Date.now() + 60 * 1000);

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      reservedDeliveryPerson: { connect: { id: proximoId } },
      reservedUntil: novaExp
    }
  });

  console.log(`⏳ Reservado para entregador ${proximoId} por 60s`);

  // 🛑 AQUI O AJUSTE CRÍTICO:
  console.log('🎯 Emitindo novo_pedido para socket do entregador:', proximoId);
  global.io.to(`entregador_${proximoId}`).emit('novo_pedido', {
    deliveryId,
    message: 'Nova entrega disponível!',
    expiraEm: novaExp,
  });
  console.log('✅ Emitido!');

  const timeoutId = setTimeout(async () => {
    const filaOriginal = pegarFila(deliveryId);
    if (!filaOriginal) return;
    const novaFila = [...filaOriginal.fila];
    novaFila.shift();

    if (novaFila.length === 0) {
      filasDeReserva.set(deliveryId, {
        fila: [],
        timeoutId: null
      });
      await processarFila(deliveryId);
      return;
    }

    filasDeReserva.set(deliveryId, {
      fila: novaFila,
      timeoutId: null
    });

    await processarFila(deliveryId);
  }, 60 * 1000);

  filasDeReserva.set(deliveryId, {
    ...filaInfo,
    timeoutId
  });
}

async function tentarReiniciarFila(deliveryId) {
  try {
    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) return;
    if (delivery.deliveryPersonId) {
      console.log(`✅ Entrega ${deliveryId} já foi aceita por entregador ${delivery.deliveryPersonId}, cancelando fila`);
      limparFila(deliveryId);
      return;
    }

    const entregadores = await prisma.deliveryPerson.findMany({
      where: {
        available: true,
        currentLat: { not: null },
        currentLng: { not: null },
        locationLat: { not: null },
        locationLng: { not: null },
        aprovado: true,
        ...(delivery.tipoServico === 'moto' && { podeMotoTaxi: true }),
        ...(delivery.tipoServico === 'carro' && { podeCarroTaxi: true }),
        ...(delivery.tipoServico === 'delivery' && { podeDelivery: true }),
        ...(delivery.tipoServico === 'frete' && { podeFrete: true })
      }
    });

    const proximos = entregadores
      .map((p) => {
        const lat = p.currentLat ?? p.locationLat;
        const lng = p.currentLng ?? p.locationLng;
        const distancia = calcularDistanciaKm(
          delivery.localPartidaLat,
          delivery.localPartidaLng,
          lat,
          lng
        );
        return { ...p, distancia };
      })
      .filter((p) => p.distancia <= 5)
      .sort((a, b) => a.distancia - b.distancia);

    if (!proximos.length) return;
    console.log('🔁 Recriando fila com entregadores:', proximos.map(p => p.id));
    tentativasDeFila.set(deliveryId, 0);
    iniciarFila(deliveryId, proximos.map(p => p.id));
    await processarFila(deliveryId);
  } catch (e) {
    console.error(`❌ Erro ao tentar reiniciar fila para delivery ${deliveryId}:`, e);
  }
}

function verificarSePodeVerEntrega(delivery, deliveryPersonId) {
  const agora = new Date();
  return (
    delivery.reservedDeliveryPersonId === null ||
    (delivery.reservedDeliveryPersonId === deliveryPersonId && delivery.reservedUntil > agora)
  );
}

async function iniciarReservaSequencial(deliveryId, entregadoresOrdenados) {
  const filaIds = entregadoresOrdenados.map(e => e.id);
  console.log('🛠️ Entregadores para fila inicial:', filaIds);
  if (!filaIds.length) return;
  iniciarFila(deliveryId, filaIds);
  await processarFila(deliveryId);
}

module.exports = {
  iniciarFila,
  pegarFila,
  limparFila,
  processarFila,
  iniciarReservaSequencial,
  verificarSePodeVerEntrega
};
