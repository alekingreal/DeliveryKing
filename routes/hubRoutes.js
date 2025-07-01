const express = require('express');
const router = express.Router();
const HubController = require('../controllers/HubController');

router.post('/criar', HubController.criarHub);
router.get('/', HubController.listarHubs);

module.exports = router;
