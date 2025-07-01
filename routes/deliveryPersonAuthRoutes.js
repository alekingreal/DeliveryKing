const express = require('express');
const router = express.Router();
const DeliveryPersonAuthController = require('../controllers/DeliveryPersonAuthController');

router.post('/login', DeliveryPersonAuthController.loginEntregador);

module.exports = router;
