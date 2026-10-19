const express = require('express');
const recipeItemController = require('../controllers/recipeItem.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('super_admin', 'admin', 'kitchen'), recipeItemController.getRecipeItems);
router.get('/product/:productId', authorizeRoles('super_admin', 'admin', 'kitchen'), recipeItemController.getRecipeByProductId);
router.get('/raw-material/:rawMaterialId', authorizeRoles('super_admin', 'admin', 'kitchen'), recipeItemController.getRecipesByRawMaterialId);
router.get('/:id', authorizeRoles('super_admin', 'admin', 'kitchen'), recipeItemController.getRecipeItemById);

router.post('/', authorizeRoles('super_admin', 'admin'), recipeItemController.addRecipeItem);
router.put('/:id', authorizeRoles('super_admin', 'admin'), recipeItemController.updateRecipeItem);
router.put('/product/:productId', authorizeRoles('super_admin', 'admin'), recipeItemController.syncProductRecipe);
router.delete('/:id', authorizeRoles('super_admin', 'admin'), recipeItemController.deleteRecipeItem);

module.exports = router;
