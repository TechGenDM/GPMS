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
    Logger.log(e);
  }
}

/**
 * Run this function to authorize Google Drive permissions
 */
function authorizeDrive() {
  try {
    // This simple call forces Google to ask for Drive permissions
    DriveApp.getRootFolder();
    Logger.log("Drive authorized successfully!");
  } catch (e) {
    Logger.log("Error: " + e.message);
  }
}
