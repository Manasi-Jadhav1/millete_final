import * as HealthProfile from '../models/HealthProfile.js';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/apiResponse.js';

/**
 * Health Guidance Controller
 * Handles health profiles and personalized recommendations
 */

/**
 * Create or update health profile
 * POST /api/health/profile
 */
export const createHealthProfile = async (req, res) => {
  try {
    const { age, weight, height, health_goal, dietary_preferences } = req.body;

    // Validate required fields
    if (!age || !weight) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Age and weight are required');
    }

    const profile = await HealthProfile.createHealthProfile({
      user_id: req.user.id,
      age: parseInt(age),
      weight: parseFloat(weight),
      height: height ? parseFloat(height) : null,
      health_goal: health_goal || 'general',
      dietary_preferences
    });

    successResponse(res, HTTP_STATUS.CREATED, 'Health profile saved successfully', profile);
  } catch (error) {
    console.error('Create health profile error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to create health profile', error.message);
  }
};

/**
 * Get user's health profile
 * GET /api/health/profile
 */
export const getHealthProfile = async (req, res) => {
  try {
    const profile = await HealthProfile.getHealthProfileByUserId(req.user.id);

    if (!profile) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Health profile not found. Please create one first.');
    }

    successResponse(res, HTTP_STATUS.OK, 'Health profile fetched successfully', profile);
  } catch (error) {
    console.error('Get health profile error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch health profile', error.message);
  }
};

/**
 * Update health profile
 * PUT /api/health/profile
 */
export const updateHealthProfile = async (req, res) => {
  try {
    const { age, weight, height, health_goal, dietary_preferences } = req.body;

    // Get existing profile
    const existingProfile = await HealthProfile.getHealthProfileByUserId(req.user.id);

    if (!existingProfile) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Health profile not found. Please create one first.');
    }

    const profile = await HealthProfile.updateHealthProfile(existingProfile.id, {
      age: age ? parseInt(age) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      health_goal,
      dietary_preferences
    });

    successResponse(res, HTTP_STATUS.OK, 'Health profile updated successfully', profile);
  } catch (error) {
    console.error('Update health profile error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update health profile', error.message);
  }
};

/**
 * Get personalized recommendations
 * GET /api/health/recommendations
 */
export const getRecommendations = async (req, res) => {
  try {
    // Get user's health profile
    let profile = await HealthProfile.getHealthProfileByUserId(req.user.id);
    
    let healthGoal = 'general';
    
    if (profile) {
      healthGoal = profile.health_goal;
    } else if (req.query.health_goal) {
      // Allow temporary health goal from query param
      healthGoal = req.query.health_goal;
    }

    // Get recommended products
    const recommendedProducts = await HealthProfile.getRecommendedProducts(healthGoal);

    // Get recommended recipes
    const recommendedRecipes = await HealthProfile.getRecommendedRecipes(healthGoal);

    // Get health tips based on goal
    const healthTips = getHealthTips(healthGoal);

    successResponse(res, HTTP_STATUS.OK, 'Recommendations fetched successfully', {
      health_goal: healthGoal,
      products: recommendedProducts,
      recipes: recommendedRecipes,
      tips: healthTips
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch recommendations', error.message);
  }
};

/**
 * Get recommendations without authentication (using query params)
 * GET /api/health/recommendations/public
 */
export const getPublicRecommendations = async (req, res) => {
  try {
    const { health_goal, age, weight, height } = req.query;

    if (!health_goal) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Health goal is required');
    }

    // Get recommended products
    const recommendedProducts = await HealthProfile.getRecommendedProducts(health_goal);

    // Get recommended recipes
    const recommendedRecipes = await HealthProfile.getRecommendedRecipes(health_goal);

    // Get health tips
    const healthTips = getHealthTips(health_goal);

    // Calculate BMI if weight and height provided
    let bmiInfo = null;
    if (weight && height) {
      bmiInfo = HealthProfile.getBMICategory(parseFloat(weight), parseFloat(height));
    }

    successResponse(res, HTTP_STATUS.OK, 'Recommendations fetched successfully', {
      health_goal,
      bmi: bmiInfo,
      products: recommendedProducts,
      recipes: recommendedRecipes,
      tips: healthTips
    });
  } catch (error) {
    console.error('Get public recommendations error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch recommendations', error.message);
  }
};

/**
 * Calculate BMI
 * POST /api/health/bmi
 */
export const calculateBMI = async (req, res) => {
  try {
    const { weight, height } = req.body;

    if (!weight || !height) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Weight and height are required');
    }

    const bmiInfo = HealthProfile.getBMICategory(parseFloat(weight), parseFloat(height));

    successResponse(res, HTTP_STATUS.OK, 'BMI calculated successfully', bmiInfo);
  } catch (error) {
    console.error('Calculate BMI error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to calculate BMI', error.message);
  }
};

/**
 * Get health statistics (admin only)
 * GET /api/health/stats
 */
export const getHealthStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Only admins can access health statistics');
    }

    const stats = await HealthProfile.getHealthProfileStats();

    successResponse(res, HTTP_STATUS.OK, 'Health statistics fetched successfully', stats);
  } catch (error) {
    console.error('Get health stats error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch health statistics', error.message);
  }
};

/**
 * Helper function to get health tips based on goal
 */
function getHealthTips(healthGoal) {
  const tips = {
    weight_loss: [
      'Choose high-fiber millet options like ragi and jowar for sustained fullness',
      'Pair millets with protein-rich foods for better satiety',
      'Avoid adding excess sugar or ghee to millet dishes',
      'Eat smaller, frequent meals throughout the day',
      'Stay hydrated and exercise regularly'
    ],
    diabetes_friendly: [
      'Choose low-GI millets like bajra and foxtail millet',
      'Combine millets with vegetables and lean proteins',
      'Avoid processed millet products with added sugars',
      'Monitor portion sizes even with healthy foods',
      'Eat at regular intervals to maintain blood sugar levels'
    ],
    fitness: [
      'Include protein-rich ragi in your post-workout meals',
      'Combine millets with nuts and seeds for extra protein',
      'Eat millet-based carbs before workouts for sustained energy',
      'Stay hydrated and maintain a balanced diet',
      'Consider millet-based energy balls for pre-workout snacks'
    ],
    general: [
      'Include a variety of millets in your weekly diet',
      'Start with one millet-based meal per day',
      'Choose whole millets over refined flour products',
      'Combine millets with vegetables, pulses, and healthy fats',
      'Drink plenty of water and maintain an active lifestyle'
    ]
  };

  return tips[healthGoal] || tips.general;
}
