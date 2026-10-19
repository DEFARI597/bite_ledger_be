const supplierRepository = require('../repositories/supplier.repository');

const formatSupplierResponse = (supplier) => {
  if (!supplier) return null;

  const formatted = {
    id: supplier.id.toString(),
    name: supplier.name,
    contactPerson: supplier.contactPerson || null,
    phone: supplier.phone || null,
    address: supplier.address || null,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt
  };

  if (supplier._count && typeof supplier._count.rawMaterials === 'number') {
    formatted.rawMaterialsCount = supplier._count.rawMaterials;
  }

  if (Array.isArray(supplier.rawMaterials)) {
    formatted.rawMaterials = supplier.rawMaterials.map((rm) => ({
      id: rm.id.toString(),
      name: rm.name,
      unit: rm.unit,
      stock: Number(rm.stock),
      costPerUnit: Number(rm.costPerUnit),
      minStockAlert: Number(rm.minStockAlert),
      productionDate: rm.productionDate,
      expDate: rm.expDate,
      createdAt: rm.createdAt,
      updatedAt: rm.updatedAt
    }));
  }

  return formatted;
};

const getSuppliers = async ({ page = 1, limit = 10, search = '' }) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (currentPage - 1) * take;

  const where = {};

  if (search && search.trim() !== '') {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { contactPerson: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } }
    ];
  }

  const [suppliers, total] = await Promise.all([
    supplierRepository.findSuppliers(where, skip, take),
    supplierRepository.countSuppliers(where)
  ]);

  const sanitizedSuppliers = suppliers.map(formatSupplierResponse);
  const totalPages = Math.ceil(total / take) || 1;

  return {
    suppliers: sanitizedSuppliers,
    pagination: {
      total,
      page: currentPage,
      limit: take,
      totalPages
    }
  };
};

const getSupplierById = async (id) => {
  let supplierId;
  try {
    supplierId = BigInt(id);
  } catch {
    throw new Error('Invalid supplier ID');
  }

  const supplier = await supplierRepository.findSupplierById(supplierId);
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  return formatSupplierResponse(supplier);
};

const createSupplier = async ({ name, contactPerson, phone, address }) => {
  if (!name || !name.trim()) {
    throw new Error('Supplier name is required');
  }

  const newSupplier = await supplierRepository.createSupplier({
    name: name.trim(),
    contactPerson: contactPerson ? contactPerson.trim() : null,
    phone: phone ? phone.trim() : null,
    address: address ? address.trim() : null
  });

  return formatSupplierResponse(newSupplier);
};

const updateSupplier = async (id, { name, contactPerson, phone, address }) => {
  let supplierId;
  try {
    supplierId = BigInt(id);
  } catch {
    throw new Error('Invalid supplier ID');
  }

  const existingSupplier = await supplierRepository.findSupplierById(supplierId);
  if (!existingSupplier) {
    throw new Error('Supplier not found');
  }

  const data = {};

  if (name !== undefined) {
    if (!name || !name.trim()) {
      throw new Error('Supplier name cannot be empty');
    }
    data.name = name.trim();
  }

  if (contactPerson !== undefined) {
    data.contactPerson = contactPerson ? contactPerson.trim() : null;
  }

  if (phone !== undefined) {
    data.phone = phone ? phone.trim() : null;
  }

  if (address !== undefined) {
    data.address = address ? address.trim() : null;
  }

  const updatedSupplier = await supplierRepository.updateSupplier(supplierId, data);
  return formatSupplierResponse(updatedSupplier);
};

const deleteSupplier = async (id) => {
  let supplierId;
  try {
    supplierId = BigInt(id);
  } catch {
    throw new Error('Invalid supplier ID');
  }

  const existingSupplier = await supplierRepository.findSupplierById(supplierId);
  if (!existingSupplier) {
    throw new Error('Supplier not found');
  }

  await supplierRepository.deleteSupplier(supplierId);
  return { message: 'Supplier deleted successfully' };
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  formatSupplierResponse
};
