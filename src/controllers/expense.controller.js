const expenseService = require('../services/expense.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const getExpenses = async (req, res) => {
  try {
    const { page, limit, category, startDate, endDate, search } = req.query;
    const result = await expenseService.getExpenses({
      page,
      limit,
      category,
      startDate,
      endDate,
      search
    });

    return sendSuccess(res, result, 'Expenses retrieved successfully', 200);
  } catch (error) {
    console.error('[Expense Controller Error - getExpenses]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await expenseService.getExpenseById(id);
    return sendSuccess(res, expense, 'Expense retrieved successfully', 200);
  } catch (error) {
    if (error.message === 'Expense not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid expense ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Expense Controller Error - getExpenseById]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const createExpense = async (req, res) => {
  try {
    const userId = req.user?.sub;
    const { category, amount, description, expenseDate } = req.body;

    const expense = await expenseService.createExpense({
      userId,
      category,
      amount,
      description,
      expenseDate
    });

    return sendSuccess(res, expense, 'Expense created successfully', 201);
  } catch (error) {
    if (
      error.message.includes('required') ||
      error.message.includes('Invalid') ||
      error.message.includes('positive')
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Expense Controller Error - createExpense]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, description, expenseDate } = req.body;

    const updated = await expenseService.updateExpense(id, {
      category,
      amount,
      description,
      expenseDate
    });

    return sendSuccess(res, updated, 'Expense updated successfully', 200);
  } catch (error) {
    if (error.message === 'Expense not found') {
      return sendError(res, error.message, 404);
    }
    if (
      error.message.includes('required') ||
      error.message.includes('Invalid') ||
      error.message.includes('positive')
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Expense Controller Error - updateExpense]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await expenseService.deleteExpense(id);
    return sendSuccess(res, result, 'Expense deleted successfully', 200);
  } catch (error) {
    if (error.message === 'Expense not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid expense ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Expense Controller Error - deleteExpense]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await expenseService.getExpenseSummary({ startDate, endDate });
    return sendSuccess(res, summary, 'Expense summary retrieved successfully', 200);
  } catch (error) {
    console.error('[Expense Controller Error - getExpenseSummary]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
};
