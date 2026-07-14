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

  // --- Users / Auth ---
  login: UserService.login,
  getUser: UserService.find,

  // --- Dashboard ---
  getDashboard: DashboardService.getSummary,
};

/**
 * Dispatches a request to the appropriate service function.
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
    return handler(payload);
  } catch (e) {
    return error(ERROR_CODES.INTERNAL_ERROR, e.message);
  }
}
