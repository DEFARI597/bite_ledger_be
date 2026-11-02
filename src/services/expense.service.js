const expenseRepository = require('../repositories/expense.repository');

const ALLOWED_CATEGORIES = ['gaji', 'utilitas', 'sewa', 'internet', 'lainnya'];

const formatExpenseResponse = (expense) => {
  if (!expense) return null;

  return {
    id: expense.id.toString(),
    userId: expense.userId ? expense.userId.toString() : null,
    category: expense.category,
    amount: Number(expense.amount),
    description: expense.description || '',
    expenseDate: expense.expenseDate instanceof Date
      ? expense.expenseDate.toISOString().slice(0, 10)
      : expense.expenseDate,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
    user: expense.user
      ? {
        id: expense.user.id.toString(),
        name: expense.user.name,
        email: expense.user.email,
        role: expense.user.role?.name
      }
      : undefined
  };
};

const getExpenses = async ({
  page = 1,
  limit = 20,
  category,
  startDate,
  endDate,
  search
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (category && category.trim() !== '') {
    const normalizedCategory = category.trim().toLowerCase();
    if (ALLOWED_CATEGORIES.includes(normalizedCategory)) {
      where.category = normalizedCategory;
    }
  }

  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) {
      where.expenseDate.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.expenseDate.lte = end;
    }
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    where.OR = [
      {
        description: {
          contains: term,
          mode: 'insensitive'
        }
      },
      {
        category: {
          contains: term,
          mode: 'insensitive'
        }
      }
    ];
  }

  const { total, expenses } = await expenseRepository.findExpenses({
    where,
    skip,
    take: limitNum,
    orderBy: { expenseDate: 'desc' }
  });

  return {
    expenses: expenses.map(formatExpenseResponse),
    pagination: {
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum
    }
  };
};

const getExpenseById = async (id) => {
  let expenseId;
  try {
    expenseId = BigInt(id);
  } catch {
    throw new Error('Invalid expense ID');
  }

  const expense = await expenseRepository.findExpenseById(expenseId);
  if (!expense) {
    throw new Error('Expense not found');
  }

  return formatExpenseResponse(expense);
};

const createExpense = async ({ userId, category, amount, description, expenseDate }) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  let parsedUserId;
  try {
    parsedUserId = BigInt(userId);
  } catch {
    throw new Error('Invalid user ID');
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    throw new Error('Category is required');
  }

  const normalizedCategory = category.trim().toLowerCase();
  if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
    throw new Error(`Invalid category. Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Amount must be a positive number greater than 0');
  }

  if (!expenseDate) {
    throw new Error('Expense date is required');
  }

  const parsedDate = new Date(expenseDate);
  if (isNaN(parsedDate.getTime())) {
    throw new Error('Invalid expense date format');
  }

  const expense = await expenseRepository.createExpense({
    userId: parsedUserId,
    category: normalizedCategory,
    amount: parsedAmount,
    description: description ? description.trim() : null,
    expenseDate: parsedDate
  });

  return formatExpenseResponse(expense);
};

const updateExpense = async (id, { category, amount, description, expenseDate }) => {
  let expenseId;
  try {
    expenseId = BigInt(id);
  } catch {
    throw new Error('Invalid expense ID');
  }

  const existing = await expenseRepository.findExpenseById(expenseId);
  if (!existing) {
    throw new Error('Expense not found');
  }

  const updateData = {};

  if (category !== undefined) {
    const normalizedCategory = category.trim().toLowerCase();
    if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
      throw new Error(`Invalid category. Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}`);
    }
    updateData.category = normalizedCategory;
  }

  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Amount must be a positive number greater than 0');
    }
    updateData.amount = parsedAmount;
  }

  if (description !== undefined) {
    updateData.description = description ? description.trim() : null;
  }

  if (expenseDate !== undefined) {
    const parsedDate = new Date(expenseDate);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid expense date format');
    }
    updateData.expenseDate = parsedDate;
  }

  const updated = await expenseRepository.updateExpense(expenseId, updateData);
  return formatExpenseResponse(updated);
};

const deleteExpense = async (id) => {
  let expenseId;
  try {
    expenseId = BigInt(id);
  } catch {
    throw new Error('Invalid expense ID');
  }

  const existing = await expenseRepository.findExpenseById(expenseId);
  if (!existing) {
    throw new Error('Expense not found');
  }

  await expenseRepository.deleteExpense(expenseId);
  return { message: 'Expense deleted successfully' };
};

const getExpenseSummary = async ({ startDate, endDate } = {}) => {
  const where = {};

  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) {
      where.expenseDate.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.expenseDate.lte = end;
    }
  }

  const stats = await expenseRepository.aggregateExpenses(where);

  const categoryDetails = ALLOWED_CATEGORIES.map((cat) => {
    const current = stats.categoryBreakdown[cat] || { count: 0, totalAmount: 0 };
    const percentage = stats.totalAmount > 0
      ? Number(((current.totalAmount / stats.totalAmount) * 100).toFixed(2))
      : 0;

    return {
      category: cat,
      label: getCategoryLabel(cat),
      count: current.count,
      totalAmount: current.totalAmount,
      percentage: `${percentage}%`
    };
  });

  return {
    period: {
      startDate: startDate || null,
      endDate: endDate || null
    },
    totalExpensesCount: stats.totalExpensesCount,
    totalAmount: stats.totalAmount,
    categories: categoryDetails
  };
};

const getCategoryLabel = (category) => {
  switch (category) {
    case 'gaji':
      return 'Beban Gaji Karyawan';
    case 'utilitas':
      return 'Beban Utilitas (Listrik, Air, Gas)';
    case 'sewa':
      return 'Beban Sewa Tempat';
    case 'internet':
      return 'Beban Internet & Komunikasi';
    case 'lainnya':
    default:
      return 'Beban Pemeliharaan / Lainnya';
  }
};

module.exports = {
  ALLOWED_CATEGORIES,
  formatExpenseResponse,
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getCategoryLabel
};
