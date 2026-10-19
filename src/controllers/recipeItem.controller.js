const recipeItemService = require('../services/recipeItem.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const getRecipeByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const recipe = await recipeItemService.getRecipeByProductId(productId);
    return sendSuccess(res, recipe, 'Product recipe retrieved successfully', 200);
  } catch (error) {
    if (error.message === 'Product not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid product ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Recipe Controller Error - getRecipeByProductId]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getRecipeItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await recipeItemService.getRecipeItemById(id);
    return sendSuccess(res, item, 'Recipe item retrieved successfully', 200);
  } catch (error) {
    if (error.message === 'Recipe item not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid recipe item ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Recipe Controller Error - getRecipeItemById]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const addRecipeItem = async (req, res) => {
  try {
    const { productId, rawMaterialId, quantityRequired } = req.body;
    const item = await recipeItemService.addRecipeItem({
      productId,
      rawMaterialId,
      quantityRequired
    });
    return sendSuccess(res, item, 'Recipe item added successfully', 201);
  } catch (error) {
    if (
      error.message === 'Product not found' ||
      error.message === 'Raw material not found'
    ) {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Raw material already exists in this product recipe') {
      return sendError(res, error.message, 409);
    }
    if (
      error.message === 'Product ID is required' ||
      error.message === 'Raw material ID is required' ||
      error.message === 'Invalid product ID' ||
      error.message === 'Invalid raw material ID' ||
      error.message.includes('must be a number greater than 0')
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Recipe Controller Error - addRecipeItem]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const updateRecipeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityRequired } = req.body;
    const item = await recipeItemService.updateRecipeItem(id, { quantityRequired });
    return sendSuccess(res, item, 'Recipe item updated successfully', 200);
  } catch (error) {
    if (error.message === 'Recipe item not found') {
      return sendError(res, error.message, 404);
    }
    if (
      error.message === 'Invalid recipe item ID' ||
      error.message.includes('must be a number greater than 0')
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Recipe Controller Error - updateRecipeItem]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const deleteRecipeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await recipeItemService.deleteRecipeItem(id);
    return sendSuccess(res, null, result.message, 200);
  } catch (error) {
    if (error.message === 'Recipe item not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid recipe item ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Recipe Controller Error - deleteRecipeItem]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const syncProductRecipe = async (req, res) => {
  try {
    const { productId } = req.params;
    const { items } = req.body;
    const recipe = await recipeItemService.syncProductRecipe(productId, items);
    return sendSuccess(res, recipe, 'Product recipe synced successfully', 200);
  } catch (error) {
    if (
      error.message === 'Product not found' ||
      error.message.includes('Raw material not found')
    ) {
      return sendError(res, error.message, 404);
    }
    if (
      error.message === 'Invalid product ID' ||
      error.message.includes('Duplicate raw material ID') ||
      error.message.includes('must be an array') ||
      error.message.includes('Invalid rawMaterialId') ||
      error.message.includes('must be greater than 0')
    ) {
      return sendError(res, error.message, 400);
    }
    console.error('[Recipe Controller Error - syncProductRecipe]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getRecipeItems = async (req, res) => {
  try {
    const { page, limit, productId, rawMaterialId } = req.query;
    const result = await recipeItemService.getRecipeItems({
      page,
      limit,
      productId,
      rawMaterialId
    });
    return sendSuccess(res, result, 'Recipe items retrieved successfully', 200);
  } catch (error) {
    if (error.message === 'Invalid product ID' || error.message === 'Invalid raw material ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Recipe Controller Error - getRecipeItems]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getRecipesByRawMaterialId = async (req, res) => {
  try {
    const { rawMaterialId } = req.params;
    const result = await recipeItemService.getRecipesByRawMaterialId(rawMaterialId);
    return sendSuccess(res, result, 'Raw material recipe usage retrieved successfully', 200);
  } catch (error) {
    if (error.message === 'Raw material not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'Invalid raw material ID') {
      return sendError(res, error.message, 400);
    }
    console.error('[Recipe Controller Error - getRecipesByRawMaterialId]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

module.exports = {
  getRecipeItems,
  getRecipesByRawMaterialId,
  getRecipeByProductId,
  getRecipeItemById,
  addRecipeItem,
  updateRecipeItem,
  deleteRecipeItem,
  syncProductRecipe
};

