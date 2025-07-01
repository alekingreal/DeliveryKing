// scripts/verificarEntregadoresElegiveis.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcularDistanciaKm } = require('../utils/deliveryUtils');

(async () => {
  try {
    const pedido = await prisma.order.findFirst({
      where: {
        pickupLat: { not: null },
        pickupLng: { not: null },
        dropoffLat: { not: null },
        dropoffLng: { not: null },
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!pedido) {
      console.log('❌ Nenhum pedido com coordenadas válidas encontrado.');
      return;
    }

    console.log('📦 Pedido selecionado:', {
      id: pedido.id,
      pickupLat: pedido.pickupLat,
      pickupLng: pedido.pickupLng,
    });

    const entregadores = await prisma.deliveryPerson.findMany({
      where: {
        available: true,
        aprovado: true,
        currentLat: { not: null },
        currentLng: { not: null },
        locationLat: { not: null },
        locationLng: { not: null },
        ...(pedido.entregaVia === 'delivery' && { podeDelivery: true }),
        ...(pedido.entregaVia === 'moto' && { podeMotoTaxi: true }),
        ...(pedido.entregaVia === 'carro' && { podeCarroTaxi: true }),
      },
    });

    const elegiveis = entregadores.filter(entregador => {
      const distancia = calcularDistanciaKm(
        entregador.currentLat,
        entregador.currentLng,
        pedido.pickupLat,
        pedido.pickupLng
      );
      console.log(`📏 ${entregador.nome} está a ${distancia.toFixed(2)} km`);
      return distancia <= 3;
    });

    console.log('🚦 Entregadores elegíveis (<= 3km):', elegiveis.map(e => e.nome || e.id));
  } catch (error) {
    console.error('❌ Erro ao verificar entregadores:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
