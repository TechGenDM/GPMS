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
 * Returns the route map at runtime.
 *
 * IMPORTANT:
 * Apps Script does not guarantee .gs file initialization order.
 * Therefore, service references must not be resolved globally.
 * Building the route map at runtime ensures all service objects
 * are available before their methods are referenced.
 *
 * @returns {Object} Action name → handler function map.
 */
function getRoutes() {
  return {
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
    verifyReceipt: DonationService.verify,

    // --- Expenses ---
    createExpense: ExpenseService.create,
    updateExpense: ExpenseService.update,
    cancelExpense: ExpenseService.cancel,
    getExpense: ExpenseService.get,
    searchExpenses: ExpenseService.search,
    getRecentExpenses: ExpenseService.getRecentExpenses,
    verifyExpense: ExpenseService.verify,
    getCategories: ExpenseService.getCategories,

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
}

/**
 * Dispatches a request to the appropriate service function.
 *
 * Implements global authentication for all routes except:
 * - authenticate
 * - getPublicDashboard
 *
 * @param {string} action - The action name from the request.
 * @param {Object} payload - The request payload.
 * @returns {ContentOutput} JSON response from the handler.
 */
function dispatch(action, payload) {
  if (!action) {
    return error(ERROR_CODES.MISSING_ACTION, 'Missing action');
  }
  if (action === 'fixCurrencyFormatting') {
    return ContentService.createTextOutput(fixCurrencyFormatting()).setMimeType(
      ContentService.MimeType.JSON
    );
  }

  // Resolve routes at runtime to avoid Apps Script
  // global initialization order problems.
  var routes = getRoutes();
  var handler = routes[action];

  if (!handler) {
    return error(ERROR_CODES.UNKNOWN_ACTION, 'Unknown action: ' + action);
  }

  try {
    // 1. Public routes do not require authentication.
    if (action === 'authenticate') {
      // UserService.authenticate(payload) — takes ONE argument.
      return handler(payload);
    }

    if (action === 'getPublicDashboard') {
      // DashboardService.getPublicDashboard(user, payload) — user is null.
      return handler(null, payload);
    }

    if (action === 'verifyReceipt') {
      // DonationService.verify(payload) — takes ONE argument, no user.
      return handler(payload);
    }

    if (action === 'verifyExpense') {
      // ExpenseService.verify(payload) — takes ONE argument, no user.
      return handler(payload);
    }

    // 2. All protected routes require a user email.
    if (!payload || !payload.userEmail) {
      return error(
        ERROR_CODES.UNAUTHORIZED,
        'Authentication required: Missing userEmail in payload'
      );
    }

    // 3. Authenticate the requesting user.
    var authResponse = JSON.parse(
      UserService.authenticate({
        email: payload.userEmail,
      }).getContent()
    );

    // Reject invalid or disabled users.
    if (authResponse.success === false) {
      return error(authResponse.code, authResponse.message);
    }

    // Authenticated and active GPMS user.
    var user = authResponse.data;

    // 4. Execute the requested protected route.
    return handler(user, payload);
  } catch (e) {
    return error(ERROR_CODES.INTERNAL_ERROR, e.message);
  }
}
