/**
 * GPMS Expense Service
 * =====================
 * ONLY expense logic lives here.
 */

var ExpenseService = {
  /**
   * Creates a new expense record.
   * @param {Object} payload - Expense data.
   * @returns {ContentOutput} JSON response.
   */
  create: function (payload) {
    // TODO: Implement in Milestone 3
    // 1. Validate → validateExpense(payload)
    // 2. Generate ID
    // 3. Save to sheet
    // 4. Audit log → AuditService.log()
    // 5. Return success with expense ID
    return success('ExpenseService.create not yet implemented');
  },

  /**
   * Updates an existing expense.
   * @param {Object} payload - Must include expenseId + fields to update.
   * @returns {ContentOutput} JSON response.
   */
  update: function (payload) {
    // TODO: Implement in Milestone 3
    return success('ExpenseService.update not yet implemented');
  },

  /**
   * Cancels an expense (soft delete — sets status to Cancelled).
   * @param {Object} payload - Must include expenseId.
   * @returns {ContentOutput} JSON response.
   */
  cancel: function (payload) {
    // TODO: Implement in Milestone 3
    return success('ExpenseService.cancel not yet implemented');
  },
};
