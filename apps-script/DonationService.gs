/**
 * GPMS Donation Service
 * ======================
 * Core business logic for managing donations.
 *
 * Donations sheet structure (actual GPMS Database 2026):
 * | A: Donation ID | B: Receipt ID | C: Donor Name | D: Phone | E: Amount |
 * | F: Payment Mode | G: UPI Ref | H: Collector ID | I: Collector Name |
 * | J: Purpose | K: Remarks | L: Status | M: Created At | N: Updated At |
 *
 * Column indexes (0-based):
 *  0  Donation ID
 *  1  Receipt ID
 *  2  Donor Name
 *  3  Phone
 *  4  Amount
 *  5  Payment Mode
 *  6  UPI Ref
 *  7  Collector ID
 *  8  Collector Name
 *  9  Purpose
 * 10  Remarks
 * 11  Status
 * 12  Created At
 * 13  Updated At
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

    var transactionId = payload.transactionId;
    if (!transactionId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Transaction ID is required for idempotency');
    }

    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000); // 15 second lock wait

      var sheet = getSheet(CONFIG.sheets.donations);

      // Idempotency check: Column 15 (O) is Transaction ID
      var existingRow = findRow(sheet, 15, transactionId);
      if (existingRow !== -1) {
        // Idempotent success: return existing record
        var currentData = sheet.getRange(existingRow, 1, 1, 15).getValues()[0];
        return success(
          'Donation recorded (idempotent)',
          DonationService._mapDonation(currentData)
        );
      }

      // 2. Generate IDs (skip inner locks)
      var donationId = ReceiptService.generateDonationId(true);
      var receiptId = ReceiptService.generateReceiptId(true);
      var date = now();

      // 3. Save to sheet (15 columns: A–O)
      safeAppendRow(
        sheet,
        [
          donationId, // A: Donation ID
          receiptId, // B: Receipt ID
          payload.donorName, // C: Donor Name
          payload.phone || '', // D: Phone
          payload.amount, // E: Amount
          payload.paymentMode, // F: Payment Mode
          payload.upiRef || '', // G: UPI Ref
          user.id, // H: Collector ID (authenticated user)
          user.fullName, // I: Collector Name
          payload.purpose || 'General', // J: Purpose
          payload.remarks || '', // K: Remarks
          CONFIG.status.active, // L: Status
          date, // M: Created At
          date, // N: Updated At
          transactionId, // O: Transaction ID
        ],
        0 // ID Col index (A)
      );
      
      SpreadsheetApp.flush(); // Ensure row is written before releasing lock
    } catch (e) {
      return error(ERROR_CODES.INTERNAL_ERROR, 'Failed to process transaction: ' + e.message);
    } finally {
      lock.releaseLock();
    }

    // 4. Audit log
    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'createDonation',
      module: 'Donations',
      recordId: donationId,
      newValue: JSON.stringify({
        amount: payload.amount,
        donor: payload.donorName,
        mode: payload.paymentMode,
      }),
    });

    // 5. Return success
    return success('Donation created successfully', {
      id: donationId,
      receiptId: receiptId,
      collectorName: user.fullName,
    });
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
      return error(
        ERROR_CODES.ROLE_NOT_ALLOWED,
        'Only admins can modify donations'
      );
    }

    var row = DonationService._findDonationRow(payload.donationId);
    if (row === -1) {
      return error(ERROR_CODES.DONATION_NOT_FOUND, 'Donation not found');
    }

    var sheet = getSheet(CONFIG.sheets.donations);

    // Read current data to preserve old state in audit
    var currentData = sheet.getRange(row, 1, 1, 14).getValues()[0];
    var oldDonation = DonationService._mapDonation(currentData);

    // Update specific fields (1-indexed column numbers)
    if (payload.donorName) sheet.getRange(row, 3).setValue(payload.donorName); // C
    if (payload.phone !== undefined)
      sheet.getRange(row, 4).setValue(payload.phone); // D
    if (payload.amount) sheet.getRange(row, 5).setValue(payload.amount); // E
    if (payload.paymentMode)
      sheet.getRange(row, 6).setValue(payload.paymentMode); // F
    if (payload.upiRef !== undefined)
      sheet.getRange(row, 7).setValue(payload.upiRef); // G
    if (payload.purpose !== undefined)
      sheet.getRange(row, 10).setValue(payload.purpose); // J
    if (payload.remarks !== undefined)
      sheet.getRange(row, 11).setValue(payload.remarks); // K

    sheet.getRange(row, 14).setValue(now()); // N: Updated At

    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'updateDonation',
      module: 'Donations',
      recordId: payload.donationId,
      oldValue: JSON.stringify({
        amount: oldDonation.amount,
        name: oldDonation.donorName,
      }),
      newValue: JSON.stringify({
        amount: payload.amount || oldDonation.amount,
        name: payload.donorName || oldDonation.donorName,
      }),
    });

    return success('Donation updated successfully');
  },

  /**
   * Cancels a donation (soft delete — sets status to Cancelled).
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include donationId + optional cancellationReason.
   * @returns {ContentOutput} JSON response.
   */
  cancel: function (user, payload) {
    if (!payload || !payload.donationId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Donation ID is required');
    }
    if (!payload.cancellationReason) {
      return error(ERROR_CODES.MISSING_FIELD, 'Cancellation reason is required');
    }

    // Authorization: Only Admins/SuperAdmins can cancel donations
    if (!UserService.authorize(user, [CONFIG.roles.admin, CONFIG.roles.superadmin])) {
      return error(
        ERROR_CODES.ROLE_NOT_ALLOWED,
        'Only admins can cancel donations'
      );
    }

    var row = DonationService._findDonationRow(payload.donationId);
    if (row === -1) {
      return error(ERROR_CODES.DONATION_NOT_FOUND, 'Donation not found');
    }

    var sheet = getSheet(CONFIG.sheets.donations);
    sheet.getRange(row, 12).setValue(CONFIG.status.cancelled); // L: Status
    sheet.getRange(row, 14).setValue(now()); // N: Updated At

    // Store cancellation reason in Remarks if provided
    if (payload.cancellationReason) {
      var existingRemarks = sheet.getRange(row, 11).getValue();
      var newRemarks = existingRemarks
        ? existingRemarks + ' | Cancelled: ' + payload.cancellationReason
        : 'Cancelled: ' + payload.cancellationReason;
      sheet.getRange(row, 11).setValue(newRemarks);
    }

    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'cancelDonation',
      module: 'Donations',
      recordId: payload.donationId,
      newValue: payload.cancellationReason || 'No reason provided'
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
    var currentData = sheet.getRange(row, 1, 1, 14).getValues()[0];

    return success(
      'Donation retrieved',
      DonationService._mapDonation(currentData)
    );
  },

  /**
   * Searches donations by criteria.
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
      if (payload.purpose && donation.purpose !== payload.purpose)
        match = false;
      if (payload.paymentMode && donation.paymentMode !== payload.paymentMode)
        match = false;

      // Date filtering
      if (payload.startDate) {
        var sDate = new Date(payload.startDate);
        sDate.setHours(0, 0, 0, 0);
        var dDate = new Date(donation.createdAt);
        if (dDate < sDate) match = false;
      }
      if (payload.endDate) {
        var eDate = new Date(payload.endDate);
        eDate.setHours(23, 59, 59, 999);
        var dDate = new Date(donation.createdAt);
        if (dDate > eDate) match = false;
      }

      // Unified search query (Receipt ID + donor name + phone)
      if (payload.searchQuery) {
        var query = String(payload.searchQuery).toLowerCase();
        var searchFields = [
          String(donation.receiptId).toLowerCase(),
          String(donation.donorName).toLowerCase(),
          String(donation.phone || '').toLowerCase()
        ].join(' ');
        
        if (searchFields.indexOf(query) === -1) {
          match = false;
        }
      }

      if (match) {
        results.push(donation);
      }
    }

    return success('Donations retrieved', results);
  },

  /**
   * Verifies a donation by receipt ID.
   * Publicly accessible, returns ONLY safe fields.
   *
   * @param {Object} payload - Must include receiptId.
   * @returns {ContentOutput} JSON response.
   */
  verify: function (payload) {
    if (!payload || !payload.receiptId) {
      return error(ERROR_CODES.MISSING_FIELD, 'Receipt ID is required');
    }

    var sheet = getSheet(CONFIG.sheets.donations);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      // Column B (index 1) is Receipt ID
      if (
        String(data[i][1]).toLowerCase() ===
        String(payload.receiptId).toLowerCase()
      ) {
        var row = data[i];

        // Only return public-safe fields
        var safeData = {
          donationId: row[0],
          receiptId: row[1],
          donorName: row[2],
          amount: row[4],
          paymentMode: row[5],
          collectorName: row[8],
          purpose: row[9],
          status: row[11],
          createdAt: row[12],
        };

        // If it's cancelled, we might want to return it but mark it clearly
        if (safeData.status === 'Cancelled') {
          return success('Receipt is cancelled', safeData);
        }

        return success('Receipt verified', safeData);
      }
    }

    return error(ERROR_CODES.DONATION_NOT_FOUND, 'Receipt not found');
  },

  // ==========================================
  // Internal Helpers
  // ==========================================

  /**
   * Maps a raw sheet row to a standard Donation object.
   * Matches actual GPMS Database 2026 Donations sheet (14 columns A–N).
   *
   * @param {Array} row - Raw row data array.
   * @returns {Object} Standard Donation object.
   * @private
   */
  _mapDonation: function (row) {
    return {
      id: row[0], // A: Donation ID
      receiptId: row[1], // B: Receipt ID
      donorName: row[2], // C: Donor Name
      phone: row[3], // D: Phone
      amount: row[4], // E: Amount
      paymentMode: row[5], // F: Payment Mode
      upiRef: row[6], // G: UPI Ref
      collectorId: row[7], // H: Collector ID
      collectorName: row[8], // I: Collector Name
      purpose: row[9], // J: Purpose
      remarks: row[10], // K: Remarks
      status: row[11], // L: Status
      createdAt: row[12], // M: Created At
      updatedAt: row[13], // N: Updated At
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
      if (
        String(data[i][0]).toLowerCase() === String(donationId).toLowerCase()
      ) {
        return i + 1;
      }
    }
    return -1;
  },
};
