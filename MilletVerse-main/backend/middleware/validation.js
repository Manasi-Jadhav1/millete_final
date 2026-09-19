/**
 * Validation Middleware
 * Validates request body against expected fields
 */

/**
 * Validate required fields in request body
 * @param {Array} fields - Array of required field names
 */
export const validateFields = (fields) => {
  return (req, res, next) => {
    const missingFields = [];

    for (const field of fields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Validate email format
 */
export const validateEmail = (req, res, next) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (req.body.email && !emailRegex.test(req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  next();
};

/**
 * Validate password strength
 */
export const validatePassword = (req, res, next) => {
  const password = req.body.password;
  
  if (password && password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  next();
};

/**
 * Validate numeric fields
 * @param {Array} fields - Array of field names that should be numeric
 */
export const validateNumeric = (fields) => {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field] !== undefined && isNaN(Number(req.body[field]))) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid number`
        });
      }
    }
    next();
  };
};

/**
 * Validate enum values
 * @param {String} field - Field name to validate
 * @param {Array} allowedValues - Array of allowed values
 */
export const validateEnum = (field, allowedValues) => {
  return (req, res, next) => {
    if (req.body[field] && !allowedValues.includes(req.body[field])) {
      return res.status(400).json({
        success: false,
        message: `${field} must be one of: ${allowedValues.join(', ')}`
      });
    }
    next();
  };
};
