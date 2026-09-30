/**
 * paymentService.js
 * MilletVerse — Razorpay gateway wrapper
 *
 * All Razorpay SDK calls are isolated here.
 * Switching to a different gateway in future only requires editing this file.
 */

import Razorpay from 'razorpay';
import crypto   from 'crypto';

// ── Razorpay client (lazy-initialised so missing keys don't crash on import) ──
let _rzp = null;

const getRazorpay = () => {
  if (!_rzp) {
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env'
      );
    }
    _rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _rzp;
};

// ─────────────────────────────────────────────
// 1. Create Razorpay Order
// ─────────────────────────────────────────────
/**
 * Create a Razorpay order object.
 * Amount is passed in rupees; we convert to paise internally.
 *
 * @param {number} amountInRupees   Total checkout amount (e.g. 800.00)
 * @param {string} receiptId        Unique reference (e.g. "mv_txn_123")
 * @returns {Promise<Object>}       Razorpay order { id, amount, currency, ... }
 */
export const createRazorpayOrder = async (amountInRupees, receiptId) => {
  const rzp = getRazorpay();

  // Razorpay requires amount in paise (smallest INR unit), integer only
  const amountPaise = Math.round(parseFloat(amountInRupees) * 100);

  const order = await rzp.orders.create({
    amount:   amountPaise,
    currency: 'INR',
    receipt:  receiptId,
    payment_capture: 1   // auto-capture on payment completion
  });

  return order;
};

// ─────────────────────────────────────────────
// 2. Verify Payment Signature (server-side only)
// ─────────────────────────────────────────────
/**
 * Verify Razorpay payment signature using HMAC-SHA256.
 * This is the only trusted proof that payment completed on Razorpay's servers.
 *
 * @param {string} razorpayOrderId    From Razorpay order creation
 * @param {string} razorpayPaymentId  Returned by Razorpay checkout
 * @param {string} razorpaySignature  Returned by Razorpay checkout
 * @returns {boolean} true if valid, false if tampered
 */
export const verifyPaymentSignature = (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error('RAZORPAY_KEY_SECRET not set');

  const body      = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected  = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(razorpaySignature, 'hex')
  );
};

// ─────────────────────────────────────────────
// 3. Verify Webhook Signature
// ─────────────────────────────────────────────
/**
 * Verify that an incoming webhook actually came from Razorpay.
 * Uses the raw request body (string) and the X-Razorpay-Signature header.
 *
 * @param {string} rawBody          Raw request body string (not parsed JSON)
 * @param {string} webhookSignature Value of "X-Razorpay-Signature" header
 * @returns {boolean}
 */
export const verifyWebhookSignature = (rawBody, webhookSignature) => {
  const secret   = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET not set');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(webhookSignature, 'hex')
  );
};

// ─────────────────────────────────────────────
// 4. Fetch Payment Details from Razorpay
// ─────────────────────────────────────────────
/**
 * Fetch live payment details from Razorpay API.
 * Used during verify flow to double-check amount server-side.
 *
 * @param {string} razorpayPaymentId
 * @returns {Promise<Object>} Razorpay payment object
 */
export const fetchPaymentDetails = async (razorpayPaymentId) => {
  const rzp = getRazorpay();
  return await rzp.payments.fetch(razorpayPaymentId);
};

// ─────────────────────────────────────────────
// 5. Initiate Refund
// ─────────────────────────────────────────────
/**
 * Initiate a refund for a captured payment.
 *
 * @param {string} razorpayPaymentId  The original payment ID
 * @param {number} amountInRupees     Amount to refund (full or partial)
 * @returns {Promise<Object>}         Razorpay refund object
 */
export const initiateRefund = async (razorpayPaymentId, amountInRupees) => {
  const rzp = getRazorpay();
  const amountPaise = Math.round(parseFloat(amountInRupees) * 100);

  return await rzp.payments.refund(razorpayPaymentId, {
    amount: amountPaise,
    speed:  'normal'
  });
};

// ─────────────────────────────────────────────
// 6. Create Route Transfer (Split Payout to Seller)
// ─────────────────────────────────────────────
/**
 * Transfer seller's share to their linked Razorpay account via Razorpay Route.
 * This requires sellers to have a Razorpay linked account (onboarded).
 * In test mode, transfers are simulated — no real money moves.
 *
 * @param {string} razorpayPaymentId  Captured payment ID
 * @param {string} sellerAccountId    Seller's Razorpay linked account ID
 * @param {number} amountInRupees     Amount to transfer to seller
 * @param {string} notes              Description / reference
 * @returns {Promise<Object>}         Transfer object from Razorpay
 */
export const createRouteTransfer = async (
  razorpayPaymentId,
  sellerAccountId,
  amountInRupees,
  notes = ''
) => {
  const rzp = getRazorpay();
  const amountPaise = Math.round(parseFloat(amountInRupees) * 100);

  const transfer = await rzp.payments.transfer(razorpayPaymentId, {
    transfers: [
      {
        account:  sellerAccountId,
        amount:   amountPaise,
        currency: 'INR',
        notes:    { description: notes }
      }
    ]
  });

  return transfer;
};

/**
 * Return the public Razorpay key_id for the frontend.
 * The secret is NEVER returned — only the publishable key_id.
 * @returns {string}
 */
export const getPublicKeyId = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new Error('RAZORPAY_KEY_ID not set');
  return keyId;
};
