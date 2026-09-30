import * as CartModel from '../models/Cart.js';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/apiResponse.js';

/**
 * Cart Controller
 * Handles shopping cart operations
 */

/**
 * Sync local cart with database
 * POST /api/cart/sync
 */
export const syncCart = async (req, res) => {
  try {
    // Block producer accounts from syncing/maintaining shopping cart
    if (['seller', 'farmer', 'startup'].includes(req.user.role)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Producer accounts (Farmer & Startup) cannot maintain a buyer cart.');
    }

    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Items array is required');
    }

    const cart = await CartModel.syncCart(req.user.id, items);

    successResponse(res, HTTP_STATUS.OK, 'Cart synchronized successfully', cart);
  } catch (error) {
    console.error('Sync cart error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to sync cart', error.message);
  }
};

/**
 * Get user's cart
 * GET /api/cart
 */
export const getCart = async (req, res) => {
  try {
    const cart = await CartModel.getCartSummary(req.user.id);

    successResponse(res, HTTP_STATUS.OK, 'Cart fetched successfully', cart);
  } catch (error) {
    console.error('Get cart error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch cart', error.message);
  }
};

/**
 * Get cart item count
 * GET /api/cart/count
 */
export const getCartCount = async (req, res) => {
  try {
    const count = await CartModel.getCartCount(req.user.id);

    successResponse(res, HTTP_STATUS.OK, 'Cart count fetched successfully', { count });
  } catch (error) {
    console.error('Get cart count error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch cart count', error.message);
  }
};

/**
 * Add item to cart
 * POST /api/cart/add
 */
export const addToCart = async (req, res) => {
  try {
    // Block producer accounts from adding items to cart
    if (['seller', 'farmer', 'startup'].includes(req.user.role)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Producer accounts (Farmer & Startup) cannot add products to cart.');
    }

    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Product ID is required');
    }

    const parsedQty = parseInt(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Valid positive quantity is required');
    }

    // Get product to check stock
    const product = await import('../models/Product.js');
    const productData = await product.getProductById(product_id);

    if (!productData) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Product not found');
    }

    // Check existing item in cart to calculate total requested quantity
    const existingItem = await CartModel.getCartItem(req.user.id, product_id);
    const existingQty = existingItem ? existingItem.quantity : 0;
    const totalRequestedQty = existingQty + parsedQty;

    if (productData.stock_quantity < totalRequestedQty) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, `Insufficient stock. Only ${productData.stock_quantity} available`);
    }

    const cart = await CartModel.addToCart({
      user_id: req.user.id,
      product_id: parseInt(product_id),
      quantity: parsedQty
    });

    successResponse(res, HTTP_STATUS.OK, 'Item added to cart successfully', cart);
  } catch (error) {
    console.error('Add to cart error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to add item to cart', error.message);
  }
};

/**
 * Update cart item quantity
 * PUT /api/cart/update
 */
export const updateCartItem = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Product ID is required');
    }

    const parsedQty = parseInt(quantity);
    if (isNaN(parsedQty) || parsedQty < 0) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Valid quantity is required');
    }

    // Get product to check stock if increasing quantity
    if (parsedQty > 0) {
      const product = await import('../models/Product.js');
      const productData = await product.getProductById(product_id);
      
      if (!productData) {
        return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Product not found');
      }

      if (productData.stock_quantity < parsedQty) {
        return errorResponse(res, HTTP_STATUS.BAD_REQUEST, `Insufficient stock. Only ${productData.stock_quantity} available`);
      }
    }

    const cart = await CartModel.updateCartItem(
      req.user.id,
      parseInt(product_id),
      parsedQty
    );

    successResponse(res, HTTP_STATUS.OK, 'Cart updated successfully', cart);
  } catch (error) {
    console.error('Update cart item error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update cart', error.message);
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/remove/:productId
 */
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Product ID is required');
    }

    const success = await CartModel.removeFromCart(req.user.id, parseInt(productId));

    if (!success) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Item not found in cart');
    }

    const cart = await CartModel.getCartSummary(req.user.id);

    successResponse(res, HTTP_STATUS.OK, 'Item removed from cart successfully', cart);
  } catch (error) {
    console.error('Remove from cart error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to remove item from cart', error.message);
  }
};

/**
 * Clear entire cart
 * DELETE /api/cart/clear
 */
export const clearCart = async (req, res) => {
  try {
    await CartModel.clearCart(req.user.id);

    successResponse(res, HTTP_STATUS.OK, 'Cart cleared successfully', {
      items: [],
      total: 0,
      count: 0
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to clear cart', error.message);
  }
};
