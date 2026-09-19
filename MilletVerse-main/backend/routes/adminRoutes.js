import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getAllProducts,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllLearningContent,
  getAnalytics
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/dashboard', getDashboardStats);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get system analytics
 * @access  Private (Admin only)
 */
router.get('/analytics', getAnalytics);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/users/:id', getUserById);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/users/:id', updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/users/:id', deleteUser);

/**
 * @route   GET /api/admin/sellers/pending
 * @desc    Get pending sellers for approval
 * @access  Private (Admin only)
 */
router.get('/sellers/pending', getPendingSellers);

/**
 * @route   PATCH /api/admin/sellers/:id/approve
 * @desc    Approve seller
 * @access  Private (Admin only)
 */
router.patch('/sellers/:id/approve', approveSeller);

/**
 * @route   PATCH /api/admin/sellers/:id/reject
 * @desc    Reject seller
 * @access  Private (Admin only)
 */
router.patch('/sellers/:id/reject', rejectSeller);

/**
 * @route   GET /api/admin/products
 * @desc    Get all products
 * @access  Private (Admin only)
 */
router.get('/products', getAllProducts);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete product
 * @access  Private (Admin only)
 */
router.delete('/products/:id', deleteProduct);

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders
 * @access  Private (Admin only)
 */
router.get('/orders', getAllOrders);

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin only)
 */
router.patch('/orders/:id/status', updateOrderStatus);

/**
 * @route   GET /api/admin/learning
 * @desc    Get all learning content
 * @access  Private (Admin only)
 */
router.get('/learning', getAllLearningContent);

export default router;
