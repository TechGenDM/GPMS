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
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include { key: "settingName" }.
   * @returns {ContentOutput} JSON response with setting value.
   */
  get: function (user, payload) {
    if (!UserService.authorize(user, [CONFIG.roles.superadmin])) {
      return error(ERROR_CODES.FORBIDDEN, 'Insufficient permissions to view settings');
    }

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
   * @param {Object} user - The authenticated User object.
   * @param {Object} payload - Must include { key, value }.
   * @returns {ContentOutput} JSON response.
   */
  update: function (user, payload) {
    // Special Case: YOUTUBE_LIVE_URL and PUBLIC_ANNOUNCEMENT can be updated by SuperAdmin, Admin, and Volunteer.
    // Everything else requires SuperAdmin.
    var allowedRoles = [CONFIG.roles.superadmin];
    if (payload && (payload.key === 'YOUTUBE_LIVE_URL' || payload.key === 'PUBLIC_ANNOUNCEMENT')) {
      allowedRoles.push(CONFIG.roles.admin, CONFIG.roles.volunteer);
    }

    if (!UserService.authorize(user, allowedRoles)) {
      return error(ERROR_CODES.FORBIDDEN, 'Insufficient permissions to update this setting');
    }

    if (!payload || !payload.key) {
      return error(ERROR_CODES.MISSING_FIELD, 'Setting key is required');
    }

    if (payload.value === undefined || payload.value === null) {
      return error(ERROR_CODES.MISSING_FIELD, 'Setting value is required');
    }

    // YouTube URL validation — backend enforcement.
    if (payload.key === 'YOUTUBE_LIVE_URL' && payload.value !== '') {
      var url = String(payload.value).trim();
      var ytPattern = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|live\/|@[\w.-]+\/live)|youtu\.be\/)/i;
      if (!ytPattern.test(url)) {
        return error(ERROR_CODES.VALIDATION_ERROR || 'VALIDATION_ERROR', 'Invalid YouTube URL. Accepted formats: youtube.com/watch?v=, youtube.com/live/, youtu.be/');
      }
      payload.value = url; // use trimmed value
    }

    // Announcement JSON validation
    if (payload.key === 'PUBLIC_ANNOUNCEMENT' && payload.value !== '') {
      try {
        var parsed = JSON.parse(payload.value);
        if (typeof parsed.text !== 'string' || parsed.text.length > 500) {
          return error(ERROR_CODES.VALIDATION_ERROR || 'VALIDATION_ERROR', 'Invalid announcement text');
        }
        if (typeof parsed.date !== 'string' || parsed.date.length > 50) {
          return error(ERROR_CODES.VALIDATION_ERROR || 'VALIDATION_ERROR', 'Invalid announcement date');
        }
      } catch (e) {
        return error(ERROR_CODES.VALIDATION_ERROR || 'VALIDATION_ERROR', 'Invalid announcement payload format');
      }
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
        user.fullName || 'System',
      ]);
    } else {
      // Update existing setting
      oldValue = sheet.getRange(row, 2).getValue();
      sheet.getRange(row, 2).setValue(payload.value);
      sheet.getRange(row, 3).setValue(now());
      sheet.getRange(row, 4).setValue(user.fullName || 'System');
    }

    // Audit log
    AuditService.log({
      userId: user.id || '',
      userName: user.fullName || 'System',
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
   * @param {Object} user - The authenticated User object.
   * @param {Object} [payload] - Not used, but accepted for consistency.
   * @returns {ContentOutput} JSON response with all settings.
   */
  getAll: function (user, payload) {
    if (!UserService.authorize(user, [CONFIG.roles.superadmin])) {
      return error(ERROR_CODES.FORBIDDEN, 'Insufficient permissions to view settings');
    }
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

  /**
   * Retrieves only the Live Darshan configuration.
   * Scoped read — does NOT expose the full Settings sheet.
   *
   * Accessible by SuperAdmin, Admin, and Volunteer.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} [payload] - Not used.
   * @returns {ContentOutput} JSON response with { youtubeUrl, updatedAt, updatedBy }.
   */
  getLiveDarshanConfig: function (user, payload) {
    if (!UserService.authorize(user, [CONFIG.roles.superadmin, CONFIG.roles.admin, CONFIG.roles.volunteer])) {
      return error(ERROR_CODES.FORBIDDEN, 'Insufficient permissions');
    }

    var sheet = getSheet(CONFIG.sheets.settings);
    var row = findRow(sheet, 1, 'YOUTUBE_LIVE_URL');

    if (row === -1) {
      return success('Live Darshan config retrieved', {
        youtubeUrl: '',
        updatedAt: '',
        updatedBy: '',
      });
    }

    var rowData = sheet.getRange(row, 1, 1, 4).getValues()[0];

    return success('Live Darshan config retrieved', {
      youtubeUrl: rowData[1] || '',
      updatedAt: rowData[2] ? String(rowData[2]) : '',
      updatedBy: rowData[3] || '',
    });
  },

  /**
   * Retrieves only the Announcement configuration.
   * Scoped read — does NOT expose the full Settings sheet.
   *
   * Accessible by SuperAdmin, Admin, and Volunteer.
   *
   * @param {Object} user - The authenticated User object.
   * @param {Object} [payload] - Not used.
   * @returns {ContentOutput} JSON response with { announcement, updatedAt, updatedBy }.
   */
  getAnnouncementConfig: function (user, payload) {
    if (!UserService.authorize(user, [CONFIG.roles.superadmin, CONFIG.roles.admin, CONFIG.roles.volunteer])) {
      return error(ERROR_CODES.FORBIDDEN, 'Insufficient permissions');
    }

    var sheet = getSheet(CONFIG.sheets.settings);
    var row = findRow(sheet, 1, 'PUBLIC_ANNOUNCEMENT');

    if (row === -1) {
      return success('Announcement config retrieved', {
        announcement: null,
        updatedAt: '',
        updatedBy: '',
      });
    }

    var rowData = sheet.getRange(row, 1, 1, 4).getValues()[0];
    var announcement = null;
    if (rowData[1]) {
      try {
        announcement = JSON.parse(rowData[1]);
      } catch(e) {
        // safely handle malformed JSON
        announcement = null;
      }
    }

    return success('Announcement config retrieved', {
      announcement: announcement,
      updatedAt: rowData[2] ? String(rowData[2]) : '',
      updatedBy: rowData[3] || '',
    });
  },
};
