/**
 * commissionService.js
 * MilletVerse — Commission calculation engine
 *
 * All arithmetic uses integer paise to avoid IEEE-754 floating-point issues.
 * Amounts are stored and returned as DECIMAL-safe JS numbers (2 d.p. max).
 */

import { query } from '../config/database.js';

/**
 * Fetch the current platform commission percentage from the database.
 * Always reads from DB — never uses a hard-coded value.
 * @returns {Promise<number>} Commission percentage (e.g. 10.00)
 */
export const getCommissionPct = async () => {
  const rows = await query('SELECT commission_pct FROM platform_config WHERE id = 1');
  if (!rows || rows.length === 0) {
    throw new Error('Platform commission not configured. Run payment_migration.sql first.');
  }
  return parseFloat(rows[0].commission_pct);
};

/**
 * Update the platform commission percentage (admin only — enforce at route level).
 * @param {number} pct  New commission percentage (0–100)
 * @param {number} adminId  ID of admin making the change
 * @returns {Promise<number>} The newly saved percentage
 */
export const setCommissionPct = async (pct, adminId) => {
  const parsed = parseFloat(pct);
  if (isNaN(parsed) || parsed < 0 || parsed > 100) {
    throw new Error('Commission must be a number between 0 and 100');
  }
  await query(
    'UPDATE platform_config SET commission_pct = ?, updated_by = ? WHERE id = 1',
    [parsed.toFixed(2), adminId]
  );
  return parsed;
};

/**
 * Calculate commission split for a single product line-item.
 * Uses integer arithmetic (paise) for precision, returns numbers rounded to 2 d.p.
 *
 * @param {number} productPrice   Unit price from DB (e.g. 500.00)
 * @param {number} quantity       Quantity ordered
 * @param {number} commissionPct  Commission percentage from DB (e.g. 10)
 * @returns {{
 *   productAmount: number,
 *   commissionPct: number,
 *   adminCommission: number,
 *   sellerAmount: number
 * }}
 */
export const calculateSplit = (productPrice, quantity, commissionPct) => {
  // Work in integer paise to avoid float drift
  const pricePaise       = Math.round(parseFloat(productPrice) * 100);
  const qtyInt           = parseInt(quantity, 10);
  const commissionBps    = Math.round(parseFloat(commissionPct) * 100); // basis points

  const productAmtPaise  = pricePaise * qtyInt;
  // admin_commission = round(product_amount × commission_pct / 100)
  const adminPaise       = Math.round((productAmtPaise * commissionBps) / 10000);
  const sellerPaise      = productAmtPaise - adminPaise;

  return {
    productAmount:   productAmtPaise / 100,
    commissionPct:   parseFloat(commissionPct),
    adminCommission: adminPaise   / 100,
    sellerAmount:    sellerPaise  / 100
  };
};

/**
 * Calculate splits for an entire cart (multi-seller aware).
 * Reads authoritative prices from DB — never trusts frontend values.
 *
 * @param {Array<{product_id, quantity, price, seller_id}>} cartItems  Items from DB
 * @param {number} commissionPct  Commission percentage from DB
 * @returns {{
 *   lineItems: Array,
 *   grandTotal: number,
 *   totalAdminCommission: number,
 *   totalSellerAmount: number,
 *   sellerBreakdown: Object
 * }}
 */
export const calculateCartSplits = (cartItems, commissionPct) => {
  let grandTotalPaise  = 0;
  let totalAdminPaise  = 0;
  let totalSellerPaise = 0;
  const sellerBreakdown = {}; // keyed by seller_id

  const lineItems = cartItems.map(item => {
    const split = calculateSplit(item.price, item.quantity, commissionPct);

    const prd = Math.round(split.productAmount  * 100);
    const adm = Math.round(split.adminCommission * 100);
    const sel = Math.round(split.sellerAmount    * 100);

    grandTotalPaise  += prd;
    totalAdminPaise  += adm;
    totalSellerPaise += sel;

    // Aggregate per-seller
    const sid = item.seller_id;
    if (!sellerBreakdown[sid]) {
      sellerBreakdown[sid] = { sellerAmount: 0, adminCommission: 0, productAmount: 0 };
    }
    sellerBreakdown[sid].productAmount   += prd / 100;
    sellerBreakdown[sid].adminCommission += adm / 100;
    sellerBreakdown[sid].sellerAmount    += sel / 100;

    return {
      product_id:      item.product_id,
      seller_id:       item.seller_id,
      quantity:        item.quantity,
      ...split
    };
  });

  return {
    lineItems,
    grandTotal:          grandTotalPaise  / 100,
    totalAdminCommission: totalAdminPaise  / 100,
    totalSellerAmount:    totalSellerPaise / 100,
    sellerBreakdown
  };
};
