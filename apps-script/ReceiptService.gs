/**
 * GPMS Receipt Service
 * =====================
 * Manages ALL ID and receipt number generation.
 * Uses LockService to prevent duplicate IDs
 * when two volunteers submit simultaneously.
 *
 * ⚠️  This is a CRITICAL file.
 * Never generate IDs outside this service.
 */

var ReceiptService = {
  /**
   * Generates a unique Donation ID.
   * Protected by LockService to prevent race conditions.
   * @returns {string} Donation ID (e.g., DON-20250714-00042).
   */
  generateDonationID: function () {
    // TODO: Implement in Milestone 3
    // 1. Acquire script lock (LockService.getScriptLock())
    // 2. Read current counter from Metadata sheet
    // 3. Increment counter
    // 4. Save new counter
    // 5. Release lock
    // 6. Return generateID(CONFIG.prefixes.donation, counter)
    return generateID(CONFIG.prefixes.donation, 0);
  },

  /**
   * Generates a unique Receipt ID.
   * Protected by LockService to prevent race conditions.
   * @returns {string} Receipt ID (e.g., RCT-20250714-00042).
   */
  generateReceiptID: function () {
    // TODO: Implement in Milestone 3
    // Same pattern as generateDonationID but with receipt prefix
    return generateID(CONFIG.prefixes.receipt, 0);
  },

  /**
   * Generates a unique Expense ID.
   * Protected by LockService to prevent race conditions.
   * @returns {string} Expense ID (e.g., EXP-20250714-00015).
   */
  generateExpenseID: function () {
    // TODO: Implement in Milestone 3
    return generateID(CONFIG.prefixes.expense, 0);
  },
};
