import express from 'express';
import {
  getAllLearningContent,
  getLearningContentById,
  getMilletTypes,
  getRecipes,
  getTutorials,
  getHealthBenefits,
  getFeaturedContent,
  createLearningContent,
  updateLearningContent,
  deleteLearningContent,
  rateContent,
  getContentStats
} from '../controllers/learningController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateFields } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/learning
 * @desc    Get all learning content with filters
 * @access  Public
 */
router.get('/', getAllLearningContent);

/**
 * @route   GET /api/learning/stats
 * @desc    Get content statistics
 * @access  Public
 */
router.get('/stats', getContentStats);

/**
 * @route   GET /api/learning/featured
 * @desc    Get featured content
 * @access  Public
 */
router.get('/featured', getFeaturedContent);

/**
 * @route   GET /api/learning/millet-types
 * @desc    Get all millet types
 * @access  Public
 */
router.get('/millet-types', getMilletTypes);

/**
 * @route   GET /api/learning/recipes
 * @desc    Get recipes
 * @access  Public
 */
router.get('/recipes', getRecipes);

/**
 * @route   GET /api/learning/tutorials
 * @desc    Get tutorials
 * @access  Public
 */
router.get('/tutorials', getTutorials);

/**
 * @route   GET /api/learning/health-benefits
 * @desc    Get health benefits content
 * @access  Public
 */
router.get('/health-benefits', getHealthBenefits);

/**
 * @route   GET /api/learning/:id
 * @desc    Get learning content by ID
 * @access  Public
 */
router.get('/:id', getLearningContentById);

/**
 * @route   POST /api/learning
 * @desc    Create learning content
 * @access  Private (Admin only)
 */
router.post('/',
  authenticate,
  authorize('admin'),
  validateFields(['title', 'description', 'category']),
  createLearningContent
);

/**
 * @route   PUT /api/learning/:id
 * @desc    Update learning content
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticate,
  authorize('admin'),
  updateLearningContent
);

/**
 * @route   POST /api/learning/:id/rate
 * @desc    Rate learning content
 * @access  Public
 */
router.post('/:id/rate', rateContent);

/**
 * @route   DELETE /api/learning/:id
 * @desc    Delete learning content
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  authorize('admin'),
  deleteLearningContent
);

export default router;
