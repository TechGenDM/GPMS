/**
 * GPMS Entry Point
 * =================
 * Only doGet() and doPost() live here.
 * Nothing else.
 */

/**
 * Handles GET requests.
 * Used for health checks and simple reads.
 *
 * @param {Object} e - Event object from Apps Script.
 * @returns {ContentOutput} JSON response.
 */
function doGet(e) {
  try {
    var action = e.parameter.action;

    // Health check — no action needed
    if (!action) {
      return success('GPMS Backend is running', {
        version: '1.0.0',
        timestamp: now(),
      });
    }

    return dispatch(action, e.parameter);
  } catch (err) {
    return error(ERROR_CODES.INTERNAL_ERROR, 'GET request failed: ' + err.message);
  }
}

/**
 * Handles POST requests.
 * All mutations go through here as JSON.
 *
 * Expected body:
 * {
 *   "action": "createDonation",
 *   "payload": { ... }
 * }
 *
 * @param {Object} e - Event object from Apps Script.
 * @returns {ContentOutput} JSON response.
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var payload = body.payload || {};

    return dispatch(action, payload);
  } catch (err) {
    return error(ERROR_CODES.INTERNAL_ERROR, 'POST request failed: ' + err.message);
  }
}