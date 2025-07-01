const express = require('express');
const router = express.Router();
const TransferenciaController = require('../controllers/TransferenciaIntermunicipalController');

router.post('/criar', TransferenciaController.criarTransferencia);
router.get('/', TransferenciaController.listarTransferencias);

module.exports = router;
