/**
 * GPMS Settings Service
 * ======================
 * Read and write application settings.
 * Never directly read the Settings sheet — always use this service.
 *
 * Settings sheet structure:
 * | Key | Value | UpdatedAt | UpdatedBy |
 */

var SettingsService = {
  /**
   * Retrieves a single setting value by key.
   *
   * @param {Object} payload - Must include { key: "settingName" }.
   * @returns {ContentOutput} JSON response with setting value.
   */
  get: function (payload) {
    if (!payload || !payload.key) {
      return error(ERROR_CODES.MISSING_FIELD, 'Setting key is required');
    }

    var sheet = getSheet(CONFIG.sheets.settings);
    var row = findRow(sheet, 1, payload.key);

    if (row === -1) {
      return error(
        ERROR_CODES.SETTING_NOT_FOUND,
        'Setting not found: ' + payload.key
      );
    }

    var value = sheet.getRange(row, 2).getValue();

    return success('Setting retrieved', {
      key: payload.key,
      value: value,
    });
  },

  /**
   * Updates a setting value by key.
   * Creates the setting if it doesn't exist.
   *
   * @param {Object} payload - Must include { key, value, userId, userName }.
   * @returns {ContentOutput} JSON response.
   */
  update: function (payload) {
    if (!payload || !payload.key) {
      return error(ERROR_CODES.MISSING_FIELD, 'Setting key is required');
    }

    if (payload.value === undefined || payload.value === null) {
      return error(ERROR_CODES.MISSING_FIELD, 'Setting value is required');
    }

    var sheet = getSheet(CONFIG.sheets.settings);
    var row = findRow(sheet, 1, payload.key);
    var oldValue = '';

    if (row === -1) {
      // Create new setting
      sheet.appendRow([
        payload.key,
        payload.value,
        now(),
        payload.userName || 'System',
      ]);
    } else {
      // Update existing setting
      oldValue = sheet.getRange(row, 2).getValue();
      sheet.getRange(row, 2).setValue(payload.value);
      sheet.getRange(row, 3).setValue(now());
      sheet.getRange(row, 4).setValue(payload.userName || 'System');
    }

    // Audit log
    AuditService.log({
      userId: payload.userId || '',
      userName: payload.userName || 'System',
      action: 'updateSetting',
      module: 'Settings',
      recordId: payload.key,
      oldValue: String(oldValue),
      newValue: String(payload.value),
    });

    return success('Setting updated', {
      key: payload.key,
      value: payload.value,
    });
  },

  /**
   * Retrieves all settings as a key-value map.
   *
   * @param {Object} [payload] - Not used, but accepted for consistency.
   * @returns {ContentOutput} JSON response with all settings.
   */
  getAll: function (payload) {
    var sheet = getSheet(CONFIG.sheets.settings);
    var data = sheet.getDataRange().getValues();
    var settings = {};

    // Skip header row
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        settings[data[i][0]] = data[i][1];
      }
    }

    return success('All settings retrieved', settings);
  },
};
