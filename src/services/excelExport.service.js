const ExcelJS = require('exceljs');
const { getMultiStepIncomeStatement, getGeneralLedger } = require('./financialReport.service');
const expenseRepository = require('../repositories/expense.repository');
const { getCategoryLabel } = require('./expense.service');

const CURRENCY_FORMAT = '_ "Rp"* #,##0 _ ;_ "Rp"* (#,##0) ;_ "Rp"* "-" _ ;_ @_ ';

const generateFinancialExcel = async ({ startDate, endDate } = {}) => {
  const [incomeStatement, ledger, expensesData] = await Promise.all([
    getMultiStepIncomeStatement({ startDate, endDate }),
    getGeneralLedger({ startDate, endDate }),
    expenseRepository.findExpenses({
      where: (startDate || endDate)
        ? {
          expenseDate: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {})
          }
        }
        : {},
      take: 1000,
      orderBy: { expenseDate: 'desc' }
    })
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BiteLedger ERP System';
  workbook.created = new Date();

  const pnlSheet = workbook.addWorksheet('Laporan Laba Rugi', {
    views: [{ showGridLines: true }]
  });

  pnlSheet.columns = [
    { width: 45 },
    { width: 25 },
    { width: 15 }
  ];

  pnlSheet.addRow(['BITELEDGER COFFEE SHOP']).font = { bold: true, size: 14, color: { argb: 'FF1F2937' } };
  pnlSheet.addRow(['LAPORAN LABA RUGI (INCOME STATEMENT)']).font = { bold: true, size: 11, color: { argb: 'FF4B5563' } };

  const periodText = `Periode: ${startDate ? startDate : 'Awal Transaksi'} s/d ${endDate ? endDate : 'Hari Ini'}`;
  pnlSheet.addRow([periodText]).font = { italic: true, size: 10, color: { argb: 'FF6B7280' } };
  pnlSheet.addRow([]);

  const revHeader = pnlSheet.addRow(['PENDAPATAN USAHA (REVENUE)', '']);
  revHeader.font = { bold: true, color: { argb: 'FF1F2937' } };

  if (incomeStatement.revenue.productsBreakdown && incomeStatement.revenue.productsBreakdown.length > 0) {
    for (const p of incomeStatement.revenue.productsBreakdown) {
      const r = pnlSheet.addRow(['  ' + p.name + ' (' + p.quantity + ' terjual)', p.totalRevenue]);
      r.getCell(2).numFmt = CURRENCY_FORMAT;
    }
  } else {
    const revRow = pnlSheet.addRow(['  Penjualan Makanan & Minuman', incomeStatement.revenue.totalAmount]);
    revRow.getCell(2).numFmt = CURRENCY_FORMAT;
  }

  const revTotal = pnlSheet.addRow(['TOTAL PENDAPATAN', incomeStatement.revenue.totalAmount]);
  revTotal.font = { bold: true };
  revTotal.getCell(2).numFmt = CURRENCY_FORMAT;
  revTotal.getCell(1).border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
  revTotal.getCell(2).border = { top: { style: 'thin' }, bottom: { style: 'thin' } };

  pnlSheet.addRow([]);

  const cogsHeader = pnlSheet.addRow(['BEBAN POKOK PENJUALAN (COST OF GOODS SOLD / COGS)', '']);
  cogsHeader.font = { bold: true, color: { argb: 'FF1F2937' } };

  pnlSheet.addRow(['  Pemakaian Bahan Baku (Perpetual Inventory Deduction)']);
  const cogsSubRow = pnlSheet.addRow([`  - ${incomeStatement.cogs.materialsSummary}`, -incomeStatement.cogs.totalAmount]);
  cogsSubRow.getCell(2).numFmt = CURRENCY_FORMAT;
  cogsSubRow.font = { italic: true, size: 9 };

  const cogsTotal = pnlSheet.addRow(['TOTAL BEBAN POKOK PENJUALAN', -incomeStatement.cogs.totalAmount]);
  cogsTotal.font = { bold: true };
  cogsTotal.getCell(2).numFmt = CURRENCY_FORMAT;
  cogsTotal.getCell(1).border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
  cogsTotal.getCell(2).border = { top: { style: 'thin' }, bottom: { style: 'thin' } };

  pnlSheet.addRow([]);

  const gpRow = pnlSheet.addRow([
    `LABA KOTOR`,
    incomeStatement.grossProfit
  ]);
  gpRow.font = { bold: true, size: 11, color: { argb: 'FF111827' } };
  gpRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  };
  gpRow.getCell(2).numFmt = CURRENCY_FORMAT;
  gpRow.getCell(1).border = { top: { style: 'double' }, bottom: { style: 'double' } };
  gpRow.getCell(2).border = { top: { style: 'double' }, bottom: { style: 'double' } };

  pnlSheet.addRow([]);

  const opexHeader = pnlSheet.addRow(['BEBAN OPERASIONAL (OPERATIONAL EXPENSES / OPEX)', '']);
  opexHeader.font = { bold: true, color: { argb: 'FF1F2937' } };

  for (const item of incomeStatement.operatingExpenses.items) {
    const r = pnlSheet.addRow([`  ${item.label}`, item.amount]);
    r.getCell(2).numFmt = CURRENCY_FORMAT;
  }

  const opexTotal = pnlSheet.addRow(['TOTAL BEBAN OPERASIONAL', -incomeStatement.operatingExpenses.totalAmount]);
  opexTotal.font = { bold: true };
  opexTotal.getCell(2).numFmt = CURRENCY_FORMAT;
  opexTotal.getCell(1).border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
  opexTotal.getCell(2).border = { top: { style: 'thin' }, bottom: { style: 'thin' } };

  pnlSheet.addRow([]);

  const npRow = pnlSheet.addRow([
    `LABA BERSIH OPERASIONAL (NET PROFIT) [Net Margin: ${incomeStatement.netProfitMargin}]`,
    incomeStatement.netProfit
  ]);
  npRow.font = { bold: true, size: 12, color: { argb: 'FF065F46' } };
  npRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD1FAE5' }
  };
  npRow.getCell(2).numFmt = CURRENCY_FORMAT;
  npRow.getCell(1).border = { top: { style: 'double' }, bottom: { style: 'double' } };
  npRow.getCell(2).border = { top: { style: 'double' }, bottom: { style: 'double' } };

  const glSheet = workbook.addWorksheet('Buku Besar (General Ledger)', {
    views: [{ showGridLines: true }]
  });

  glSheet.columns = [
    { header: 'Tanggal', key: 'date', width: 14 },
    { header: 'No. Bukti / Ref', key: 'ref', width: 16 },
    { header: 'Nama Akun / Kategori', key: 'account', width: 32 },
    { header: 'Keterangan Transaksi', key: 'desc', width: 38 },
    { header: 'Debit (Kas Masuk)', key: 'debit', width: 22 },
    { header: 'Kredit (Kas Keluar)', key: 'credit', width: 22 },
    { header: 'Saldo Kas Berjalan', key: 'balance', width: 22 }
  ];

  const glHeader = glSheet.getRow(1);
  glHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  glHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF374151' }
  };
  glHeader.alignment = { vertical: 'middle', horizontal: 'center' };

  const openRow = glSheet.addRow({
    date: startDate || '-',
    ref: '-',
    account: '[Saldo Awal]',
    desc: 'Saldo Kas Sebelum Periode Terpilih',
    debit: 0,
    credit: 0,
    balance: ledger.openingBalance
  });
  openRow.font = { italic: true, bold: true };
  openRow.getCell('debit').numFmt = CURRENCY_FORMAT;
  openRow.getCell('credit').numFmt = CURRENCY_FORMAT;
  openRow.getCell('balance').numFmt = CURRENCY_FORMAT;

  ledger.entries.forEach((entry) => {
    const r = glSheet.addRow({
      date: entry.dateFormatted,
      ref: entry.ref,
      account: entry.account,
      desc: entry.description,
      debit: entry.debit,
      credit: entry.credit,
      balance: entry.runningBalance
    });

    r.getCell('debit').numFmt = CURRENCY_FORMAT;
    r.getCell('credit').numFmt = CURRENCY_FORMAT;
    r.getCell('balance').numFmt = CURRENCY_FORMAT;
    r.getCell('date').alignment = { horizontal: 'center' };
    r.getCell('ref').alignment = { horizontal: 'center' };
  });

  const glSummary = glSheet.addRow({
    date: '',
    ref: '',
    account: '',
    desc: 'TOTAL MUTASI & SALDO AKHIR',
    debit: ledger.totalDebit,
    credit: ledger.totalCredit,
    balance: ledger.closingBalance
  });
  glSummary.font = { bold: true };
  glSummary.getCell('debit').numFmt = CURRENCY_FORMAT;
  glSummary.getCell('credit').numFmt = CURRENCY_FORMAT;
  glSummary.getCell('balance').numFmt = CURRENCY_FORMAT;
  glSummary.border = { top: { style: 'thin' }, bottom: { style: 'double' } };

  const opexSheet = workbook.addWorksheet('Rincian Beban OPEX', {
    views: [{ showGridLines: true }]
  });

  opexSheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Tanggal Beban', key: 'date', width: 15 },
    { header: 'Kategori', key: 'category', width: 25 },
    { header: 'Deskripsi / Keterangan', key: 'desc', width: 35 },
    { header: 'Nominal Biaya', key: 'amount', width: 22 },
    { header: 'Dicatat Oleh', key: 'user', width: 20 },
    { header: 'Tanggal Input', key: 'created', width: 20 }
  ];

  const opexHeaderRow = opexSheet.getRow(1);
  opexHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  opexHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEA580C' }
  };

  expensesData.expenses.forEach((exp) => {
    const row = opexSheet.addRow({
      id: exp.id.toString(),
      date: exp.expenseDate instanceof Date
        ? exp.expenseDate.toISOString().slice(0, 10)
        : String(exp.expenseDate).slice(0, 10),
      category: getCategoryLabel(exp.category),
      desc: exp.description || '-',
      amount: Number(exp.amount),
      user: exp.user?.name || 'Admin',
      created: exp.createdAt instanceof Date
        ? exp.createdAt.toISOString().slice(0, 19).replace('T', ' ')
        : String(exp.createdAt)
    });
    row.getCell('amount').numFmt = CURRENCY_FORMAT;
    row.getCell('id').alignment = { horizontal: 'center' };
    row.getCell('date').alignment = { horizontal: 'center' };
  });

  return workbook;
};

module.exports = {
  generateFinancialExcel
};
