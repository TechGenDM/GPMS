/**
 * GPMS Validation Layer
 * ======================
 * All input validation lives here.
 * No validation inside service files.
 *
 * Every validator returns:
 *   { valid: true }
 *   { valid: false, code: "ERROR_CODE", message: "Human-readable message" }
 */

/**
 * Validates donation input.
 * Matches actual GPMS Database 2026 Donations sheet.
 *
 * Required: donorName, amount, paymentMode
 * Optional: phone, upiRef, purpose, remarks
 *
 * @param {Object} data - Donation payload.
 * @returns {Object} Validation result.
 */
function validateDonation(data) {
  if (!data) {
    return { valid: false, code: ERROR_CODES.VALIDATION_ERROR, message: 'Donation data is required' };
  }

  if (!data.donorName || String(data.donorName).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Donor name is required' };
  }

  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    return { valid: false, code: ERROR_CODES.INVALID_AMOUNT, message: 'Amount must be greater than zero' };
  }

  if (!data.paymentMode || String(data.paymentMode).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Payment mode is required' };
  }

  return { valid: true };
}

/**
 * Validates expense input.
 *
 * @param {Object} data - Expense payload.
 * @returns {Object} Validation result.
 */
function validateExpense(data) {
  if (!data) {
    return { valid: false, code: ERROR_CODES.VALIDATION_ERROR, message: 'Expense data is required' };
  }

  if (!data.category || String(data.category).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Category is required' };
  }

  if (!data.description || String(data.description).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Description is required' };
  }

  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    return { valid: false, code: ERROR_CODES.INVALID_AMOUNT, message: 'Amount must be greater than zero' };
  }

  if (!data.category || String(data.category).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Category is required' };
  }

  return { valid: true };
}

/**
 * Validates user / login input for creation or updates.
 *
 * @param {Object} data - User payload.
 * @returns {Object} Validation result.
 */
function validateUser(data) {
  if (!data) {
    return { valid: false, code: ERROR_CODES.VALIDATION_ERROR, message: 'User data is required' };
  }

  if (!data.fullName || String(data.fullName).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Full name is required' };
  }

  if (!data.email || String(data.email).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Email is required' };
  }

  // Basic email validation
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid email format' };
  }

  if (!data.phone || String(data.phone).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Phone number is required' };
  }

  // Basic phone validation (Indian 10-digit)
  var phone = String(data.phone).replace(/\D/g, '');
  if (phone.length !== 10) {
    return { valid: false, code: ERROR_CODES.VALIDATION_ERROR, message: 'Phone must be 10 digits' };
  }

  if (!data.role || String(data.role).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Role is required' };
  }

  // Validate role against CONFIG
  var validRoles = Object.values(CONFIG.roles);
  if (validRoles.indexOf(data.role) === -1) {
    return { valid: false, code: ERROR_CODES.INVALID_ROLE, message: 'Invalid role specified' };
  }

  if (!data.status || String(data.status).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Status is required' };
  }

  // Validate status against CONFIG
  var validStatuses = Object.values(CONFIG.status);
  if (validStatuses.indexOf(data.status) === -1) {
    return { valid: false, code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid status specified' };
  }

  return { valid: true };
}

/**
 * Validates settings input.
 *
 * @param {Object} data - Settings payload.
 * @returns {Object} Validation result.
 */
function validateSettings(data) {
  if (!data) {
    return { valid: false, code: ERROR_CODES.VALIDATION_ERROR, message: 'Settings data is required' };
  }

  if (!data.key || String(data.key).trim() === '') {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Setting key is required' };
  }

  if (data.value === undefined || data.value === null) {
    return { valid: false, code: ERROR_CODES.MISSING_FIELD, message: 'Setting value is required' };
  }

  return { valid: true };
}
