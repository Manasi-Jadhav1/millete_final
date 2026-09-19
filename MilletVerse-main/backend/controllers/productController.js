import * as Product from '../models/Product.js';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/apiResponse.js';

/**
 * Product Controller
 * Handles all product-related operations
 */

/**
 * Get all products with filters
 * GET /api/products
 */
export const getAllProducts = async (req, res) => {
  try {
    const {
      millet_type,
      seller_id,
      is_featured,
      is_available,
      search,
      min_price,
      max_price,
      sort,
      order,
      page,
      limit
    } = req.query;

    const filters = {
      millet_type,
      seller_id: seller_id ? parseInt(seller_id) : null,
      is_featured: is_featured !== undefined ? is_featured === 'true' : undefined,
      is_available: is_available !== undefined ? is_available === 'true' : undefined,
      search,
      min_price: min_price ? parseFloat(min_price) : null,
      max_price: max_price ? parseFloat(max_price) : null,
      sort,
      order,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12
    };

    const products = await Product.getAllProducts(filters);
    const total = await Product.getProductCount(filters);

    successResponse(res, HTTP_STATUS.OK, 'Products fetched successfully', {
      products,
      pagination: {
        current_page: filters.page,
        total_items: total,
        items_per_page: filters.limit,
        total_pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch products', error.message);
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.getProductById(id);

    if (!product) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Product not found');
    }

    successResponse(res, HTTP_STATUS.OK, 'Product fetched successfully', product);
  } catch (error) {
    console.error('Get product error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch product', error.message);
  }
};

/**
 * Get featured products
 * GET /api/products/featured
 */
export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const products = await Product.getFeaturedProducts(parseInt(limit));

    successResponse(res, HTTP_STATUS.OK, 'Featured products fetched successfully', products);
  } catch (error) {
    console.error('Get featured products error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch featured products', error.message);
  }
};

/**
 * Get products by millet type
 * GET /api/products/millet/:type
 */
export const getProductsByMilletType = async (req, res) => {
  try {
    const { type } = req.params;
    const products = await Product.getProductsByMilletType(type);

    successResponse(res, HTTP_STATUS.OK, 'Products fetched successfully', products);
  } catch (error) {
    console.error('Get products by millet type error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch products', error.message);
  }
};

/**
 * Get products by seller
 * GET /api/products/seller/:sellerId
 */
export const getProductsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const products = await Product.getProductsBySeller(sellerId);

    successResponse(res, HTTP_STATUS.OK, 'Products fetched successfully', products);
  } catch (error) {
    console.error('Get products by seller error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch products', error.message);
  }
};

/**
 * Create a new product
 * POST /api/products
 */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      ingredients,
      nutrition_info,
      price,
      millet_type,
      image_url,
      stock_quantity = 0,
      is_featured
    } = req.body;

    // Validate required fields
    if (!name || !description || price === undefined || !millet_type) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Name, description, price, and millet_type are required');
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Price must be a valid positive number');
    }

    const parsedStock = parseInt(stock_quantity);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Stock quantity must be a valid non-negative number');
    }

    // Seller ID from authenticated user
    const seller_id = req.user.id;

    const product = await Product.createProduct({
      name,
      description,
      ingredients,
      nutrition_info,
      price: parsedPrice,
      millet_type,
      seller_id,
      image_url,
      stock_quantity: parsedStock,
      is_featured
    });

    successResponse(res, HTTP_STATUS.CREATED, 'Product created successfully', product);
  } catch (error) {
    console.error('Create product error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to create product', error.message);
  }
};

/**
 * Update product
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.price !== undefined) {
      const parsedPrice = parseFloat(updateData.price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Price must be a valid positive number');
      }
      updateData.price = parsedPrice;
    }

    if (updateData.stock_quantity !== undefined) {
      const parsedStock = parseInt(updateData.stock_quantity);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Stock quantity must be a valid non-negative number');
      }
      updateData.stock_quantity = parsedStock;
    }

    // Check if product exists
    const existingProduct = await Product.getProductById(id);
    if (!existingProduct) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Product not found');
    }

    // Check if user is the seller (or admin)
    if (req.user.role !== 'admin' && existingProduct.seller_id !== req.user.id) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to update this product');
    }

    const product = await Product.updateProduct(id, updateData);

    successResponse(res, HTTP_STATUS.OK, 'Product updated successfully', product);
  } catch (error) {
    console.error('Update product error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update product', error.message);
  }
};

/**
 * Delete product
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await Product.getProductById(id);
    if (!existingProduct) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Product not found');
    }

    // Check if user is the seller (or admin)
    if (req.user.role !== 'admin' && existingProduct.seller_id !== req.user.id) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to delete this product');
    }

    await Product.deleteProduct(id);

    successResponse(res, HTTP_STATUS.OK, 'Product deleted successfully', null);
  } catch (error) {
    console.error('Delete product error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to delete product', error.message);
  }
};

/**
 * Update product stock
 * PATCH /api/products/:id/stock
 */
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Quantity is required');
    }

    const parsedQty = parseInt(quantity);
    if (isNaN(parsedQty) || parsedQty < 0) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Stock quantity must be a valid non-negative number');
    }

    const product = await Product.updateProductStock(id, parsedQty);

    successResponse(res, HTTP_STATUS.OK, 'Stock updated successfully', product);
  } catch (error) {
    console.error('Update stock error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update stock', error.message);
  }
};

/**
 * Search products
 * GET /api/products/search?q=query
 */
export const searchProducts = async (req, res) => {
  try {
    const { q, page, limit } = req.query;

    if (!q) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Search query is required');
    }

    const filters = {
      search: q,
      is_available: true,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12
    };

    const products = await Product.getAllProducts(filters);
    const total = await Product.getProductCount(filters);

    successResponse(res, HTTP_STATUS.OK, 'Search results', {
      products,
      pagination: {
        current_page: filters.page,
        total_items: total,
        items_per_page: filters.limit
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to search products', error.message);
  }
};
