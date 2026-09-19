import {
  createUser,
  getUserByEmail,
  authenticateUser,
  updateUser,
  getUserById
} from '../models/User.js';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/apiResponse.js';

/**
 * Auth Controller
 * Handles user authentication (register, login, logout, profile)
 */

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return errorResponse(res, HTTP_STATUS.CONFLICT, 'User with this email already exists');
    }

    // Map roles: 'startup' and 'farmer' from frontend become 'seller' in DB
    let dbRole = role || 'user';
    if (dbRole === 'startup' || dbRole === 'farmer') {
      dbRole = 'seller';
    }

    // Create user
    const user = await createUser({
      name,
      email,
      password,
      role: dbRole,
      phone,
      address
    });

    // Remove sensitive data from response
    const { password: _, ...userWithoutPassword } = user;

    successResponse(res, HTTP_STATUS.CREATED, 'User registered successfully', userWithoutPassword);
  } catch (error) {
    console.error('Register error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to register user', error.message);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
    }

    // Authenticate user
    const result = await authenticateUser(email, password);

    // Set cookie (optional)
    res.cookie('token', result.token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    successResponse(res, HTTP_STATUS.OK, 'Login successful', {
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid email or password') {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, error.message);
    }
    
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to login', error.message);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // Clear cookie
    res.clearCookie('token');

    successResponse(res, HTTP_STATUS.OK, 'Logout successful', null);
  } catch (error) {
    console.error('Logout error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to logout', error.message);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    successResponse(res, HTTP_STATUS.OK, 'Profile fetched successfully', user);
  } catch (error) {
    console.error('Get profile error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch profile', error.message);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await updateUser(req.user.id, {
      name,
      phone,
      address
    });

    successResponse(res, HTTP_STATUS.OK, 'Profile updated successfully', user);
  } catch (error) {
    console.error('Update profile error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update profile', error.message);
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await getUserByEmail(req.user.email);

    // Verify current password
    const bcrypt = (await import('bcrypt')).default;
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await updateUser(req.user.id, { password: hashedPassword });

    successResponse(res, HTTP_STATUS.OK, 'Password changed successfully', null);
  } catch (error) {
    console.error('Change password error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to change password', error.message);
  }
};
