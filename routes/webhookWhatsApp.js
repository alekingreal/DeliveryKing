// routes/webhookWhatsApp.js
const express = require('express');
const router = express.Router();

const VERIFY_TOKEN = 'deliveryking2025'; // o mesmo que você vai usar no painel da Meta

// Etapa de verificação do Webhook
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('✅ Webhook do WhatsApp verificado com sucesso');
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// (Opcional) Etapa de recebimento de mensagens, caso ative depois
router.post('/webhook', (req, res) => {
  const body = req.body;
  console.log('📩 Evento recebido da Meta:', JSON.stringify(body, null, 2));
  res.sendStatus(200);
});

module.exports = router;
