const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const ConfiguracaoController = require('../controllers/ConfiguracaoController');
const adminAuth = require('../middlewares/adminAuthMiddleware');
const adminRBAC = require('../middlewares/adminRBAC');

// 🔒 Protegendo tudo com o adminAuth global
router.use(adminAuth);

// Rotas já protegidas com RBAC

router.get('/overview', AdminController.getOverview);


router.get('/usuarios', adminRBAC('USUARIOS', 'podeLer'), AdminController.listarUsuarios);
router.get('/saques', adminRBAC('SAQUES', 'podeLer'), AdminController.listarSaques);
router.get('/transferencias', adminRBAC('TRANSFERENCIAS', 'podeLer'), AdminController.listarTransferencias);
router.get('/rewards', adminRBAC('REWARDS', 'podeLer'), AdminController.listarRewards);
router.get('/suspeitas', adminRBAC('AUDITORIA', 'podeLer'), AdminController.listarSuspeitas);
router.get('/logs', adminRBAC('LOGS', 'podeLer'), AdminController.logTransacoes);
router.post('/supply', adminRBAC('CONFIGURACAO', 'podeGravar'), AdminController.atualizarSupply);
router.get('/supply', adminRBAC('CONFIGURACAO', 'podeLer'), AdminController.verSupply);
router.get('/logs', adminRBAC('LOGS', 'podeLer'), AdminController.logTransacoes);
router.get('/logs-admin', adminRBAC('LOGS', 'podeLer'), AdminController.getAdminLogs);


// Parte de permissões de Admin
router.get('/permissoes', adminRBAC('PERMISSOES', 'podeLer'), AdminController.getPermissoesAdmin);
router.post('/permissoes', adminRBAC('PERMISSOES', 'podeGravar'), AdminController.salvarPermissoes);

// Parte de Configuração
router.get('/configuracao', adminRBAC('CONFIGURACAO', 'podeLer'), ConfiguracaoController.getConfiguracao);
router.post('/configuracao', adminRBAC('CONFIGURACAO', 'podeGravar'), ConfiguracaoController.atualizarConfiguracao);

// Busca e Exportação
router.get('/buscar-usuarios', AdminController.buscarUsuario);
router.get('/exportar-csv', AdminController.exportarUsuariosCSV);

module.exports = router;

