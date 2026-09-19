import * as User from '../models/User.js';
import * as Product from '../models/Product.js';
import * as Order from '../models/Order.js';
import * as LearningContent from '../models/LearningContent.js';
import * as HealthProfile from '../models/HealthProfile.js';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/apiResponse.js';

/**
 * Admin Controller
 * Handles admin panel operations
 */

/**
 * Get admin dashboard statistics
 * GET /api/admin/dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.getUserCount();
    const totalProducts = await Product.getTotalProductCount();
    const orderStats = await Order.getOrderStatistics();
    const healthStats = await HealthProfile.getHealthProfileStats();
    const contentStats = await LearningContent.getContentCountByCategory();

    // Get recent orders
    const recentOrders = await Order.getAllOrders({ limit: 5 });

    // Get pending sellers
    const pendingSellers = await User.getPendingSellers();

    successResponse(res, HTTP_STATUS.OK, 'Dashboard stats fetched successfully', {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders: orderStats.total_orders || 0,
        totalRevenue: orderStats.total_revenue || 0,
        totalHealthProfiles: healthStats.total_profiles || 0
      },
      orderBreakdown: {
        pending: orderStats.pending_orders || 0,
        confirmed: orderStats.confirmed_orders || 0,
        processing: orderStats.processing_orders || 0,
        shipped: orderStats.shipped_orders || 0,
        delivered: orderStats.delivered_orders || 0,
        cancelled: orderStats.cancelled_orders || 0
      },
      contentBreakdown: contentStats,
      healthGoalBreakdown: {
        weightLoss: healthStats.weight_loss_count || 0,
        diabetes: healthStats.diabetes_count || 0,
        fitness: healthStats.fitness_count || 0,
        general: healthStats.general_count || 0
      },
      recentOrders,
      pendingSellers
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch dashboard stats', error.message);
  }
};

/**
 * Get all users
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const users = await User.getAllUsers(role);

    successResponse(res, HTTP_STATUS.OK, 'Users fetched successfully', {
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Get all users error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch users', error.message);
  }
};

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.getUserById(id);

    if (!user) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    successResponse(res, HTTP_STATUS.OK, 'User fetched successfully', user);
  } catch (error) {
    console.error('Get user error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch user', error.message);
  }
};

/**
 * Update user
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, is_approved, role } = req.body;

    const user = await User.updateUser(id, {
      name,
      phone,
      address,
      is_approved: is_approved !== undefined ? is_approved : undefined,
      role
    });

    successResponse(res, HTTP_STATUS.OK, 'User updated successfully', user);
  } catch (error) {
    console.error('Update user error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update user', error.message);
  }
};

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting admin accounts
    const user = await User.getUserById(id);
    if (user && user.role === 'admin') {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Cannot delete admin accounts');
    }

    await User.deleteUser(id);

    successResponse(res, HTTP_STATUS.OK, 'User deleted successfully', null);
  } catch (error) {
    console.error('Delete user error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to delete user', error.message);
  }
};

/**
 * Get pending sellers for approval
 * GET /api/admin/sellers/pending
 */
export const getPendingSellers = async (req, res) => {
  try {
    const sellers = await User.getPendingSellers();

    successResponse(res, HTTP_STATUS.OK, 'Pending sellers fetched successfully', sellers);
  } catch (error) {
    console.error('Get pending sellers error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch pending sellers', error.message);
  }
};

/**
 * Approve seller
 * PATCH /api/admin/sellers/:id/approve
 */
export const approveSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.updateUser(id, { is_approved: true });

    successResponse(res, HTTP_STATUS.OK, 'Seller approved successfully', user);
  } catch (error) {
    console.error('Approve seller error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to approve seller', error.message);
  }
};

/**
 * Reject seller
 * PATCH /api/admin/sellers/:id/reject
 */
export const rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the seller account
    await User.deleteUser(id);

    successResponse(res, HTTP_STATUS.OK, 'Seller rejected and removed', null);
  } catch (error) {
    console.error('Reject seller error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to reject seller', error.message);
  }
};

/**
 * Get all products (admin view)
 * GET /api/admin/products
 */
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const products = await Product.getAllProducts({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const total = await Product.getProductCount();

    successResponse(res, HTTP_STATUS.OK, 'Products fetched successfully', {
      products,
      pagination: {
        current_page: parseInt(page),
        total_items: total,
        items_per_page: parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch products', error.message);
  }
};

/**
 * Delete product (admin)
 * DELETE /api/admin/products/:id
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await Product.deleteProduct(id);

    successResponse(res, HTTP_STATUS.OK, 'Product deleted successfully', null);
  } catch (error) {
    console.error('Delete product error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to delete product', error.message);
  }
};

/**
 * Get all orders (admin view)
 * GET /api/admin/orders
 */
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, order_status } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      order_status
    };

    const orders = await Order.getAllOrders(filters);
    const total = await Order.getOrderCount(filters);

    successResponse(res, HTTP_STATUS.OK, 'Orders fetched successfully', {
      orders,
      pagination: {
        current_page: parseInt(page),
        total_items: total,
        items_per_page: parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch orders', error.message);
  }
};

/**
 * Update order status (admin)
 * PATCH /api/admin/orders/:id/status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    if (!order_status) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Order status is required');
    }

    const order = await Order.updateOrderStatus(id, order_status);

    successResponse(res, HTTP_STATUS.OK, 'Order status updated successfully', order);
  } catch (error) {
    console.error('Update order status error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update order status', error.message);
  }
};

/**
 * Get all learning content (admin view)
 * GET /api/admin/learning
 */
export const getAllLearningContent = async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      category
    };

    const content = await LearningContent.getAllLearningContent(filters);
    const total = await LearningContent.getLearningContentCount(filters);

    successResponse(res, HTTP_STATUS.OK, 'Learning content fetched successfully', {
      content,
      pagination: {
        current_page: parseInt(page),
        total_items: total,
        items_per_page: parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all learning content error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch learning content', error.message);
  }
};

/**
 * Get system analytics
 * GET /api/admin/analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    // Get detailed analytics
    const orderStats = await Order.getOrderStatistics();
    const healthStats = await HealthProfile.getHealthProfileStats();
    const contentStats = await LearningContent.getContentCountByCategory();

    // Get top products
    const topProducts = await Product.getAllProducts({
      sort: 'rating',
      order: 'DESC',
      limit: 10
    });

    // Get user role distribution
    const allUsers = await User.getAllUsers();
    const roleDistribution = {
      user: allUsers.filter(u => u.role === 'user').length,
      seller: allUsers.filter(u => u.role === 'seller').length,
      admin: allUsers.filter(u => u.role === 'admin').length
    };

    successResponse(res, HTTP_STATUS.OK, 'Analytics fetched successfully', {
      orderStats,
      healthStats,
      contentStats,
      topProducts,
      roleDistribution
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    errorResponse(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch analytics', error.message);
  }
};
