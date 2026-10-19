const rawMaterialService = require('../services/rawMaterial.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const getRawMaterials = async (req, res) => {
  try {
    const { page, limit, search, supplierId, lowStock } = req.query;
    const result = await rawMaterialService.getRawMaterials({
      page,
      limit,
      search,
      supplierId,
      lowStockOnly: lowStock
    });
    return sendSuccess(res, result, 'Raw materials retrieved successfully', 200);
  } catch (error) {
    console.error('[Raw Material Controller Error - getRawMaterials]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getRawMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await rawMaterialService.getRawMaterialById(id);
    return sendSuccess(res, material, 'Raw material retrieved successfully', 200);
  } catch (error) {
    if (error.message === 'Raw material not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid raw material ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Raw Material Controller Error - getRawMaterialById]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const createRawMaterial = async (req, res) => {
  try {
    const {
      name,
      unit,
      supplierId,
      stock,
      costPerUnit,
      minStockAlert,
      productionDate,
      expDate
    } = req.body;

    const material = await rawMaterialService.createRawMaterial({
      name,
      unit,
      supplierId,
      stock,
      costPerUnit,
      minStockAlert,
      productionDate,
      expDate
    });

    return sendSuccess(res, material, 'Raw material created successfully', 201);
  } catch (error) {
    if (error.message === 'Supplier not found') {
      return sendError(res, error.message, 404);
    }
    if (
      error.message === 'Raw material name is required' ||
      error.message === 'Unit is required' ||
      error.message === 'Invalid supplier ID' ||
      error.message.includes('must be a non-negative number')
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Raw Material Controller Error - createRawMaterial]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      unit,
      supplierId,
      stock,
      costPerUnit,
      minStockAlert,
      productionDate,
      expDate
    } = req.body;

    const material = await rawMaterialService.updateRawMaterial(id, {
      name,
      unit,
      supplierId,
      stock,
      costPerUnit,
      minStockAlert,
      productionDate,
      expDate
    });

    return sendSuccess(res, material, 'Raw material updated successfully', 200);
  } catch (error) {
    if (
      error.message === 'Raw material not found' ||
      error.message === 'Supplier not found'
    ) {
      return sendError(res, error.message, 404);
    }
    if (
      error.message === 'Invalid raw material ID' ||
      error.message === 'Invalid supplier ID' ||
      error.message === 'Raw material name cannot be empty' ||
      error.message === 'Unit cannot be empty' ||
      error.message.includes('must be a non-negative number')
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Raw Material Controller Error - updateRawMaterial]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { change, setStock } = req.body;
    const material = await rawMaterialService.adjustStock(id, { change, setStock });
    return sendSuccess(res, material, 'Stock adjusted successfully', 200);
  } catch (error) {
    if (error.message === 'Raw material not found') {
      return sendError(res, error.message, 404);
    }
    if (
      error.message === 'Invalid raw material ID' ||
      error.message.includes('Insufficient stock') ||
      error.message.includes('must be a valid number') ||
      error.message.includes('must be a non-negative number') ||
      error.message === 'Either change or setStock is required'
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Raw Material Controller Error - adjustStock]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await rawMaterialService.deleteRawMaterial(id);
    return sendSuccess(res, null, result.message, 200);
  } catch (error) {
    if (error.message === 'Raw material not found') {
      return sendError(res, error.message, 404);
    }
    if (
      error.message === 'Invalid raw material ID' ||
      error.message === 'Cannot delete raw material because it is currently used in product recipes'
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Raw Material Controller Error - deleteRawMaterial]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

module.exports = {
  getRawMaterials,
  getRawMaterialById,
  createRawMaterial,
  updateRawMaterial,
  adjustStock,
  deleteRawMaterial
};
