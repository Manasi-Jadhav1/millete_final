import { query } from '../config/database.js';

/**
 * Product Model
 * Handles all database operations related to products
 */

/**
 * Create a new product
 * @param {Object} productData - Product data object
 * @returns {Object} Created product
 */
export const createProduct = async (productData) => {
  const {
    name,
    description,
    ingredients,
    nutrition_info,
    price,
    millet_type,
    seller_id,
    image_url,
    stock_quantity = 0,
    is_featured = false
  } = productData;
  
  const sql = `
    INSERT INTO products (name, description, ingredients, nutrition_info, price, millet_type, seller_id, image_url, stock_quantity, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query(sql, [
    name, description, ingredients, nutrition_info, price, millet_type, seller_id, image_url, stock_quantity, is_featured
  ]);
  
  return await getProductById(result.insertId);
};

/**
 * Get product by ID
 * @param {Number} id - Product ID
 * @returns {Object} Product object
 */
export const getProductById = async (id) => {
  const sql = `
    SELECT p.*, u.name as seller_name, u.email as seller_email
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.id = ?
  `;
  
  const products = await query(sql, [id]);
  return products[0] || null;
};

/**
 * Get all products with filters
 * @param {Object} filters - Filter options
 * @returns {Array} Array of products
 */
export const getAllProducts = async (filters = {}) => {
  const {
    millet_type,
    seller_id,
    is_featured,
    is_available,
    search,
    min_price,
    max_price,
    sort = 'created_at',
    order = 'DESC',
    page = 1,
    limit = 12
  } = filters;
  
  let sql = `
    SELECT p.*, u.name as seller_name
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  // Apply filters
  if (millet_type) {
    sql += ' AND p.millet_type = ?';
    params.push(millet_type);
  }
  
  if (seller_id) {
    sql += ' AND p.seller_id = ?';
    params.push(seller_id);
  }
  
  if (is_featured !== undefined) {
    sql += ' AND p.is_featured = ?';
    params.push(is_featured);
  }
  
  if (is_available !== undefined) {
    sql += ' AND p.is_available = ?';
    params.push(is_available);
  }
  
  if (search) {
    sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.ingredients LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (min_price) {
    sql += ' AND p.price >= ?';
    params.push(min_price);
  }
  
  if (max_price) {
    sql += ' AND p.price <= ?';
    params.push(max_price);
  }
  
  // Sorting
  const allowedSorts = ['name', 'price', 'rating', 'created_at'];
  if (!allowedSorts.includes(sort)) {
    sort = 'created_at';
  }
  sql += ` ORDER BY p.${sort} ${order}`;
  
  // Pagination
  const offset = (page - 1) * limit;
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  return await query(sql, params);
};

/**
 * Get product count with filters
 * @param {Object} filters - Filter options
 * @returns {Number} Total count
 */
export const getProductCount = async (filters = {}) => {
  const { millet_type, seller_id, is_featured, is_available, search } = filters;
  
  let sql = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
  const params = [];
  
  if (millet_type) {
    sql += ' AND millet_type = ?';
    params.push(millet_type);
  }
  
  if (seller_id) {
    sql += ' AND seller_id = ?';
    params.push(seller_id);
  }
  
  if (is_featured !== undefined) {
    sql += ' AND is_featured = ?';
    params.push(is_featured);
  }
  
  if (is_available !== undefined) {
    sql += ' AND is_available = ?';
    params.push(is_available);
  }
  
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ? OR ingredients LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  const result = await query(sql, params);
  return result[0].count;
};

/**
 * Update product
 * @param {Number} id - Product ID
 * @param {Object} productData - Updated product data
 * @returns {Object} Updated product
 */
export const updateProduct = async (id, productData) => {
  const {
    name,
    description,
    ingredients,
    nutrition_info,
    price,
    millet_type,
    image_url,
    stock_quantity,
    is_featured,
    is_available
  } = productData;
  
  const sql = `
    UPDATE products
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        ingredients = COALESCE(?, ingredients),
        nutrition_info = COALESCE(?, nutrition_info),
        price = COALESCE(?, price),
        millet_type = COALESCE(?, millet_type),
        image_url = COALESCE(?, image_url),
        stock_quantity = COALESCE(?, stock_quantity),
        is_featured = COALESCE(?, is_featured),
        is_available = COALESCE(?, is_available)
    WHERE id = ?
  `;
  
  await query(sql, [
    name, description, ingredients, nutrition_info, price, millet_type, image_url, stock_quantity, is_featured, is_available, id
  ]);
  
  return await getProductById(id);
};

/**
 * Update product stock
 * @param {Number} id - Product ID
 * @param {Number} quantity - Quantity to adjust (negative for decrease)
 * @returns {Object} Updated product
 */
export const updateProductStock = async (id, quantity) => {
  const sql = `
    UPDATE products
    SET stock_quantity = stock_quantity + ?
    WHERE id = ?
  `;
  
  await query(sql, [quantity, id]);
  return await getProductById(id);
};

/**
 * Delete product
 * @param {Number} id - Product ID
 * @returns {Boolean} Success status
 */
export const deleteProduct = async (id) => {
  const sql = 'DELETE FROM products WHERE id = ?';
  const result = await query(sql, [id]);
  return result.affectedRows > 0;
};

/**
 * Get products by seller
 * @param {Number} sellerId - Seller ID
 * @returns {Array} Array of products
 */
export const getProductsBySeller = async (sellerId) => {
  const sql = `
    SELECT * FROM products
    WHERE seller_id = ?
    ORDER BY created_at DESC
  `;
  
  return await query(sql, [sellerId]);
};

/**
 * Get featured products
 * @param {Number} limit - Number of products to return
 * @returns {Array} Array of featured products
 */
export const getFeaturedProducts = async (limit = 8) => {
  const sql = `
    SELECT p.*, u.name as seller_name
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.is_featured = TRUE AND p.is_available = TRUE
    ORDER BY p.rating DESC, p.created_at DESC
    LIMIT ?
  `;
  
  return await query(sql, [limit]);
};

/**
 * Get products by millet type
 * @param {String} milletType - Millet type
 * @returns {Array} Array of products
 */
export const getProductsByMilletType = async (milletType) => {
  const sql = `
    SELECT p.*, u.name as seller_name
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.millet_type = ? AND p.is_available = TRUE
    ORDER BY p.rating DESC
  `;
  
  return await query(sql, [milletType]);
};

/**
 * Get product count by seller
 * @param {Number} sellerId - Seller ID
 * @returns {Number} Product count
 */
export const getProductCountBySeller = async (sellerId) => {
  const sql = 'SELECT COUNT(*) as count FROM products WHERE seller_id = ?';
  const result = await query(sql, [sellerId]);
  return result[0].count;
};

/**
 * Get total product count
 * @returns {Number} Total product count
 */
export const getTotalProductCount = async () => {
  const sql = 'SELECT COUNT(*) as count FROM products';
  const result = await query(sql);
  return result[0].count;
};
