const orderService = require('../services/order.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const getOrders = async (req, res) => {
  try {
    const { page, limit, status, paymentMethod, userId, startDate, endDate, search } = req.query;
    const result = await orderService.getOrders({
      page,
      limit,
      status,
      paymentMethod,
      userId,
      startDate,
      endDate,
      search
    });
    return sendSuccess(res, result, 'Orders retrieved successfully', 200);
  } catch (error) {
    console.error('[Order Controller Error - getOrders]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    return sendSuccess(res, order, 'Order retrieved successfully', 200);
  } catch (error) {
    if (error.message === 'Order not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid order ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Order Controller Error - getOrderById]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const createOrder = async (req, res) => {
  try {
    const { paymentMethod, status, items } = req.body;
    const userId = req.user && req.user.sub ? req.user.sub : req.body.userId;

    const order = await orderService.createOrder({
      userId,
      paymentMethod,
      status,
      items
    });
    return sendSuccess(res, order, 'Order created successfully', 201);
  } catch (error) {
    if (
      error.message === 'User ID is required' ||
      error.message === 'Invalid user ID' ||
      error.message === 'Payment method is required' ||
      error.message.includes('Payment method must be') ||
      error.message === 'Order must contain at least one item' ||
      error.message === 'Product ID is required for each item' ||
      error.message.includes('Invalid product ID') ||
      error.message.includes('Quantity must be a positive integer') ||
      error.message.includes('is not active and cannot be ordered') ||
      error.message.includes('Stok bahan baku tidak mencukupi') ||
      error.message.includes('tidak mencukupi') ||
      error.message.includes('Insufficient stock')
    ) {
      return sendError(res, error.message, 400);
    }
    if (error.message.startsWith('Product(s) not found')) {
      return sendError(res, error.message, 404);
    }
    console.error('[Order Controller Error - createOrder]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(id, status);
    return sendSuccess(res, order, 'Order status updated successfully', 200);
  } catch (error) {
    if (error.message === 'Order not found') {
      return sendError(res, error.message, 404);
    }
    if (
      error.message === 'Invalid order ID' ||
      error.message === 'Status is required' ||
      error.message.includes('Invalid status')
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Order Controller Error - updateOrderStatus]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await orderService.deleteOrder(id);
    return sendSuccess(res, null, result.message, 200);
  } catch (error) {
    if (error.message === 'Order not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid order ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Order Controller Error - deleteOrder]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await orderService.getOrderStatistics({ startDate, endDate });
    return sendSuccess(res, stats, 'Order statistics retrieved successfully', 200);
  } catch (error) {
    console.error('[Order Controller Error - getOrderStatistics]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStatistics
};
