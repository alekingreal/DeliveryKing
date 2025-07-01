const express = require('express');
const router = express.Router();
const MotoristaFrotaController = require('../controllers/MotoristaFrotaController');

router.post('/criar', MotoristaFrotaController.criarMotorista);
router.get('/', MotoristaFrotaController.listarMotoristas);

module.exports = router;
