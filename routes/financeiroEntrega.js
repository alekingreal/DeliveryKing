const express = require('express');
const router = express.Router();
const { registrarPagamentoEntrega, obterPainelEntrega } = require('../controllers/FinanceiroEntregaController');

router.post('/registrar', registrarPagamentoEntrega);
router.get('/painel', obterPainelEntrega); // ✅ nova rota

module.exports = router;
