const express = require('express');

const { createRequest } = require('../controllers/RequestController');
console.log('🔍 createRequest:', typeof createRequest);

const router = express.Router();

router.post('/', createRequest);

module.exports = router;
