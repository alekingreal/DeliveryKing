const axios = require('axios');

const META_PHONE_ID = process.env.META_PHONE_ID;
const META_WPP_TOKEN = process.env.META_WPP_TOKEN;

const sendCodeMeta = async (phone, code) => {
  try {
    const fullPhone = phone.replace(/\D/g, '');
    const internationalPhone = fullPhone.length === 11 ? `55${fullPhone}` : fullPhone;

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${META_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: internationalPhone,
        type: 'text',
        text: {
          body: `🔐 Seu código de verificação do DeliveryKing é: *${code}*`
        }
      },
      {
        headers: {
          Authorization: `Bearer ${META_WPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Código enviado para ${internationalPhone}`);
    return true;
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem pelo WhatsApp Meta:', err.response?.data || err.message);
    throw new Error('Erro ao enviar mensagem');
  }
};

module.exports = {
  sendCodeMeta,
};
