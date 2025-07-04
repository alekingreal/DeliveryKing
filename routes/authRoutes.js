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



router.post('/send-code', AuthController.sendCode);
router.post('/verify-code', AuthController.verifyCode);
router.put('/update-phone/:userId', AuthController.updatePhone);
router.post('/confirmar-novo-telefone/:userId', AuthController.confirmarNovoTelefone);
router.post('/recuperar-acesso', AuthController.recuperarAcesso);
router.get('/validar-token', AuthController.validarToken);
router.put('/:id', AuthController.updateUserData);



module.exports = router;
