const orderRepository = require('../repositories/order.repository');
const prisma = require('../config/database');

const formatOrderResponse = (order) => {
  if (!order) return null;

  const totalAmount = Number(order.totalAmount);

  let formattedItems = [];
  let totalItemsCount = 0;
  let totalCogs = 0;

  if (order.orderItems && Array.isArray(order.orderItems)) {
    formattedItems = order.orderItems.map((item) => {
      const quantity = item.quantity;
      const unitPrice = Number(item.unitPrice);
      const unitCogs = Number(item.unitCogs);
      const subtotal = Number(
        item.subtotal !== undefined && item.subtotal !== null
          ? item.subtotal
          : (quantity * unitPrice).toFixed(2)
      );
      const itemCogs = Number((quantity * unitCogs).toFixed(2));
      const itemProfit = Number((subtotal - itemCogs).toFixed(2));

      totalItemsCount += quantity;
      totalCogs += itemCogs;

      return {
        id: item.id.toString(),
        orderId: item.orderId ? item.orderId.toString() : order.id.toString(),
        productId: item.productId.toString(),
        productName: item.product ? item.product.name : undefined,
        category: item.product ? item.product.category : undefined,
        imageUrl: item.product ? item.product.imageUrl : undefined,
        quantity,
        unitPrice,
        unitCogs,
        subtotal,
        itemCogs,
        itemProfit
      };
    });
  }

  totalCogs = Number(totalCogs.toFixed(2));
  const grossProfit = Number((totalAmount - totalCogs).toFixed(2));
  const grossProfitMargin = totalAmount > 0
    ? Number(((grossProfit / totalAmount) * 100).toFixed(2))
    : 0;

  return {
    id: order.id.toString(),
    userId: order.userId.toString(),
    user: order.user
      ? {
          id: order.user.id.toString(),
          name: order.user.name,
          email: order.user.email,
          role: order.user.role ? order.user.role.name : undefined
        }
      : undefined,
    totalAmount,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt,
    summary: {
      totalItems: totalItemsCount,
      totalCogs,
      grossProfit,
      grossProfitMargin: `${grossProfitMargin}%`
    },
    items: formattedItems
  };
};

const getOrders = async ({
  page = 1,
  limit = 20,
  status,
  paymentMethod,
  userId,
  startDate,
  endDate,
  search
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (status && status.trim() !== '') {
    where.status = {
      equals: status.trim().toLowerCase(),
      mode: 'insensitive'
    };
  }

  if (paymentMethod && paymentMethod.trim() !== '') {
    where.paymentMethod = {
      equals: paymentMethod.trim().toLowerCase(),
      mode: 'insensitive'
    };
  }

  if (userId) {
    try {
      where.userId = BigInt(userId);
    } catch {
      // Ignore invalid user id format
    }
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      where.createdAt.lte = new Date(end.setHours(23, 59, 59, 999));
    }
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    const conditions = [
      {
        user: {
          name: {
            contains: term,
            mode: 'insensitive'
          }
        }
      }
    ];

    try {
      conditions.push({ id: BigInt(term) });
    } catch {
      // Non-numeric search term
    }

    where.OR = conditions;
  }

  const { total, orders } = await orderRepository.findOrders({
    where,
    skip,
    take: limitNum,
    orderBy: { createdAt: 'desc' }
  });

  return {
    orders: orders.map(formatOrderResponse),
    pagination: {
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum
    }
  };
};

const getOrderById = async (id) => {
  let orderId;
  try {
    orderId = BigInt(id);
  } catch {
    throw new Error('Invalid order ID');
  }

  const order = await orderRepository.findOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  return formatOrderResponse(order);
};

const createOrder = async ({ userId, paymentMethod, status = 'completed', items }) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  let parsedUserId;
  try {
    parsedUserId = BigInt(userId);
  } catch {
    throw new Error('Invalid user ID');
  }

  if (!paymentMethod || typeof paymentMethod !== 'string' || !paymentMethod.trim()) {
    throw new Error('Payment method is required');
  }

  const trimmedPayment = paymentMethod.trim().toLowerCase();
  if (trimmedPayment.length > 20) {
    throw new Error('Payment method must be 20 characters or less');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  const productQuantities = new Map();
  for (const item of items) {
    if (!item.productId) {
      throw new Error('Product ID is required for each item');
    }

    let pId;
    try {
      pId = BigInt(item.productId);
    } catch {
      throw new Error(`Invalid product ID: ${item.productId}`);
    }

    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Quantity must be a positive integer for product ID: ${item.productId}`);
    }

    const currentQty = productQuantities.get(pId) || 0;
    productQuantities.set(pId, currentQty + qty);
  }

  const productIds = Array.from(productQuantities.keys());
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds }
    },
    include: {
      recipeItems: {
        include: {
          rawMaterial: true
        }
      }
    }
  });

  if (products.length !== productIds.length) {
    const foundIds = new Set(products.map((p) => p.id.toString()));
    const missing = productIds.filter((id) => !foundIds.has(id.toString()));
    throw new Error(`Product(s) not found: ${missing.join(', ')}`);
  }

  for (const product of products) {
    if (!product.isActive) {
      throw new Error(`Product "${product.name}" is not active and cannot be ordered`);
    }
  }

  const productMap = new Map(products.map((p) => [p.id.toString(), p]));
  let totalAmount = 0;
  const preparedItems = [];
  const rawMaterialDeductionMap = new Map();

  for (const [pId, qty] of productQuantities.entries()) {
    const product = productMap.get(pId.toString());
    const unitPrice = Number(product.sellingPrice);

    let unitCogs = 0;
    if (product.recipeItems && product.recipeItems.length > 0) {
      unitCogs = product.recipeItems.reduce((acc, curr) => {
        const qtyReq = Number(curr.quantityRequired);
        const cost = curr.rawMaterial ? Number(curr.rawMaterial.costPerUnit) : 0;
        return acc + qtyReq * cost;
      }, 0);

      // Accumulate raw material deductions for products that have recipes/BOM applied
      for (const recipeItem of product.recipeItems) {
        const rmId = recipeItem.rawMaterialId.toString();
        const rm = recipeItem.rawMaterial;
        const needed = Number(recipeItem.quantityRequired) * qty;

        if (rawMaterialDeductionMap.has(rmId)) {
          const existing = rawMaterialDeductionMap.get(rmId);
          existing.deductQuantity = Number((existing.deductQuantity + needed).toFixed(3));
        } else {
          rawMaterialDeductionMap.set(rmId, {
            rawMaterialId: recipeItem.rawMaterialId,
            rawMaterialName: rm ? rm.name : 'Unknown Raw Material',
            unit: rm ? rm.unit : '',
            currentStock: rm ? Number(rm.stock) : 0,
            deductQuantity: Number(needed.toFixed(3))
          });
        }
      }
    }
    unitCogs = Number(unitCogs.toFixed(2));

    const subtotal = Number((qty * unitPrice).toFixed(2));
    totalAmount += subtotal;

    preparedItems.push({
      productId: product.id,
      quantity: qty,
      unitPrice,
      unitCogs
    });
  }

  // Pre-validate stock availability for all required raw materials
  for (const deduction of rawMaterialDeductionMap.values()) {
    if (deduction.currentStock < deduction.deductQuantity) {
      throw new Error(
        `Stok bahan baku tidak mencukupi untuk '${deduction.rawMaterialName}'. Tersedia: ${deduction.currentStock} ${deduction.unit}, Dibutuhkan: ${deduction.deductQuantity} ${deduction.unit}`
      );
    }
  }

  totalAmount = Number(totalAmount.toFixed(2));

  const validStatuses = ['pending', 'cooking', 'ready', 'completed', 'cancelled'];
  const finalStatus = status && validStatuses.includes(status.toLowerCase())
    ? status.toLowerCase()
    : 'pending';

  const order = await orderRepository.createOrderWithItems({
    userId: parsedUserId,
    totalAmount,
    paymentMethod: trimmedPayment,
    status: finalStatus,
    items: preparedItems,
    rawMaterialDeductions: Array.from(rawMaterialDeductionMap.values())
  });

  return formatOrderResponse(order);
};

const updateOrderStatus = async (id, status) => {
  let orderId;
  try {
    orderId = BigInt(id);
  } catch {
    throw new Error('Invalid order ID');
  }

  if (!status || typeof status !== 'string') {
    throw new Error('Status is required');
  }

  const validStatuses = ['pending', 'cooking', 'ready', 'completed', 'cancelled'];
  const normalizedStatus = status.trim().toLowerCase();
  if (!validStatuses.includes(normalizedStatus)) {
    throw new Error(`Invalid status. Allowed values: ${validStatuses.join(', ')}`);
  }

  const existingOrder = await orderRepository.findOrderById(orderId);
  if (!existingOrder) {
    throw new Error('Order not found');
  }

  const updatedOrder = await orderRepository.updateOrderStatus(orderId, normalizedStatus);
  return formatOrderResponse(updatedOrder);
};

const deleteOrder = async (id) => {
  let orderId;
  try {
    orderId = BigInt(id);
  } catch {
    throw new Error('Invalid order ID');
  }

  const existingOrder = await orderRepository.findOrderById(orderId);
  if (!existingOrder) {
    throw new Error('Order not found');
  }

  await orderRepository.deleteOrder(orderId);
  return { message: 'Order deleted successfully' };
};

const getOrderStatistics = async ({ startDate, endDate } = {}) => {
  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      where.createdAt.lte = new Date(end.setHours(23, 59, 59, 999));
    }
  }

  return orderRepository.aggregateOrderStats(where);
};

module.exports = {
  formatOrderResponse,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStatistics
};
