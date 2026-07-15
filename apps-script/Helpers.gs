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
 * for the last row that has an ID in the specified ID column.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to modify.
 * @param {Array} rowData - 1D array of row data to insert.
 * @param {number} idColIndex - 0-indexed column number to check for real data (e.g., 0 for Col A).
 */
function safeAppendRow(sheet, rowData, idColIndex) {
  var data = sheet.getDataRange().getValues();
  
  var lastRowWithData = 0;
  // Scan from bottom up to find the last row with an ID
  for (var i = data.length - 1; i >= 0; i--) {
    if (String(data[i][idColIndex]).trim() !== '') {
      lastRowWithData = i + 1; // 1-indexed row number
      break;
    }
  }

  var targetRow = lastRowWithData === 0 ? 1 : lastRowWithData + 1;

  if (targetRow > sheet.getMaxRows()) {
    sheet.appendRow(rowData);
  } else {
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  }
}
