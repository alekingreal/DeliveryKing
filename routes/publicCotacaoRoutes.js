const express = require('express');
const router = express.Router();
const PublicCotacaoController = require('../controllers/PublicCotacaoController');

router.get('/', PublicCotacaoController.getCotacaoPublica);

module.exports = router;
