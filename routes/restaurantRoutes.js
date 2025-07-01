const express = require('express');
const {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require('../controllers/RestaurantController');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);
router.post('/', authMiddleware, createRestaurant);
router.put('/:id', authMiddleware, updateRestaurant);
router.delete('/:id', authMiddleware, deleteRestaurant);

module.exports = router;
