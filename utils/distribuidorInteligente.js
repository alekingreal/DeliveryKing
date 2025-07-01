// utils/distribuidorInteligente.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getRouteDistanceAndDuration } = require('./googleMapsUtils');

/**
 * Retorna os entregadores/motoristas elegíveis com base no tipo de serviço, local e modoAtual
 * @param {Object} options
 * @param {'delivery'|'moto'|'carro'|'frete'} options.tipoServico
 * @param {number} options.lat
 * @param {number} options.lng
 * @param {number} [options.limiteKm=3]
 * @returns {Promise<Array<{id: number, distancia: number, durationMin: number}>>}
 */
async function buscarCandidatosPorServico({ tipoServico, lat, lng, limiteKm = 3 }) {
  const filtros = {
    available: true,
    currentLat: { not: null },
currentLng: { not: null },

    aprovado: true,
    OR: [
      { blockUntil: null },
      { blockUntil: { lt: new Date() } },
    ],
  };

  switch (tipoServico) {
    case 'delivery':
      filtros.modoAtual = 'delivery';
      filtros.podeDelivery = true;
      break;
    case 'moto':
      filtros.modoAtual = 'motoTaxi';
      filtros.podeMotoTaxi = true;
      break;
    case 'carro':
      filtros.modoAtual = 'carroTaxi';
      filtros.podeCarroTaxi = true;
      break;
    case 'frete':
      filtros.modoAtual = 'frete';
      filtros.podeFrete = true;
      break;
    default:
      throw new Error(`Tipo de serviço inválido: ${tipoServico}`);
  }

  const motoristas = await prisma.deliveryPerson.findMany({ where: filtros });
  const candidatos = [];

  for (const motorista of motoristas) {
    try {
      const { distanceKm, durationMin } = await getRouteDistanceAndDuration(
        motorista.locationLat,
        motorista.locationLng,
        lat,
        lng
      );

      if (distanceKm <= limiteKm) {
        candidatos.push({
          id: motorista.id,
          distancia: distanceKm,
          durationMin,
        });
      }
    } catch (err) {
      console.warn(`Erro Google Maps para ${motorista.id}:`, err.message);
    }
  }

  return candidatos.sort((a, b) => a.distancia - b.distancia);
}

module.exports = { buscarCandidatosPorServico };
