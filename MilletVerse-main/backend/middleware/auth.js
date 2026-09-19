import jwt from 'jsonwebtoken';
import { errorResponse, HTTP_STATUS } from '../utils/apiResponse.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'No token provided');
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Token expired');
    }
    return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
  }
};

/**
 * Role Authorization Middleware
 * Checks if user has required role
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to access this resource');
    }

    next();
  };
};

/**
 * Optional Authentication
 * Attaches user if token exists but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
};
