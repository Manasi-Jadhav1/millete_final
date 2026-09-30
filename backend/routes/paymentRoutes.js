/**
 * paymentRoutes.js
 * MilletVerse — Payment & commission splitting routes
 */

import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getPaymentById,
  getAdminPaymentSummary,
  getCommission,
  setCommission,
  getFarmerEarnings
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// ── Webhook (no JWT — verified by Razorpay HMAC instead) ─────────────────────
// IMPORTANT: must be before express.json() parses the body.
// We attach the raw body in server.js using a verify callback.
/**
 * @route   POST /api/payments/webhook
 * @desc    Razorpay webhook handler (idempotent, HMAC verified)
 * @access  Public (Razorpay servers only — verified via signature)
 */
router.post('/webhook', handleWebhook);

// ── Consumer payment flow ─────────────────────────────────────────────────────

/**
 * @route   POST /api/payments/create-order
 * @desc    Consumer initiates checkout — creates Razorpay order
 * @access  Private (consumer)
 */
router.post('/create-order', authenticate, createPaymentOrder);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment signature after consumer pays
 * @access  Private (consumer)
 */
router.post('/verify', authenticate, verifyPayment);

/**
 * @route   GET /api/payments/:paymentId
 * @desc    Get payment transaction details
 * @access  Private (owner consumer or admin)
 */
router.get('/:paymentId', authenticate, getPaymentById);

// ── Admin routes ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/payments/admin/summary
 * @desc    Admin — platform payment statistics + recent transactions
 * @access  Private (admin only)
 */
router.get('/admin/summary', authenticate, authorize('admin'), getAdminPaymentSummary);

/**
 * @route   GET /api/payments/admin/commission
 * @desc    Admin — get current commission percentage
 * @access  Private (admin only)
 */
router.get('/admin/commission', authenticate, authorize('admin'), getCommission);

/**
 * @route   POST /api/payments/admin/commission
 * @desc    Admin — update commission percentage
 * @access  Private (admin only)
 */
router.post('/admin/commission', authenticate, authorize('admin'), setCommission);

// ── Farmer / Seller routes ────────────────────────────────────────────────────

/**
 * @route   GET /api/payments/farmer/earnings
 * @desc    Farmer/Seller — view own earnings, splits, and payout history
 * @access  Private (seller or farmer)
 */
router.get('/farmer/earnings', authenticate, authorize('seller', 'farmer'), getFarmerEarnings);

export default router;
