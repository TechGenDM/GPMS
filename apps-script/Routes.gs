/**
 * GPMS Route Dispatcher
 * ======================
 * Maps action names to service functions.
 * Acts like Express.js routes.
 *
 * Request format:
 * {
 *   "action": "createDonation",
 *   "payload": { ... }
 * }
 */

/**
 * Route map — action name → handler function.
 * Add new routes here as services are implemented.
 */
var ROUTES = {
  // --- Settings ---
  getSetting: SettingsService.get,
  updateSetting: SettingsService.update,
  getAllSettings: SettingsService.getAll,

  // --- Donations ---
  createDonation: DonationService.create,
  updateDonation: DonationService.update,
  cancelDonation: DonationService.cancel,
  getDonation: DonationService.get,
  searchDonations: DonationService.search,

  // --- Expenses ---
  createExpense: ExpenseService.create,
  updateExpense: ExpenseService.update,
  cancelExpense: ExpenseService.cancel,
  getExpense: ExpenseService.get,
  searchExpenses: ExpenseService.search,
  getRecentExpenses: ExpenseService.getRecentExpenses,

  // --- Users / Auth ---
  authenticate: UserService.authenticate,
  createUser: UserService.createUser,
  updateUser: UserService.updateUser,
  disableUser: UserService.disableUser,
  getAllUsers: UserService.getAllUsers,

  // --- Dashboard ---
  getFinancialSummary: DashboardService.getFinancialSummary,
  getRecentActivity: DashboardService.getRecentActivity,
  getDonationStats: DashboardService.getDonationStats,
  getExpenseStats: DashboardService.getExpenseStats,
  getDashboardSummary: DashboardService.getDashboardSummary,
  getPublicDashboard: DashboardService.getPublicDashboard,
};

/**
 * Dispatches a request to the appropriate service function.
 * Implements global authentication for all routes except 'authenticate' and 'getPublicDashboard'.
 *
 * @param {string} action - The action name from the request.
 * @param {Object} payload - The request payload.
 * @returns {ContentOutput} JSON response from the handler.
 */
function dispatch(action, payload) {
  if (!action) {
    return error(ERROR_CODES.MISSING_ACTION, 'Missing action');
  }

  var handler = ROUTES[action];
  if (!handler) {
    return error(ERROR_CODES.UNKNOWN_ACTION, 'Unknown action: ' + action);
  }

  try {
    // 1. Skip authentication for public routes
    if (action === 'authenticate' || action === 'getPublicDashboard') {
      return handler(null, payload);
    }

    // 2. Global Authentication Interceptor
    if (!payload || !payload.userEmail) {
      return error(ERROR_CODES.UNAUTHORIZED, 'Authentication required: Missing userEmail in payload');
    }

    // Attempt to authenticate the user
    var authResponse = JSON.parse(UserService.authenticate({ email: payload.userEmail }).getContent());
    if (authResponse.success === false) {
       // Return the exact error (e.g., USER_NOT_FOUND or USER_DISABLED)
       return error(authResponse.code, authResponse.message);
    }

    // We have a valid, active user object now
    var user = authResponse.data;

    // 3. Call the handler with (user, payload)
    return handler(user, payload);
  } catch (e) {
    return error(ERROR_CODES.INTERNAL_ERROR, e.message);
  }
}
