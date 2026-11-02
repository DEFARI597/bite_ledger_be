const prisma = require('../config/database');

const getIncomeStatementData = async ({ startDate, endDate } = {}) => {
  const orderWhere = {
    status: 'completed'
  };

  const expenseWhere = {};

  if (startDate || endDate) {
    orderWhere.createdAt = {};
    expenseWhere.expenseDate = {};

    if (startDate) {
      const start = new Date(startDate);
      orderWhere.createdAt.gte = start;
      expenseWhere.expenseDate.gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      const endOfDay = new Date(end.setHours(23, 59, 59, 999));
      orderWhere.createdAt.lte = endOfDay;
      expenseWhere.expenseDate.lte = new Date(endDate);
    }
  }

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        orderItems: {
          select: {
            productId: true,
            quantity: true,
            unitPrice: true,
            unitCogs: true,
            subtotal: true,
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                recipeItems: {
                  select: {
                    quantityRequired: true,
                    rawMaterial: {
                      select: {
                        id: true,
                        name: true,
                        unit: true,
                        costPerUnit: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      select: {
        id: true,
        category: true,
        amount: true,
        description: true,
        expenseDate: true,
        createdAt: true
      },
      orderBy: { expenseDate: 'asc' }
    })
  ]);

  return { orders, expenses };
};

const getGeneralLedgerData = async ({ startDate, endDate } = {}) => {
  let priorSalesSum = 0;
  let priorExpenseSum = 0;

  if (startDate) {
    const start = new Date(startDate);

    const [priorOrdersAgg, priorExpensesAgg] = await Promise.all([
      prisma.order.aggregate({
        where: {
          status: 'completed',
          createdAt: { lt: start }
        },
        _sum: { totalAmount: true }
      }),
      prisma.expense.aggregate({
        where: {
          expenseDate: { lt: start }
        },
        _sum: { amount: true }
      })
    ]);

    priorSalesSum = Number(priorOrdersAgg._sum.totalAmount || 0);
    priorExpenseSum = Number(priorExpensesAgg._sum.amount || 0);
  }

  const openingBalance = Number((priorSalesSum - priorExpenseSum).toFixed(2));

  // Current period orders
  const orderWhere = { status: 'completed' };
  const expenseWhere = {};

  if (startDate || endDate) {
    orderWhere.createdAt = {};
    expenseWhere.expenseDate = {};

    if (startDate) {
      orderWhere.createdAt.gte = new Date(startDate);
      expenseWhere.expenseDate.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      orderWhere.createdAt.lte = new Date(end.setHours(23, 59, 59, 999));
      expenseWhere.expenseDate.lte = new Date(endDate);
    }
  }

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      select: {
        id: true,
        category: true,
        amount: true,
        description: true,
        expenseDate: true,
        createdAt: true,
        user: {
          select: { name: true }
        }
      },
      orderBy: { expenseDate: 'asc' }
    })
  ]);

  return {
    openingBalance,
    orders,
    expenses
  };
};

module.exports = {
  getIncomeStatementData,
  getGeneralLedgerData
};
