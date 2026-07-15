/**
 * GPMS Expense Service
 * =====================
 * Core business logic for managing expenses.
 *
 * Expenses sheet structure (actual GPMS Database 2026):
 * | A: Expense ID | B: Category | C: Description | D: Vendor | E: Amount |
 * | F: Paid By ID | G: Paid By Name | H: Bill Link | I: Status | J: Created At |
 * | K: Updated At |
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

    // 3. Save to sheet (11 columns: A–K)
    var sheet = getSheet(CONFIG.sheets.expenses);
    sheet.appendRow([
      expenseId,                     // A: Expense ID
      payload.category,              // B: Category
      payload.description,           // C: Description
      payload.vendor || '',          // D: Vendor
      payload.amount,                // E: Amount
      user.id,                       // F: Paid By ID
      user.fullName,                 // G: Paid By Name
      payload.billLink || '',        // H: Bill Link
      CONFIG.status.active,          // I: Status
      date,                          // J: Created At
      ''                             // K: Updated At
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

    // Update specific fields (1-indexed for getRange)
    if (payload.category) sheet.getRange(row, 2).setValue(payload.category);
    if (payload.description) sheet.getRange(row, 3).setValue(payload.description);
    if (payload.vendor !== undefined) sheet.getRange(row, 4).setValue(payload.vendor);
    if (payload.amount) sheet.getRange(row, 5).setValue(payload.amount);
    if (payload.billLink !== undefined) sheet.getRange(row, 8).setValue(payload.billLink);
    if (payload.status) sheet.getRange(row, 9).setValue(payload.status);
    
    sheet.getRange(row, 11).setValue(now()); // Updated At

    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'updateExpense',
      module: 'Expenses',
      recordId: payload.expenseId,
      newValue: 'Updated expense',
    });

    return success('Expense updated successfully');
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
   * Searches expenses by criteria.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Search filters.
   * @returns {ContentOutput} JSON response.
   */
  search: function (user, payload) {
    var sheet = getSheet(CONFIG.sheets.expenses);
    var data = sheet.getDataRange().getValues();
    var results = [];

    for (var i = 1; i < data.length; i++) {
      if (!data[i][0] || String(data[i][0]).toLowerCase() === 'expense id') continue;

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
   * Retrieves the most recent expenses.
   */
  getRecentExpenses: function(user, payload) {
    var limit = payload && payload.limit ? parseInt(payload.limit, 10) : 10;
    
    var sheet = getSheet(CONFIG.sheets.expenses);
    var data = sheet.getDataRange().getValues();
    var results = [];

    for (var i = data.length - 1; i > 0; i--) {
      if (!data[i][0] || String(data[i][0]).toLowerCase() === 'expense id') continue;
      
      var expense = ExpenseService._mapExpense(data[i]);
      results.push(expense);
      
      if (results.length >= limit) break;
    }

    return success('Recent expenses retrieved', results);
  },

  // ==========================================
  // Internal Helpers
  // ==========================================

  /**
   * Maps a raw sheet row (11 columns) to a standard Expense object.
   */
  _mapExpense: function (row) {
    return {
      id: row[0],             // A: Expense ID
      category: row[1],       // B: Category
      description: row[2],    // C: Description
      vendor: row[3],         // D: Vendor
      amount: row[4],         // E: Amount
      paidById: row[5],       // F: Paid By ID
      paidByName: row[6],     // G: Paid By Name
      billLink: row[7],       // H: Bill Link
      status: row[8],         // I: Status
      createdAt: row[9],      // J: Created At
      updatedAt: row[10]      // K: Updated At
    };
  },

  /**
   * Finds the row index for an expense based on its ID.
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
  }
};
