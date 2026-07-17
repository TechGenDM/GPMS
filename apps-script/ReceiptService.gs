/**
 * GPMS Receipt Service
 * =====================
 * Manages ALL ID and receipt number generation.
 * Uses LockService to prevent duplicate IDs
 * when two volunteers submit simultaneously.
 *
 * ⚠️  This is a CRITICAL file.
 * Never generate IDs outside this service.
 *
 * Metadata sheet structure:
 * | Key            | Value |
 * | donationCounter | 42   |
 * | expenseCounter  | 15   |
 * | receiptCounter  | 42   |
 * | userCounter     | 8    |
 * | logCounter      | 200  |
 */

var ReceiptService = {
  /**
   * Generates a unique Receipt ID.
   * Protected by LockService to prevent race conditions.
   *
   * @param {boolean} [skipLock] - If true, skips acquiring the lock.
   * @returns {string} Receipt ID (e.g., RCT-20250714-00042).
   */
  generateReceiptId: function (skipLock) {
    return ReceiptService._generateId(
      'receiptCounter',
      CONFIG.prefixes.receipt,
      skipLock
    );
  },

  /**
   * Generates a unique Donation ID.
   * Protected by LockService to prevent race conditions.
   *
   * @param {boolean} [skipLock] - If true, skips acquiring the lock.
   * @returns {string} Donation ID (e.g., DON-20250714-00042).
   */
  generateDonationId: function (skipLock) {
    return ReceiptService._generateId(
      'donationCounter',
      CONFIG.prefixes.donation,
      skipLock
    );
  },

  /**
   * Generates a unique Expense ID.
   * Protected by LockService to prevent race conditions.
   *
   * @param {boolean} [skipLock] - If true, skips acquiring the lock.
   * @returns {string} Expense ID (e.g., EXP-20250714-00015).
   */
  generateExpenseId: function (skipLock) {
    return ReceiptService._generateId(
      'expenseCounter',
      CONFIG.prefixes.expense,
      skipLock
    );
  },

  /**
   * Generates a unique User ID.
   * Protected by LockService to prevent race conditions.
   *
   * @returns {string} User ID (e.g., USR-20250714-00008).
   */
  generateUserId: function () {
    return ReceiptService._generateId('userCounter', CONFIG.prefixes.user);
  },

  /**
   * Generates a unique Log ID.
   * Protected by LockService to prevent race conditions.
   *
   * @returns {string} Log ID (e.g., LOG-20250714-00200).
   */
  generateLogId: function () {
    return ReceiptService._generateId('logCounter', CONFIG.prefixes.log);
  },

  /**
   * Internal: Generates a unique ID using LockService.
   *
   * 1. Acquire script lock (prevents race conditions)
   * 2. Read current counter from Metadata sheet
   * 3. Increment counter
   * 4. Save new counter
   * 5. Release lock
   * 6. Return formatted ID
   *
   * @param {string} counterKey - Key in the Metadata sheet.
   * @param {string} prefix - ID prefix (e.g., DON, EXP).
   * @returns {string} Generated ID.
   * @private
   */
  _generateId: function (counterKey, prefix, skipLock) {
    if (skipLock) {
      return ReceiptService._generateIdInternal(counterKey, prefix);
    }
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      return ReceiptService._generateIdInternal(counterKey, prefix);
    } catch (e) {
      throw new Error('Could not acquire lock for ID generation. Please try again.');
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Actual ID generation logic without acquiring a lock.
   * Assumes the caller has already acquired the lock.
   */
  _generateIdInternal: function (counterKey, prefix) {
    var sheet = getSheet(CONFIG.sheets.metadata);
    var row = findRow(sheet, 1, counterKey);
    var counter = 0;

    if (row === -1) {
      // Counter doesn't exist yet — create it
      counter = 1;
      sheet.appendRow([counterKey, counter]);
    } else {
      // Read, increment, save
      counter = Number(sheet.getRange(row, 2).getValue()) + 1;
      sheet.getRange(row, 2).setValue(counter);
    }

    SpreadsheetApp.flush(); // Force write

    return generateID(prefix, counter);
  },
};
