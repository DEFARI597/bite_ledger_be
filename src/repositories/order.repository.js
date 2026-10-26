const prisma = require('../config/database');

const createOrderWithItems = async ({
  userId,
  totalAmount,
  paymentMethod,
  status,
  items,
  rawMaterialDeductions = []
}) => {
  return prisma.$transaction(async (tx) => {
    // 1. Deduct raw material stock for items that have recipes/BOM applied
    for (const deduction of rawMaterialDeductions) {
      const material = await tx.rawMaterial.findUnique({
        where: { id: deduction.rawMaterialId }
      });

      if (!material) {
        throw new Error(`Bahan baku dengan ID ${deduction.rawMaterialId} tidak ditemukan`);
      }

      const currentStock = Number(material.stock);
      const deductQty = Number(deduction.deductQuantity);

      if (currentStock < deductQty) {
        throw new Error(
          `Stok bahan baku tidak mencukupi untuk '${material.name}'. Tersedia: ${currentStock} ${material.unit}, Dibutuhkan: ${deductQty} ${material.unit}`
        );
      }

      await tx.rawMaterial.update({
        where: { id: deduction.rawMaterialId },
        data: {
          stock: {
            decrement: deductQty
          }
        }
      });
    }

    // 2. Create the order with items
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        paymentMethod,
        status: status || 'completed',
        orderItems: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCogs: item.unitCogs
          }))
        }
      },
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
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                sellingPrice: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });

    return order;
  });
};

const findOrders = async ({ where = {}, skip = 0, take = 20, orderBy = { createdAt: 'desc' } } = {}) => {
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
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
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                sellingPrice: true,
                imageUrl: true
              }
            }
          }
        }
      }
    })
  ]);

  return { total, orders };
};

const findOrderById = async (id) => {
  return prisma.order.findUnique({
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
      },
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sellingPrice: true,
              imageUrl: true
            }
          }
        }
      }
    }
  });
};

const updateOrderStatus = async (id, status) => {
  return prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                recipeItems: {
                  include: {
                    rawMaterial: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // If order was cancelled and now restoring, or if active order is cancelled, adjust stock
    if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
      // Restore raw material stock
      for (const item of existingOrder.orderItems) {
        if (item.product && item.product.recipeItems && item.product.recipeItems.length > 0) {
          for (const recipeItem of item.product.recipeItems) {
            const returnQty = Number(recipeItem.quantityRequired) * item.quantity;
            await tx.rawMaterial.update({
              where: { id: recipeItem.rawMaterialId },
              data: {
                stock: {
                  increment: returnQty
                }
              }
            });
          }
        }
      }
    } else if (existingOrder.status === 'cancelled' && status !== 'cancelled') {
      // Re-deduct raw material stock
      for (const item of existingOrder.orderItems) {
        if (item.product && item.product.recipeItems && item.product.recipeItems.length > 0) {
          for (const recipeItem of item.product.recipeItems) {
            const deductQty = Number(recipeItem.quantityRequired) * item.quantity;
            await tx.rawMaterial.update({
              where: { id: recipeItem.rawMaterialId },
              data: {
                stock: {
                  decrement: deductQty
                }
              }
            });
          }
        }
      }
    }

    return tx.order.update({
      where: { id },
      data: { status },
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
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                sellingPrice: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });
  });
};

const deleteOrder = async (id) => {
  return prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                recipeItems: true
              }
            }
          }
        }
      }
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // If order was not cancelled, return the raw material stock before deleting
    if (existingOrder.status !== 'cancelled') {
      for (const item of existingOrder.orderItems) {
        if (item.product && item.product.recipeItems && item.product.recipeItems.length > 0) {
          for (const recipeItem of item.product.recipeItems) {
            const returnQty = Number(recipeItem.quantityRequired) * item.quantity;
            await tx.rawMaterial.update({
              where: { id: recipeItem.rawMaterialId },
              data: {
                stock: {
                  increment: returnQty
                }
              }
            });
          }
        }
      }
    }

    return tx.order.delete({
      where: { id }
    });
  });
};

const aggregateOrderStats = async (where = {}) => {
  const [orders, countByStatus] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
        status: true,
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
                sellingPrice: true
              }
            }
          }
        }
      }
    }),
    prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { id: true }
    })
  ]);

  let totalOrders = orders.length;
  let totalRevenue = 0;
  let totalCogs = 0;
  let totalItemsSold = 0;
  const paymentMethodBreakdown = {};
  const paymentMethodDetails = {};
  const dailyMap = {};
  const productMap = {};

  for (const order of orders) {
    const isCompleted = order.status === 'completed';
    const amount = Number(order.totalAmount);
    const method = order.paymentMethod || 'other';

    paymentMethodBreakdown[method] =
      (paymentMethodBreakdown[method] || 0) + 1;

    if (!paymentMethodDetails[method]) {
      paymentMethodDetails[method] = { count: 0, totalAmount: 0 };
    }
    paymentMethodDetails[method].count += 1;
    if (isCompleted) {
      paymentMethodDetails[method].totalAmount += amount;
    }

    if (isCompleted) {
      totalRevenue += amount;
      let orderCogs = 0;

      for (const item of order.orderItems) {
        totalItemsSold += item.quantity;
        const cogs = item.quantity * Number(item.unitCogs || 0);
        const itemRev = Number(item.subtotal) || (item.quantity * Number(item.unitPrice || 0));
        orderCogs += cogs;
        totalCogs += cogs;

        const pId = item.productId ? item.productId.toString() : 'unknown';
        if (!productMap[pId]) {
          productMap[pId] = {
            productId: pId,
            name: item.product?.name || `Product #${pId}`,
            category: item.product?.category || 'Lainnya',
            sellingPrice: Number(item.unitPrice || item.product?.sellingPrice || 0),
            unitCogs: Number(item.unitCogs || 0),
            quantitySold: 0,
            totalRevenue: 0,
            totalCogs: 0,
            grossProfit: 0,
            marginPercent: 0
          };
        }
        productMap[pId].quantitySold += item.quantity;
        productMap[pId].totalRevenue += itemRev;
        productMap[pId].totalCogs += cogs;
        productMap[pId].grossProfit += (itemRev - cogs);
      }

      const dateKey = order.createdAt.toISOString().slice(0, 10);
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          revenue: 0,
          cogs: 0,
          profit: 0,
          ordersCount: 0
        };
      }
      dailyMap[dateKey].revenue += amount;
      dailyMap[dateKey].cogs += orderCogs;
      dailyMap[dateKey].profit += (amount - orderCogs);
      dailyMap[dateKey].ordersCount += 1;
    }
  }

  totalRevenue = Number(totalRevenue.toFixed(2));
  totalCogs = Number(totalCogs.toFixed(2));
  const grossProfit = Number((totalRevenue - totalCogs).toFixed(2));
  const grossProfitMargin = totalRevenue > 0
    ? Number(((grossProfit / totalRevenue) * 100).toFixed(2))
    : 0;

  const statusBreakdown = countByStatus.reduce((acc, curr) => {
    acc[curr.status] = curr._count.id;
    return acc;
  }, {});

  const dailyTrends = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  const productPerformance = Object.values(productMap)
    .map(p => ({
      ...p,
      marginPercent: p.totalRevenue > 0 ? Number(((p.grossProfit / p.totalRevenue) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    period: {
      startDate: where.createdAt?.gte || null,
      endDate: where.createdAt?.lte || null
    },
    totalOrders,
    completedOrdersRevenue: totalRevenue,
    completedOrdersCogs: totalCogs,
    grossProfit,
    grossProfitMargin: `${grossProfitMargin}%`,
    totalItemsSold,
    statusBreakdown,
    paymentMethodBreakdown,
    paymentMethodDetails,
    dailyTrends,
    productPerformance
  };
};

module.exports = {
  createOrderWithItems,
  findOrders,
  findOrderById,
  updateOrderStatus,
  deleteOrder,
  aggregateOrderStats
};
