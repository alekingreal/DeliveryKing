const express = require('express');
const router = express.Router();
const AdminAuthController = require('../controllers/AdminAuthController');

router.post('/login', AdminAuthController.loginAdmin);

module.exports = router;
