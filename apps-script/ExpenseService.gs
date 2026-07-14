/**
 * GPMS Expense Service
 * =====================
 * Core business logic for managing expenses.
 *
 * Expense object format:
 * { id, date, category, description, vendor, amount, billLink, status, createdBy, updatedBy, remarks }
 *
 * Expenses sheet structure:
 * | ID | Date | Category | Description | Vendor | Amount | BillLink | Status | CreatedBy | UpdatedBy | Remarks |
 */

var ExpenseService = {
  /**
   * Creates a new expense record.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Expense data.
   * @returns {ContentOutput} JSON response.
   */
  create: function (user, payload) {
    // 1. Validate
    var validation = validateExpense(payload);
    if (!validation.valid) {
      return error(validation.code, validation.message);
    }

    // 2. Generate ID
    var expenseId = ReceiptService.generateExpenseId();
    var date = now();

    // 3. Save to sheet
    var sheet = getSheet(CONFIG.sheets.expenses);
    sheet.appendRow([
      expenseId,
      date,
      payload.category,
      payload.description,
      payload.vendor || '',
      payload.amount,
      payload.billLink || '',
      CONFIG.status.active, // Status
      user.fullName,        // CreatedBy
      '',                   // UpdatedBy
      ''                    // Remarks
    ]);

    // 4. Audit log
    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'createExpense',
      module: 'Expenses',
      recordId: expenseId,
      newValue: JSON.stringify({ amount: payload.amount, category: payload.category }),
    });

    // 5. Return success
    return success('Expense created successfully', { id: expenseId });
  },

  /**
   * Updates an existing expense.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include expenseId + fields to update.
   * @returns {ContentOutput} JSON response.
   */
  update: function (user, payload) {
    if (!payload || !payload.expenseId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Expense ID is required');
    }

    // Authorization: Only Admins can update expenses
    if (!UserService.authorize(user, [CONFIG.roles.admin])) {
      return error(ERROR_CODES.ROLE_NOT_ALLOWED, 'Only admins can modify expenses');
    }

    var row = ExpenseService._findExpenseRow(payload.expenseId);
    if (row === -1) {
      return error(ERROR_CODES.EXPENSE_NOT_FOUND, 'Expense not found');
    }

    var sheet = getSheet(CONFIG.sheets.expenses);
    var currentData = sheet.getRange(row, 1, 1, 11).getValues()[0];
    var oldExpense = ExpenseService._mapExpense(currentData);

    // Update specific fields
    if (payload.category) sheet.getRange(row, 3).setValue(payload.category);
    if (payload.description) sheet.getRange(row, 4).setValue(payload.description);
    if (payload.vendor !== undefined) sheet.getRange(row, 5).setValue(payload.vendor);
    if (payload.amount) sheet.getRange(row, 6).setValue(payload.amount);
    if (payload.billLink !== undefined) sheet.getRange(row, 7).setValue(payload.billLink);
    
    sheet.getRange(row, 10).setValue(user.fullName); // UpdatedBy

    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'updateExpense',
      module: 'Expenses',
      recordId: payload.expenseId,
      oldValue: JSON.stringify({ amount: oldExpense.amount, category: oldExpense.category }),
      newValue: JSON.stringify({ amount: payload.amount || oldExpense.amount, category: payload.category || oldExpense.category }),
    });

    return success('Expense updated successfully');
  },

  /**
   * Cancels an expense (soft delete — sets status to Cancelled).
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include expenseId and reason.
   * @returns {ContentOutput} JSON response.
   */
  cancel: function (user, payload) {
    if (!payload || !payload.expenseId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Expense ID is required');
    }
    
    if (!payload.reason || String(payload.reason).trim() === '') {
      return error(ERROR_CODES.MISSING_FIELD, 'Cancel reason is required');
    }

    // Authorization: Only Admins can cancel expenses
    if (!UserService.authorize(user, [CONFIG.roles.admin])) {
      return error(ERROR_CODES.ROLE_NOT_ALLOWED, 'Only admins can cancel expenses');
    }

    var row = ExpenseService._findExpenseRow(payload.expenseId);
    if (row === -1) {
      return error(ERROR_CODES.EXPENSE_NOT_FOUND, 'Expense not found');
    }

    var sheet = getSheet(CONFIG.sheets.expenses);
    sheet.getRange(row, 8).setValue(CONFIG.status.cancelled); // Status
    sheet.getRange(row, 10).setValue(user.fullName); // UpdatedBy
    sheet.getRange(row, 11).setValue(payload.reason); // Remarks (Cancel Reason)

    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'cancelExpense',
      module: 'Expenses',
      recordId: payload.expenseId,
    });

    return success('Expense cancelled successfully');
  },

  /**
   * Retrieves a single expense by ID.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include expenseId.
   * @returns {ContentOutput} JSON response.
   */
  get: function (user, payload) {
    if (!payload || !payload.expenseId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Expense ID is required');
    }

    var row = ExpenseService._findExpenseRow(payload.expenseId);
    if (row === -1) {
      return error(ERROR_CODES.EXPENSE_NOT_FOUND, 'Expense not found');
    }

    var sheet = getSheet(CONFIG.sheets.expenses);
    var currentData = sheet.getRange(row, 1, 1, 11).getValues()[0];

    return success('Expense retrieved', ExpenseService._mapExpense(currentData));
  },

  /**
   * Searches expenses by criteria (ID, vendor, category, description).
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Search filters.
   * @returns {ContentOutput} JSON response.
   */
  search: function (user, payload) {
    var sheet = getSheet(CONFIG.sheets.expenses);
    var data = sheet.getDataRange().getValues();
    var results = [];

    // Skip header row
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;

      var expense = ExpenseService._mapExpense(data[i]);
      var match = true;

      if (payload.status && expense.status !== payload.status) match = false;
      if (payload.category && expense.category !== payload.category) match = false;
      
      if (payload.vendor && expense.vendor.toLowerCase().indexOf(payload.vendor.toLowerCase()) === -1) {
        match = false;
      }
      if (payload.description && expense.description.toLowerCase().indexOf(payload.description.toLowerCase()) === -1) {
        match = false;
      }
      if (payload.expenseId && String(expense.id).toLowerCase() !== String(payload.expenseId).toLowerCase()) {
        match = false;
      }

      if (match) {
        results.push(expense);
      }
    }

    return success('Expenses retrieved', results);
  },

  /**
   * Retrieves the most recent expenses up to a specified limit.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include limit (number).
   * @returns {ContentOutput} JSON response.
   */
  getRecentExpenses: function(user, payload) {
    var limit = payload && payload.limit ? parseInt(payload.limit, 10) : 10;
    
    var sheet = getSheet(CONFIG.sheets.expenses);
    var data = sheet.getDataRange().getValues();
    var results = [];

    // Skip header and iterate backwards
    for (var i = data.length - 1; i > 0; i--) {
      if (!data[i][0]) continue;
      
      var expense = ExpenseService._mapExpense(data[i]);
      // Generally we want active expenses for "recent", or maybe all. We'll include all here.
      results.push(expense);
      
      if (results.length >= limit) break;
    }

    return success('Recent expenses retrieved', results);
  },

  // ==========================================
  // Internal Helpers
  // ==========================================

  /**
   * Maps a raw sheet row to a standard Expense object.
   *
   * @param {Array} row - Raw row data array.
   * @returns {Object} Standard Expense object.
   * @private
   */
  _mapExpense: function (row) {
    return {
      id: row[0],
      date: row[1],
      category: row[2],
      description: row[3],
      vendor: row[4],
      amount: row[5],
      billLink: row[6],
      status: row[7],
      createdBy: row[8],
      updatedBy: row[9],
      remarks: row[10],
    };
  },

  /**
   * Finds the row index for an expense based on its ID.
   *
   * @param {string} expenseId - ID to search for.
   * @returns {number} Row index (1-indexed) or -1 if not found.
   * @private
   */
  _findExpenseRow: function (expenseId) {
    var sheet = getSheet(CONFIG.sheets.expenses);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(expenseId).toLowerCase()) {
        return i + 1;
      }
    }
    return -1;
  },
};
