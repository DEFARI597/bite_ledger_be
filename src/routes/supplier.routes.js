const express = require('express');
const supplierController = require('../controllers/supplier.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('super_admin', 'admin', 'kitchen'), supplierController.getSuppliers);
router.get('/:id', authorizeRoles('super_admin', 'admin', 'kitchen'), supplierController.getSupplierById)
router.post('/', authorizeRoles('super_admin', 'admin'), supplierController.createSupplier);
router.put('/:id', authorizeRoles('super_admin', 'admin'), supplierController.updateSupplier);
router.delete('/:id', authorizeRoles('super_admin', 'admin'), supplierController.deleteSupplier);

module.exports = router;
