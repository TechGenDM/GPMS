/**
 * GPMS User Service
 * ==================
 * Authentication and authorization foundation.
 * Responsible for trust, finding users, and managing roles.
 *
 * User object format:
 * { id, fullName, email, phone, role, status, createdAt, lastLogin }
 *
 * Users sheet structure:
 * | ID | FullName | Email | Phone | Role | Status | CreatedAt | LastLogin |
 */

var UserService = {
  /**
   * Finds a user by email address.
   *
   * @param {string} email - Email address to search for.
   * @returns {ContentOutput} JSON response with mapped User object.
   */
  findByEmail: function (email) {
    if (!email) {
      return error(ERROR_CODES.MISSING_FIELD, 'Email is required');
    }

    var row = UserService._findUserRow(email, 3); // 3rd column is Email
    if (row === -1) {
      return error(ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }

    var sheet = getSheet(CONFIG.sheets.users);
    var dataRow = sheet.getRange(row, 1, 1, 8).getValues()[0];

    return success('User found', UserService._mapUser(dataRow));
  },

  /**
   * Finds a user by ID.
   *
   * @param {string} userId - User ID (e.g., USR-...).
   * @returns {ContentOutput} JSON response with mapped User object.
   */
  findById: function (userId) {
    if (!userId) {
      return error(ERROR_CODES.MISSING_FIELD, 'User ID is required');
    }

    var row = UserService._findUserRow(userId, 1); // 1st column is ID
    if (row === -1) {
      return error(ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }

    var sheet = getSheet(CONFIG.sheets.users);
    var dataRow = sheet.getRange(row, 1, 1, 8).getValues()[0];

    return success('User found', UserService._mapUser(dataRow));
  },

  /**
   * Authenticates a user based on their Google email.
   * This is the core login flow. No passwords required.
   *
   * @param {Object} payload - Must include { email }.
   * @returns {ContentOutput} JSON response with User object if Active.
   */
  authenticate: function (payload) {
    if (!payload || !payload.email) {
      return error(ERROR_CODES.MISSING_FIELD, 'Email is required');
    }

    var row = UserService._findUserRow(payload.email, 3);
    if (row === -1) {
      return error(ERROR_CODES.USER_NOT_FOUND, 'User not found. You do not have access to GPMS.');
    }

    var sheet = getSheet(CONFIG.sheets.users);
    var dataRow = sheet.getRange(row, 1, 1, 8).getValues()[0];
    var user = UserService._mapUser(dataRow);

    if (user.status !== CONFIG.status.active) {
      return error(ERROR_CODES.USER_DISABLED, 'Your account has been disabled.');
    }

    // Update last login
    UserService._updateLastLogin(row);

    // Update the object before returning
    user.lastLogin = now();

    return success('Authentication successful', user);
  },

  /**
   * Authorizes an already authenticated user against allowed roles.
   * Used internally by other services. DOES NOT return a ContentOutput.
   *
   * @param {Object} user - The standard User object.
   * @param {string[]} allowedRoles - Array of roles allowed (e.g., [CONFIG.roles.admin]).
   * @returns {boolean} True if allowed, false otherwise.
   */
  authorize: function (user, allowedRoles) {
    if (!user || !user.role || !user.status) {
      return false;
    }

    if (user.status !== CONFIG.status.active) {
      return false;
    }

    // SuperAdmin bypass (assuming we might add it later, for now we just check the array)
    // If we have a 'SuperAdmin' role, we could always return true here.
    
    if (allowedRoles && allowedRoles.length > 0) {
      return allowedRoles.indexOf(user.role) !== -1;
    }

    return true; // No roles specified means any active user is allowed
  },

  /**
   * Creates a new user.
   * Protected operation — typically called by Admin panel.
   *
   * @param {Object} payload - User data (fullName, email, phone, role, status, adminUserId).
   * @returns {ContentOutput} JSON response.
   */
  createUser: function (payload) {
    var validation = validateUser(payload);
    if (!validation.valid) {
      return error(validation.code, validation.message);
    }

    // Check if email already exists
    if (UserService._findUserRow(payload.email, 3) !== -1) {
      return error(ERROR_CODES.EMAIL_ALREADY_EXISTS, 'Email already exists');
    }

    var sheet = getSheet(CONFIG.sheets.users);
    var userId = ReceiptService.generateUserId();
    var createdAt = now();

    sheet.appendRow([
      userId,
      payload.fullName,
      payload.email,
      payload.phone,
      payload.role,
      payload.status,
      createdAt,
      '', // lastLogin
    ]);

    AuditService.log({
      userId: payload.adminUserId || 'SYSTEM',
      userName: payload.adminUserName || 'System',
      action: 'createUser',
      module: 'Users',
      recordId: userId,
      newValue: JSON.stringify({ email: payload.email, role: payload.role }),
    });

    return success('User created successfully', { id: userId });
  },

  /**
   * Updates an existing user.
   *
   * @param {Object} payload - User data (userId, fullName, phone, role, adminUserId).
   * @returns {ContentOutput} JSON response.
   */
  updateUser: function (payload) {
    if (!payload || !payload.userId) {
      return error(ERROR_CODES.MISSING_FIELD, 'User ID is required');
    }

    var row = UserService._findUserRow(payload.userId, 1);
    if (row === -1) {
      return error(ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }

    var sheet = getSheet(CONFIG.sheets.users);
    
    // We only update specific fields, not email or status (status is managed via disable)
    if (payload.fullName) sheet.getRange(row, 2).setValue(payload.fullName);
    if (payload.phone) sheet.getRange(row, 4).setValue(payload.phone);
    if (payload.role) sheet.getRange(row, 5).setValue(payload.role);

    AuditService.log({
      userId: payload.adminUserId || 'SYSTEM',
      userName: payload.adminUserName || 'System',
      action: 'updateUser',
      module: 'Users',
      recordId: payload.userId,
      newValue: JSON.stringify({ fullName: payload.fullName, role: payload.role }),
    });

    return success('User updated successfully');
  },

  /**
   * Soft deletes a user by changing their status to Disabled.
   *
   * @param {Object} payload - Must include { userId, adminUserId }.
   * @returns {ContentOutput} JSON response.
   */
  disableUser: function (payload) {
    if (!payload || !payload.userId) {
      return error(ERROR_CODES.MISSING_FIELD, 'User ID is required');
    }

    var row = UserService._findUserRow(payload.userId, 1);
    if (row === -1) {
      return error(ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }

    var sheet = getSheet(CONFIG.sheets.users);
    
    // Protection: Cannot disable self (optional but good practice)
    if (payload.userId === payload.adminUserId) {
       return error(ERROR_CODES.FORBIDDEN, 'You cannot disable yourself');
    }

    sheet.getRange(row, 6).setValue('Disabled'); // Using hardcoded or config string, though config.status.cancelled might apply. Let's stick to 'Disabled' as per requirements.

    AuditService.log({
      userId: payload.adminUserId || 'SYSTEM',
      userName: payload.adminUserName || 'System',
      action: 'disableUser',
      module: 'Users',
      recordId: payload.userId,
    });

    return success('User disabled successfully');
  },

  /**
   * Retrieves all users.
   *
   * @returns {ContentOutput} JSON response with array of User objects.
   */
  getAllUsers: function () {
    var sheet = getSheet(CONFIG.sheets.users);
    var data = sheet.getDataRange().getValues();
    var users = [];

    // Skip header row
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        users.push(UserService._mapUser(data[i]));
      }
    }

    return success('Users retrieved', users);
  },

  // ==========================================
  // Internal Helpers
  // ==========================================

  /**
   * Maps a raw sheet row to a standard User object.
   *
   * @param {Array} row - Raw row data array.
   * @returns {Object} Standard User object.
   * @private
   */
  _mapUser: function (row) {
    return {
      id: row[0],
      fullName: row[1],
      email: row[2],
      phone: row[3],
      role: row[4],
      status: row[5],
      createdAt: row[6],
      lastLogin: row[7],
    };
  },

  /**
   * Finds the row index for a user based on a specific column index.
   *
   * @param {string} key - Value to search for.
   * @param {number} columnIndex - Which column to search (1-indexed).
   * @returns {number} Row index (1-indexed) or -1 if not found.
   * @private
   */
  _findUserRow: function (key, columnIndex) {
    var sheet = getSheet(CONFIG.sheets.users);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) { // Skip header
      if (String(data[i][columnIndex - 1]).toLowerCase() === String(key).toLowerCase()) {
        return i + 1; // 1-indexed for SpreadsheetApp
      }
    }
    return -1;
  },

  /**
   * Updates the LastLogin column for a user.
   *
   * @param {number} rowIndex - Row index of the user.
   * @private
   */
  _updateLastLogin: function (rowIndex) {
    var sheet = getSheet(CONFIG.sheets.users);
    sheet.getRange(rowIndex, 8).setValue(now()); // 8th column is LastLogin
  },
};
