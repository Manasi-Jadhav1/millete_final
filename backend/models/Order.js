import { query } from '../config/database.js';

/**
 * Order Model
 * Handles all database operations related to orders
 */

/**
 * Create a new order
 * @param {Object} orderData - Order data object
 * @returns {Object} Created order
 */
export const createOrder = async (orderData) => {
  const {
    user_id,
    product_id,
    quantity,
    total_price,
    delivery_address,
    order_status = 'pending',
    payment_status = 'pending'
  } = orderData;
  
  const sql = `
    INSERT INTO orders (user_id, product_id, quantity, total_price, delivery_address, order_status, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query(sql, [
    user_id, product_id, quantity, total_price, delivery_address, order_status, payment_status
  ]);
  
  // Update product stock
  await query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, product_id]);
  
  return await getOrderById(result.insertId);
};

/**
 * Get order by ID
 * @param {Number} id - Order ID
 * @returns {Object} Order object with details
 */
export const getOrderById = async (id) => {
  const sql = `
    SELECT o.*, p.name as product_name, p.image_url as product_image,
           u.name as user_name, u.email as user_email, u.phone as user_phone
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `;
  
  const orders = await query(sql, [id]);
  return orders[0] || null;
};

/**
 * Get all orders with filters
 * @param {Object} filters - Filter options
 * @returns {Array} Array of orders
 */
export const getAllOrders = async (filters = {}) => {
  const {
    user_id,
    product_id,
    seller_id,
    order_status,
    payment_status,
    start_date,
    end_date,
    page = 1,
    limit = 20
  } = filters;
  
  let sql = `
    SELECT o.*, p.name as product_name, p.millet_type, p.price as product_price,
           u.name as user_name, u.email as user_email
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (user_id) {
    sql += ' AND o.user_id = ?';
    params.push(user_id);
  }
  
  if (product_id) {
    sql += ' AND o.product_id = ?';
    params.push(product_id);
  }
  
  // Filter orders by seller's products
  if (seller_id) {
    sql += ' AND p.seller_id = ?';
    params.push(seller_id);
  }
  
  if (order_status) {
    sql += ' AND o.order_status = ?';
    params.push(order_status);
  }
  
  if (payment_status) {
    sql += ' AND o.payment_status = ?';
    params.push(payment_status);
  }
  
  if (start_date) {
    sql += ' AND o.order_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    sql += ' AND o.order_date <= ?';
    params.push(end_date);
  }
  
  sql += ' ORDER BY o.order_date DESC';
  
  // Pagination
  const offset = (page - 1) * limit;
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  return await query(sql, params);
};

/**
 * Get order count with filters
 * @param {Object} filters - Filter options
 * @returns {Number} Total count
 */
export const getOrderCount = async (filters = {}) => {
  const { user_id, seller_id, order_status } = filters;
  
  let sql = `
    SELECT COUNT(*) as count
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) {
    sql += ' AND o.user_id = ?';
    params.push(user_id);
  }
  
  if (seller_id) {
    sql += ' AND p.seller_id = ?';
    params.push(seller_id);
  }
  
  if (order_status) {
    sql += ' AND o.order_status = ?';
    params.push(order_status);
  }
  
  const result = await query(sql, params);
  return result[0].count;
};

/**
 * Update order status
 * @param {Number} id - Order ID
 * @param {String} status - New status
 * @returns {Object} Updated order
 */
export const updateOrderStatus = async (id, status) => {
  let sql;
  
  if (status === 'delivered') {
    sql = `
      UPDATE orders
      SET order_status = ?, delivered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
  } else {
    sql = `
      UPDATE orders
      SET order_status = ?
      WHERE id = ?
    `;
  }
  
  await query(sql, [status, id]);
  return await getOrderById(id);
};

/**
 * Update payment status
 * @param {Number} id - Order ID
 * @param {String} status - New payment status
 * @returns {Object} Updated order
 */
export const updatePaymentStatus = async (id, status) => {
  const sql = `
    UPDATE orders
    SET payment_status = ?
    WHERE id = ?
  `;
  
  await query(sql, [status, id]);
  return await getOrderById(id);
};

/**
 * Cancel order
 * @param {Number} id - Order ID
 * @returns {Object} Updated order
 */
export const cancelOrder = async (id) => {
  // Get order details first
  const order = await getOrderById(id);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Restore product stock
  await query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [order.quantity, order.product_id]);
  
  // Update order status
  const sql = `
    UPDATE orders
    SET order_status = 'cancelled'
    WHERE id = ?
  `;
  
  await query(sql, [id]);
  return await getOrderById(id);
};

/**
 * Get orders by user
 * @param {Number} userId - User ID
 * @returns {Array} Array of orders
 */
export const getOrdersByUser = async (userId) => {
  const sql = `
    SELECT o.*, p.name as product_name, p.image_url as product_image, p.millet_type
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.order_date DESC
  `;
  
  return await query(sql, [userId]);
};

/**
 * Get orders by seller
 * @param {Number} sellerId - Seller ID
 * @returns {Array} Array of orders
 */
export const getOrdersBySeller = async (sellerId) => {
  const sql = `
    SELECT o.*, p.name as product_name, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE p.seller_id = ?
    ORDER BY o.order_date DESC
  `;
  
  return await query(sql, [sellerId]);
};

/**
 * Get total revenue
 * @param {Number} sellerId - Optional seller ID
 * @returns {Number} Total revenue
 */
export const getTotalRevenue = async (sellerId = null) => {
  let sql = `
    SELECT SUM(total_price) as revenue
    FROM orders
    WHERE order_status != 'cancelled' AND payment_status = 'paid'
  `;
  
  const params = [];
  
  if (sellerId) {
    sql += ' AND product_id IN (SELECT id FROM products WHERE seller_id = ?)';
    params.push(sellerId);
  }
  
  const result = await query(sql, params);
  return result[0].revenue || 0;
};

/**
 * Get order statistics
 * @returns {Object} Order statistics
 */
export const getOrderStatistics = async () => {
  const sql = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
      SUM(CASE WHEN order_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
      SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
      SUM(CASE WHEN order_status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
      SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
      SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
      SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END) as total_revenue
    FROM orders
  `;
  
  const result = await query(sql);
  return result[0];
};
