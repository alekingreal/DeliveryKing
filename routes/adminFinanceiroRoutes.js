const express = require('express');
const router = express.Router();
const AdminFinanceiroController = require('../controllers/AdminFinanceiroController');

router.get('/relatorio', AdminFinanceiroController.getRelatorioFinanceiro);

module.exports = router;
