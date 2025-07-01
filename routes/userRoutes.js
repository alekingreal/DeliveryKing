const express = require('express');
const userController = require('../controllers/UserController');
const router = express.Router();

router.post('/', userController.createUser);
router.get('/', userController.listUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.put('/:id/password', userController.updatePassword);

module.exports = router;