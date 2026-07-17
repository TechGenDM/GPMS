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
   * Retrieves active expense categories.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Unused payload.
   * @returns {ContentOutput} JSON response.
   */
  getCategories: function (user, payload) {
    var sheet = getSheet(CONFIG.sheets.categories);
    var data = sheet.getDataRange().getValues();
    var categories = [];
    
    var catColIdx = -1;
    var startRow = 0;
    
    // Find the header row and column
    for (var r = 0; r < data.length; r++) {
      for (var c = 0; c < data[r].length; c++) {
        if (String(data[r][c]).trim().toLowerCase() === 'category') {
          catColIdx = c;
          startRow = r + 1;
          break;
        }
      }
      if (catColIdx !== -1) break;
    }
    
    if (catColIdx !== -1) {
      for (var i = startRow; i < data.length; i++) {
        if (data[i][catColIdx]) {
          var catName = String(data[i][catColIdx]).trim();
          if (catName) {
            categories.push(catName);
          }
        }
      }
    } else {
      // Fallback
      for (var i = 1; i < data.length; i++) {
        if (data[i][0]) {
          categories.push(String(data[i][0]).trim());
        }
      }
    }

    return success('Categories retrieved', categories);
  },

  /**
   * Records a new expense.
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
    var timestamp = now();
    
    var finalBillLink = payload.billLink || '';
    var fileId = null;

    if (payload.billFile && payload.billFile.base64) {
      var fileValidation = validateBillFile(payload.billFile);
      if (!fileValidation.valid) {
        return error(fileValidation.code, fileValidation.message);
      }
      
      // Get folder ID from settings
      var settingsSheet = getSheet(CONFIG.sheets.settings);
      var row = findRow(settingsSheet, 1, 'Expense Bills Folder ID');
      if (row === -1) {
        return error(ERROR_CODES.INTERNAL_ERROR, 'Expense Bills Folder ID is not configured in Settings.');
      }
      var folderId = settingsSheet.getRange(row, 2).getValue();
      
      try {
        var folder = DriveApp.getFolderById(folderId);
        
        // Convert base64 to blob. Remove data URI prefix if present.
        var base64Data = payload.billFile.base64;
        if (base64Data.indexOf('base64,') !== -1) {
          base64Data = base64Data.split('base64,')[1];
        }
        
        var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), payload.billFile.mimeType, expenseId + '_' + payload.billFile.name);
        
        var file = folder.createFile(blob);
        finalBillLink = file.getUrl();
        fileId = file.getId();
      } catch (e) {
        return error(ERROR_CODES.UPLOAD_FAILED, 'Failed to upload bill file: ' + e.message);
      }
    }

    // 3. Save to sheet (11 columns: A–K)
    var sheet = getSheet(CONFIG.sheets.expenses);
    try {
      safeAppendRow(
        sheet,
        [
          expenseId, // A: Expense ID
          payload.category, // B: Category
          payload.description, // C: Description
          payload.vendor || '', // D: Vendor
          payload.amount, // E: Amount
          user.id, // F: Paid By ID
          user.fullName, // G: Paid By Name
          finalBillLink, // H: Bill Link
          CONFIG.status.active, // I: Status
          timestamp, // J: CreatedAt
          timestamp, // K: UpdatedAt
        ],
        0
      );
    } catch (e) {
      if (fileId) {
        try {
          DriveApp.getFileById(fileId).setTrashed(true);
        } catch (delErr) {
          // Ignore
        }
      }
      return error(ERROR_CODES.INTERNAL_ERROR, 'Failed to save expense: ' + e.message);
    } // 0 is the index for column A (Expense ID)

    // 4. Audit log
    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'createExpense',
      module: 'Expenses',
      recordId: expenseId,
      newValue: JSON.stringify({
        amount: payload.amount,
        category: payload.category,
      }),
    });

    // 5. Return success
    return success('Expense created successfully', {
      id: expenseId,
      category: payload.category,
      description: payload.description,
      vendor: payload.vendor || '',
      amount: payload.amount,
      paidBy: user.fullName,
      date: timestamp,
      billLink: payload.billLink || '',
    });
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
      return error(
        ERROR_CODES.ROLE_NOT_ALLOWED,
        'Only admins can modify expenses'
      );
    }

    var row = ExpenseService._findExpenseRow(payload.expenseId);
    if (row === -1) {
      return error(ERROR_CODES.EXPENSE_NOT_FOUND, 'Expense not found');
    }

    var sheet = getSheet(CONFIG.sheets.expenses);
    var currentData = sheet.getRange(row, 1, 1, 11).getValues()[0];

    // Update specific fields (1-indexed for getRange)
    if (payload.category) sheet.getRange(row, 2).setValue(payload.category);
    if (payload.description)
      sheet.getRange(row, 3).setValue(payload.description);
    if (payload.vendor !== undefined)
      sheet.getRange(row, 4).setValue(payload.vendor);
    if (payload.amount) sheet.getRange(row, 5).setValue(payload.amount);
    if (payload.billLink !== undefined)
      sheet.getRange(row, 8).setValue(payload.billLink);
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
   * Cancels an existing expense.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include expenseId and cancellationReason.
   * @returns {ContentOutput} JSON response.
   */
  cancel: function (user, payload) {
    if (!UserService.authorize(user, [CONFIG.roles.admin, CONFIG.roles.superadmin])) {
      return error(ERROR_CODES.FORBIDDEN, 'Access denied. You do not have permission to cancel expenses.');
    }

    if (!payload || !payload.expenseId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Expense ID is required');
    }
    if (!payload.cancellationReason) {
      return error(ERROR_CODES.MISSING_FIELD, 'Cancellation reason is required');
    }

    var row = ExpenseService._findExpenseRow(payload.expenseId);
    if (row === -1) {
      return error(ERROR_CODES.EXPENSE_NOT_FOUND, 'Expense not found');
    }

    var sheet = getSheet(CONFIG.sheets.expenses);
    var currentStatus = sheet.getRange(row, 9).getValue();

    if (currentStatus === CONFIG.status.cancelled) {
      return error(ERROR_CODES.INVALID_STATE, 'Expense is already cancelled');
    }

    // Set Status to Cancelled (Column I / index 9)
    sheet.getRange(row, 9).setValue(CONFIG.status.cancelled);
    sheet.getRange(row, 11).setValue(now()); // UpdatedAt

    // For expenses, there's no "Remarks" column out of the box in the 1-11 standard schema.
    // I will append it to Description (Column C / index 3) if allowed, or just log in AuditLogs.
    // Wait, the prompt says "Preserve the reason in the cancellation AuditLog entry along with actor, timestamp and record ID. Do not modify frozen database columns without approval."
    // So I only need to log it in AuditLogs!

    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'cancelExpense',
      module: 'Expenses',
      recordId: payload.expenseId,
      newValue: payload.cancellationReason
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

    return success(
      'Expense retrieved',
      ExpenseService._mapExpense(currentData)
    );
  },

  /**
   * Searches expenses by criteria.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Search filters.
   * @returns {ContentOutput} JSON response.
   */
  search: function (user, payload) {
    if (!UserService.authorize(user, [CONFIG.roles.admin, CONFIG.roles.superadmin])) {
      return error(ERROR_CODES.FORBIDDEN, 'Access denied. You do not have permission to search expenses.');
    }

    var sheet = getSheet(CONFIG.sheets.expenses);
    var data = sheet.getDataRange().getValues();
    var results = [];

    for (var i = 1; i < data.length; i++) {
      if (!data[i][0] || String(data[i][0]).toLowerCase() === 'expense id')
        continue;

      var expense = ExpenseService._mapExpense(data[i]);
      var match = true;

      if (payload.status && expense.status !== payload.status) match = false;
      if (payload.category && expense.category !== payload.category)
        match = false;

      // Date filtering
      if (payload.startDate) {
        var sDate = new Date(payload.startDate);
        sDate.setHours(0, 0, 0, 0);
        var dDate = new Date(expense.createdAt);
        if (dDate < sDate) match = false;
      }
      if (payload.endDate) {
        var eDate = new Date(payload.endDate);
        eDate.setHours(23, 59, 59, 999);
        var dDate = new Date(expense.createdAt);
        if (dDate > eDate) match = false;
      }

      // Unified search query (Expense ID + vendor + description)
      if (payload.searchQuery) {
        var query = String(payload.searchQuery).toLowerCase();
        var searchFields = [
          String(expense.id).toLowerCase(),
          String(expense.vendor || '').toLowerCase(),
          String(expense.description || '').toLowerCase()
        ].join(' ');
        
        if (searchFields.indexOf(query) === -1) {
          match = false;
        }
      }

      if (match) {
        results.push(expense);
      }
    }

    return success('Expenses retrieved', results);
  },

  /**
   * Verifies an official expense record (Public, unauthenticated).
   * Scrubbed for privacy.
   *
   * @param {Object} payload - Must include { expenseId }
   * @returns {ContentOutput} JSON response with verified data.
   */
  verify: function (payload) {
    if (!payload || !payload.expenseId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Expense ID is required');
    }

    var row = ExpenseService._findExpenseRow(payload.expenseId);
    if (row === -1) {
      return error(ERROR_CODES.EXPENSE_NOT_FOUND, 'Expense record not found');
    }

    var sheet = getSheet(CONFIG.sheets.expenses);
    var dataRow = sheet.getRange(row, 1, 1, 11).getValues()[0];
    var rawExpense = ExpenseService._mapExpense(dataRow);

    // Return safe data for public verification
    var safeData = {
      expenseId: rawExpense.id,
      category: rawExpense.category,
      description: rawExpense.description,
      vendor: rawExpense.vendor,
      amount: rawExpense.amount,
      paidByName: rawExpense.paidByName, // Safe to show name
      date: rawExpense.createdAt,
      status: rawExpense.status,
      hasBill: !!rawExpense.billLink,
    };

    return success('Expense verified successfully', safeData);
  },

  /**
   * Retrieves the most recent expenses.
   */
  getRecentExpenses: function (user, payload) {
    var limit = payload && payload.limit ? parseInt(payload.limit, 10) : 10;

    var sheet = getSheet(CONFIG.sheets.expenses);
    var data = sheet.getDataRange().getValues();
    var results = [];

    for (var i = data.length - 1; i > 0; i--) {
      if (!data[i][0] || String(data[i][0]).toLowerCase() === 'expense id')
        continue;

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
      id: row[0], // A: Expense ID
      category: row[1], // B: Category
      description: row[2], // C: Description
      vendor: row[3], // D: Vendor
      amount: row[4], // E: Amount
      paidById: row[5], // F: Paid By ID
      paidByName: row[6], // G: Paid By Name
      billLink: row[7], // H: Bill Link
      status: row[8], // I: Status
      createdAt: row[9], // J: Created At
      updatedAt: row[10], // K: Updated At
    };
  },

  /**
   * Finds the row index for an expense based on its ID.
   */
  _findExpenseRow: function (expenseId) {
    var sheet = getSheet(CONFIG.sheets.expenses);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (
        String(data[i][0]).toLowerCase() === String(expenseId).toLowerCase()
      ) {
        return i + 1;
      }
    }
    return -1;
  },
};
