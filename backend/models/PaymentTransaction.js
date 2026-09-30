/**
 * PaymentTransaction.js
 * MilletVerse — DB model for payment_transactions table
 */

import { query } from '../config/database.js';

/**
 * Create a new payment transaction record (before Razorpay order is created).
 * @param {Object} data
 * @returns {Promise<Object>} Created transaction row
 */
export const createTransaction = async (data) => {
  const { consumer_id, total_amount } = data;

  const sql = `
    INSERT INTO payment_transactions
      (consumer_id, total_amount, payment_status)
    VALUES (?, ?, 'pending')
  `;
  const result = await query(sql, [consumer_id, total_amount]);
  return await getTransactionById(result.insertId);
};

/**
 * Attach the Razorpay order ID after creating the Razorpay order.
 * @param {number} txnId
 * @param {string} razorpayOrderId
 */
export const setRazorpayOrderId = async (txnId, razorpayOrderId) => {
  await query(
    `UPDATE payment_transactions
     SET razorpay_order_id = ?, payment_status = 'payment_initiated'
     WHERE id = ?`,
    [razorpayOrderId, txnId]
  );
};

/**
 * Mark payment as successful after server-side signature verification.
 * @param {number} txnId
 * @param {string} razorpayPaymentId
 * @param {string} razorpaySignature
 */
export const markPaymentSuccess = async (txnId, razorpayPaymentId, razorpaySignature) => {
  await query(
    `UPDATE payment_transactions
     SET razorpay_payment_id = ?,
         razorpay_signature  = ?,
         payment_status      = 'payment_success'
     WHERE id = ?`,
    [razorpayPaymentId, razorpaySignature, txnId]
  );
};

/**
 * Mark payment as failed.
 * @param {number} txnId
 * @param {string} reason
 */
export const markPaymentFailed = async (txnId, reason = '') => {
  await query(
    `UPDATE payment_transactions
     SET payment_status = 'payment_failed', failure_reason = ?
     WHERE id = ?`,
    [reason, txnId]
  );
};

/**
 * Mark payment as refunded.
 * @param {number} txnId
 */
export const markRefunded = async (txnId) => {
  await query(
    `UPDATE payment_transactions SET payment_status = 'refunded' WHERE id = ?`,
    [txnId]
  );
};

/**
 * Set webhook_processed = 1 (idempotency guard).
 * @param {number} txnId
 */
export const markWebhookProcessed = async (txnId) => {
  await query(
    `UPDATE payment_transactions SET webhook_processed = 1 WHERE id = ?`,
    [txnId]
  );
};

/**
 * Get transaction by internal ID.
 * @param {number} id
 */
export const getTransactionById = async (id) => {
  const rows = await query(
    `SELECT pt.*, u.name AS consumer_name, u.email AS consumer_email
     FROM payment_transactions pt
     LEFT JOIN users u ON pt.consumer_id = u.id
     WHERE pt.id = ?`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Get transaction by Razorpay order ID.
 * @param {string} razorpayOrderId
 */
export const getTransactionByRazorpayOrderId = async (razorpayOrderId) => {
  const rows = await query(
    `SELECT * FROM payment_transactions WHERE razorpay_order_id = ?`,
    [razorpayOrderId]
  );
  return rows[0] || null;
};

/**
 * Get transaction by Razorpay payment ID.
 * @param {string} razorpayPaymentId
 */
export const getTransactionByRazorpayPaymentId = async (razorpayPaymentId) => {
  const rows = await query(
    `SELECT * FROM payment_transactions WHERE razorpay_payment_id = ?`,
    [razorpayPaymentId]
  );
  return rows[0] || null;
};

/**
 * Get all transactions (admin use).
 * @param {Object} filters
 */
export const getAllTransactions = async (filters = {}) => {
  const { payment_status, consumer_id, limit = 50, page = 1 } = filters;
  let sql = `
    SELECT pt.*, u.name AS consumer_name, u.email AS consumer_email
    FROM payment_transactions pt
    LEFT JOIN users u ON pt.consumer_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (payment_status) { sql += ' AND pt.payment_status = ?'; params.push(payment_status); }
  if (consumer_id)    { sql += ' AND pt.consumer_id = ?';    params.push(consumer_id); }

  sql += ' ORDER BY pt.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  return await query(sql, params);
};

/**
 * Get platform-level payment statistics for admin dashboard.
 */
export const getPaymentStatistics = async () => {
  const rows = await query(`
    SELECT
      COUNT(*)                                                    AS total_transactions,
      SUM(CASE WHEN payment_status = 'payment_success' THEN total_amount ELSE 0 END)
                                                                  AS total_sales,
      SUM(CASE WHEN payment_status = 'payment_failed'  THEN 1 ELSE 0 END)
                                                                  AS failed_count,
      SUM(CASE WHEN payment_status = 'refunded'        THEN 1 ELSE 0 END)
                                                                  AS refunded_count
    FROM payment_transactions
  `);
  return rows[0];
};
