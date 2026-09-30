/**
 * PaymentSplit.js
 * MilletVerse — DB model for payment_splits table
 */

import { query } from '../config/database.js';

/**
 * Create a payment split record for a single order-item.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const createSplit = async (data) => {
  const {
    payment_transaction_id,
    order_id,
    seller_id,
    product_id,
    quantity,
    product_amount,
    commission_pct,
    admin_commission,
    seller_amount
  } = data;

  const sql = `
    INSERT INTO payment_splits
      (payment_transaction_id, order_id, seller_id, product_id,
       quantity, product_amount, commission_pct, admin_commission, seller_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    payment_transaction_id, order_id, seller_id, product_id,
    quantity, product_amount, commission_pct, admin_commission, seller_amount
  ]);
  return await getSplitById(result.insertId);
};

/**
 * Get split by ID.
 */
export const getSplitById = async (id) => {
  const rows = await query(
    `SELECT ps.*, p.name AS product_name, u.name AS seller_name
     FROM payment_splits ps
     LEFT JOIN products p ON ps.product_id = p.id
     LEFT JOIN users    u ON ps.seller_id  = u.id
     WHERE ps.id = ?`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Get all splits for a payment transaction.
 * @param {number} paymentTransactionId
 */
export const getSplitsByTransaction = async (paymentTransactionId) => {
  return await query(
    `SELECT ps.*, p.name AS product_name, u.name AS seller_name
     FROM payment_splits ps
     LEFT JOIN products p ON ps.product_id = p.id
     LEFT JOIN users    u ON ps.seller_id  = u.id
     WHERE ps.payment_transaction_id = ?`,
    [paymentTransactionId]
  );
};

/**
 * Get all splits for a specific seller (farmer earnings view).
 * @param {number} sellerId
 * @param {Object} filters
 */
export const getSplitsBySeller = async (sellerId, filters = {}) => {
  const { payout_status, limit = 50, page = 1 } = filters;

  let sql = `
    SELECT ps.*,
           p.name  AS product_name,
           pt.razorpay_payment_id,
           pt.created_at AS payment_date,
           o.order_date,
           u.name  AS consumer_name
    FROM payment_splits ps
    LEFT JOIN payment_transactions pt ON ps.payment_transaction_id = pt.id
    LEFT JOIN products              p  ON ps.product_id = p.id
    LEFT JOIN orders                o  ON ps.order_id   = o.id
    LEFT JOIN users                 u  ON pt.consumer_id = u.id
    WHERE ps.seller_id = ?
  `;
  const params = [sellerId];

  if (payout_status) { sql += ' AND ps.payout_status = ?'; params.push(payout_status); }

  sql += ' ORDER BY ps.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  return await query(sql, params);
};

/**
 * Update payout status (e.g. after Razorpay Route transfer).
 * @param {number} splitId
 * @param {string} status
 * @param {string|null} transferId
 */
export const updatePayoutStatus = async (splitId, status, transferId = null) => {
  await query(
    `UPDATE payment_splits
     SET payout_status = ?,
         razorpay_transfer_id = COALESCE(?, razorpay_transfer_id),
         payout_processed_at  = CASE WHEN ? = 'payout_completed' THEN CURRENT_TIMESTAMP ELSE payout_processed_at END
     WHERE id = ?`,
    [status, transferId, status, splitId]
  );
};

/**
 * Update all splits for a transaction to refund_pending.
 * @param {number} paymentTransactionId
 */
export const markSplitsRefundPending = async (paymentTransactionId) => {
  await query(
    `UPDATE payment_splits
     SET payout_status = 'refund_pending'
     WHERE payment_transaction_id = ?
       AND payout_status NOT IN ('refunded')`,
    [paymentTransactionId]
  );
};

/**
 * Get aggregated earnings summary for a seller (farmer dashboard).
 * @param {number} sellerId
 */
export const getSellerEarningsSummary = async (sellerId) => {
  const rows = await query(
    `SELECT
       SUM(product_amount)   AS total_sales,
       SUM(admin_commission) AS total_commission_deducted,
       SUM(seller_amount)    AS total_net_earnings,
       SUM(CASE WHEN payout_status = 'payout_pending'    THEN seller_amount ELSE 0 END) AS pending_payout,
       SUM(CASE WHEN payout_status = 'payout_completed'  THEN seller_amount ELSE 0 END) AS completed_payout,
       SUM(CASE WHEN payout_status = 'payout_failed'     THEN seller_amount ELSE 0 END) AS failed_payout
     FROM payment_splits
     WHERE seller_id = ?`,
    [sellerId]
  );
  return rows[0] || {};
};

/**
 * Get platform-level commission statistics for admin dashboard.
 */
export const getAdminCommissionStats = async () => {
  const rows = await query(`
    SELECT
      SUM(product_amount)   AS total_sales,
      SUM(admin_commission) AS total_platform_commission,
      SUM(seller_amount)    AS total_seller_payouts,
      SUM(CASE WHEN payout_status = 'payout_pending'   THEN seller_amount ELSE 0 END) AS pending_payouts,
      SUM(CASE WHEN payout_status = 'payout_completed' THEN seller_amount ELSE 0 END) AS completed_payouts,
      SUM(CASE WHEN payout_status = 'payout_failed'    THEN seller_amount ELSE 0 END) AS failed_payouts,
      SUM(CASE WHEN payout_status = 'refunded'         THEN seller_amount ELSE 0 END) AS refunded_payouts
    FROM payment_splits
  `);
  return rows[0] || {};
};
