// IntelligentDispatcher.js - versão unificada usando apenas o sistema de fila (reservaManager)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pendingTimers = new Map();
const { getRouteDistanceAndDuration } = require('../utils/googleMapsUtils');
const { iniciarFila, processarFila, iniciarReservaSequencial } = require('../utils/reservaManager');
const { iniciarReservaPassageiro } = require('../utils/reservaPassageiroManager');

async function tentarAtribuirPedido(order) {
  try {
    const entregadores = await prisma.deliveryPerson.findMany({
      where: {
        available: true,
        currentLat: { not: null },
        currentLng: { not: null },
        modoAtual: 'delivery',
        podeDelivery: true,
        OR: [
          { blockUntil: null },
          { blockUntil: { lt: new Date() } }
        ]
      }
    });

    console.log('📦 Entregadores elegíveis retornados para redistribuição (findMany):');
    entregadores.forEach(e => {
      console.log({
        id: e.id,
        nome: e.name,
        available: e.available,
        currentLat: e.currentLat,
        currentLng: e.currentLng,
        modoAtual: e.modoAtual,
        podeDelivery: e.podeDelivery,
        blockUntil: e.blockUntil,
      });
    });

    const candidatos = [];

    for (const ent of entregadores) {
      try {
        const { distanceKm, durationMin } = await getRouteDistanceAndDuration(
          ent.currentLat,
          ent.currentLng,
          order.pickupLat,
          order.pickupLng
        );

        console.log(`📏 Google (${ent.id}): ${distanceKm.toFixed(2)}km, estimado: ${durationMin}min`);
        if (distanceKm <= 3) {
          candidatos.push({ ...ent, distancia: distanceKm });
        }
      } catch (err) {
        console.warn(`⚠️ Erro Google Maps (${ent.id}):`, err.message);
      }
    }

    candidatos.sort((a, b) => a.distancia - b.distancia);

    if (candidatos.length === 0) {
      console.log('❌ Nenhum entregador próximo (Google Maps)');
      return;
    }

    // ✅ Substituindo atribuição direta por fila sequencial
    const delivery = await prisma.delivery.findUnique({
      where: { id: order.deliveryId }
    });

    if (!delivery) {
      console.warn('❌ Delivery não encontrada para iniciar fila');
      return;
    }

    await iniciarReservaSequencial(delivery.id, candidatos);

  } catch (err) {
    console.error('❌ Erro ao tentar atribuir pedido:', err);
  }
}

function iniciarTimerDeRota(deliveryId, deliveryPersonId) {
  if (pendingTimers.has(deliveryPersonId)) return;

  const timer = setTimeout(async () => {
    try {
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { orders: true, passageiros: true }
      });
      console.log(`⌛ Verificando status da entrega ${delivery.id} após 5min:`, delivery.status);

      if (!delivery || delivery.status === 'em_rota' || delivery.status === 'cancelada' || delivery.status === 'finalizada') {
        // ✅ se já iniciou, cancelou ou finalizou, não precisa punir
        pendingTimers.delete(deliveryPersonId);
        return;
      }
      

      const entregador = await prisma.deliveryPerson.findUnique({
        where: { id: deliveryPersonId }
      });

      const novoNivel = (entregador.punishmentLevel || 0) + 1;
      const minutosPunicao = novoNivel * 5;
      const fimPena = new Date(Date.now() + minutosPunicao * 60000);

      await prisma.deliveryPerson.update({
        where: { id: deliveryPersonId },
        data: {
          available: false,
          pending: 0,
          punishmentLevel: novoNivel,
          blockUntil: fimPena
        }
      });

      await prisma.order.updateMany({
        where: { deliveryId: delivery.id },
        data: {
          deliveryId: null,
          status: 'pendente',
          statusCliente: 'aguardando'
        }
      });

      await prisma.passageiro.updateMany({
        where: { deliveryId: delivery.id },
        data: { deliveryId: null }
      });

      await prisma.delivery.delete({ where: { id: delivery.id } });

      console.log(`⏰ Rota não iniciada. Punição de ${minutosPunicao}min para entregador ${deliveryPersonId}`);

      if (delivery.orders.length > 0) {
        const pedidoBase = delivery.orders[0];
        const entregadores = await prisma.deliveryPerson.findMany({
          where: {
            available: true,
            currentLat: { not: null },
            currentLng: { not: null },
            modoAtual: 'delivery',
            podeDelivery: true,
            OR: [
              { blockUntil: null },
              { blockUntil: { lt: new Date() } }
            ]
          }
        });

        const candidatos = [];

        for (const ent of entregadores) {
          try {
            const { distanceKm } = await getRouteDistanceAndDuration(
              ent.currentLat,
              ent.currentLng,
              pedidoBase.pickupLat,
              pedidoBase.pickupLng
            );

            if (distanceKm <= 3) {
              candidatos.push({ id: ent.id, distancia: distanceKm });
            }
          } catch (err) {
            console.warn(`⚠️ Erro rota (reenvio) entregador ${ent.id}:`, err.message);
          }
        }

        candidatos.sort((a, b) => a.distancia - b.distancia);

        if (candidatos.length > 0) {
          const novaEntrega = await prisma.delivery.create({
            data: {
              status: 'pendente',
              distanceKm: 0,
              fee: 0,
              orders: { connect: delivery.orders.map(p => ({ id: p.id })) },
              tipoServico: 'delivery',
              localPartidaLat: pedidoBase.pickupLat,
              localPartidaLng: pedidoBase.pickupLng
            }
          });

          await iniciarReservaSequencial(novaEntrega.id, candidatos);

        } else {
          console.log('⚠️ Nenhum entregador disponível após punição.');
        }
      } else {
        for (const passageiro of delivery.passageiros) {
          await iniciarReservaPassageiro(passageiro.id);
        }
      }
    } catch (err) {
      console.error('Erro ao punir entregador por inatividade:', err);
    } finally {
      pendingTimers.delete(deliveryPersonId);
    }
  }, 5 * 60 * 1000);

  pendingTimers.set(deliveryPersonId, timer);
}

function limparTimerDeRota(deliveryPersonId) {
  const timer = pendingTimers.get(deliveryPersonId);
  if (timer) {
    clearTimeout(timer);
    pendingTimers.delete(deliveryPersonId);
  }
}

module.exports = {
  tentarAtribuirPedido, // Ainda disponível, mas agora usa iniciarReservaSequencial
  iniciarTimerDeRota,
  limparTimerDeRota
};
