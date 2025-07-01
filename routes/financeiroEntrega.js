const express = require('express');
const router = express.Router();
const { registrarPagamentoEntrega } = require('../controllers/FinanceiroEntregaController');

router.post('/registrar', registrarPagamentoEntrega);

module.exports = router;
