/**
 * GPMS Standard Response Helpers
 * ===============================
 * Every API response uses the SAME structure.
 * Never manually build JSON — always use these.
 */

/**
 * Returns a success response.
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
 * Returns an error response.
 * @param {string} message - Human-readable error message.
 * @param {string} [error=''] - Technical error detail (for debugging).
 * @returns {ContentOutput} JSON response.
 */
function error(message, error) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: false,
      message: message || 'Something went wrong',
      error: error || '',
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
