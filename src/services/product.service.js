const productRepository = require('../repositories/product.repository');

const formatProductResponse = (product) => {
  if (!product) return null;

  const sellingPrice = Number(product.sellingPrice);
  const response = {
    id: product.id.toString(),
    name: product.name,
    category: product.category,
    sellingPrice,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };

  if (product.recipeItems) {
    const formattedRecipe = product.recipeItems.map((item) => {
      const quantityRequired = Number(item.quantityRequired);
      const costPerUnit = item.rawMaterial ? Number(item.rawMaterial.costPerUnit) : 0;
      const itemCost = Number((quantityRequired * costPerUnit).toFixed(2));
      return {
        id: item.id.toString(),
        rawMaterialId: item.rawMaterialId.toString(),
        rawMaterialName: item.rawMaterial ? item.rawMaterial.name : undefined,
        unit: item.rawMaterial ? item.rawMaterial.unit : undefined,
        costPerUnit,
        quantityRequired,
        itemCost
      };
    });

    const totalRecipeCost = Number(
      formattedRecipe.reduce((acc, curr) => acc + (curr.itemCost || 0), 0).toFixed(2)
    );

    response.recipe = {
      items: formattedRecipe,
      totalRecipeCost,
      estimatedGrossProfit: Number((sellingPrice - totalRecipeCost).toFixed(2))
    };
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

const createProduct = async ({ name, category, sellingPrice, isActive = true }) => {
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

  const newProduct = await productRepository.createProduct({
    name: name.trim(),
    category: category.trim(),
    sellingPrice: parsedPrice,
    isActive: typeof isActive === 'boolean' ? isActive : true
  });

  return formatProductResponse(newProduct);
};

const updateProduct = async (id, { name, category, sellingPrice, isActive }) => {
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
