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
    return {
      valid: false,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Donation data is required',
    };
  }

  if (!data.donorName || String(data.donorName).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Donor name is required',
    };
  }

  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0 || Number(data.amount) > 9999999) {
    return {
      valid: false,
      code: ERROR_CODES.INVALID_AMOUNT,
      message: 'Amount must be a valid number between 1 and 9,999,999',
    };
  }

  if (data.phone && String(data.phone).trim() !== '') {
    var phoneStr = String(data.phone).trim();
    if (!/^[6-9]\d{9}$/.test(phoneStr)) {
      return {
        valid: false,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Please enter a valid 10-digit mobile number',
      };
    }
  }

  if (!data.paymentMode || String(data.paymentMode).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Payment mode is required',
    };
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
    return {
      valid: false,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Expense data is required',
    };
  }

  if (!data.category || String(data.category).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Category is required',
    };
  }

  if (!data.description || String(data.description).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Description is required',
    };
  }

  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0 || Number(data.amount) > 9999999) {
    return {
      valid: false,
      code: ERROR_CODES.INVALID_AMOUNT,
      message: 'Amount must be a valid number between 1 and 9,999,999',
    };
  }

  if (!data.category || String(data.category).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Category is required',
    };
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
    return {
      valid: false,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'User data is required',
    };
  }

  if (!data.fullName || String(data.fullName).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Full name is required',
    };
  }

  if (!data.email || String(data.email).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Email is required',
    };
  }

  // Basic email validation
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return {
      valid: false,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Invalid email format',
    };
  }

  if (!data.phone || String(data.phone).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Phone number is required',
    };
  }

  // Basic phone validation (Indian 10-digit)
  var phone = String(data.phone).replace(/\D/g, '');
  if (phone.length !== 10) {
    return {
      valid: false,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Phone must be 10 digits',
    };
  }

  if (!data.role || String(data.role).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Role is required',
    };
  }

  // Validate role against CONFIG
  var validRoles = Object.values(CONFIG.roles);
  if (validRoles.indexOf(String(data.role)) === -1) {
    return {
      valid: false,
      code: ERROR_CODES.INVALID_ROLE,
      message: 'Invalid role specified: ' + data.role + ' (Valid: ' + validRoles.join(',') + ')',
    };
  }

  if (!data.status || String(data.status).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Status is required',
    };
  }

  // Validate status against CONFIG
  var validStatuses = Object.values(CONFIG.status);
  if (validStatuses.indexOf(data.status) === -1) {
    return {
      valid: false,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Invalid status specified',
    };
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
    return {
      valid: false,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Settings data is required',
    };
  }

  if (!data.key || String(data.key).trim() === '') {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Setting key is required',
    };
  }

  if (data.value === undefined || data.value === null) {
    return {
      valid: false,
      code: ERROR_CODES.MISSING_FIELD,
      message: 'Setting value is required',
    };
  }

  return { valid: true };
}

/**
 * Validates a bill file upload.
 *
 * @param {Object} file - File payload { base64, mimeType, name }
 * @returns {Object} Validation result.
 */
function validateBillFile(file) {
  if (!file || !file.base64 || !file.mimeType || !file.name) {
    return {
      valid: false,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Invalid file payload',
    };
  }

  var validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (validTypes.indexOf(file.mimeType) === -1) {
    return {
      valid: false,
      code: ERROR_CODES.INVALID_FILE_TYPE,
      message: 'Invalid file type. Only PDF, JPG, and PNG are allowed.',
    };
  }

  // Calculate approx size from base64 (string length * 3/4)
  var approxSizeMB = (file.base64.length * 0.75) / (1024 * 1024);
  if (approxSizeMB > 5) {
    return {
      valid: false,
      code: ERROR_CODES.FILE_TOO_LARGE,
      message: 'File is too large. Maximum size is 5MB.',
    };
  }

  return { valid: true };
}
