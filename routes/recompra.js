// routes/recompra.js
const express = require('express');
const router = express.Router();
const { solicitarRecompra } = require('../controllers/RecompraController');

router.post('/solicitar', solicitarRecompra);

module.exports = router;
