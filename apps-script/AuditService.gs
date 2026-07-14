/**
 * GPMS Audit Service
 * ====================
 * Every important action gets logged here.
 * One function. Used everywhere.
 *
 * Flow: Action → Save → Audit Log → Return
 * Never forget logging.
 */

var AuditService = {
  /**
   * Logs an action to the AuditLogs sheet.
   * @param {Object} params
   * @param {string} params.action   - What happened (e.g., "createDonation").
   * @param {string} params.user     - Who did it (user ID or name).
   * @param {string} params.details  - Additional context (JSON string or description).
   * @param {string} [params.recordId] - Related record ID (donation/expense ID).
   */
  log: function (params) {
    // TODO: Implement in Milestone 3
    // 1. Get AuditLogs sheet
    // 2. Append row: [timestamp, action, user, recordId, details]
    // 3. No return needed — fire and forget
  },
};
