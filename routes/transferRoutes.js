const express = require('express');
const router = express.Router();
const transferController = require('../controllers/TransferController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, transferController.transferir);

module.exports = router;
