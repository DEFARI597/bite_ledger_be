const express = require('express');
const productController = require('../controllers/product.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('super_admin', 'admin', 'cashier', 'kitchen'), productController.getProducts);
router.get('/:id', authorizeRoles('super_admin', 'admin', 'cashier', 'kitchen'), productController.getProductById);

router.post('/', authorizeRoles('super_admin', 'admin'), productController.createProduct);
router.put('/:id', authorizeRoles('super_admin', 'admin'), productController.updateProduct);
router.delete('/:id', authorizeRoles('super_admin', 'admin'), productController.deleteProduct);

module.exports = router;
