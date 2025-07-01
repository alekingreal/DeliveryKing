// routes/realFinanceiro.js

const express = require('express');
const router = express.Router();
const { receberPagamentoRealista } = require('../controllers/RealFinanceiroController');

router.post('/receber-real', receberPagamentoRealista);

module.exports = router;
