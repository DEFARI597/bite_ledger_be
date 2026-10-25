const express = require('express');
const orderController = require('../controllers/order.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/statistics', authorizeRoles('super_admin', 'admin'), orderController.getOrderStatistics);
router.get('/', authorizeRoles('super_admin', 'admin', 'cashier', 'kitchen'), orderController.getOrders);
router.get('/:id', authorizeRoles('super_admin', 'admin', 'cashier', 'kitchen'), orderController.getOrderById);

router.post('/', authorizeRoles('super_admin', 'admin', 'cashier'), orderController.createOrder);
router.patch('/:id/status', authorizeRoles('super_admin', 'admin', 'kitchen'), orderController.updateOrderStatus);
router.delete('/:id', authorizeRoles('super_admin'), orderController.deleteOrder);

module.exports = router;
