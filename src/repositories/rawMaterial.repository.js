const prisma = require('../config/database');

const findRawMaterials = async (where, skip, take) => {
  return prisma.rawMaterial.findMany({
    where,
    skip,
    take,
    include: {
      supplier: true
    },
    orderBy: { id: 'desc' }
  });
};

const countRawMaterials = async (where) => {
  return prisma.rawMaterial.count({ where });
};

const findRawMaterialById = async (id) => {
  return prisma.rawMaterial.findUnique({
    where: { id },
    include: {
      supplier: true,
      recipeItems: {
        include: {
          product: true
        }
      }
    }
  });
};

const findRawMaterialByName = async (name) => {
  return prisma.rawMaterial.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' }
    }
  });
};

const createRawMaterial = async (data) => {
  return prisma.rawMaterial.create({
    data,
    include: {
      supplier: true
    }
  });
};

const updateRawMaterial = async (id, data) => {
  return prisma.rawMaterial.update({
    where: { id },
    data,
    include: {
      supplier: true
    }
  });
};

const updateStock = async (id, newStock) => {
  return prisma.rawMaterial.update({
    where: { id },
    data: {
      stock: newStock
    },
    include: {
      supplier: true
    }
  });
};

const deleteRawMaterial = async (id) => {
  return prisma.rawMaterial.delete({
    where: { id }
  });
};

const countRecipeItemsByRawMaterialId = async (rawMaterialId) => {
  return prisma.recipeItem.count({
    where: { rawMaterialId }
  });
};

const findLowStockRawMaterialIds = async () => {
  const rows = await prisma.$queryRaw`SELECT id FROM raw_materials WHERE stock <= min_stock_alert`;
  return rows.map((r) => r.id);
};

module.exports = {
  findRawMaterials,
  countRawMaterials,
  findRawMaterialById,
  findRawMaterialByName,
  createRawMaterial,
  updateRawMaterial,
  updateStock,
  deleteRawMaterial,
  countRecipeItemsByRawMaterialId,
  findLowStockRawMaterialIds
};

