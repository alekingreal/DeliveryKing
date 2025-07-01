

console.log('✅ productRoutes carregado');
console.log('✅ Tentando importar ProductController de:', require.resolve('../controllers/ProductController'));

const express = require('express');
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getHighlightedProducts
  } = require('../controllers/ProductController');
  console.log('✅ getHighlightedProducts:', getHighlightedProducts);
  const ProductController = require('../controllers/ProductController');
  

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getAllProducts);
router.get('/highlights', getHighlightedProducts);
router.get('/:id', getProductById);
router.post('/', authMiddleware, createProduct);
router.put('/:id', authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);
router.get('/', ProductController.getAllProducts);
router.post('/', ProductController.createProduct);


module.exports = router;
