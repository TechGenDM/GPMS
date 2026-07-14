/**
 * GPMS Donation Service
 * ======================
 * Core business logic for managing donations.
 *
 * Donation object format:
 * { id, date, donorName, amount, category, paymentMode, status, createdBy, updatedBy, remarks }
 *
 * Donations sheet structure:
 * | ID | Date | DonorName | Amount | Category | PaymentMode | Status | CreatedBy | UpdatedBy | Remarks |
 */

var DonationService = {
  /**
   * Creates a new donation record.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Donation data.
   * @returns {ContentOutput} JSON response.
   */
  create: function (user, payload) {
    // 1. Validate
    var validation = validateDonation(payload);
    if (!validation.valid) {
      return error(validation.code, validation.message);
    }

    // 2. Generate ID
    var donationId = ReceiptService.generateDonationId();
    var date = now();

    // 3. Save to sheet
    var sheet = getSheet(CONFIG.sheets.donations);
    sheet.appendRow([
      donationId,
      date,
      payload.donorName,
      payload.amount,
      payload.category,
      payload.paymentMode,
      CONFIG.status.active, // Default status
      user.fullName,        // CreatedBy
      '',                   // UpdatedBy
      payload.remarks || '' // Remarks
    ]);

    // 4. Audit log
    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'createDonation',
      module: 'Donations',
      recordId: donationId,
      newValue: JSON.stringify({ amount: payload.amount, category: payload.category }),
    });

    // 5. Return success
    return success('Donation created successfully', { id: donationId });
  },

  /**
   * Updates an existing donation.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include donationId + fields to update.
   * @returns {ContentOutput} JSON response.
   */
  update: function (user, payload) {
    if (!payload || !payload.donationId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Donation ID is required');
    }

    // Authorization: Only Admins can update donations
    if (!UserService.authorize(user, [CONFIG.roles.admin])) {
      return error(ERROR_CODES.ROLE_NOT_ALLOWED, 'Only admins can modify donations');
    }

    var row = DonationService._findDonationRow(payload.donationId);
    if (row === -1) {
      return error(ERROR_CODES.DONATION_NOT_FOUND, 'Donation not found');
    }

    var sheet = getSheet(CONFIG.sheets.donations);
    
    // Read current data to preserve old state in audit if needed
    var currentData = sheet.getRange(row, 1, 1, 10).getValues()[0];
    var oldDonation = DonationService._mapDonation(currentData);

    // Update specific fields
    if (payload.donorName) sheet.getRange(row, 3).setValue(payload.donorName);
    if (payload.amount) sheet.getRange(row, 4).setValue(payload.amount);
    if (payload.category) sheet.getRange(row, 5).setValue(payload.category);
    if (payload.paymentMode) sheet.getRange(row, 6).setValue(payload.paymentMode);
    if (payload.remarks !== undefined) sheet.getRange(row, 10).setValue(payload.remarks);
    
    sheet.getRange(row, 9).setValue(user.fullName); // UpdatedBy

    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'updateDonation',
      module: 'Donations',
      recordId: payload.donationId,
      oldValue: JSON.stringify({ amount: oldDonation.amount, name: oldDonation.donorName }),
      newValue: JSON.stringify({ amount: payload.amount || oldDonation.amount, name: payload.donorName || oldDonation.donorName }),
    });

    return success('Donation updated successfully');
  },

  /**
   * Cancels a donation (soft delete — sets status to Cancelled).
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include donationId.
   * @returns {ContentOutput} JSON response.
   */
  cancel: function (user, payload) {
    if (!payload || !payload.donationId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Donation ID is required');
    }

    // Authorization: Only Admins can cancel donations
    if (!UserService.authorize(user, [CONFIG.roles.admin])) {
      return error(ERROR_CODES.ROLE_NOT_ALLOWED, 'Only admins can cancel donations');
    }

    var row = DonationService._findDonationRow(payload.donationId);
    if (row === -1) {
      return error(ERROR_CODES.DONATION_NOT_FOUND, 'Donation not found');
    }

    var sheet = getSheet(CONFIG.sheets.donations);
    sheet.getRange(row, 7).setValue(CONFIG.status.cancelled); // Status
    sheet.getRange(row, 9).setValue(user.fullName); // UpdatedBy

    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'cancelDonation',
      module: 'Donations',
      recordId: payload.donationId,
    });

    return success('Donation cancelled successfully');
  },

  /**
   * Retrieves a single donation by ID.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include donationId.
   * @returns {ContentOutput} JSON response.
   */
  get: function (user, payload) {
    if (!payload || !payload.donationId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Donation ID is required');
    }

    var row = DonationService._findDonationRow(payload.donationId);
    if (row === -1) {
      return error(ERROR_CODES.DONATION_NOT_FOUND, 'Donation not found');
    }

    var sheet = getSheet(CONFIG.sheets.donations);
    var currentData = sheet.getRange(row, 1, 1, 10).getValues()[0];

    return success('Donation retrieved', DonationService._mapDonation(currentData));
  },

  /**
   * Searches donations by criteria (name, date range, category, etc.).
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Search filters.
   * @returns {ContentOutput} JSON response.
   */
  search: function (user, payload) {
    var sheet = getSheet(CONFIG.sheets.donations);
    var data = sheet.getDataRange().getValues();
    var results = [];

    // Skip header row
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue; // Skip empty rows

      var donation = DonationService._mapDonation(data[i]);
      var match = true;

      // Basic filtering
      if (payload.status && donation.status !== payload.status) match = false;
      if (payload.category && donation.category !== payload.category) match = false;
      if (payload.paymentMode && donation.paymentMode !== payload.paymentMode) match = false;
      
      // Case-insensitive substring match for donor name
      if (payload.donorName && donation.donorName.toLowerCase().indexOf(payload.donorName.toLowerCase()) === -1) {
        match = false;
      }

      if (match) {
        results.push(donation);
      }
    }

    return success('Donations retrieved', results);
  },

  // ==========================================
  // Internal Helpers
  // ==========================================

  /**
   * Maps a raw sheet row to a standard Donation object.
   *
   * @param {Array} row - Raw row data array.
   * @returns {Object} Standard Donation object.
   * @private
   */
  _mapDonation: function (row) {
    return {
      id: row[0],
      date: row[1],
      donorName: row[2],
      amount: row[3],
      category: row[4],
      paymentMode: row[5],
      status: row[6],
      createdBy: row[7],
      updatedBy: row[8],
      remarks: row[9],
    };
  },

  /**
   * Finds the row index for a donation based on its ID.
   *
   * @param {string} donationId - ID to search for.
   * @returns {number} Row index (1-indexed) or -1 if not found.
   * @private
   */
  _findDonationRow: function (donationId) {
    var sheet = getSheet(CONFIG.sheets.donations);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(donationId).toLowerCase()) {
        return i + 1;
      }
    }
    return -1;
  },
};
