const express = require('express');
const {
  register,
  login,
  deleteAllUsers,
  listUsers,
  loginEntregador
} = require('../controllers/AuthController');
const AuthController = require('../controllers/AuthController');
const { updatePhone } = AuthController;

const router = express.Router();

router.post('/login-entregador', loginEntregador);
router.post('/register', register);
router.post('/login', login);
router.delete('/delete-all', deleteAllUsers);
router.get('/list', listUsers);



router.post('/auth/send-code', AuthController.sendCode);
router.post('/auth/verify-code', AuthController.verifyCode);
router.post('/users/:userId/update-phone', updatePhone);
router.put('/auth/update-phone/:userId', AuthController.updatePhone);
router.post('/auth/confirmar-novo-telefone/:userId', AuthController.confirmarNovoTelefone);
router.post('/auth/recuperar-acesso', AuthController.recuperarAcesso);
router.get('/auth/validar-token', AuthController.validarToken);



module.exports = router;
