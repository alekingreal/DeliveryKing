// 🔍 reservaPassageiroManager.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getRouteDistanceAndDuration } = require('./googleMapsUtils');

const filaPassageiros = new Map(); // Map<passageiroId, { motoristas: [], index: number }>
const timers = new Map(); // Map<passageiroId, Timeout>






const getOptimizedOrder = async (loja, pedidos) => {
  const origin = `${loja.lat},${loja.lng}`;
  const waypoints = pedidos.map(p => `${p.dropoffLat},${p.dropoffLng}`).join('|');
  const destination = `${pedidos[pedidos.length - 1].dropoffLat},${pedidos[pedidos.length - 1].dropoffLng}`;

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

  console.log('🌐 Rota otimizada URL:', url);
  const response = await axios.get(url);
  const data = response.data;

  if (data.status !== 'OK') {
    throw new Error(`Erro da API Google: ${data.status}`);
  }

  console.log('🧭 Ordem ideal da rota:', data.routes[0].waypoint_order);
  return {
    ordem: data.routes[0].waypoint_order,
    polyline: data.routes[0].overview_polyline.points
  };
};

async function iniciarReservaPassageiro(passageiroId) {
  if (timers.has(passageiroId)) {
    clearTimeout(timers.get(passageiroId));
    timers.delete(passageiroId);
  }
  filaPassageiros.delete(passageiroId);

  const passageiro = await prisma.passageiro.findUnique({
    where: { id: passageiroId }
  });

  if (!passageiro) {
    console.warn(`⚠️ Passageiro ${passageiroId} não encontrado.`);
    return;
  }

  const motoristasDisponiveis = await prisma.partner.findMany({
    where: {
      available: true,
      locationLat: { not: null },
      locationLng: { not: null },
      modoAtual: 'motoTaxi',
      OR: [
        { blockUntil: null },
        { blockUntil: { lt: new Date() } }
      ]
    }
  });

  console.log('🧪 Resultado cru da consulta:', motoristasDisponiveis);

  if (Array.isArray(motoristasDisponiveis)) {
    console.log('👀 Rechecando motoristas disponíveis:', motoristasDisponiveis.map(m => ({
      id: m.id,
      locationLat: m.locationLat,
      locationLng: m.locationLng,
      available: m.available,
      blockUntil: m.blockUntil
    })));
  } else {
    console.warn('⚠️ motoristasDisponiveis não é um array:', motoristasDisponiveis);
  }

  console.log('🧭 Motoristas encontrados para passageiro:', motoristasDisponiveis.map(m => ({
    id: m.id,
    nome: m.name,
    available: m.available,
    modo: m.modoAtual,
    blockUntil: m.blockUntil
  })));

  const candidatos = [];

  for (const motorista of motoristasDisponiveis) {
    try {
      const { distanceKm: googleDist, durationMin } = await getRouteDistanceAndDuration(
        motorista.locationLat,
        motorista.locationLng,
        passageiro.localPartidaLat,
        passageiro.localPartidaLng
      );

      console.log(`📏 Google: ${googleDist.toFixed(2)}km`);

      if (googleDist <= 3) {
        candidatos.push({
          ...motorista,
          distancia: googleDist,
          tempoEstimado: durationMin
        });

        console.log(`🚦 Candidato aceito com distância Google: ${googleDist.toFixed(2)}km e tempo estimado: ${durationMin.toFixed(1)}min`);
        console.log(`✅ Motorista ${motorista.id} aceito na lista`);
      } else {
        console.log(`❌ Motorista ${motorista.id} fora do raio (Google)`);
      }

    } catch (err) {
      console.warn(`⚠️ Erro ao calcular rota do motorista ${motorista.id}:`, err.message);
    }
  }

  candidatos.sort((a, b) => a.distancia - b.distancia);
  const ids = candidatos.map(c => c.id);

  console.log('🔍 Candidatos filtrados:', ids);
  console.log('✅ Motoristas dentro do raio:', ids);

  if (ids.length === 0) {
    console.log(`❌ Nenhum motorista disponível para passageiro ${passageiroId}`);
    return;
  }

  filaPassageiros.set(passageiroId, { motoristas: ids, index: 0 });
  processarFilaPassageiro(passageiroId);
}

function processarFilaPassageiro(passageiroId) {
  const fila = filaPassageiros.get(passageiroId);
  if (!fila || fila.index >= fila.motoristas.length) {
    console.log(`⚠️ Fila finalizada para passageiro ${passageiroId}`);
    filaPassageiros.delete(passageiroId);
    return;
  }

  const motoristaId = fila.motoristas[fila.index];
  console.log(`🎯 Reservado motorista ${motoristaId} para passageiro ${passageiroId}`);

  timers.set(
    passageiroId,
    setTimeout(() => {
      fila.index++;
      processarFilaPassageiro(passageiroId);
    }, 30 * 1000)
  );
}

function cancelarReservaPassageiro(passageiroId) {
  clearTimeout(timers.get(passageiroId));
  timers.delete(passageiroId);
  filaPassageiros.delete(passageiroId);
}

module.exports = {
  iniciarReservaPassageiro,
  cancelarReservaPassageiro
};
