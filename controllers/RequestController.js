// 📦 RequestController.js - atualizado e compatível com distribuidor inteligente

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { calcularFretePorPedido, calcularDistanciaKm } = require('../utils/deliveryUtils');
const { iniciarReservaSequencial } = require('../utils/reservaManager');
const { getRouteDistanceAndDuration } = require('../utils/googleMapsUtils');

async function createRequest(req, res) {
  console.log("📦 req.body:", req.body);

  try {
    const {
      userId,
      tipoServico,
      localPartidaLat,
      localPartidaLng,
      destinoLat,
      destinoLng,
      pickupLocation,
      dropoffLocation
    } = req.body;

    if (!userId || !tipoServico || !localPartidaLat || !localPartidaLng) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    if (['moto', 'carro', 'frete'].includes(tipoServico) && (!destinoLat || !destinoLng)) {
      return res.status(400).json({ error: 'Destino obrigatório para esse tipo de serviço.' });
    }

    const raioBuscaKm = 5;

    const entregadores = await prisma.partner.findMany({
      where: {
        available: true,
        locationLat: { not: null },
        locationLng: { not: null },
        aprovado: true,
        ...(tipoServico === 'moto' && { podeMotoTaxi: true }),
        ...(tipoServico === 'carro' && { podeCarroTaxi: true }),
        ...(tipoServico === 'delivery' && { podeDelivery: true }),
        ...(tipoServico === 'frete' && { podeFrete: true })
      }
    });

    const proximos = entregadores
      .map((p) => ({
        ...p,
        distancia: calcularDistanciaKm(localPartidaLat, localPartidaLng, p.locationLat, p.locationLng)
      }))
      .filter((p) => p.distancia <= raioBuscaKm)
      .sort((a, b) => a.distancia - b.distancia);

    if (proximos.length === 0) {
      return res.status(404).json({ error: 'Nenhum motorista disponível próximo.' });
    }

    let distanceKm = 0;
    let durationMin = null;

    if (destinoLat && destinoLng) {
      const result = await getRouteDistanceAndDuration(localPartidaLat, localPartidaLng, destinoLat, destinoLng);
      distanceKm = result.distanceKm;
      durationMin = result.durationMin;
    }

    const fee = calcularFretePorPedido(distanceKm);

    const delivery = await prisma.delivery.create({
      data: {
        tipoServico,
        status: "pendente",
        tipoRota: "fila",
        maxPessoas: 1,
        localPartidaLat,
        localPartidaLng,
        destinoLat,
        destinoLng,
        pickupLocation,
        dropoffLocation,
        distanceKm,
        tempoParaIniciar: durationMin,
        fee,
        reservedPartnerId: proximos[0]?.id,
        reservedUntil: new Date(Date.now() + 30 * 1000),
        passageiros: {
          create: {
            user: {
              connect: { id: userId }
            },
            status: "aguardando",
            posicaoFila: 1,
            localPartidaLat,
            localPartidaLng
          }
        }
      }
    });

    console.log('🛠️ Entregadores elegíveis para fila:', proximos.map(e => e.id));

    await iniciarReservaSequencial(delivery.id, proximos);

    return res.status(201).json({ message: 'Solicitação criada com sucesso!', delivery });
  } catch (err) {
    console.error('❌ Erro em createRequest:', err);
    res.status(500).json({ error: 'Erro interno ao criar solicitação.' });
  }
}

module.exports = {
  createRequest
};
