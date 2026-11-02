const express = require('express');
const financialReportController = require('../controllers/financialReport.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get(
  '/income-statement',
  authorizeRoles('super_admin', 'admin'),
  financialReportController.getIncomeStatement
);

router.get(
  '/ledger',
  authorizeRoles('super_admin', 'admin'),
  financialReportController.getGeneralLedger
);

router.get(
  '/export/excel',
  authorizeRoles('super_admin', 'admin'),
  financialReportController.exportFinancialExcel
);

module.exports = router;
