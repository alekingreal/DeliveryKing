const express = require('express');
const router = express.Router();
const { enviarCodigoWhatsApp } = require('../controllers/WhatsappController');

router.post('/enviar-codigo', enviarCodigoWhatsApp);

module.exports = router;
