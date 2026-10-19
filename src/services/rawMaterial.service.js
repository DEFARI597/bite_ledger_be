const rawMaterialRepository = require('../repositories/rawMaterial.repository');
const supplierRepository = require('../repositories/supplier.repository');

const formatRawMaterialResponse = (material) => {
  if (!material) return null;

  const stock = Number(material.stock);
  const minStockAlert = Number(material.minStockAlert);
  const costPerUnit = Number(material.costPerUnit);

  const formatted = {
    id: material.id.toString(),
    supplierId: material.supplierId ? material.supplierId.toString() : null,
    name: material.name,
    unit: material.unit,
    stock,
    costPerUnit,
    minStockAlert,
    isLowStock: stock <= minStockAlert,
    productionDate: material.productionDate,
    expDate: material.expDate,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt
  };

  if (material.supplier) {
    formatted.supplier = {
      id: material.supplier.id.toString(),
      name: material.supplier.name,
      contactPerson: material.supplier.contactPerson,
      phone: material.supplier.phone
    };
  }

  if (Array.isArray(material.recipeItems)) {
    formatted.recipes = material.recipeItems.map((item) => ({
      id: item.id.toString(),
      productId: item.productId ? item.productId.toString() : null,
      productName: item.product ? item.product.name : undefined,
      quantityRequired: Number(item.quantityRequired)
    }));
  }

  return formatted;
};

const getRawMaterials = async ({
  page = 1,
  limit = 10,
  search = '',
  supplierId,
  lowStockOnly = false
}) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (currentPage - 1) * take;

  const where = {};

  if (search && search.trim() !== '') {
    where.name = { contains: search.trim(), mode: 'insensitive' };
  }

  if (supplierId) {
    try {
      where.supplierId = BigInt(supplierId);
    } catch {
      // ignore invalid bigint
    }
  }

  const isLowStockFilter = lowStockOnly === true || lowStockOnly === 'true';
  if (isLowStockFilter) {
    const lowStockIds = await rawMaterialRepository.findLowStockRawMaterialIds();
    where.id = { in: lowStockIds };
  }

  const [materials, total] = await Promise.all([
    rawMaterialRepository.findRawMaterials(where, skip, take),
    rawMaterialRepository.countRawMaterials(where)
  ]);

  const sanitizedMaterials = materials.map(formatRawMaterialResponse);
  const totalPages = Math.ceil(total / take) || 1;

  return {
    rawMaterials: sanitizedMaterials,
    pagination: {
      total,
      page: currentPage,
      limit: take,
      totalPages
    }
  };
};

const getRawMaterialById = async (id) => {
  let materialId;
  try {
    materialId = BigInt(id);
  } catch {
    throw new Error('Invalid raw material ID');
  }

  const material = await rawMaterialRepository.findRawMaterialById(materialId);
  if (!material) {
    throw new Error('Raw material not found');
  }

  return formatRawMaterialResponse(material);
};

const createRawMaterial = async ({
  name,
  unit,
  supplierId,
  stock = 0,
  costPerUnit = 0,
  minStockAlert = 0,
  productionDate,
  expDate
}) => {
  if (!name || !name.trim()) {
    throw new Error('Raw material name is required');
  }
  if (!unit || !unit.trim()) {
    throw new Error('Unit is required');
  }

  let parsedSupplierId = null;
  if (supplierId) {
    try {
      parsedSupplierId = BigInt(supplierId);
      const supplier = await supplierRepository.findSupplierById(parsedSupplierId);
      if (!supplier) {
        throw new Error('Supplier not found');
      }
    } catch (e) {
      if (e.message === 'Supplier not found') throw e;
      throw new Error('Invalid supplier ID');
    }
  }

  const parsedStock = parseFloat(stock);
  if (isNaN(parsedStock) || parsedStock < 0) {
    throw new Error('Stock must be a non-negative number');
  }

  const parsedCost = parseFloat(costPerUnit);
  if (isNaN(parsedCost) || parsedCost < 0) {
    throw new Error('Cost per unit must be a non-negative number');
  }

  const parsedMinAlert = parseFloat(minStockAlert);
  if (isNaN(parsedMinAlert) || parsedMinAlert < 0) {
    throw new Error('Minimum stock alert must be a non-negative number');
  }

  const newMaterial = await rawMaterialRepository.createRawMaterial({
    name: name.trim(),
    unit: unit.trim(),
    supplierId: parsedSupplierId,
    stock: parsedStock,
    costPerUnit: parsedCost,
    minStockAlert: parsedMinAlert,
    productionDate: productionDate ? new Date(productionDate) : null,
    expDate: expDate ? new Date(expDate) : null
  });

  return formatRawMaterialResponse(newMaterial);
};

const updateRawMaterial = async (id, {
  name,
  unit,
  supplierId,
  stock,
  costPerUnit,
  minStockAlert,
  productionDate,
  expDate
}) => {
  let materialId;
  try {
    materialId = BigInt(id);
  } catch {
    throw new Error('Invalid raw material ID');
  }

  const existingMaterial = await rawMaterialRepository.findRawMaterialById(materialId);
  if (!existingMaterial) {
    throw new Error('Raw material not found');
  }

  const data = {};

  if (name !== undefined) {
    if (!name || !name.trim()) {
      throw new Error('Raw material name cannot be empty');
    }
    data.name = name.trim();
  }

  if (unit !== undefined) {
    if (!unit || !unit.trim()) {
      throw new Error('Unit cannot be empty');
    }
    data.unit = unit.trim();
  }

  if (supplierId !== undefined) {
    if (supplierId === null || supplierId === '') {
      data.supplierId = null;
    } else {
      try {
        const parsedSupplierId = BigInt(supplierId);
        const supplier = await supplierRepository.findSupplierById(parsedSupplierId);
        if (!supplier) {
          throw new Error('Supplier not found');
        }
        data.supplierId = parsedSupplierId;
      } catch (e) {
        if (e.message === 'Supplier not found') throw e;
        throw new Error('Invalid supplier ID');
      }
    }
  }

  if (stock !== undefined) {
    const parsedStock = parseFloat(stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      throw new Error('Stock must be a non-negative number');
    }
    data.stock = parsedStock;
  }

  if (costPerUnit !== undefined) {
    const parsedCost = parseFloat(costPerUnit);
    if (isNaN(parsedCost) || parsedCost < 0) {
      throw new Error('Cost per unit must be a non-negative number');
    }
    data.costPerUnit = parsedCost;
  }

  if (minStockAlert !== undefined) {
    const parsedMinAlert = parseFloat(minStockAlert);
    if (isNaN(parsedMinAlert) || parsedMinAlert < 0) {
      throw new Error('Minimum stock alert must be a non-negative number');
    }
    data.minStockAlert = parsedMinAlert;
  }

  if (productionDate !== undefined) {
    data.productionDate = productionDate ? new Date(productionDate) : null;
  }

  if (expDate !== undefined) {
    data.expDate = expDate ? new Date(expDate) : null;
  }

  const updatedMaterial = await rawMaterialRepository.updateRawMaterial(materialId, data);
  return formatRawMaterialResponse(updatedMaterial);
};

const adjustStock = async (id, { change, setStock }) => {
  let materialId;
  try {
    materialId = BigInt(id);
  } catch {
    throw new Error('Invalid raw material ID');
  }

  const existingMaterial = await rawMaterialRepository.findRawMaterialById(materialId);
  if (!existingMaterial) {
    throw new Error('Raw material not found');
  }

  let finalStock;
  if (setStock !== undefined) {
    const parsedSet = parseFloat(setStock);
    if (isNaN(parsedSet) || parsedSet < 0) {
      throw new Error('setStock must be a non-negative number');
    }
    finalStock = parsedSet;
  } else if (change !== undefined) {
    const parsedChange = parseFloat(change);
    if (isNaN(parsedChange)) {
      throw new Error('change must be a valid number');
    }
    const currentStock = Number(existingMaterial.stock);
    finalStock = currentStock + parsedChange;
    if (finalStock < 0) {
      throw new Error(`Insufficient stock. Current stock is ${currentStock}, adjustment would result in ${finalStock}`);
    }
  } else {
    throw new Error('Either change or setStock is required');
  }

  const updatedMaterial = await rawMaterialRepository.updateStock(materialId, finalStock);
  return formatRawMaterialResponse(updatedMaterial);
};

const deleteRawMaterial = async (id) => {
  let materialId;
  try {
    materialId = BigInt(id);
  } catch {
    throw new Error('Invalid raw material ID');
  }

  const existingMaterial = await rawMaterialRepository.findRawMaterialById(materialId);
  if (!existingMaterial) {
    throw new Error('Raw material not found');
  }

  const recipeCount = await rawMaterialRepository.countRecipeItemsByRawMaterialId(materialId);
  if (recipeCount > 0) {
    throw new Error('Cannot delete raw material because it is currently used in product recipes');
  }

  await rawMaterialRepository.deleteRawMaterial(materialId);
  return { message: 'Raw material deleted successfully' };
};

module.exports = {
  getRawMaterials,
  getRawMaterialById,
  createRawMaterial,
  updateRawMaterial,
  adjustStock,
  deleteRawMaterial,
  formatRawMaterialResponse
};
