const prisma = require('../config/database');

const findExpenses = async ({ where = {}, skip = 0, take = 20, orderBy = { expenseDate: 'desc' } } = {}) => {
  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })
  ]);

  return { total, expenses };
};

const findExpenseById = async (id) => {
  return prisma.expense.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });
};

const createExpense = async (data) => {
  return prisma.expense.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

const updateExpense = async (id, data) => {
  return prisma.expense.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

const deleteExpense = async (id) => {
  return prisma.expense.delete({
    where: { id }
  });
};

const aggregateExpenses = async (where = {}) => {
  const [grouped, allExpenses] = await Promise.all([
    prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    }),
    prisma.expense.findMany({
      where,
      select: {
        id: true,
        category: true,
        amount: true,
        expenseDate: true,
        description: true
      },
      orderBy: { expenseDate: 'asc' }
    })
  ]);

  let totalAmount = 0;
  const categoryBreakdown = {};

  grouped.forEach((item) => {
    const sum = Number(item._sum.amount || 0);
    totalAmount += sum;
    categoryBreakdown[item.category] = {
      count: item._count.id,
      totalAmount: sum
    };
  });

  return {
    totalExpensesCount: allExpenses.length,
    totalAmount: Number(totalAmount.toFixed(2)),
    categoryBreakdown,
    rawList: allExpenses
  };
};

module.exports = {
  findExpenses,
  findExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  aggregateExpenses
};
