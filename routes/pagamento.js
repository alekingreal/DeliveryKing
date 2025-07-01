const express = require('express');
const router = express.Router();
const { criarPagamento } = require('../controllers/PagamentoController');

router.post('/', criarPagamento);

module.exports = router;
