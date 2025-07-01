const express = require('express');
const router = express.Router();
const TransferDKController = require('../controllers/TransferDKController');

router.post('/transferir', TransferDKController.transferirDK);

module.exports = router;
