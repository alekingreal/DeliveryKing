// controllers/RequestController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcularFretePorPedido, calcularDistanciaKm } = require('../utils/deliveryUtils');
const { iniciarReservaSequencial } = require('../utils/reservaManager');
const { getRouteDistanceAndDuration } = require('../utils/googleMapsUtils');

async function createRequest(req, res) {
  console.log('📦 [createRequest] body:', JSON.stringify(req.body));

  try {
    const {
      userId,
      tipoServico, // 'moto' | 'carro' | 'frete' | 'delivery'
      localPartidaLat,
      localPartidaLng,
      destinoLat,
      destinoLng,
      pickupLocation,
      dropoffLocation,
      restaurantId,
    } = req.body;

    if (!userId || !tipoServico || localPartidaLat == null || localPartidaLng == null) {
      return res.status(400).json({ error: 'Dados incompletos (userId, tipoServico, localPartidaLat/Lng).' });
    }

    if (['moto', 'carro', 'frete'].includes(tipoServico) && (destinoLat == null || destinoLng == null)) {
      return res.status(400).json({ error: 'Destino obrigatório para tipoServico = moto|carro|frete.' });
    }

    if (tipoServico === 'delivery' && !restaurantId) {
      return res.status(400).json({ error: 'restaurantId é obrigatório para tipoServico = delivery.' });
    }

    const raioBuscaKm = 5;

    const entregadores = await prisma.partner.findMany({
      where: {
        available: true,
        aprovado: true,
        OR: [
          { AND: [{ locationLat: { not: null } }, { locationLng: { not: null } }] },
          { AND: [{ currentLat: { not: null } }, { currentLng: { not: null } }] },
        ],
        ...(tipoServico === 'moto' && { podeMotoTaxi: true }),
        ...(tipoServico === 'carro' && { podeCarroTaxi: true }),
        ...(tipoServico === 'delivery' && { podeDelivery: true }),
        ...(tipoServico === 'frete' && { podeFrete: true }),
      },
      select: { id: true, name: true, locationLat: true, locationLng: true, currentLat: true, currentLng: true },
    });

    const proximos = entregadores
      .map((p) => {
        const lat = p.currentLat ?? p.locationLat;
        const lng = p.currentLng ?? p.locationLng;
        const distancia = calcularDistanciaKm(Number(localPartidaLat), Number(localPartidaLng), lat, lng);
        return { ...p, distancia };
      })
      .filter((p) => p.distancia <= raioBuscaKm)
      .sort((a, b) => a.distancia - b.distancia);

    console.log('🧭 candidatos:', proximos.map(p => ({ id: p.id, km: p.distancia?.toFixed?.(2) })));

    if (proximos.length === 0) {
      return res.status(404).json({ error: 'Nenhum motorista disponível próximo.' });
    }

    let distanceKm = 0;
    let durationMin = null;
    if (destinoLat != null && destinoLng != null) {
      try {
        const r = await getRouteDistanceAndDuration(
          Number(localPartidaLat), Number(localPartidaLng),
          Number(destinoLat), Number(destinoLng)
        );
        distanceKm = r?.distanceKm ?? 0;
        durationMin = r?.durationMin ?? null;
      } catch (e) {
        console.warn('⚠️ getRouteDistanceAndDuration falhou:', e?.message);
      }
    }

    const fee = calcularFretePorPedido(distanceKm || 0);

    const dataBase = {
      tipoServico,
      status: 'pendente',
      tipoRota: 'fila',
      maxPessoas: 1,
      localPartidaLat: Number(localPartidaLat),
      localPartidaLng: Number(localPartidaLng),
      destinoLat: destinoLat != null ? Number(destinoLat) : null,
      destinoLng: destinoLng != null ? Number(destinoLng) : null,
      pickupLocation: pickupLocation || null,
      dropoffLocation: dropoffLocation || null,
      distanceKm,
      tempoParaIniciar: durationMin,
      fee,
      reservedPartnerId: proximos[0]?.id ?? null,
      reservedUntil: proximos[0] ? new Date(Date.now() + 30 * 1000) : null,
    };

    let delivery;
    if (tipoServico === 'delivery') {
      delivery = await prisma.delivery.create({
        data: {
          ...dataBase,
          restaurantId: Number(restaurantId),
        },
      });
    } else {
      delivery = await prisma.delivery.create({
        data: {
          ...dataBase,
          passageiros: {
            create: {
              user: { connect: { id: Number(userId) } },
              status: 'aguardando',
              posicaoFila: 1,
              localPartidaLat: Number(localPartidaLat),
              localPartidaLng: Number(localPartidaLng),
            },
          },
        },
      });
    }

    console.log('🛠️ fila p/ delivery', delivery.id, 'cands:', proximos.map(e => e.id));
    await iniciarReservaSequencial(delivery.id, proximos);

    return res.status(201).json({ message: 'Solicitação criada com sucesso!', delivery });
  } catch (err) {
    // LOGAR TUDO no Render
    console.error('❌ [createRequest] erro:', err);
    // Resposta “falante” só quando DEBUG_ERRORS=1 (temporário)
    if (process.env.DEBUG_ERRORS === '1') {
      return res.status(500).json({ error: 'createRequest falhou', detail: String(err?.message || err) });
    }
    return res.status(500).json({ error: 'Erro interno ao criar solicitação.' });
  }
}

module.exports = { createRequest };