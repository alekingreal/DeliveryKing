// 📦 utils/rotaUtils.js
const axios = require('axios');

/**
 * Gera rota otimizada entre vários pontos de entrega.
 * @param {Object} loja - Coordenadas da loja { lat, lng }
 * @param {Array} pedidos - Lista de pedidos com coordenadas de dropoff
 * @returns {Object} - { ordem, polyline, steps }
 */
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

  const rota = data.routes[0];
  const optimizedOrder = rota.waypoint_order;

  return {
    ordem: optimizedOrder,
    polyline: rota.overview_polyline.points,
    steps: rota.legs.flatMap(leg =>
      leg.steps.map(step => ({
        instruction: step.html_instructions,
        location: {
          lat: step.end_location.lat,
          lng: step.end_location.lng
        }
      }))
    )
  };
};

module.exports = {
  getOptimizedOrder
};
