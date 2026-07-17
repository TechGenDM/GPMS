/**
 * GPMS Audit Service
 * ====================
 * Every important action gets logged here.
 * One function. Used everywhere.
 *
 * Flow: Action → Save → Audit Log → Return
 * Never forget logging.
 *
 * AuditLogs sheet structure:
 * | LogId | Timestamp | UserId | UserName | Action | Module | RecordId | OldValue | NewValue |
 */

var AuditService = {
  /**
   * Logs an action to the AuditLogs sheet.
   *
   * @param {Object} params
   * @param {string} params.userId    - Who did it (user ID).
   * @param {string} params.userName  - Who did it (display name).
   * @param {string} params.action    - What happened (e.g., "createDonation").
   * @param {string} params.module    - Which module (e.g., "Donations").
   * @param {string} [params.recordId]  - Related record ID.
   * @param {string} [params.oldValue]  - Previous value (for updates).
   * @param {string} [params.newValue]  - New value (for updates).
   */
  log: function (params) {
    try {
      var sheet = getSheet(CONFIG.sheets.auditLogs);

      sheet.appendRow([
        Utilities.getUuid(), // LogId — unique identifier
        params.userId || '', // UserId
        params.userName || 'System', // UserName
        params.action || '', // Action
        params.module || '', // Module
        params.recordId || '', // RecordId
        params.oldValue || '', // OldValue
        params.newValue || '', // NewValue
        now(), // Timestamp
      ]);
    } catch (e) {
      // Audit logging should never break the main flow.
      // If it fails, log to Apps Script console but don't throw.
      console.error('AuditService.log failed: ' + e.message);
    }
  },

  /**
   * Retrieves the latest audit logs.
   * Strictly limited to SuperAdmin and Admin.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Limit (max 500).
   * @returns {ContentOutput} JSON response.
   */
  getRecentLogs: function (user, payload) {
    if (!UserService.authorize(user, [CONFIG.roles.superadmin, CONFIG.roles.admin])) {
      return error(ERROR_CODES.FORBIDDEN, 'Insufficient permissions to view audit logs');
    }

    var limit = parseInt(payload && payload.limit ? payload.limit : 500, 10);
    if (isNaN(limit) || limit < 1) limit = 100;
    if (limit > 500) limit = 500;

    var sheet = getSheet(CONFIG.sheets.auditLogs);
    var data = sheet.getDataRange().getValues();
    var results = [];

    // Skip header and iterate backwards
    for (var i = data.length - 1; i > 0; i--) {
      if (results.length >= limit) break;
      var row = data[i];
      if (!row[0]) continue; // Skip empty rows

      results.push({
        logId: row[0],
        userId: row[1],
        userName: row[2],
        action: row[3],
        module: row[4],
        recordId: row[5],
        oldValue: row[6],
        newValue: row[7],
        timestamp: row[8],
      });
    }

    return success('Audit logs retrieved successfully', results);
  },

  /**
   * Logs an export action by an admin.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Export details.
   * @returns {ContentOutput} JSON response.
   */
  logExport: function (user, payload) {
    if (!UserService.authorize(user, [CONFIG.roles.superadmin, CONFIG.roles.admin])) {
      return error(ERROR_CODES.FORBIDDEN, 'Insufficient permissions');
    }

    AuditService.log({
      userId: user.id,
      userName: user.fullName,
      action: 'export',
      module: payload.module || 'System',
      newValue: 'Exported ' + (payload.format || 'CSV'),
    });

    return success('Export logged successfully');
  },
};
