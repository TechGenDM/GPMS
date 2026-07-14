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
        Utilities.getUuid(),          // LogId — unique identifier
        now(),                        // Timestamp
        params.userId || '',          // UserId
        params.userName || 'System',  // UserName
        params.action || '',          // Action
        params.module || '',          // Module
        params.recordId || '',        // RecordId
        params.oldValue || '',        // OldValue
        params.newValue || '',        // NewValue
      ]);
    } catch (e) {
      // Audit logging should never break the main flow.
      // If it fails, log to Apps Script console but don't throw.
      console.error('AuditService.log failed: ' + e.message);
    }
  },
};
