const express = require('express');
const router = express.Router();
const CotacaoController = require('../controllers/CotacaoController');

router.get('/historico', CotacaoController.getHistoricoCotacao);
router.get('/full', CotacaoController.getFullCotacao); // <-- ESSA É A NOVA

module.exports = router;
