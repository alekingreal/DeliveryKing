const express = require('express');
const router = express.Router();
const saqueController = require('../controllers/SaqueController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, saqueController.solicitarSaque);

module.exports = router;
