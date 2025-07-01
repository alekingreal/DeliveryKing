const express = require('express');
const router = express.Router();
const UserAuthController = require('../controllers/UserAuthController');

router.post('/register', UserAuthController.register);
router.post('/login', UserAuthController.login);

module.exports = router;
