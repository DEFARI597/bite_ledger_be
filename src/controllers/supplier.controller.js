const supplierService = require('../services/supplier.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const getSuppliers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await supplierService.getSuppliers({ page, limit, search });
    return sendSuccess(res, result, 'Suppliers retrieved successfully', 200);
  } catch (error) {
    console.error('[Supplier Controller Error - getSuppliers]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById(id);
    return sendSuccess(res, supplier, 'Supplier retrieved successfully', 200);
  } catch (error) {
    if (error.message === 'Supplier not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid supplier ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Supplier Controller Error - getSupplierById]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const createSupplier = async (req, res) => {
  try {
    const { name, contactPerson, phone, address } = req.body;
    const supplier = await supplierService.createSupplier({
      name,
      contactPerson,
      phone,
      address
    });
    return sendSuccess(res, supplier, 'Supplier created successfully', 201);
  } catch (error) {
    if (error.message === 'Supplier name is required') {
      return sendError(res, error.message, 400);
    }
    console.error('[Supplier Controller Error - createSupplier]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, phone, address } = req.body;
    const supplier = await supplierService.updateSupplier(id, {
      name,
      contactPerson,
      phone,
      address
    });
    return sendSuccess(res, supplier, 'Supplier updated successfully', 200);
  } catch (error) {
    if (error.message === 'Supplier not found') {
      return sendError(res, error.message, 404);
    }
    if (
      error.message === 'Invalid supplier ID' ||
      error.message === 'Supplier name cannot be empty'
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Supplier Controller Error - updateSupplier]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supplierService.deleteSupplier(id);
    return sendSuccess(res, null, result.message, 200);
  } catch (error) {
    if (error.message === 'Supplier not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid supplier ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Supplier Controller Error - deleteSupplier]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
