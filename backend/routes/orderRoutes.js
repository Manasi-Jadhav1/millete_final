import express from 'express';
import {
  getAllOrders,
  getOrderById,
  getMyOrders,
  createOrder,
  checkout,
  updateOrderStatus,
  cancelOrder,
  getOrderStatistics,
  getSellerOrders
} from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateFields } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/orders
 * @desc    Get all orders (filtered by role)
 * @access  Private
 */
router.get('/', authenticate, getAllOrders);

/**
 * @route   GET /api/orders/statistics
 * @desc    Get order statistics
 * @access  Private (Admin only)
 */
router.get('/statistics', authenticate, authorize('admin'), getOrderStatistics);

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get current user's orders
 * @access  Private
 */
router.get('/my-orders', authenticate, getMyOrders);

/**
 * @route   GET /api/orders/seller/orders
 * @desc    Get seller's orders
 * @access  Private (Seller only)
 */
router.get('/seller/orders', authenticate, authorize('seller'), getSellerOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', authenticate, getOrderById);

/**
 * @route   POST /api/orders
 * @desc    Place a new order
 * @access  Private
 */
router.post('/',
  authenticate,
  validateFields(['product_id', 'quantity']),
  createOrder
);

/**
 * @route   POST /api/orders/checkout
 * @desc    Checkout cart items
 * @access  Private
 */
router.post('/checkout', authenticate, checkout);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Seller or Admin)
 */
router.patch('/:id/status',
  authenticate,
  authorize('seller', 'admin'),
  updateOrderStatus
);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.patch('/:id/cancel', authenticate, cancelOrder);

export default router;
