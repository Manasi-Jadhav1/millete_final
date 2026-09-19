import express from 'express';
import {
  getCart,
  getCartCount,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart
} from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';
import { validateFields } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', authenticate, getCart);

/**
 * @route   GET /api/cart/count
 * @desc    Get cart item count
 * @access  Private
 */
router.get('/count', authenticate, getCartCount);

/**
 * @route   POST /api/cart/sync
 * @desc    Sync local cart with database
 * @access  Private
 */
router.post('/sync', authenticate, syncCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/add',
  authenticate,
  validateFields(['product_id']),
  addToCart
);

/**
 * @route   PUT /api/cart/update
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/update',
  authenticate,
  validateFields(['product_id', 'quantity']),
  updateCartItem
);

/**
 * @route   DELETE /api/cart/remove/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/remove/:productId', authenticate, removeFromCart);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/clear', authenticate, clearCart);

export default router;
