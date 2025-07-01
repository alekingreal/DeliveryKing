// routes/supplyRoutes.js
const express = require('express');
const router = express.Router();
const SupplyController = require('../controllers/SupplyController');

router.get('/', SupplyController.getSupplyInfo);

module.exports = router;
