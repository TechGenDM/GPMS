/**
 * GPMS Helper Utilities
 * ======================
 * Reusable functions used across all services.
 * No business logic here — only pure utilities.
 */

/**
 * Returns a Sheet object by name from the configured spreadsheet.
 * @param {string} sheetName - Name of the sheet (use CONFIG.sheets.*).
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet object.
 */
function getSheet(sheetName) {
  var ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  return sheet;
}

/**
 * Formats a Date object using the configured timezone and format.
 * @param {Date} [date=new Date()] - Date to format.
 * @returns {string} Formatted date string.
 */
function formatDate(date) {
  return Utilities.formatDate(
    date || new Date(),
    CONFIG.timezone,
    CONFIG.dateFormat
  );
}

/**
 * Generates a unique ID with the given prefix.
 * Format: PREFIX-YYYYMMDD-XXXXX (e.g., DON-20250714-00001)
 * @param {string} prefix - ID prefix (use CONFIG.prefixes.*).
 * @param {number} counter - Sequential counter value.
 * @returns {string} Generated ID.
 */
function generateID(prefix, counter) {
  var now = new Date();
  var datePart = Utilities.formatDate(now, CONFIG.timezone, 'yyyyMMdd');
  var counterPart = ('00000' + counter).slice(-5);
  return prefix + '-' + datePart + '-' + counterPart;
}

/**
 * Finds a row index by matching a value in a specific column.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to search.
 * @param {number} column - Column number (1-indexed).
 * @param {*} value - Value to search for.
 * @returns {number} Row number (1-indexed), or -1 if not found.
 */
function findRow(sheet, column, value) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    // Skip header row
    if (data[i][column - 1] == value) {
      return i + 1; // Convert to 1-indexed row number
    }
  }
  return -1;
}

/**
 * Returns all data from a sheet as an array of objects.
 * Uses the first row as headers/keys.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to read.
 * @returns {Object[]} Array of row objects.
 */
function getSheetData(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Returns the current timestamp formatted for the configured timezone.
 * @returns {string} Formatted timestamp.
 */
function now() {
  return formatDate(new Date());
}

/**
 * Safely appends a row of data below the last actual data row.
 * Bypasses issues with pre-filled dropdown template rows by looking
 * for the first empty row in the ID column after the header.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to modify.
 * @param {Array} rowData - 1D array of row data to insert.
 * @param {number} idColIndex - 0-indexed column number to check for real data (e.g., 0 for Col A).
 */
function safeAppendRow(sheet, rowData, idColIndex) {
  var data = sheet.getDataRange().getValues();
  
  // 1. Find the header row (look for 'id', 'expense id', 'donation id' etc in the id column)
  var headerIndex = 0;
  for (var i = 0; i < data.length; i++) {
    var val = String(data[i][idColIndex]).trim().toLowerCase();
    if (val === 'expense id' || val === 'donation id' || val === 'id' || val === 'receipt id') {
      headerIndex = i;
      break;
    }
  }
  
  // 2. Scan downwards from the header to find the first empty cell in the ID column
  var targetRow = data.length + 1; // default to appending at the end if no empty cell is found
  for (var i = headerIndex + 1; i < data.length; i++) {
    if (String(data[i][idColIndex]).trim() === '') {
      targetRow = i + 1; // 1-indexed row number
      break;
    }
  }

  // 3. Ensure we have enough rows in the sheet
  if (targetRow > sheet.getMaxRows()) {
    sheet.insertRowAfter(sheet.getMaxRows());
  } 
  
  // 4. Overwrite the target row
  sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
}
