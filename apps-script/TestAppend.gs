function fixCurrencyFormatting() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);

    // Format Donations Amount column (Column E)
    var donationsSheet = ss.getSheetByName(CONFIG.sheets.donations);
    if (donationsSheet) {
      donationsSheet.getRange('E:E').setNumberFormat('"₹" #,##0.00');
    }

    // Format Expenses Amount column (Column E)
    var expensesSheet = ss.getSheetByName(CONFIG.sheets.expenses);
    if (expensesSheet) {
      expensesSheet.getRange('E:E').setNumberFormat('"₹" #,##0.00');
    }

    return JSON.stringify({
      success: true,
      message: 'Currency formatted to INR',
    });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
}
