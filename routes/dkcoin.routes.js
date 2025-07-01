const express = require('express');
const router = express.Router();
const DkCoinController = require('../controllers/DkCoinController');
const ProductController = require('../controllers/ProductController');

router.get('/carteira', DkCoinController.getCarteira);
router.get('/historico', DkCoinController.getHistorico);
router.get('/cotacao', DkCoinController.getCotacao);
router.get('/', ProductController.getAllProducts);

router.post('/comprar', DkCoinController.comprarDK);
router.post('/gastar', DkCoinController.gastarDK);

module.exports = router;

