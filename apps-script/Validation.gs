/**
 * GPMS Validation Layer
 * ======================
 * All input validation lives here.
 * No validation inside service files.
 *
 * Each function returns:
 *   { valid: true }  or  { valid: false, message: "..." }
 */

/**
 * Validates donation input.
 * @param {Object} data - Donation payload.
 * @returns {Object} Validation result.
 */
function validateDonation(data) {
  // TODO: Implement in Milestone 3
  // Required fields: donorName, amount, category, date, paymentMode
  return { valid: true };
}

/**
 * Validates expense input.
 * @param {Object} data - Expense payload.
 * @returns {Object} Validation result.
 */
function validateExpense(data) {
  // TODO: Implement in Milestone 3
  // Required fields: description, amount, category, date
  return { valid: true };
}

/**
 * Validates user / login input.
 * @param {Object} data - User payload.
 * @returns {Object} Validation result.
 */
function validateUser(data) {
  // TODO: Implement in Milestone 3
  // Required fields: phone or username, password
  return { valid: true };
}
