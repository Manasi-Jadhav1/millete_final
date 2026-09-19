import express from 'express';
import {
  createHealthProfile,
  getHealthProfile,
  updateHealthProfile,
  getRecommendations,
  getPublicRecommendations,
  calculateBMI,
  getHealthStats
} from '../controllers/healthController.js';
import { authenticate } from '../middleware/auth.js';
import { validateFields, validateNumeric } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/health/profile
 * @desc    Create or update health profile
 * @access  Private
 */
router.post('/profile',
  authenticate,
  validateFields(['age', 'weight']),
  validateNumeric(['age', 'weight', 'height']),
  createHealthProfile
);

/**
 * @route   GET /api/health/profile
 * @desc    Get user's health profile
 * @access  Private
 */
router.get('/profile', authenticate, getHealthProfile);

/**
 * @route   PUT /api/health/profile
 * @desc    Update health profile
 * @access  Private
 */
router.put('/profile',
  authenticate,
  validateNumeric(['age', 'weight', 'height']),
  updateHealthProfile
);

/**
 * @route   GET /api/health/recommendations
 * @desc    Get personalized recommendations
 * @access  Private
 */
router.get('/recommendations', authenticate, getRecommendations);

/**
 * @route   GET /api/health/recommendations/public
 * @desc    Get recommendations without authentication
 * @access  Public
 */
router.get('/recommendations/public', getPublicRecommendations);

/**
 * @route   POST /api/health/bmi
 * @desc    Calculate BMI
 * @access  Public
 */
router.post('/bmi',
  validateFields(['weight', 'height']),
  validateNumeric(['weight', 'height']),
  calculateBMI
);

/**
 * @route   GET /api/health/stats
 * @desc    Get health statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticate, getHealthStats);

export default router;
