const axios = require('axios');

const getTaxaCambioUSD_BRL = async () => {
  try {
    const response = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    const taxa = parseFloat(response.data.USDBRL.bid);
    return taxa;
  } catch (error) {
    console.error('❌ Erro ao buscar cotação USD/BRL:', error);
    return 5.0; // fallback para não travar o app
  }
};

module.exports = { getTaxaCambioUSD_BRL };
