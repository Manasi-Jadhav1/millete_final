import * as LearningContent from '../models/LearningContent.js';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/apiResponse.js';

/**
 * Learning Content Controller
 * Handles all learning content operations (millets info, recipes, tutorials)
 */

/**
 * Get all learning content with filters
 * GET /api/learning
 */
export const getAllLearningContent = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      search,
      sort,
      order,
      page,
      limit
    } = req.query;

    const filters = {
      category,
      subcategory,
      search,
      sort,
      order,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12
    };

    const content = await LearningContent.getAllLearningContent(filters);
    const total = await LearningContent.getLearningContentCount(filters);

    successResponse(res, HTTP_STATUS.OK, 'Content fetched successfully', {
      content,
      pagination: {
        current_page: filters.page,
        total_items: total,
        items_per_page: filters.limit,
        total_pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    console.error('Get all learning content error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch content', error.message);
  }
};

/**
 * Get learning content by ID
 * GET /api/learning/:id
 */
export const getLearningContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await LearningContent.getLearningContentById(id);

    if (!content) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Content not found');
    }

    successResponse(res, HTTP_STATUS.OK, 'Content fetched successfully', content);
  } catch (error) {
    console.error('Get learning content error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch content', error.message);
  }
};

/**
 * Get millet types
 * GET /api/learning/millet-types
 */
export const getMilletTypes = async (req, res) => {
  try {
    const millets = await LearningContent.getMilletTypes();

    successResponse(res, HTTP_STATUS.OK, 'Millet types fetched successfully', millets);
  } catch (error) {
    console.error('Get millet types error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch millet types', error.message);
  }
};

/**
 * Get recipes
 * GET /api/learning/recipes
 */
export const getRecipes = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const recipes = await LearningContent.getRecipes(parseInt(limit));

    successResponse(res, HTTP_STATUS.OK, 'Recipes fetched successfully', recipes);
  } catch (error) {
    console.error('Get recipes error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch recipes', error.message);
  }
};

/**
 * Get tutorials
 * GET /api/learning/tutorials
 */
export const getTutorials = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const tutorials = await LearningContent.getTutorials(parseInt(limit));

    successResponse(res, HTTP_STATUS.OK, 'Tutorials fetched successfully', tutorials);
  } catch (error) {
    console.error('Get tutorials error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch tutorials', error.message);
  }
};

/**
 * Get health benefits
 * GET /api/learning/health-benefits
 */
export const getHealthBenefits = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const benefits = await LearningContent.getHealthBenefits(parseInt(limit));

    successResponse(res, HTTP_STATUS.OK, 'Health benefits fetched successfully', benefits);
  } catch (error) {
    console.error('Get health benefits error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch health benefits', error.message);
  }
};

/**
 * Get featured content
 * GET /api/learning/featured
 */
export const getFeaturedContent = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const content = await LearningContent.getFeaturedContent(parseInt(limit));

    successResponse(res, HTTP_STATUS.OK, 'Featured content fetched successfully', content);
  } catch (error) {
    console.error('Get featured content error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch featured content', error.message);
  }
};

/**
 * Create learning content
 * POST /api/learning
 */
export const createLearningContent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      image_url,
      content
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Title, description, and category are required');
    }

    // Only admin can create content
    if (req.user.role !== 'admin') {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Only admins can create learning content');
    }

    const newContent = await LearningContent.createLearningContent({
      title,
      description,
      category,
      subcategory,
      image_url,
      content,
      author_id: req.user.id
    });

    successResponse(res, HTTP_STATUS.CREATED, 'Content created successfully', newContent);
  } catch (error) {
    console.error('Create learning content error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to create content', error.message);
  }
};

/**
 * Update learning content
 * PUT /api/learning/:id
 */
export const updateLearningContent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if content exists
    const existingContent = await LearningContent.getLearningContentById(id);
    if (!existingContent) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Content not found');
    }

    // Only admin can update content
    if (req.user.role !== 'admin') {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Only admins can update learning content');
    }

    const updatedContent = await LearningContent.updateLearningContent(id, updateData);

    successResponse(res, HTTP_STATUS.OK, 'Content updated successfully', updatedContent);
  } catch (error) {
    console.error('Update learning content error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update content', error.message);
  }
};

/**
 * Delete learning content
 * DELETE /api/learning/:id
 */
export const deleteLearningContent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if content exists
    const existingContent = await LearningContent.getLearningContentById(id);
    if (!existingContent) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Content not found');
    }

    // Only admin can delete content
    if (req.user.role !== 'admin') {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Only admins can delete learning content');
    }

    await LearningContent.deleteLearningContent(id);

    successResponse(res, HTTP_STATUS.OK, 'Content deleted successfully', null);
  } catch (error) {
    console.error('Delete learning content error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to delete content', error.message);
  }
};

/**
 * Rate learning content
 * POST /api/learning/:id/rate
 */
export const rateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Rating must be between 1 and 5');
    }

    const updatedContent = await LearningContent.rateContent(id, rating);

    successResponse(res, HTTP_STATUS.OK, 'Content rated successfully', updatedContent);
  } catch (error) {
    console.error('Rate content error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to rate content', error.message);
  }
};

/**
 * Get content count by category
 * GET /api/learning/stats
 */
export const getContentStats = async (req, res) => {
  try {
    const stats = await LearningContent.getContentCountByCategory();

    successResponse(res, HTTP_STATUS.OK, 'Stats fetched successfully', stats);
  } catch (error) {
    console.error('Get content stats error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch stats', error.message);
  }
};
