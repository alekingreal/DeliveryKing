const express = require('express');
const {
  markOrderAsReady,
  createOrder,
  createOrderHibrido,  // <-- NOVO aqui
  completeDelivery,
  getPendingOrders,
  getAllOrders,
  deleteAllUsers,
} = require('../controllers/OrderController');
const { getAvailableDeliveries } = require('../controllers/DeliveryController');

const router = express.Router();

// 📦 Rotas de pedidos
router.post('/', createOrder);
router.post('/hibrido', createOrderHibrido);  // <-- NOVA rota híbrida
router.patch('/:id/ready', markOrderAsReady);
router.patch('/:id/complete', completeDelivery);
router.get('/pendentes', getPendingOrders);
router.get('/all', getAllOrders);
router.get('/available', getAvailableDeliveries);

// 🧪 Rota de teste opcional
router.delete('/reset/users', deleteAllUsers);

module.exports = router;
