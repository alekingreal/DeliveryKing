const express = require('express');
const router = express.Router();
const profileController = require('../controllers/ProfileController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota de perfil (proteção com token já)
router.get('/', authMiddleware, profileController.getProfile);
router.put('/', authMiddleware, profileController.updateProfile);

module.exports = router;
