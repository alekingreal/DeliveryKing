const express = require('express');
const router = express.Router();
const PartnerAuthController = require('../controllers/PartnerAuthController');

router.post('/login', PartnerAuthController.loginEntregador);

module.exports = router;
