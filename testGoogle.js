require('dotenv').config();
const { getRouteDistanceAndDuration } = require('./utils/googleMapsUtils');

async function testarGoogle() {
  const origemLat = -10.935;
  const origemLng = -37.095;
  const destinoLat = -10.95;
  const destinoLng = -37.071;

  console.log('📤 Testando rota com Google Maps...');
  const resultado = await getRouteDistanceAndDuration(origemLat, origemLng, destinoLat, destinoLng);
  console.log('📍 Resultado da rota:', resultado);
}

testarGoogle();
