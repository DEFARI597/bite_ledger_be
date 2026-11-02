const financialReportService = require('../services/financialReport.service');
const excelExportService = require('../services/excelExport.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const getIncomeStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await financialReportService.getMultiStepIncomeStatement({
      startDate,
      endDate
    });

    return sendSuccess(res, report, 'Income statement retrieved successfully', 200);
  } catch (error) {
    console.error('[Financial Report Controller Error - getIncomeStatement]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const getGeneralLedger = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;
    const ledger = await financialReportService.getGeneralLedger({
      startDate,
      endDate,
      paymentMethod
    });

    return sendSuccess(res, ledger, 'General ledger retrieved successfully', 200);
  } catch (error) {
    console.error('[Financial Report Controller Error - getGeneralLedger]:', error);
    return sendError(res, error.message || 'Internal server error', 500);
  }
};

const exportFinancialExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const workbook = await excelExportService.generateFinancialExcel({
      startDate,
      endDate
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `BiteLedger_Laporan_Keuangan_${startDate || 'Awal'}_sd_${endDate || timestamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('[Financial Report Controller Error - exportFinancialExcel]:', error);
    return sendError(res, error.message || 'Gagal mengekspor laporan ke file Excel', 500);
  }
};

module.exports = {
  getIncomeStatement,
  getGeneralLedger,
  exportFinancialExcel
};
