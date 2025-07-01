const express = require('express');
const router = express.Router();
const extratoController = require('../controllers/ExtratoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, extratoController.getExtrato);

module.exports = router;
