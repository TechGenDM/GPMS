/**
 * GPMS User Service
 * ==================
 * Authentication and user lookup.
 */

var UserService = {
  /**
   * Authenticates a user by phone/username + password.
   * @param {Object} payload - Must include phone/username and password.
   * @returns {ContentOutput} JSON response with user data + role.
   */
  login: function (payload) {
    // TODO: Implement in Milestone 3
    // 1. Validate → validateUser(payload)
    // 2. Find user in Users sheet
    // 3. Verify password
    // 4. Audit log → AuditService.log()
    // 5. Return success with user info + role
    return success('UserService.login not yet implemented');
  },

  /**
   * Finds a user by identifier (phone, username, or user ID).
   * @param {Object} payload - Search criteria.
   * @returns {ContentOutput} JSON response with user data.
   */
  find: function (payload) {
    // TODO: Implement in Milestone 3
    return success('UserService.find not yet implemented');
  },

  /**
   * Returns the role of a user.
   * @param {string} userId - User ID.
   * @returns {string} Role name.
   */
  getRole: function (userId) {
    // TODO: Implement in Milestone 3
    return CONFIG.roles.viewer;
  },
};
