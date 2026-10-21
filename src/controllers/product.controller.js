const productService = require('../services/product.service');
const { sendSuccess, sendError } = require('../utils/response.util');
const { deleteFile } = require('../utils/file.util');

const getProducts = async (req, res) => {
  try {
    const { page, limit, search, category, isActive } = req.query;
    const result = await productService.getProducts({
      page,
      limit,
      search,
      category,
      isActive
    });
    return sendSuccess(res, result, 'Products retrieved successfully', 200);
  } catch (error) {
    console.error('[Product Controller Error - getProducts]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    return sendSuccess(res, product, 'Product retrieved successfully', 200);
  } catch (error) {
    if (error.message === 'Product not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid product ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Product Controller Error - getProductById]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, category, sellingPrice, isActive } = req.body;
    const product = await productService.createProduct({
      name,
      category,
      sellingPrice,
      isActive,
      file: req.file
    });
    return sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error) {
    if (req.file) {
      deleteFile(`/uploads/products/${req.file.filename}`);
    }

    if (
      error.message === 'Product name is required' ||
      error.message === 'Category is required' ||
      error.message.includes('Selling price must be')
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Product Controller Error - createProduct]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, sellingPrice, isActive, removeImage } = req.body;
    const product = await productService.updateProduct(id, {
      name,
      category,
      sellingPrice,
      isActive,
      file: req.file,
      removeImage
    });
    return sendSuccess(res, product, 'Product updated successfully', 200);
  } catch (error) {
    if (req.file) {
      deleteFile(`/uploads/products/${req.file.filename}`);
    }

    if (error.message === 'Product not found') {
      return sendError(res, error.message, 404);
    }
    if (
      error.message === 'Invalid product ID' ||
      error.message.includes('cannot be empty') ||
      error.message.includes('Selling price must be')
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Product Controller Error - updateProduct]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);
    return sendSuccess(res, null, result.message, 200);
  } catch (error) {
    if (error.message === 'Product not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid product ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Product Controller Error - deleteProduct]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
