const express = require('express');
const rawMaterialController = require('../controllers/rawMaterial.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles('super_admin', 'admin', 'kitchen'), rawMaterialController.getRawMaterials);
router.get('/:id', authorizeRoles('super_admin', 'admin', 'kitchen'), rawMaterialController.getRawMaterialById);

router.post('/', authorizeRoles('super_admin', 'admin'), rawMaterialController.createRawMaterial);
router.put('/:id', authorizeRoles('super_admin', 'admin'), rawMaterialController.updateRawMaterial);
router.patch('/:id/stock', authorizeRoles('super_admin', 'admin'), rawMaterialController.adjustStock);
router.delete('/:id', authorizeRoles('super_admin', 'admin'), rawMaterialController.deleteRawMaterial);

module.exports = router;
