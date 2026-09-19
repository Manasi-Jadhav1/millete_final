import { query } from '../config/database.js';

/**
 * Cart Model
 * Handles all database operations related to shopping cart
 */

/**
 * Add item to cart
 * @param {Object} cartData - Cart data object
 * @returns {Object} Cart item
 */
export const addToCart = async (cartData) => {
  const { user_id, product_id, quantity = 1 } = cartData;
  
  // Check if item already exists in cart
  const existingItem = await getCartItem(user_id, product_id);
  
  if (existingItem) {
    // Update quantity if item exists
    const sql = `
      UPDATE cart
      SET quantity = quantity + ?, added_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND product_id = ?
    `;
    await query(sql, [quantity, user_id, product_id]);
  } else {
    // Insert new item
    const sql = `
      INSERT INTO cart (user_id, product_id, quantity)
      VALUES (?, ?, ?)
    `;
    await query(sql, [user_id, product_id, quantity]);
  }
  
  return await getCartItems(user_id);
};

/**
 * Sync local cart with database
 * @param {Number} userId - User ID
 * @param {Array} localItems - Array of { product_id, quantity }
 * @returns {Object} Updated cart summary
 */
export const syncCart = async (userId, localItems) => {
  for (const item of localItems) {
    await addToCart({
      user_id: userId,
      product_id: item.product_id,
      quantity: item.quantity
    });
  }
  return await getCartSummary(userId);
};

/**
 * Get cart item
 * @param {Number} userId - User ID
 * @param {Number} productId - Product ID
 * @returns {Object} Cart item
 */
export const getCartItem = async (userId, productId) => {
  const sql = `
    SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ? AND c.product_id = ?
  `;
  
  const items = await query(sql, [userId, productId]);
  return items[0] || null;
};

/**
 * Get all cart items for a user
 * @param {Number} userId - User ID
 * @returns {Array} Array of cart items
 */
export const getCartItems = async (userId) => {
  const sql = `
    SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity, p.millet_type,
           (c.quantity * p.price) as subtotal
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
    ORDER BY c.added_at DESC
  `;
  
  return await query(sql, [userId]);
};

/**
 * Get cart count for a user
 * @param {Number} userId - User ID
 * @returns {Number} Total items in cart
 */
export const getCartCount = async (userId) => {
  const sql = 'SELECT SUM(quantity) as count FROM cart WHERE user_id = ?';
  const result = await query(sql, [userId]);
  return result[0].count || 0;
};

/**
 * Get cart total
 * @param {Number} userId - User ID
 * @returns {Number} Total price
 */
export const getCartTotal = async (userId) => {
  const sql = `
    SELECT SUM(c.quantity * p.price) as total
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  
  const result = await query(sql, [userId]);
  return result[0].total || 0;
};

/**
 * Update cart item quantity
 * @param {Number} userId - User ID
 * @param {Number} productId - Product ID
 * @param {Number} quantity - New quantity
 * @returns {Object} Updated cart items
 */
export const updateCartItem = async (userId, productId, quantity) => {
  if (quantity <= 0) {
    return await removeFromCart(userId, productId);
  }
  
  const sql = `
    UPDATE cart
    SET quantity = ?
    WHERE user_id = ? AND product_id = ?
  `;
  
  await query(sql, [quantity, userId, productId]);
  return await getCartItems(userId);
};

/**
 * Remove item from cart
 * @param {Number} userId - User ID
 * @param {Number} productId - Product ID
 * @returns {Boolean} Success status
 */
export const removeFromCart = async (userId, productId) => {
  const sql = 'DELETE FROM cart WHERE user_id = ? AND product_id = ?';
  const result = await query(sql, [userId, productId]);
  return result.affectedRows > 0;
};

/**
 * Clear cart
 * @param {Number} userId - User ID
 * @returns {Boolean} Success status
 */
export const clearCart = async (userId) => {
  const sql = 'DELETE FROM cart WHERE user_id = ?';
  const result = await query(sql, [userId]);
  return result.affectedRows > 0;
};

/**
 * Get cart summary
 * @param {Number} userId - User ID
 * @returns {Object} Cart summary
 */
export const getCartSummary = async (userId) => {
  const items = await getCartItems(userId);
  const total = await getCartTotal(userId);
  const count = await getCartCount(userId);
  
  return {
    items,
    total: parseFloat(total),
    count
  };
};

/**
 * Move cart item to order (checkout)
 * @param {Number} userId - User ID
 * @param {Number} productId - Product ID
 * @returns {Object} Cart item data
 */
export const getCartItemForOrder = async (userId, productId) => {
  const sql = `
    SELECT c.*, p.price, p.stock_quantity
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ? AND c.product_id = ?
  `;
  
  const items = await query(sql, [userId, productId]);
  return items[0] || null;
};
