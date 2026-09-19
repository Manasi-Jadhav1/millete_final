import { query } from '../config/database.js';

/**
 * Learning Content Model
 * Handles all database operations related to learning content
 */

/**
 * Create learning content
 * @param {Object} contentData - Content data object
 * @returns {Object} Created content
 */
export const createLearningContent = async (contentData) => {
  const {
    title,
    description,
    category,
    subcategory,
    image_url,
    content,
    author_id
  } = contentData;
  
  const sql = `
    INSERT INTO learning_content (title, description, category, subcategory, image_url, content, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query(sql, [title, description, category, subcategory, image_url, content, author_id]);
  return await getLearningContentById(result.insertId);
};

/**
 * Get learning content by ID
 * @param {Number} id - Content ID
 * @returns {Object} Content object
 */
export const getLearningContentById = async (id) => {
  const sql = `
    SELECT lc.*, u.name as author_name
    FROM learning_content lc
    LEFT JOIN users u ON lc.author_id = u.id
    WHERE lc.id = ?
  `;
  
  const contents = await query(sql, [id]);
  
  // Increment views
  if (contents[0]) {
    await query('UPDATE learning_content SET views = views + 1 WHERE id = ?', [id]);
  }
  
  return contents[0] || null;
};

/**
 * Get all learning content with filters
 * @param {Object} filters - Filter options
 * @returns {Array} Array of content
 */
export const getAllLearningContent = async (filters = {}) => {
  const {
    category,
    subcategory,
    search,
    sort = 'created_at',
    order = 'DESC',
    page = 1,
    limit = 12
  } = filters;
  
  let sql = `
    SELECT lc.*, u.name as author_name
    FROM learning_content lc
    LEFT JOIN users u ON lc.author_id = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (category) {
    sql += ' AND lc.category = ?';
    params.push(category);
  }
  
  if (subcategory) {
    sql += ' AND lc.subcategory = ?';
    params.push(subcategory);
  }
  
  if (search) {
    sql += ' AND (lc.title LIKE ? OR lc.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  // Sorting
  const allowedSorts = ['title', 'views', 'rating', 'created_at'];
  if (!allowedSorts.includes(sort)) {
    sort = 'created_at';
  }
  sql += ` ORDER BY lc.${sort} ${order}`;
  
  // Pagination
  const offset = (page - 1) * limit;
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  return await query(sql, params);
};

/**
 * Get learning content count
 * @param {Object} filters - Filter options
 * @returns {Number} Total count
 */
export const getLearningContentCount = async (filters = {}) => {
  const { category, subcategory, search } = filters;
  
  let sql = 'SELECT COUNT(*) as count FROM learning_content WHERE 1=1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  
  if (subcategory) {
    sql += ' AND subcategory = ?';
    params.push(subcategory);
  }
  
  if (search) {
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  const result = await query(sql, params);
  return result[0].count;
};

/**
 * Update learning content
 * @param {Number} id - Content ID
 * @param {Object} contentData - Updated content data
 * @returns {Object} Updated content
 */
export const updateLearningContent = async (id, contentData) => {
  const {
    title,
    description,
    category,
    subcategory,
    image_url,
    content
  } = contentData;
  
  const sql = `
    UPDATE learning_content
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        subcategory = COALESCE(?, subcategory),
        image_url = COALESCE(?, image_url),
        content = COALESCE(?, content)
    WHERE id = ?
  `;
  
  await query(sql, [title, description, category, subcategory, image_url, content, id]);
  return await getLearningContentById(id);
};

/**
 * Delete learning content
 * @param {Number} id - Content ID
 * @returns {Boolean} Success status
 */
export const deleteLearningContent = async (id) => {
  const sql = 'DELETE FROM learning_content WHERE id = ?';
  const result = await query(sql, [id]);
  return result.affectedRows > 0;
};

/**
 * Get content by category
 * @param {String} category - Category name
 * @param {Number} limit - Number of items to return
 * @returns {Array} Array of content
 */
export const getContentByCategory = async (category, limit = 10) => {
  const sql = `
    SELECT * FROM learning_content
    WHERE category = ?
    ORDER BY rating DESC, views DESC
    LIMIT ?
  `;
  
  return await query(sql, [category, limit]);
};

/**
 * Get featured/featured content
 * @param {Number} limit - Number of items to return
 * @returns {Array} Array of featured content
 */
export const getFeaturedContent = async (limit = 6) => {
  const sql = `
    SELECT * FROM learning_content
    WHERE rating > 0
    ORDER BY rating DESC, views DESC
    LIMIT ?
  `;
  
  return await query(sql, [limit]);
};

/**
 * Get millet types content
 * @returns {Array} Array of millet type content
 */
export const getMilletTypes = async () => {
  return await getContentByCategory('millet_type', 10);
};

/**
 * Get recipes
 * @param {Number} limit - Number of recipes to return
 * @returns {Array} Array of recipes
 */
export const getRecipes = async (limit = 8) => {
  return await getContentByCategory('recipe', limit);
};

/**
 * Get tutorials
 * @param {Number} limit - Number of tutorials to return
 * @returns {Array} Array of tutorials
 */
export const getTutorials = async (limit = 8) => {
  return await getContentByCategory('tutorial', limit);
};

/**
 * Get health benefits content
 * @param {Number} limit - Number of items to return
 * @returns {Array} Array of health benefits content
 */
export const getHealthBenefits = async (limit = 8) => {
  return await getContentByCategory('health_benefit', limit);
};

/**
 * Rate learning content
 * @param {Number} id - Content ID
 * @param {Number} rating - Rating (1-5)
 * @returns {Object} Updated content
 */
export const rateContent = async (id, rating) => {
  // Calculate new average rating
  const content = await getLearningContentById(id);
  
  if (!content) {
    throw new Error('Content not found');
  }
  
  const newRating = ((content.rating * content.views) + rating) / (content.views + 1);
  
  const sql = `
    UPDATE learning_content
    SET rating = ?
    WHERE id = ?
  `;
  
  await query(sql, [newRating, id]);
  return await getLearningContentById(id);
};

/**
 * Get learning content count by category
 * @returns {Object} Count by category
 */
export const getContentCountByCategory = async () => {
  const sql = `
    SELECT category, COUNT(*) as count
    FROM learning_content
    GROUP BY category
  `;
  
  const results = await query(sql);
  const countByCategory = {};
  
  results.forEach(row => {
    countByCategory[row.category] = row.count;
  });
  
  return countByCategory;
};
