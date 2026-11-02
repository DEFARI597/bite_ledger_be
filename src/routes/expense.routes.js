const express = require('express');
const expenseController = require('../controllers/expense.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/summary', authorizeRoles('super_admin', 'admin'), expenseController.getExpenseSummary);
router.get('/', authorizeRoles('super_admin', 'admin'), expenseController.getExpenses);
router.get('/:id', authorizeRoles('super_admin', 'admin'), expenseController.getExpenseById);

router.post('/', authorizeRoles('super_admin', 'admin'), expenseController.createExpense);
router.put('/:id', authorizeRoles('super_admin', 'admin'), expenseController.updateExpense);
router.delete('/:id', authorizeRoles('super_admin', 'admin'), expenseController.deleteExpense);

module.exports = router;
