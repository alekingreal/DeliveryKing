// utils/deliveryUtils.js

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;
  
    if ([lat1, lon1, lat2, lon2].some(v => v === null || v === undefined || isNaN(v))) {
      console.warn('⚠️ Coordenadas inválidas no cálculo de distância:', { lat1, lon1, lat2, lon2 });
      return 0;
    }
  
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
  
    console.log(`📏 Distância calculada: ${distancia.toFixed(2)} km entre (${lat1}, ${lon1}) e (${lat2}, ${lon2})`);
    return distancia;
  }
  
  function calcularFretePorPedido(distanciaKm) {
    if (distanciaKm <= 5) return 5;
    return 5 + (distanciaKm - 5) * 1.5;
  }
  
  module.exports = {
    calcularDistanciaKm,
    calcularFretePorPedido,
  };
  