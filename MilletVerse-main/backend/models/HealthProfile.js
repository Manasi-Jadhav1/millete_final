import { query } from '../config/database.js';

/**
 * Health Profile Model
 * Handles all database operations related to user health profiles
 */

/**
 * Create health profile
 * @param {Object} profileData - Profile data object
 * @returns {Object} Created profile
 */
export const createHealthProfile = async (profileData) => {
  const {
    user_id,
    age,
    weight,
    height,
    health_goal = 'general',
    dietary_preferences
  } = profileData;
  
  // Check if profile already exists
  const existing = await getHealthProfileByUserId(user_id);
  
  if (existing) {
    return await updateHealthProfile(existing.id, profileData);
  }
  
  const sql = `
    INSERT INTO health_profiles (user_id, age, weight, height, health_goal, dietary_preferences)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query(sql, [user_id, age, weight, height, health_goal, dietary_preferences]);
  return await getHealthProfileById(result.insertId);
};

/**
 * Get health profile by ID
 * @param {Number} id - Profile ID
 * @returns {Object} Profile object
 */
export const getHealthProfileById = async (id) => {
  const sql = `
    SELECT * FROM health_profiles
    WHERE id = ?
  `;
  
  const profiles = await query(sql, [id]);
  return profiles[0] || null;
};

/**
 * Get health profile by user ID
 * @param {Number} userId - User ID
 * @returns {Object} Profile object
 */
export const getHealthProfileByUserId = async (userId) => {
  const sql = `
    SELECT * FROM health_profiles
    WHERE user_id = ?
  `;
  
  const profiles = await query(sql, [userId]);
  return profiles[0] || null;
};

/**
 * Update health profile
 * @param {Number} id - Profile ID
 * @param {Object} profileData - Updated profile data
 * @returns {Object} Updated profile
 */
export const updateHealthProfile = async (id, profileData) => {
  const {
    age,
    weight,
    height,
    health_goal,
    dietary_preferences
  } = profileData;
  
  const sql = `
    UPDATE health_profiles
    SET age = COALESCE(?, age),
        weight = COALESCE(?, weight),
        height = COALESCE(?, height),
        health_goal = COALESCE(?, health_goal),
        dietary_preferences = COALESCE(?, dietary_preferences)
    WHERE id = ?
  `;
  
  await query(sql, [age, weight, height, health_goal, dietary_preferences, id]);
  return await getHealthProfileById(id);
};

/**
 * Delete health profile
 * @param {Number} id - Profile ID
 * @returns {Boolean} Success status
 */
export const deleteHealthProfile = async (id) => {
  const sql = 'DELETE FROM health_profiles WHERE id = ?';
  const result = await query(sql, [id]);
  return result.affectedRows > 0;
};

/**
 * Get health recommendations based on goal
 * This calls the stored procedure for recommendations
 * @param {String} healthGoal - Health goal
 * @returns {Array} Recommended products
 */
export const getHealthRecommendations = async (healthGoal) => {
  // Map frontend health goals to database values
  const goalMap = {
    'weight_loss': 'weight_loss',
    'diabetes_friendly': 'diabetes_friendly',
    'fitness': 'fitness',
    'general': 'general'
  };
  
  const goal = goalMap[healthGoal] || 'general';
  
  // Call stored procedure
  const sql = 'CALL get_health_recommendations(?)';
  const results = await query(sql, [goal]);
  
  // Stored procedure returns array of arrays
  return results[0] || [];
};

/**
 * Helper to parse nutrition string into an object
 * @param {String} nutritionStr - e.g. "Per 100g: Calories 420, Protein 8g, Carbs 65g, Fat 12g, Fiber 10g, Calcium 150mg"
 */
const parseNutrition = (nutritionStr) => {
  if (!nutritionStr) return {};
  const data = {};
  const metrics = ['Calories', 'Protein', 'Carbs', 'Fat', 'Fiber', 'Calcium', 'Iron', 'Magnesium'];
  
  metrics.forEach(metric => {
    const regex = new RegExp(`${metric}\\s+(\\d+(\\.\\d+)?)`, 'i');
    const match = nutritionStr.match(regex);
    if (match) {
      data[metric.toLowerCase()] = parseFloat(match[1]);
    }
  });
  return data;
};

/**
 * Calculate compatibility score (0-100) based on goal and nutrition
 */
const calculateNutritionScore = (goal, nutrition) => {
  let score = 70; // Base score
  
  if (!nutrition || Object.keys(nutrition).length === 0) return score;

  switch (goal) {
    case 'weight_loss':
      if (nutrition.fiber > 8) score += 15;
      if (nutrition.calories < 400) score += 10;
      if (nutrition.fat > 15) score -= 10;
      break;
    case 'diabetes_friendly':
      if (nutrition.fiber > 10) score += 20;
      if (nutrition.carbs < 60) score += 10;
      break;
    case 'fitness':
      if (nutrition.protein > 10) score += 20;
      if (nutrition.calories > 400) score += 5;
      break;
    case 'general':
      if (nutrition.calcium > 100 || nutrition.iron > 5) score += 10;
      break;
  }

  return Math.min(100, Math.max(0, score));
};

/**
 * Get recommended products based on health goal with nutrition scoring
 * @param {String} healthGoal - Health goal
 * @returns {Array} Recommended products with scores
 */
export const getRecommendedProducts = async (healthGoal) => {
  let milletTypes = [];
  
  // Define recommendations based on health goal
  switch (healthGoal) {
    case 'weight_loss':
      milletTypes = ['ragi', 'jowar', 'barnyard', 'mixed'];
      break;
    case 'diabetes_friendly':
      milletTypes = ['bajra', 'foxtail', 'little', 'kodo'];
      break;
    case 'fitness':
      milletTypes = ['ragi', 'mixed', 'jowar', 'proso'];
      break;
    default:
      milletTypes = ['ragi', 'jowar', 'bajra', 'foxtail', 'mixed'];
  }
  
  // Build query with dynamic millet types
  const placeholders = milletTypes.map(() => '?').join(',');
  const sql = `
    SELECT p.*, u.name as seller_name
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.millet_type IN (${placeholders})
    AND p.is_available = TRUE
    ORDER BY p.rating DESC
    LIMIT 15
  `;
  
  const products = await query(sql, milletTypes);
  
  // Apply nutrition scoring and ensure UNIQUE images
  const seenImages = new Set();
  const productsWithScores = [];

  for (const product of products) {
    // If we've seen this image, skip it to ensure visual diversity
    if (seenImages.has(product.image_url)) continue;
    seenImages.add(product.image_url);

    const nutrition = parseNutrition(product.nutrition_info);
    const score = calculateNutritionScore(healthGoal, nutrition);
    
    // Add reasoning
    let reason = 'Balanced nutrition profile for general health.';
    if (healthGoal === 'weight_loss' && nutrition.fiber > 8) reason = 'High fiber content aids in weight management.';
    if (healthGoal === 'diabetes_friendly' && nutrition.fiber > 10) reason = 'Exceptional fiber content helps maintain steady blood sugar.';
    if (healthGoal === 'fitness' && nutrition.protein > 10) reason = 'Superior protein content for muscle recovery.';

    productsWithScores.push({
      ...product,
      compatibility_score: score,
      recommendation_reason: reason
    });
  }

  // Sort by score
  return productsWithScores.sort((a, b) => b.compatibility_score - a.compatibility_score).slice(0, 10);
};

/**
 * Get recommended recipes based on health goal
 * @param {String} healthGoal - Health goal
 * @returns {Array} Recommended recipes
 */
export const getRecommendedRecipes = async (healthGoal) => {
  let subcategories = [];
  
  // Define recipe recommendations based on health goal
  switch (healthGoal) {
    case 'weight_loss':
      subcategories = ['snack', 'breakfast'];
      break;
    case 'diabetes_friendly':
      subcategories = ['snack', 'bread'];
      break;
    case 'fitness':
      subcategories = ['snack', 'breakfast', 'cookies'];
      break;
    default:
      subcategories = ['cookies', 'bread', 'snack', 'breakfast'];
  }
  
  // Build query with dynamic subcategories
  const placeholders = subcategories.map(() => '?').join(',');
  const sql = `
    SELECT * FROM learning_content
    WHERE category = 'recipe'
    ${subcategories.length > 0 ? `AND subcategory IN (${placeholders})` : ''}
    ORDER BY rating DESC, views DESC
    LIMIT 6
  `;
  
  const params = subcategories.length > 0 ? subcategories : [];
  return await query(sql, params);
};

/**
 * Get BMI category
 * @param {Number} weight - Weight in kg
 * @param {Number} height - Height in cm
 * @returns {Object} BMI and category
 */
export const getBMICategory = (weight, height) => {
  const heightInMeters = height / 100;
  const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
  
  let category = '';
  if (bmi < 18.5) {
    category = 'Underweight';
  } else if (bmi < 25) {
    category = 'Normal weight';
  } else if (bmi < 30) {
    category = 'Overweight';
  } else {
    category = 'Obese';
  }
  
  return { bmi, category };
};

/**
 * Get health profile statistics
 * @returns {Object} Statistics
 */
export const getHealthProfileStats = async () => {
  const sql = `
    SELECT 
      COUNT(*) as total_profiles,
      AVG(age) as avg_age,
      AVG(weight) as avg_weight,
      COUNT(CASE WHEN health_goal = 'weight_loss' THEN 1 END) as weight_loss_count,
      COUNT(CASE WHEN health_goal = 'diabetes_friendly' THEN 1 END) as diabetes_count,
      COUNT(CASE WHEN health_goal = 'fitness' THEN 1 END) as fitness_count,
      COUNT(CASE WHEN health_goal = 'general' THEN 1 END) as general_count
    FROM health_profiles
  `;
  
  const result = await query(sql);
  return result[0];
};
