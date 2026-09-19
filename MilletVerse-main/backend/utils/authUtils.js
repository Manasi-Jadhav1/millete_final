import jwt from 'jsonwebtoken';

/**
 * Generate JWT Token
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT Token
 */
export const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Verify JWT Token
 * @param {String} token - JWT Token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Hash Password using bcrypt
 * @param {String} password - Plain text password
 * @returns {Promise<String>} Hashed password
 */
export const hashPassword = async (password) => {
  const bcrypt = (await import('bcrypt')).default;
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare Password with hash
 * @param {String} password - Plain text password
 * @param {String} hashedPassword - Hashed password
 * @returns {Promise<Boolean>} True if match
 */
export const comparePassword = async (password, hashedPassword) => {
  const bcrypt = (await import('bcrypt')).default;
  return await bcrypt.compare(password, hashedPassword);
};
