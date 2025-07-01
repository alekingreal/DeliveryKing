const express = require('express');
const router = express.Router();
const OrderDKController = require('../controllers/OrderDKController');

router.post('/comprar-com-dk', OrderDKController.comprarComDK);

module.exports = router;
