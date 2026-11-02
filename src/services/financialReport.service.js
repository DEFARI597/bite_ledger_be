const financialReportRepository = require('../repositories/financialReport.repository');
const { getCategoryLabel } = require('./expense.service');

const getMultiStepIncomeStatement = async ({ startDate, endDate } = {}) => {
  const { orders, expenses } = await financialReportRepository.getIncomeStatementData({
    startDate,
    endDate
  });

  let totalRevenue = 0;
  let totalCogs = 0;
  const rawMaterialMap = new Map();

    const productMap = new Map();
  for (const order of orders) {
    if (order.orderItems && Array.isArray(order.orderItems)) {
      for (const item of order.orderItems) {
        const prodName = item.product?.name || ("Produk #" + item.productId);
        const qty = Number(item.quantity || 1);
        const subtotal = Number(item.subtotal || qty * Number(item.unitPrice || 0));
        if (!productMap.has(prodName)) {
          productMap.set(prodName, { name: prodName, quantity: 0, totalRevenue: 0 });
        }
        const p = productMap.get(prodName);
        p.quantity += qty;
        p.totalRevenue += subtotal;
      }
    }

    const orderTotal = Number(order.totalAmount || 0);
    totalRevenue += orderTotal;

    if (order.orderItems && Array.isArray(order.orderItems)) {
      for (const item of order.orderItems) {
        const qty = item.quantity;
        const unitCogs = Number(item.unitCogs || 0);
        const itemCogs = qty * unitCogs;
        totalCogs += itemCogs;

        if (item.product?.recipeItems && Array.isArray(item.product.recipeItems)) {
          for (const recipeItem of item.product.recipeItems) {
            const rm = recipeItem.rawMaterial;
            if (rm) {
              const rmId = rm.id.toString();
              const usedQty = Number(recipeItem.quantityRequired) * qty;
              const cost = usedQty * Number(rm.costPerUnit || 0);

              if (rawMaterialMap.has(rmId)) {
                const existing = rawMaterialMap.get(rmId);
                existing.quantity = Number((existing.quantity + usedQty).toFixed(3));
                existing.totalCost = Number((existing.totalCost + cost).toFixed(2));
              } else {
                rawMaterialMap.set(rmId, {
                  name: rm.name,
                  unit: rm.unit,
                  quantity: Number(usedQty.toFixed(3)),
                  totalCost: Number(cost.toFixed(2))
                });
              }
            }
          }
        }
      }
    }
  }

  totalRevenue = Number(totalRevenue.toFixed(2));
  totalCogs = Number(totalCogs.toFixed(2));
  const grossProfit = Number((totalRevenue - totalCogs).toFixed(2));
  const grossProfitMargin = totalRevenue > 0
    ? Number(((grossProfit / totalRevenue) * 100).toFixed(1))
    : 0;
  const foodCostPercentage = totalRevenue > 0
    ? Number(((totalCogs / totalRevenue) * 100).toFixed(1))
    : 0;

  const categoryMap = {
    gaji: 0,
    utilitas: 0,
    sewa: 0,
    internet: 0,
    lainnya: 0
  };

  let totalOpex = 0;
  for (const exp of expenses) {
    const amt = Number(exp.amount || 0);
    const cat = categoryMap[exp.category] !== undefined ? exp.category : 'lainnya';
    categoryMap[cat] += amt;
    totalOpex += amt;
  }

  totalOpex = Number(totalOpex.toFixed(2));
  const netProfit = Number((grossProfit - totalOpex).toFixed(2));
  const netProfitMargin = totalRevenue > 0
    ? Number(((netProfit / totalRevenue) * 100).toFixed(1))
    : 0;
  const opexRatio = totalRevenue > 0
    ? Number(((totalOpex / totalRevenue) * 100).toFixed(1))
    : 0;

  const opexItems = [
    { category: 'gaji', label: 'Beban Gaji Karyawan', amount: Number(categoryMap.gaji.toFixed(2)) },
    { category: 'utilitas', label: 'Beban Utilitas (Listrik, Air, Gas)', amount: Number(categoryMap.utilitas.toFixed(2)) },
    { category: 'sewa', label: 'Beban Sewa Tempat', amount: Number(categoryMap.sewa.toFixed(2)) },
    { category: 'internet', label: 'Beban Internet & Komunikasi', amount: Number(categoryMap.internet.toFixed(2)) },
    { category: 'lainnya', label: 'Beban Pemeliharaan & Perbaikan / Lainnya', amount: Number(categoryMap.lainnya.toFixed(2)) }
  ];

  const materialsBreakdown = Array.from(rawMaterialMap.values()).sort(
    (a, b) => b.totalCost - a.totalCost
  );

  const materialsSummary = materialsBreakdown.length > 0
    ? materialsBreakdown.slice(0, 5).map((m) => m.name).join(', ')
    : 'Bahan Baku & Kemasan Operasional';

  return {
    businessName: 'BITELEDGER COFFEE SHOP',
    reportTitle: 'LAPORAN LABA RUGI (INCOME STATEMENT)',
    period: {
      startDate: startDate || null,
      endDate: endDate || null
    },
    revenue: {
      label: 'Penjualan Makanan & Minuman',
      totalAmount: totalRevenue,
      totalOrders: orders.length,
      productsBreakdown: Array.from(productMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue)
    },
    cogs: {
      label: 'Pemakaian Bahan Baku (Perpetual Inventory Auto-Deduction)',
      totalAmount: totalCogs,
      materialsSummary,
      materialsBreakdown
    },
    grossProfit,
    grossProfitMargin: `${grossProfitMargin}%`,
    foodCostPercentage: `${foodCostPercentage}%`,
    operatingExpenses: {
      items: opexItems,
      totalAmount: totalOpex,
      opexRatio: `${opexRatio}%`
    },
    netProfit,
    netProfitMargin: `${netProfitMargin}%`
  };
};

const getGeneralLedger = async ({ startDate, endDate, paymentMethod } = {}) => {
  const { openingBalance, orders, expenses } =
    await financialReportRepository.getGeneralLedgerData({ startDate, endDate });

  const rawEntries = [];

  const filteredOrders = paymentMethod && paymentMethod.trim() !== ''
    ? orders.filter(
      (o) => o.paymentMethod.toLowerCase() === paymentMethod.trim().toLowerCase()
    )
    : orders;

  for (const o of filteredOrders) {
    const amount = Number(o.totalAmount || 0);
    rawEntries.push({
      id: `ORD-${o.id}`,
      type: 'sales',
      date: o.createdAt,
      ref: `ORD-${o.id}`,
      account: `Kas / Penjualan (${o.paymentMethod.toUpperCase()})`,
      description: `Order #${o.id} - ${o.paymentMethod.toUpperCase()}${o.user?.name ? ` (Kasir: ${o.user.name})` : ''}`,
      debit: amount,
      credit: 0
    });
  }

  for (const exp of expenses) {
    const amount = Number(exp.amount || 0);
    const date = exp.expenseDate instanceof Date
      ? exp.expenseDate
      : new Date(exp.expenseDate);

    rawEntries.push({
      id: `EXP-${exp.id}`,
      type: 'expense',
      date,
      ref: `EXP-${exp.id}`,
      account: `Beban: ${getCategoryLabel(exp.category)}`,
      description: exp.description || `Pengeluaran ${getCategoryLabel(exp.category)}`,
      debit: 0,
      credit: amount
    });
  }

  rawEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;

  const ledgerEntries = rawEntries.map((entry) => {
    totalDebit += entry.debit;
    totalCredit += entry.credit;
    runningBalance = Number((runningBalance + entry.debit - entry.credit).toFixed(2));

    const dateFormatted = entry.date instanceof Date
      ? entry.date.toISOString().slice(0, 10)
      : String(entry.date).slice(0, 10);

    return {
      ...entry,
      dateFormatted,
      runningBalance
    };
  });

  return {
    period: {
      startDate: startDate || null,
      endDate: endDate || null
    },
    openingBalance,
    totalDebit: Number(totalDebit.toFixed(2)),
    totalCredit: Number(totalCredit.toFixed(2)),
    closingBalance: runningBalance,
    totalEntries: ledgerEntries.length,
    entries: ledgerEntries
  };
};

module.exports = {
  getMultiStepIncomeStatement,
  getGeneralLedger
};
