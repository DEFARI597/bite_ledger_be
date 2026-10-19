const prisma = require('../config/database');

const findRecipeItemsByProductId = async (productId) => {
  return prisma.recipeItem.findMany({
    where: { productId },
    include: {
      rawMaterial: true,
      product: true
    },
    orderBy: { id: 'asc' }
  });
};

const findRecipeItemById = async (id) => {
  return prisma.recipeItem.findUnique({
    where: { id },
    include: {
      rawMaterial: true,
      product: true
    }
  });
};

const findRecipeItem = async (productId, rawMaterialId) => {
  return prisma.recipeItem.findUnique({
    where: {
      productId_rawMaterialId: {
        productId,
        rawMaterialId
      }
    }
  });
};

const createRecipeItem = async (data) => {
  return prisma.recipeItem.create({
    data,
    include: {
      rawMaterial: true,
      product: true
    }
  });
};

const updateRecipeItem = async (id, data) => {
  return prisma.recipeItem.update({
    where: { id },
    data,
    include: {
      rawMaterial: true,
      product: true
    }
  });
};

const deleteRecipeItem = async (id) => {
  return prisma.recipeItem.delete({
    where: { id }
  });
};

const syncProductRecipe = async (productId, items) => {
  return prisma.$transaction(async (tx) => {
    await tx.recipeItem.deleteMany({
      where: { productId }
    });

    if (items && items.length > 0) {
      await tx.recipeItem.createMany({
        data: items.map((item) => ({
          productId,
          rawMaterialId: item.rawMaterialId,
          quantityRequired: item.quantityRequired
        }))
      });
    }

    return tx.recipeItem.findMany({
      where: { productId },
      include: {
        rawMaterial: true,
        product: true
      },
      orderBy: { id: 'asc' }
    });
  });
};

const findProductById = async (productId) => {
  return prisma.product.findUnique({
    where: { id: productId }
  });
};

const findAllProducts = async () => {
  return prisma.product.findMany({
    orderBy: { id: 'asc' }
  });
};

module.exports = {
  findRecipeItemsByProductId,
  findRecipeItemById,
  findRecipeItem,
  createRecipeItem,
  updateRecipeItem,
  deleteRecipeItem,
  syncProductRecipe,
  findProductById,
  findAllProducts
};

