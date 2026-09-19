import * as Order from '../models/Order.js';
import * as Cart from '../models/Cart.js';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/apiResponse.js';

/**
 * Order Controller
 * Handles all order-related operations
 */

/**
 * Get all orders with filters
 * GET /api/orders
 */
export const getAllOrders = async (req, res) => {
  try {
    const {
      user_id,
      product_id,
      seller_id,
      order_status,
      payment_status,
      start_date,
      end_date,
      page,
      limit
    } = req.query;

    const filters = {
      user_id: user_id ? parseInt(user_id) : null,
      product_id: product_id ? parseInt(product_id) : null,
      seller_id: seller_id ? parseInt(seller_id) : null,
      order_status,
      payment_status,
      start_date,
      end_date,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20
    };

    // If regular user, only show their orders
    if (req.user.role === 'user') {
      filters.user_id = req.user.id;
    }

    // If seller, only show orders for their products
    if (req.user.role === 'seller') {
      filters.seller_id = req.user.id;
    }

    const orders = await Order.getAllOrders(filters);
    const total = await Order.getOrderCount(filters);

    successResponse(res, HTTP_STATUS.OK, 'Orders fetched successfully', {
      orders,
      pagination: {
        current_page: filters.page,
        total_items: total,
        items_per_page: filters.limit,
        total_pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch orders', error.message);
  }
};

/**
 * Get order by ID
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.getOrderById(id);

    if (!order) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Order not found');
    }

    // Check authorization
    if (req.user.role === 'user' && order.user_id !== req.user.id) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to view this order');
    }

    successResponse(res, HTTP_STATUS.OK, 'Order fetched successfully', order);
  } catch (error) {
    console.error('Get order error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch order', error.message);
  }
};

/**
 * Get user's orders
 * GET /api/orders/my-orders
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.getOrdersByUser(req.user.id);

    successResponse(res, HTTP_STATUS.OK, 'Orders fetched successfully', orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch orders', error.message);
  }
};

/**
 * Place a new order
 * POST /api/orders
 */
export const createOrder = async (req, res) => {
  try {
    const { product_id, quantity, delivery_address } = req.body;

    // Validate required fields
    if (!product_id || quantity === undefined) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Product ID and quantity are required');
    }

    const parsedQty = parseInt(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Valid positive quantity is required');
    }

    // Get product details
    const product = await import('../models/Product.js');
    const productData = await product.getProductById(product_id);

    if (!productData) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Product not found');
    }

    // Check stock availability
    if (productData.stock_quantity < parsedQty) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Insufficient stock available');
    }

    // Calculate total price
    const total_price = productData.price * parsedQty;

    // Create order
    const order = await Order.createOrder({
      user_id: req.user.id,
      product_id,
      quantity: parsedQty,
      total_price,
      delivery_address: delivery_address || req.user.address || 'Address not provided'
    });

    // Remove from cart if it was there
    try {
      await Cart.removeFromCart(req.user.id, product_id);
    } catch (e) {
      // Ignore cart errors
    }

    successResponse(res, HTTP_STATUS.CREATED, 'Order placed successfully', order);
  } catch (error) {
    console.error('Create order error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to place order', error.message);
  }
};

/**
 * Place order from cart
 * POST /api/orders/checkout
 */
export const checkout = async (req, res) => {
  try {
    // Get cart items
    const cartItems = await Cart.getCartItems(req.user.id);

    if (cartItems.length === 0) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Cart is empty');
    }

    // PRE-VALIDATE all items stock before creating any orders
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        return errorResponse(res, HTTP_STATUS.BAD_REQUEST, `Insufficient stock for ${item.name}`);
      }
    }

    const createdOrders = [];

    // Create separate order for each cart item
    for (const item of cartItems) {
      const order = await Order.createOrder({
        user_id: req.user.id,
        product_id: item.product_id,
        quantity: item.quantity,
        total_price: item.subtotal,
        delivery_address: req.body.delivery_address || req.user.address || 'Address not provided'
      });

      createdOrders.push(order);
    }

    // Clear cart
    await Cart.clearCart(req.user.id);

    successResponse(res, HTTP_STATUS.CREATED, 'Checkout successful', {
      orders: createdOrders,
      total_orders: createdOrders.length
    });
  } catch (error) {
    console.error('Checkout error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to checkout', error.message);
  }
};

/**
 * Update order status
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    if (!order_status) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Order status is required');
    }

    // Check if order exists
    const order = await Order.getOrderById(id);
    if (!order) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Order not found');
    }

    // Check authorization (only seller or admin can update status)
    if (req.user.role === 'user') {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to update order status');
    }

    const updatedOrder = await Order.updateOrderStatus(id, order_status);

    successResponse(res, HTTP_STATUS.OK, 'Order status updated successfully', updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update order status', error.message);
  }
};

/**
 * Cancel order
 * PATCH /api/orders/:id/cancel
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const order = await Order.getOrderById(id);
    if (!order) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Order not found');
    }

    // Check authorization
    if (req.user.role === 'user' && order.user_id !== req.user.id) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to cancel this order');
    }

    // Only allow cancellation of pending/confirmed orders
    if (['shipped', 'delivered'].includes(order.order_status)) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Cannot cancel order that has been shipped');
    }

    const cancelledOrder = await Order.cancelOrder(id);

    successResponse(res, HTTP_STATUS.OK, 'Order cancelled successfully', cancelledOrder);
  } catch (error) {
    console.error('Cancel order error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to cancel order', error.message);
  }
};

/**
 * Get order statistics
 * GET /api/orders/statistics
 */
export const getOrderStatistics = async (req, res) => {
  try {
    // Only admin can access statistics
    if (req.user.role !== 'admin') {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized');
    }

    const stats = await Order.getOrderStatistics();

    successResponse(res, HTTP_STATUS.OK, 'Statistics fetched successfully', stats);
  } catch (error) {
    console.error('Get statistics error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch statistics', error.message);
  }
};

/**
 * Get seller's orders
 * GET /api/orders/seller/orders
 */
export const getSellerOrders = async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Only sellers can access this endpoint');
    }

    const orders = await Order.getOrdersBySeller(req.user.id);

    successResponse(res, HTTP_STATUS.OK, 'Orders fetched successfully', orders);
  } catch (error) {
    console.error('Get seller orders error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch orders', error.message);
  }
};
