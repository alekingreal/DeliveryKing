const axios = require('axios');

const accessToken = process.env.META_WPP_TOKEN;
const phoneNumberId = process.env.META_PHONE_ID;

exports.enviarCodigoWhatsApp = async (req, res) => {
  const { numero, codigo } = req.body;

  if (!numero || !codigo) {
    return res.status(400).json({ error: 'Número e código são obrigatórios' });
  }

  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: numero,
      type: 'text',
      text: {
        body: `🔐 Seu código de verificação: *${codigo}*`,
      },
    };

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    console.error('Erro ao enviar WhatsApp:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};
