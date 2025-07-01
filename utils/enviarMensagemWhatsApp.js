const axios = require('axios');

const META_TOKEN = process.env.META_WPP_TOKEN;
const META_PHONE_ID = process.env.META_PHONE_ID;

async function enviarMensagemWhatsApp(numero, modelo = 'hello_world') {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${META_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: numero, // já deve estar no formato 55DDDNUMERO
        type: 'template',
        template: {
          name: modelo,
          language: { code: 'en_US' }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${META_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = enviarMensagemWhatsApp;
