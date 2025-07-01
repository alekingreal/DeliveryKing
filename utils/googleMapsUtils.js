const axios = require('axios');
const polyline = require('@mapbox/polyline');
require('dotenv').config();

async function getRouteDistanceAndDuration(originLat, originLng, destLat, destLng) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${apiKey}`;
    console.log('🌍 URL chamada:', url);

    const response = await axios.get(url);
    const leg = response.data?.routes?.[0]?.legs?.[0];

    if (leg) {
      return {
        distanceKm: leg.distance.value / 1000,
        durationMin: leg.duration.value / 60
      };
    }
    return { distanceKm: 0, durationMin: 0 };
  } catch (error) {
    console.error('❌ Erro Google Maps API:', error.message);
    return { distanceKm: 0, durationMin: 0 };
  }
}

// 🆕 Nova função para buscar rota completa entre dois pontos
async function buscarRotaEntreDoisPontos(origem, destino) {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origem.latitude},${origem.longitude}&destination=${destino.latitude},${destino.longitude}&key=${apiKey}`;
      const response = await axios.get(url);
      const encoded = response.data?.routes?.[0]?.overview_polyline?.points;
  
      if (encoded) {
        return polyline.decode(encoded).map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
      }
  
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar rota entre dois pontos:', error.message);
      return [];
    }
  }

module.exports = {
  getRouteDistanceAndDuration,
  buscarRotaEntreDoisPontos
};
