const productRepository = require('../repositories/product.repository');
const { deleteFile } = require('../utils/file.util');

const formatProductResponse = (product) => {
  if (!product) return null;

  const sellingPrice = Number(product.sellingPrice);
  const response = {
    id: product.id.toString(),
    name: product.name,
    category: product.category,
    sellingPrice,
    imageUrl: product.imageUrl || null,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };

  if (product.recipeItems) {
    const formattedRecipe = product.recipeItems.map((item) => {
      const quantityRequired = Number(item.quantityRequired);
      const costPerUnit = item.rawMaterial ? Number(item.rawMaterial.costPerUnit) : 0;
      const stock = item.rawMaterial ? Number(item.rawMaterial.stock) : 0;
      const minStockAlert = item.rawMaterial ? Number(item.rawMaterial.minStockAlert) : 0;
      const itemCost = Number((quantityRequired * costPerUnit).toFixed(2));
      const isInsufficient = stock < quantityRequired;
      const isLowStock = stock <= minStockAlert;
      const maxPortions = quantityRequired > 0 ? Math.floor(stock / quantityRequired) : 0;

      return {
        id: item.id.toString(),
        rawMaterialId: item.rawMaterialId.toString(),
        rawMaterialName: item.rawMaterial ? item.rawMaterial.name : undefined,
        unit: item.rawMaterial ? item.rawMaterial.unit : undefined,
        stock,
        minStockAlert,
        costPerUnit,
        quantityRequired,
        itemCost,
        isInsufficient,
        isLowStock,
        maxPortions
      };
    });

    const totalRecipeCost = Number(
      formattedRecipe.reduce((acc, curr) => acc + (curr.itemCost || 0), 0).toFixed(2)
    );

    const hasRecipe = formattedRecipe.length > 0;
    const emptyIngredients = formattedRecipe.filter((i) => i.isInsufficient);
    const lowStockIngredients = formattedRecipe.filter((i) => i.isLowStock && !i.isInsufficient);

    // Out of stock if:
    // 1) Any recipe ingredient has stock < quantityRequired (empty / insufficient), OR
    // 2) Any recipe ingredient has stock <= minStockAlert (stok menipis)
    const isOutOfStock = hasRecipe && (emptyIngredients.length > 0 || lowStockIngredients.length > 0);

    let stockStatus = 'AVAILABLE';
    if (isOutOfStock) {
      stockStatus = emptyIngredients.length > 0 ? 'EMPTY' : 'LOW_STOCK';
    }

    const maxPortionsAvailable = hasRecipe
      ? Math.min(...formattedRecipe.map((i) => i.maxPortions))
      : null;

    response.recipe = {
      items: formattedRecipe,
      totalRecipeCost,
      estimatedGrossProfit: Number((sellingPrice - totalRecipeCost).toFixed(2)),
      isOutOfStock,
      stockStatus,
      maxPortionsAvailable,
      emptyIngredients: emptyIngredients.map((i) => ({
        rawMaterialName: i.rawMaterialName,
        required: i.quantityRequired,
        available: i.stock,
        unit: i.unit
      })),
      lowStockIngredients: lowStockIngredients.map((i) => ({
        rawMaterialName: i.rawMaterialName,
        available: i.stock,
        minStockAlert: i.minStockAlert,
        unit: i.unit
      }))
    };

    response.isOutOfStock = isOutOfStock;
    response.stockStatus = stockStatus;
    response.maxPortionsAvailable = maxPortionsAvailable;
  } else {
    response.isOutOfStock = false;
    response.stockStatus = 'AVAILABLE';
    response.maxPortionsAvailable = null;
  }

  return response;
};

const getProducts = async ({ page = 1, limit = 20, search, category, isActive } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  let parsedIsActive;
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    parsedIsActive = isActive === 'true' || isActive === true;
  }

  const { total, products } = await productRepository.findAllProducts({
    skip,
    take: limitNum,
    search: search ? String(search).trim() : undefined,
    category: category ? String(category).trim() : undefined,
    isActive: parsedIsActive
  });

  return {
    products: products.map(formatProductResponse),
    pagination: {
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum
    }
  };
};

const getProductById = async (id) => {
  let productId;
  try {
    productId = BigInt(id);
  } catch {
    throw new Error('Invalid product ID');
  }

  const product = await productRepository.findProductById(productId, true);
  if (!product) {
    throw new Error('Product not found');
  }

  return formatProductResponse(product);
};

const createProduct = async ({ name, category, sellingPrice, isActive = true, file }) => {
  if (!name || !name.trim()) {
    throw new Error('Product name is required');
  }
  if (!category || !category.trim()) {
    throw new Error('Category is required');
  }

  const parsedPrice = parseFloat(sellingPrice);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    throw new Error('Selling price must be a valid number greater than or equal to 0');
  }

  let parsedIsActive = true;
  if (isActive !== undefined && isActive !== null) {
    parsedIsActive = typeof isActive === 'boolean' ? isActive : isActive === 'true';
  }

  const imageUrl = file ? `/uploads/products/${file.filename}` : null;

  const newProduct = await productRepository.createProduct({
    name: name.trim(),
    category: category.trim(),
    sellingPrice: parsedPrice,
    imageUrl,
    isActive: parsedIsActive
  });

  return formatProductResponse(newProduct);
};

const updateProduct = async (id, { name, category, sellingPrice, isActive, file, removeImage }) => {
  let productId;
  try {
    productId = BigInt(id);
  } catch {
    throw new Error('Invalid product ID');
  }

  const existingProduct = await productRepository.findProductById(productId);
  if (!existingProduct) {
    throw new Error('Product not found');
  }

  const updateData = {};

  if (name !== undefined) {
    if (!name.trim()) throw new Error('Product name cannot be empty');
    updateData.name = name.trim();
  }

  if (category !== undefined) {
    if (!category.trim()) throw new Error('Category cannot be empty');
    updateData.category = category.trim();
  }

  if (sellingPrice !== undefined) {
    const parsedPrice = parseFloat(sellingPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new Error('Selling price must be a valid number greater than or equal to 0');
    }
    updateData.sellingPrice = parsedPrice;
  }

  if (isActive !== undefined) {
    updateData.isActive = typeof isActive === 'boolean' ? isActive : isActive === 'true';
  }

  // Handle image replacement or removal
  if (file) {
    if (existingProduct.imageUrl) {
      deleteFile(existingProduct.imageUrl);
    }
    updateData.imageUrl = `/uploads/products/${file.filename}`;
  } else if (removeImage === true || removeImage === 'true') {
    if (existingProduct.imageUrl) {
      deleteFile(existingProduct.imageUrl);
    }
    updateData.imageUrl = null;
  }

  const updatedProduct = await productRepository.updateProduct(productId, updateData);
  return formatProductResponse(updatedProduct);
};

const deleteProduct = async (id) => {
  let productId;
  try {
    productId = BigInt(id);
  } catch {
    throw new Error('Invalid product ID');
  }

  const existingProduct = await productRepository.findProductById(productId);
  if (!existingProduct) {
    throw new Error('Product not found');
  }

  await productRepository.deleteProduct(productId);

  // Clean up image file if product had an image
  if (existingProduct.imageUrl) {
    deleteFile(existingProduct.imageUrl);
  }

  return { message: 'Product deleted successfully' };
};

module.exports = {
  formatProductResponse,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
