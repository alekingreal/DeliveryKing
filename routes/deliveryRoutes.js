// backend/routes/deliveryRoutes.js

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const DeliveryController = require('../controllers/DeliveryController');
const DeliveryPersonController = require('../controllers/DeliveryPersonController');
const { getDeliveryById } = require('../controllers/DeliveryController');

// 📦 ROTAS DE PEDIDOS

router.patch('/:id/ready', authMiddleware, (req, res, next) => {
  console.log(`🛠️ PATCH /deliveries/${req.params.id}/ready chamada`);
  next();
}, DeliveryController.markOrderAsReady);

router.patch('/:id/complete', authMiddleware, (req, res, next) => {
  console.log(`🛠️ PATCH /deliveries/${req.params.id}/complete chamada`);
  next();
}, DeliveryController.completeDelivery);

// 🔍 ROTAS DE LISTAGEM E DISPONIBILIDADE



router.get('/pending', authMiddleware, (req, res, next) => {
  console.log('🛠️ GET /deliveries/pending chamada com query:', req.query);
  next();
}, DeliveryController.getPendingDeliveries);

router.get('/available', authMiddleware, (req, res, next) => {
  console.log('🛠️ GET /deliveries/available chamada com query:', req.query);
  next();
}, DeliveryController.getAvailableDeliveries);

// 🚀 ROTA DE ACEITAR E INICIAR ENTREGA

router.patch('/:id/accept', authMiddleware, (req, res, next) => {
  console.log(`🛠️ PATCH /deliveries/${req.params.id}/accept chamada`);
  next();
}, DeliveryController.acceptDelivery);

router.patch('/:id/start', authMiddleware, (req, res, next) => {
  console.log(`🛠️ PATCH /deliveries/${req.params.id}/start chamada`);
  next();
}, DeliveryController.startDeliveryRoute);

// ➕ VINCULAR PEDIDO À ENTREGA EXISTENTE

router.post('/:id/add-order', authMiddleware, (req, res, next) => {
  console.log(`🛠️ POST /deliveries/${req.params.id}/add-order chamada com body:`, req.body);
  next();
}, DeliveryController.addOrderToDelivery);

// ❌ CANCELAR ENTREGA

router.patch('/:id/cancel', authMiddleware, (req, res, next) => {
  console.log(`🛠️ PATCH /deliveries/${req.params.id}/cancel chamada`);
  next();
}, DeliveryController.cancelDeliveryRoute); // ou cancelDelivery

// 📜 HISTÓRICO E ADMIN

router.get('/history/:id', authMiddleware, (req, res, next) => {
  console.log(`🛠️ GET /deliveries/history/${req.params.id} chamada`);
  next();
}, DeliveryController.getDeliveryHistory);

router.get('/all', authMiddleware, (req, res, next) => {
  console.log('🛠️ GET /deliveries/all chamada');
  next();
}, DeliveryController.listAllDeliveries);

router.delete('/all', authMiddleware, (req, res, next) => {
  console.log('🛠️ DELETE /deliveries/all chamada');
  next();
}, DeliveryController.deleteAllDeliveries);

// 👤 PERFIL DO ENTREGADOR (deve ficar no fim)

router.get('/perfil/:id', authMiddleware, DeliveryPersonController.getDeliveryPersonById);
router.get('/:id', getDeliveryById);

module.exports = router;
