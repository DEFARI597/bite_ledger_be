const recipeItemRepository = require('../repositories/recipeItem.repository');
const rawMaterialRepository = require('../repositories/rawMaterial.repository');
const productRepository = require('../repositories/product.repository');

const formatRecipeItemResponse = (item) => {
  if (!item) return null;

  const quantityRequired = Number(item.quantityRequired);
  const costPerUnit = item.rawMaterial ? Number(item.rawMaterial.costPerUnit) : 0;
  const itemCost = Number((quantityRequired * costPerUnit).toFixed(2));

  return {
    id: item.id.toString(),
    productId: item.productId.toString(),
    productName: item.product ? item.product.name : undefined,
    rawMaterialId: item.rawMaterialId.toString(),
    rawMaterialName: item.rawMaterial ? item.rawMaterial.name : undefined,
    unit: item.rawMaterial ? item.rawMaterial.unit : undefined,
    stock: item.rawMaterial ? Number(item.rawMaterial.stock) : undefined,
    costPerUnit,
    quantityRequired,
    itemCost
  };
};

const getRecipeByProductId = async (productId) => {
  let parsedProductId;
  try {
    parsedProductId = BigInt(productId);
  } catch {
    throw new Error('Invalid product ID');
  }

  const product = await productRepository.findProductById(parsedProductId);
  if (!product) {
    throw new Error('Product not found');
  }

  const items = await recipeItemRepository.findRecipeItemsByProductId(parsedProductId);
  const formattedItems = items.map(formatRecipeItemResponse);

  const totalRecipeCost = Number(
    formattedItems.reduce((acc, curr) => acc + (curr.itemCost || 0), 0).toFixed(2)
  );

  return {
    productId: product.id.toString(),
    productName: product.name,
    category: product.category,
    sellingPrice: Number(product.sellingPrice),
    items: formattedItems,
    totalRecipeCost
  };
};

const getRecipeItemById = async (id) => {
  let itemId;
  try {
    itemId = BigInt(id);
  } catch {
    throw new Error('Invalid recipe item ID');
  }

  const item = await recipeItemRepository.findRecipeItemById(itemId);
  if (!item) {
    throw new Error('Recipe item not found');
  }

  return formatRecipeItemResponse(item);
};

const addRecipeItem = async ({ productId, rawMaterialId, quantityRequired }) => {
  if (!productId) {
    throw new Error('Product ID is required');
  }
  if (!rawMaterialId) {
    throw new Error('Raw material ID is required');
  }

  let parsedProductId, parsedRawMaterialId;
  try {
    parsedProductId = BigInt(productId);
  } catch {
    throw new Error('Invalid product ID');
  }

  try {
    parsedRawMaterialId = BigInt(rawMaterialId);
  } catch {
    throw new Error('Invalid raw material ID');
  }

  const parsedQuantity = parseFloat(quantityRequired);
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    throw new Error('Quantity required must be a number greater than 0');
  }

  const product = await productRepository.findProductById(parsedProductId);
  if (!product) {
    throw new Error('Product not found');
  }

  const rawMaterial = await rawMaterialRepository.findRawMaterialById(parsedRawMaterialId);
  if (!rawMaterial) {
    throw new Error('Raw material not found');
  }

  const existingItem = await recipeItemRepository.findRecipeItem(
    parsedProductId,
    parsedRawMaterialId
  );
  if (existingItem) {
    throw new Error('Raw material already exists in this product recipe');
  }

  const newItem = await recipeItemRepository.createRecipeItem({
    productId: parsedProductId,
    rawMaterialId: parsedRawMaterialId,
    quantityRequired: parsedQuantity
  });

  return formatRecipeItemResponse(newItem);
};

const updateRecipeItem = async (id, { quantityRequired }) => {
  let itemId;
  try {
    itemId = BigInt(id);
  } catch {
    throw new Error('Invalid recipe item ID');
  }

  const existingItem = await recipeItemRepository.findRecipeItemById(itemId);
  if (!existingItem) {
    throw new Error('Recipe item not found');
  }

  const parsedQuantity = parseFloat(quantityRequired);
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    throw new Error('Quantity required must be a number greater than 0');
  }

  const updatedItem = await recipeItemRepository.updateRecipeItem(itemId, {
    quantityRequired: parsedQuantity
  });

  return formatRecipeItemResponse(updatedItem);
};

const deleteRecipeItem = async (id) => {
  let itemId;
  try {
    itemId = BigInt(id);
  } catch {
    throw new Error('Invalid recipe item ID');
  }

  const existingItem = await recipeItemRepository.findRecipeItemById(itemId);
  if (!existingItem) {
    throw new Error('Recipe item not found');
  }

  await recipeItemRepository.deleteRecipeItem(itemId);
  return { message: 'Recipe item deleted successfully' };
};

const syncProductRecipe = async (productId, items = []) => {
  let parsedProductId;
  try {
    parsedProductId = BigInt(productId);
  } catch {
    throw new Error('Invalid product ID');
  }

  const product = await productRepository.findProductById(parsedProductId);
  if (!product) {
    throw new Error('Product not found');
  }

  if (!Array.isArray(items)) {
    throw new Error('Items must be an array of recipe items');
  }

  const seenMaterialIds = new Set();
  const preparedItems = [];

  for (const item of items) {
    let parsedMaterialId;
    try {
      parsedMaterialId = BigInt(item.rawMaterialId);
    } catch {
      throw new Error(`Invalid rawMaterialId: ${item.rawMaterialId}`);
    }

    if (seenMaterialIds.has(parsedMaterialId.toString())) {
      throw new Error(`Duplicate raw material ID in recipe items: ${item.rawMaterialId}`);
    }
    seenMaterialIds.add(parsedMaterialId.toString());

    const material = await rawMaterialRepository.findRawMaterialById(parsedMaterialId);
    if (!material) {
      throw new Error(`Raw material not found for ID: ${item.rawMaterialId}`);
    }

    const parsedQty = parseFloat(item.quantityRequired);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      throw new Error(`Quantity required must be greater than 0 for raw material: ${material.name}`);
    }

    preparedItems.push({
      rawMaterialId: parsedMaterialId,
      quantityRequired: parsedQty
    });
  }

  const savedItems = await recipeItemRepository.syncProductRecipe(parsedProductId, preparedItems);
  const formattedItems = savedItems.map(formatRecipeItemResponse);

  const totalRecipeCost = Number(
    formattedItems.reduce((acc, curr) => acc + (curr.itemCost || 0), 0).toFixed(2)
  );

  return {
    productId: product.id.toString(),
    productName: product.name,
    category: product.category,
    sellingPrice: Number(product.sellingPrice),
    items: formattedItems,
    totalRecipeCost
  };
};

const getRecipeItems = async ({ page = 1, limit = 20, productId, rawMaterialId } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  let parsedProductId;
  if (productId) {
    try {
      parsedProductId = BigInt(productId);
    } catch {
      throw new Error('Invalid product ID');
    }
  }

  let parsedRawMaterialId;
  if (rawMaterialId) {
    try {
      parsedRawMaterialId = BigInt(rawMaterialId);
    } catch {
      throw new Error('Invalid raw material ID');
    }
  }

  const { total, items } = await recipeItemRepository.findAllRecipeItems({
    skip,
    take: limitNum,
    productId: parsedProductId,
    rawMaterialId: parsedRawMaterialId
  });

  return {
    items: items.map(formatRecipeItemResponse),
    pagination: {
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum
    }
  };
};

const getRecipesByRawMaterialId = async (rawMaterialId) => {
  let parsedMaterialId;
  try {
    parsedMaterialId = BigInt(rawMaterialId);
  } catch {
    throw new Error('Invalid raw material ID');
  }

  const material = await rawMaterialRepository.findRawMaterialById(parsedMaterialId);
  if (!material) {
    throw new Error('Raw material not found');
  }

  const items = await recipeItemRepository.findRecipeItemsByRawMaterialId(parsedMaterialId);

  return {
    rawMaterialId: material.id.toString(),
    rawMaterialName: material.name,
    unit: material.unit,
    stock: Number(material.stock),
    costPerUnit: Number(material.costPerUnit),
    usedInProductsCount: items.length,
    products: items.map(formatRecipeItemResponse)
  };
};

module.exports = {
  getRecipeItems,
  getRecipesByRawMaterialId,
  getRecipeByProductId,
  getRecipeItemById,
  addRecipeItem,
  updateRecipeItem,
  deleteRecipeItem,
  syncProductRecipe,
  formatRecipeItemResponse
};

