const prisma = require('../config/database');

const findProductById = async (id, includeRelations = false) => {
  return prisma.product.findUnique({
    where: { id },
    include: includeRelations
      ? {
          recipeItems: {
            include: {
              rawMaterial: true
            }
          }
        }
      : undefined
  });
};

const findAllProducts = async ({ skip = 0, take = 20, search, category, isActive } = {}) => {
  const where = {};

  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive'
    };
  }

  if (category) {
    where.category = {
      equals: category,
      mode: 'insensitive'
    };
  }

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'asc' }
    })
  ]);

  return { total, products };
};

const createProduct = async (data) => {
  return prisma.product.create({
    data
  });
};

const updateProduct = async (id, data) => {
  return prisma.product.update({
    where: { id },
    data
  });
};

const deleteProduct = async (id) => {
  return prisma.product.delete({
    where: { id }
  });
};

module.exports = {
  findProductById,
  findAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
