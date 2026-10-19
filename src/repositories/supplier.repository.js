const prisma = require('../config/database');

const findSuppliers = async (where, skip, take) => {
  return prisma.supplier.findMany({
    where,
    skip,
    take,
    include: {
      _count: {
        select: { rawMaterials: true }
      }
    },
    orderBy: { id: 'desc' }
  });
};

const countSuppliers = async (where) => {
  return prisma.supplier.count({ where });
};

const findSupplierById = async (id) => {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      rawMaterials: {
        orderBy: { id: 'desc' }
      }
    }
  });
};

const findSupplierByName = async (name) => {
  return prisma.supplier.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' }
    }
  });
};

const createSupplier = async (data) => {
  return prisma.supplier.create({
    data
  });
};

const updateSupplier = async (id, data) => {
  return prisma.supplier.update({
    where: { id },
    data
  });
};

const deleteSupplier = async (id) => {
  return prisma.supplier.delete({
    where: { id }
  });
};

module.exports = {
  findSuppliers,
  countSuppliers,
  findSupplierById,
  findSupplierByName,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
