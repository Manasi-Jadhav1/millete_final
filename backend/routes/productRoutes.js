import express from 'express';
import {
  getAllProducts,
  getProductById,
  getFeaturedProducts,
  getProductsByMilletType,
  getProductsBySeller,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  searchProducts
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateFields } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured', getFeaturedProducts);

/**
 * @route   GET /api/products/search
 * @desc    Search products
 * @access  Public
 */
router.get('/search', searchProducts);

/**
 * @route   GET /api/products/millet/:type
 * @desc    Get products by millet type
 * @access  Public
 */
router.get('/millet/:type', getProductsByMilletType);

/**
 * @route   GET /api/products/seller/:sellerId
 * @desc    Get products by seller
 * @access  Public
 */
router.get('/seller/:sellerId', getProductsBySeller);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', getProductById);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Seller only)
 */
router.post('/',
  authenticate,
  authorize('seller', 'admin'),
  validateFields(['name', 'description', 'price', 'millet_type']),
  createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Seller or Admin)
 */
router.put('/:id',
  authenticate,
  authorize('seller', 'admin'),
  updateProduct
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Private (Seller or Admin)
 */
router.patch('/:id/stock',
  authenticate,
  authorize('seller', 'admin'),
  updateProductStock
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Seller or Admin)
 */
router.delete('/:id',
  authenticate,
  authorize('seller', 'admin'),
  deleteProduct
);

export default router;
