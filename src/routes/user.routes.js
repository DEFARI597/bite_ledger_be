const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');

const router = express.Router();

// All user management routes require valid authentication and super_admin role
router.use(authenticateToken);
router.use(authorizeRoles('super_admin'));

router.get('/', userController.getUsers);
router.get('/roles', userController.getRoles);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
