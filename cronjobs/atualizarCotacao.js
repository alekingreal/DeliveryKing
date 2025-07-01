const { atualizarCotacao } = require('../services/dkCoinService');

setInterval(async () => {
  const nova = await atualizarCotacao();
  console.log('📈 Cotação DK Coin atualizada para: R$', nova.toFixed(2));
}, 1000 * 60 * 60); // a cada 1h
