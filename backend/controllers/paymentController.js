/**
 * paymentController.js
 * MilletVerse — Payment splitting controller
 *
 * Handles: create-order, verify, webhook, admin stats, farmer earnings
 */

import * as Cart               from '../models/Cart.js';
import * as Order              from '../models/Order.js';
import * as Product            from '../models/Product.js';
import * as PaymentTransaction from '../models/PaymentTransaction.js';
import * as PaymentSplit       from '../models/PaymentSplit.js';
import * as commissionSvc      from '../services/commissionService.js';
import * as paymentSvc         from '../services/paymentService.js';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/apiResponse.js';

// ─────────────────────────────────────────────────────
// POST /api/payments/create-order
// Consumer initiates checkout — creates Razorpay order
// ─────────────────────────────────────────────────────
export const createPaymentOrder = async (req, res) => {
  try {
    // Block seller/farmer/admin from buying
    if (['seller', 'farmer', 'admin'].includes(req.user.role)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Only consumers can initiate checkout');
    }

    const { delivery_address } = req.body;

    // 1. Read cart from DB (server-side — never trust frontend cart totals)
    const cartItems = await Cart.getCartItems(req.user.id);
    if (!cartItems || cartItems.length === 0) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Your cart is empty');
    }

    // 2. Validate stock for every item BEFORE creating any records
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        return errorResponse(
          res, HTTP_STATUS.BAD_REQUEST,
          `Insufficient stock for "${item.name}". Available: ${item.stock_quantity}`
        );
      }
    }

    // 3. Read commission % from DB (never from frontend)
    const commissionPct = await commissionSvc.getCommissionPct();

    // 4. Calculate splits using authoritative DB prices
    const dbPricedItems = cartItems.map(item => ({
      product_id: item.product_id,
      seller_id:  item.seller_id,
      price:      item.price,          // DB price — not item.subtotal/quantity
      quantity:   item.quantity
    }));
    const { lineItems, grandTotal } = commissionSvc.calculateCartSplits(dbPricedItems, commissionPct);

    // 5. Create internal payment_transaction record (status = pending)
    const txn = await PaymentTransaction.createTransaction({
      consumer_id:  req.user.id,
      total_amount: grandTotal
    });

    // 6. Create Razorpay order
    let rzpOrder;
    try {
      rzpOrder = await paymentSvc.createRazorpayOrder(grandTotal, `mv_txn_${txn.id}`);
    } catch (err) {
      await PaymentTransaction.markPaymentFailed(txn.id, err.message);
      return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Payment gateway error: ' + err.message);
    }

    // 7. Attach Razorpay order ID to our transaction (status → payment_initiated)
    await PaymentTransaction.setRazorpayOrderId(txn.id, rzpOrder.id);

    // 8. Create orders (status = pending, not confirmed) + payment_splits
    const createdOrders = [];
    for (const item of lineItems) {
      const order = await Order.createOrder({
        user_id:                req.user.id,
        product_id:             item.product_id,
        quantity:               item.quantity,
        total_price:            item.productAmount,
        delivery_address:       delivery_address || req.user.address || '',
        order_status:           'pending',
        payment_status:         'pending',
        payment_transaction_id: txn.id
      });

      await PaymentSplit.createSplit({
        payment_transaction_id: txn.id,
        order_id:               order.id,
        seller_id:              item.seller_id,
        product_id:             item.product_id,
        quantity:               item.quantity,
        product_amount:         item.productAmount,
        commission_pct:         item.commissionPct,
        admin_commission:       item.adminCommission,
        seller_amount:          item.sellerAmount
      });

      createdOrders.push(order);
    }

    // 9. Return what the frontend Razorpay modal needs
    //    NOTE: only key_id is returned — key_secret stays server-side
    return successResponse(res, HTTP_STATUS.CREATED, 'Payment order created', {
      payment_transaction_id: txn.id,
      razorpay_order_id:      rzpOrder.id,
      razorpay_key_id:        paymentSvc.getPublicKeyId(),
      amount_paise:           Math.round(grandTotal * 100),   // for Razorpay modal
      amount_rupees:          grandTotal,
      currency:               'INR',
      order_ids:              createdOrders.map(o => o.id),
      commission_pct:         commissionPct,
      line_items:             lineItems
    });

  } catch (error) {
    console.error('createPaymentOrder error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to create payment order', error.message);
  }
};

// ─────────────────────────────────────────────────────
// POST /api/payments/verify
// Called by frontend AFTER consumer pays on Razorpay modal
// ─────────────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_transaction_id
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Missing payment verification fields');
    }

    // 1. Verify signature server-side (HMAC-SHA256) — never trust frontend alone
    let signatureValid;
    try {
      signatureValid = paymentSvc.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
    } catch (err) {
      return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Signature verification error');
    }

    if (!signatureValid) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid payment signature — possible tampering detected');
    }

    // 2. Fetch our transaction record
    const txn = payment_transaction_id
      ? await PaymentTransaction.getTransactionById(payment_transaction_id)
      : await PaymentTransaction.getTransactionByRazorpayOrderId(razorpay_order_id);

    if (!txn) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Payment transaction not found');
    }

    // 3. Guard: already processed (idempotency)
    if (txn.payment_status === 'payment_success') {
      return successResponse(res, HTTP_STATUS.OK, 'Payment already verified', { transaction_id: txn.id });
    }

    // 4. Cross-check amount with Razorpay API (server-side amount verification)
    try {
      const rzpPayment = await paymentSvc.fetchPaymentDetails(razorpay_payment_id);
      const rzpAmountRupees = rzpPayment.amount / 100;
      const ourAmount = parseFloat(txn.total_amount);

      // Allow ±1 paise tolerance for rounding
      if (Math.abs(rzpAmountRupees - ourAmount) > 0.01) {
        await PaymentTransaction.markPaymentFailed(txn.id, 'Amount mismatch');
        return errorResponse(res, HTTP_STATUS.BAD_REQUEST,
          `Amount mismatch: expected ₹${ourAmount}, gateway reported ₹${rzpAmountRupees}`
        );
      }
    } catch (err) {
      // If Razorpay API is down, proceed with signature as proof (already verified)
      console.warn('Could not cross-check amount with Razorpay API:', err.message);
    }

    // 5. Mark transaction as payment_success
    await PaymentTransaction.markPaymentSuccess(txn.id, razorpay_payment_id, razorpay_signature);

    // 6. Update all linked orders → payment_status=paid, order_status=confirmed
    const splits = await PaymentSplit.getSplitsByTransaction(txn.id);
    for (const split of splits) {
      await Order.updateOrderStatus(split.order_id, 'confirmed');
      await Order.updatePaymentStatus(split.order_id, 'paid');
    }

    // 7. Clear consumer's cart
    await Cart.clearCart(req.user.id);

    // 8. Initiate Razorpay Route transfers to sellers
    //    (runs asynchronously — webhook confirms completion)
    triggerSellerPayouts(splits, razorpay_payment_id).catch(err =>
      console.error('Seller payout trigger error:', err.message)
    );

    return successResponse(res, HTTP_STATUS.OK, 'Payment verified successfully', {
      transaction_id:   txn.id,
      payment_status:   'payment_success',
      order_count:      splits.length
    });

  } catch (error) {
    console.error('verifyPayment error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Payment verification failed', error.message);
  }
};

// ─────────────────────────────────────────────────────
// Internal: Trigger Route transfers to sellers
// ─────────────────────────────────────────────────────
async function triggerSellerPayouts(splits, razorpayPaymentId) {
  for (const split of splits) {
    try {
      await PaymentSplit.updatePayoutStatus(split.id, 'payout_processing');

      // Only transfer if seller has a Razorpay linked account ID stored
      // For now we record the intent and the webhook handles confirmation.
      // In production: fetch seller.razorpay_account_id from DB here.
      // For test mode: log and mark as processing.
      console.log(
        `[Payout] Split ${split.id} | Seller ${split.seller_id} | ₹${split.seller_amount}`
      );

      // Uncomment below when sellers have onboarded Razorpay linked accounts:
      // const sellerAccount = await getSellerRazorpayAccount(split.seller_id);
      // if (sellerAccount) {
      //   const transfer = await paymentSvc.createRouteTransfer(
      //     razorpayPaymentId, sellerAccount, split.seller_amount,
      //     `MilletVerse order ${split.order_id}`
      //   );
      //   await PaymentSplit.updatePayoutStatus(split.id, 'payout_completed', transfer.items[0].id);
      // }

    } catch (err) {
      await PaymentSplit.updatePayoutStatus(split.id, 'payout_failed');
      console.error(`Payout failed for split ${split.id}:`, err.message);
    }
  }
}

// ─────────────────────────────────────────────────────
// POST /api/payments/webhook
// Razorpay webhook — verified by HMAC, idempotent
// ─────────────────────────────────────────────────────
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing webhook signature' });
    }

    // Verify webhook signature using raw body
    let valid;
    try {
      valid = paymentSvc.verifyWebhookSignature(req.rawBody, signature);
    } catch (err) {
      return res.status(500).json({ error: 'Webhook signature check failed' });
    }

    if (!valid) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    const eventType = event.event;

    // ── payment.captured ──────────────────────────────
    if (eventType === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const txn = await PaymentTransaction.getTransactionByRazorpayOrderId(payment.order_id);

      if (txn && !txn.webhook_processed && txn.payment_status !== 'payment_success') {
        await PaymentTransaction.markPaymentSuccess(txn.id, payment.id, null);
        const splits = await PaymentSplit.getSplitsByTransaction(txn.id);
        for (const split of splits) {
          await Order.updateOrderStatus(split.order_id, 'confirmed');
          await Order.updatePaymentStatus(split.order_id, 'paid');
        }
        await PaymentTransaction.markWebhookProcessed(txn.id);
      }
    }

    // ── payment.failed ────────────────────────────────
    if (eventType === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const txn = await PaymentTransaction.getTransactionByRazorpayOrderId(payment.order_id);
      if (txn && !txn.webhook_processed) {
        await PaymentTransaction.markPaymentFailed(txn.id, payment.error_description || 'Payment failed');
        await PaymentTransaction.markWebhookProcessed(txn.id);
      }
    }

    // ── transfer.settled ──────────────────────────────
    if (eventType === 'transfer.settled') {
      const transfer = event.payload.transfer.entity;
      // Find the split by transfer ID and mark completed
      // (transfer.id was stored in razorpay_transfer_id during createRouteTransfer)
      const splits = await PaymentSplit.findByTransferId(transfer.id).catch(() => []);
      for (const split of splits) {
        await PaymentSplit.updatePayoutStatus(split.id, 'payout_completed', transfer.id);
      }
    }

    // ── refund.created ────────────────────────────────
    if (eventType === 'refund.created') {
      const refund  = event.payload.refund.entity;
      const txn     = await PaymentTransaction.getTransactionByRazorpayPaymentId(refund.payment_id);
      if (txn) {
        await PaymentTransaction.markRefunded(txn.id);
        await PaymentSplit.markSplitsRefundPending(txn.id);
      }
    }

    // Acknowledge webhook to Razorpay (must respond 200 quickly)
    return res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook error:', error);
    // Still respond 200 — Razorpay retries on non-200
    return res.status(200).json({ status: 'error_logged' });
  }
};

// ─────────────────────────────────────────────────────
// GET /api/payments/:paymentId
// Get payment transaction details (consumer or admin)
// ─────────────────────────────────────────────────────
export const getPaymentById = async (req, res) => {
  try {
    const txn = await PaymentTransaction.getTransactionById(req.params.paymentId);
    if (!txn) return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Payment not found');

    // Authorization: only the consumer who made it, or admin
    if (req.user.role !== 'admin' && txn.consumer_id !== req.user.id) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized');
    }

    const splits = await PaymentSplit.getSplitsByTransaction(txn.id);
    return successResponse(res, HTTP_STATUS.OK, 'Payment details', { transaction: txn, splits });

  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch payment', error.message);
  }
};

// ─────────────────────────────────────────────────────
// GET /api/payments/admin/summary
// Admin — payment statistics
// ─────────────────────────────────────────────────────
export const getAdminPaymentSummary = async (req, res) => {
  try {
    const [txnStats, commissionStats, transactions] = await Promise.all([
      PaymentTransaction.getPaymentStatistics(),
      PaymentSplit.getAdminCommissionStats(),
      PaymentTransaction.getAllTransactions({ limit: 20 })
    ]);

    return successResponse(res, HTTP_STATUS.OK, 'Admin payment summary', {
      payment_stats:    txnStats,
      commission_stats: commissionStats,
      recent_transactions: transactions
    });
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch admin summary', error.message);
  }
};

// ─────────────────────────────────────────────────────
// GET  /api/payments/admin/commission
// POST /api/payments/admin/commission
// Admin — read / update commission %
// ─────────────────────────────────────────────────────
export const getCommission = async (req, res) => {
  try {
    const pct = await commissionSvc.getCommissionPct();
    return successResponse(res, HTTP_STATUS.OK, 'Commission fetched', { commission_pct: pct });
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch commission', error.message);
  }
};

export const setCommission = async (req, res) => {
  try {
    const { commission_pct } = req.body;
    if (commission_pct === undefined) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'commission_pct is required');
    }
    const saved = await commissionSvc.setCommissionPct(commission_pct, req.user.id);
    return successResponse(res, HTTP_STATUS.OK, 'Commission updated', { commission_pct: saved });
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update commission', error.message);
  }
};

// ─────────────────────────────────────────────────────
// GET /api/payments/farmer/earnings
// Farmer / seller — earnings dashboard
// ─────────────────────────────────────────────────────
export const getFarmerEarnings = async (req, res) => {
  try {
    if (!['seller', 'farmer'].includes(req.user.role)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Only sellers and farmers can view earnings');
    }

    const [summary, splits] = await Promise.all([
      PaymentSplit.getSellerEarningsSummary(req.user.id),
      PaymentSplit.getSplitsBySeller(req.user.id, { limit: 50 })
    ]);

    return successResponse(res, HTTP_STATUS.OK, 'Farmer earnings', {
      summary,
      payout_history: splits
    });
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch earnings', error.message);
  }
};
