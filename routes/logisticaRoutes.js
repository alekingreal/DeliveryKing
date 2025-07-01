const express = require('express');
const router = express.Router();
const LogisticaController = require('../controllers/LogisticaController');

router.get('/pacotes', LogisticaController.listarPacotes);
router.get('/transferencias', LogisticaController.listarTransferencias);
router.post('/agendar', LogisticaController.agendar);

module.exports = router;
