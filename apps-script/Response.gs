/**
 * GPMS Standard Response Helpers
 * ===============================
 * Every API response uses the SAME structure.
 * Never manually build JSON — always use these.
 *
 * Success: { success: true, message, data }
 * Error:   { success: false, code, message }
 */

/**
 * Returns a success response.
 *
 * @param {string} message - Human-readable success message.
 * @param {Object} [data={}] - Response payload.
 * @returns {ContentOutput} JSON response.
 */
function success(message, data) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: message || 'OK',
      data: data || {},
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Returns an error response with a machine-readable error code.
 *
 * @param {string} code - Machine-readable error code (e.g., VALIDATION_ERROR).
 * @param {string} message - Human-readable error message.
 * @returns {ContentOutput} JSON response.
 */
function error(code, message) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: false,
      code: code || 'INTERNAL_ERROR',
      message: message || 'Something went wrong',
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Standard error codes used across the backend.
 * Frontend can switch on these for specific handling.
 */
var ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Not found
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  DONATION_NOT_FOUND: 'DONATION_NOT_FOUND',
  EXPENSE_NOT_FOUND: 'EXPENSE_NOT_FOUND',
  SETTING_NOT_FOUND: 'SETTING_NOT_FOUND',
  SHEET_NOT_FOUND: 'SHEET_NOT_FOUND',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RECEIPT_GENERATION_FAILED: 'RECEIPT_GENERATION_FAILED',
  LOCK_TIMEOUT: 'LOCK_TIMEOUT',

  // Actions
  UNKNOWN_ACTION: 'UNKNOWN_ACTION',
  MISSING_ACTION: 'MISSING_ACTION',
};
