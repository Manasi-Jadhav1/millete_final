import { query } from '../config/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/authUtils.js';

/**
 * User Model
 * Handles all database operations related to users
 */

/**
 * Create a new user
 * @param {Object} userData - User data object
 * @returns {Object} Created user (without password)
 */
export const createUser = async (userData) => {
  const { name, email, password, role = 'user', phone = null, address = null } = userData;
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  const sql = `
    INSERT INTO users (name, email, password, role, phone, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query(sql, [name, email, hashedPassword, role, phone, address]);
  
  // Get created user
  const user = await getUserById(result.insertId);
  return user;
};

/**
 * Get user by ID
 * @param {Number} id - User ID
 * @returns {Object} User object
 */
export const getUserById = async (id) => {
  const sql = `
    SELECT id, name, email, role, phone, address, is_approved, created_at, updated_at
    FROM users
    WHERE id = ?
  `;
  
  const users = await query(sql, [id]);
  return users[0] || null;
};

/**
 * Get user by email (includes password for authentication)
 * @param {String} email - User email
 * @returns {Object} User object with password
 */
export const getUserByEmail = async (email) => {
  const sql = `
    SELECT id, name, email, password, role, phone, address, is_approved, created_at, updated_at
    FROM users
    WHERE email = ?
  `;
  
  const users = await query(sql, [email]);
  return users[0] || null;
};

/**
 * Get all users (with optional role filter)
 * @param {String} role - Optional role filter
 * @returns {Array} Array of users
 */
export const getAllUsers = async (role = null) => {
  let sql = `
    SELECT id, name, email, role, phone, address, is_approved, created_at, updated_at
    FROM users
  `;
  const params = [];
  
  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  
  return await query(sql, params);
};

/**
 * Update user
 * @param {Number} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Object} Updated user
 */
export const updateUser = async (id, userData) => {
  const { name, phone, address, is_approved } = userData;
  
  const sql = `
    UPDATE users
    SET name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        is_approved = COALESCE(?, is_approved)
    WHERE id = ?
  `;
  
  await query(sql, [name, phone, address, is_approved, id]);
  return await getUserById(id);
};

/**
 * Update user password
 * @param {Number} id - User ID
 * @param {String} newPassword - New password
 * @returns {Boolean} Success status
 */
export const updatePassword = async (id, newPassword) => {
  const hashedPassword = await hashPassword(newPassword);
  
  const sql = `
    UPDATE users
    SET password = ?
    WHERE id = ?
  `;
  
  await query(sql, [hashedPassword, id]);
  return true;
};

/**
 * Delete user
 * @param {Number} id - User ID
 * @returns {Boolean} Success status
 */
export const deleteUser = async (id) => {
  const sql = 'DELETE FROM users WHERE id = ?';
  const result = await query(sql, [id]);
  return result.affectedRows > 0;
};

/**
 * Authenticate user (login)
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} User data with token
 */
export const authenticateUser = async (email, password) => {
  // Get user with password
  const user = await getUserByEmail(email);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Verify password
  const isMatch = await comparePassword(password, user.password);
  
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }
  
  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  
  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });
  
  return {
    user: userWithoutPassword,
    token
  };
};

/**
 * Get user count
 * @returns {Number} Total user count
 */
export const getUserCount = async () => {
  const sql = 'SELECT COUNT(*) as count FROM users';
  const result = await query(sql);
  return result[0].count;
};

/**
 * Get sellers pending approval
 * @returns {Array} Array of pending sellers
 */
export const getPendingSellers = async () => {
  const sql = `
    SELECT id, name, email, phone, address, created_at
    FROM users
    WHERE role = 'seller' AND is_approved = FALSE
  `;
  return await query(sql);
};
