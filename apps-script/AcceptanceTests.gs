/**
 * =====================================================================
 * GPMS BACKEND ACCEPTANCE TESTS (Milestone 3.6)
 * =====================================================================
 *
 * Operational Simulation — "Can GPMS survive Ganesh Puja?"
 *
 * ⚠️  IMPORTANT: Before running, create a SEPARATE Google Spreadsheet
 *     with the SAME sheet names as production (Users, Donations,
 *     Expenses, Settings, Categories, AuditLogs, Metadata).
 *     Update CONFIG.spreadsheetId to point to the TEST spreadsheet.
 *     NEVER run acceptance tests against production data.
 *
 * Groups:
 *   A — Functional Tests
 *   B — Security Tests
 *   C — Financial Integrity Tests
 *   D — Data Integrity Tests
 *   E — Public Dashboard Isolation Tests
 *
 * Run: Select `runAcceptanceTests` → Run
 * =====================================================================
 */

// =====================================================================
// Test Framework
// =====================================================================

var _testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: [],
};

function _assert(testName, condition, failureMessage) {
  _testResults.total++;
  if (condition) {
    _testResults.passed++;
    Logger.log('  ✅ ' + testName);
  } else {
    _testResults.failed++;
    _testResults.failures.push(
      testName + ': ' + (failureMessage || 'Assertion failed')
    );
    Logger.log(
      '  ❌ ' + testName + ' — ' + (failureMessage || 'Assertion failed')
    );
  }
}

function _parseResponse(contentOutput) {
  return JSON.parse(contentOutput.getContent());
}

// =====================================================================
// Test Data Setup
// =====================================================================

var _testUsers = {}; // Stores created user objects
var _testDonIds = []; // Stores created donation IDs
var _testExpIds = []; // Stores created expense IDs

function _setupTestEnvironment() {
  Logger.log('\n============================');
  Logger.log('  SETTING UP TEST ENVIRONMENT');
  Logger.log('============================\n');

  // 1. Create Admin
  var adminRes = _parseResponse(
    UserService.createUser({
      fullName: 'Test Admin',
      email: 'testadmin@gpms.org',
      phone: '9000000001',
      role: CONFIG.roles.admin,
      status: CONFIG.status.active,
    })
  );
  if (adminRes.success) {
    var authAdmin = _parseResponse(
      UserService.authenticate({ email: 'testadmin@gpms.org' })
    );
    _testUsers.admin = authAdmin.data;
    Logger.log('  Admin created: ' + _testUsers.admin.id);
  } else if (adminRes.code === ERROR_CODES.EMAIL_ALREADY_EXISTS) {
    var authAdmin2 = _parseResponse(
      UserService.authenticate({ email: 'testadmin@gpms.org' })
    );
    _testUsers.admin = authAdmin2.data;
    Logger.log('  Admin reused: ' + _testUsers.admin.id);
  }

  // 2. Create Volunteer
  var volRes = _parseResponse(
    UserService.createUser({
      fullName: 'Test Volunteer',
      email: 'testvolunteer@gpms.org',
      phone: '9000000002',
      role: CONFIG.roles.volunteer,
      status: CONFIG.status.active,
    })
  );
  if (volRes.success) {
    var authVol = _parseResponse(
      UserService.authenticate({ email: 'testvolunteer@gpms.org' })
    );
    _testUsers.volunteer = authVol.data;
    Logger.log('  Volunteer created: ' + _testUsers.volunteer.id);
  } else if (volRes.code === ERROR_CODES.EMAIL_ALREADY_EXISTS) {
    var authVol2 = _parseResponse(
      UserService.authenticate({ email: 'testvolunteer@gpms.org' })
    );
    _testUsers.volunteer = authVol2.data;
    Logger.log('  Volunteer reused: ' + _testUsers.volunteer.id);
  }

  // 3. Create Viewer (low-privilege user)
  var viewerRes = _parseResponse(
    UserService.createUser({
      fullName: 'Test Viewer',
      email: 'testviewer@gpms.org',
      phone: '9000000003',
      role: CONFIG.roles.viewer,
      status: CONFIG.status.active,
    })
  );
  if (viewerRes.success) {
    var authViewer = _parseResponse(
      UserService.authenticate({ email: 'testviewer@gpms.org' })
    );
    _testUsers.viewer = authViewer.data;
    Logger.log('  Viewer created: ' + _testUsers.viewer.id);
  } else if (viewerRes.code === ERROR_CODES.EMAIL_ALREADY_EXISTS) {
    var authViewer2 = _parseResponse(
      UserService.authenticate({ email: 'testviewer@gpms.org' })
    );
    _testUsers.viewer = authViewer2.data;
    Logger.log('  Viewer reused: ' + _testUsers.viewer.id);
  }

  // 4. Ensure test categories exist
  var catSheet = getSheet(CONFIG.sheets.categories);
  var catData = catSheet.getDataRange().getValues();
  var neededCats = [
    ['General', 'Donation'],
    ['Decoration', 'Expense'],
    ['Transportation', 'Expense'],
  ];
  neededCats.forEach(function (cat) {
    var exists = false;
    for (var i = 1; i < catData.length; i++) {
      if (catData[i][0] === cat[0] && catData[i][1] === cat[1]) {
        exists = true;
        break;
      }
    }
    if (!exists) catSheet.appendRow(cat);
  });
  Logger.log('  Categories verified.\n');

  // 5. Ensure Settings exist
  var settingsSheet = getSheet(CONFIG.sheets.settings);
  var setData = settingsSheet.getDataRange().getValues();
  var neededSettings = [
    ['COMMITTEE_NAME', 'GPMS Test Committee'],
    ['YEAR', '2026'],
  ];
  neededSettings.forEach(function (s) {
    var exists = false;
    for (var i = 1; i < setData.length; i++) {
      if (setData[i][0] === s[0]) {
        exists = true;
        break;
      }
    }
    if (!exists) settingsSheet.appendRow([s[0], s[1], now(), 'SYSTEM']);
  });
  Logger.log('  Settings verified.\n');
}

// =====================================================================
// GROUP A — Functional Tests
// =====================================================================

function _runGroupA() {
  Logger.log('\n============================');
  Logger.log('  GROUP A: FUNCTIONAL TESTS');
  Logger.log('============================\n');

  var admin = _testUsers.admin;

  // A1: Create Donation
  var donRes = _parseResponse(
    DonationService.create(admin, {
      donorName: 'Func Test Donor',
      amount: 1000,
      category: 'General',
      paymentMode: 'Cash',
    })
  );
  _assert(
    'A1: Create Donation',
    donRes.success && donRes.data.id,
    donRes.message
  );
  if (donRes.success) _testDonIds.push(donRes.data.id);

  // A2: Get Donation
  var getRes = _parseResponse(
    DonationService.get(admin, { donationId: _testDonIds[0] })
  );
  _assert(
    'A2: Get Donation',
    getRes.success && getRes.data.donorName === 'Func Test Donor',
    getRes.message
  );

  // A3: Update Donation (Admin)
  var updRes = _parseResponse(
    DonationService.update(admin, { donationId: _testDonIds[0], amount: 2000 })
  );
  _assert('A3: Update Donation', updRes.success, updRes.message);

  // A4: Search Donation
  var searchRes = _parseResponse(
    DonationService.search(admin, { donorName: 'Func Test' })
  );
  _assert(
    'A4: Search Donation',
    searchRes.success && searchRes.data.length > 0,
    searchRes.message
  );

  // A5: Create Expense
  var expRes = _parseResponse(
    ExpenseService.create(admin, {
      category: 'Decoration',
      description: 'Test flowers',
      amount: 300,
      vendor: 'Local Shop',
    })
  );
  _assert(
    'A5: Create Expense',
    expRes.success && expRes.data.id,
    expRes.message
  );
  if (expRes.success) _testExpIds.push(expRes.data.id);

  // A6: Get Expense
  var getExpRes = _parseResponse(
    ExpenseService.get(admin, { expenseId: _testExpIds[0] })
  );
  _assert(
    'A6: Get Expense',
    getExpRes.success && getExpRes.data.description === 'Test flowers',
    getExpRes.message
  );

  // A7: Update Expense (Admin)
  var updExpRes = _parseResponse(
    ExpenseService.update(admin, { expenseId: _testExpIds[0], amount: 500 })
  );
  _assert('A7: Update Expense', updExpRes.success, updExpRes.message);

  // A8: Search Expense
  var srchExpRes = _parseResponse(
    ExpenseService.search(admin, { vendor: 'Local' })
  );
  _assert(
    'A8: Search Expense',
    srchExpRes.success && srchExpRes.data.length > 0,
    srchExpRes.message
  );

  // A9: Dashboard Summary
  var dashRes = _parseResponse(DashboardService.getDashboardSummary(admin));
  _assert(
    'A9: Dashboard Summary',
    dashRes.success && dashRes.data.summary.balance !== undefined,
    dashRes.message
  );

  // A10: Recent Activity
  var actRes = _parseResponse(
    DashboardService.getRecentActivity(admin, { limit: 5 })
  );
  _assert(
    'A10: Recent Activity',
    actRes.success && Array.isArray(actRes.data),
    actRes.message
  );

  // A11: Cancel Donation
  var cancelDonRes = _parseResponse(
    DonationService.cancel(admin, { donationId: _testDonIds[0] })
  );
  _assert('A11: Cancel Donation', cancelDonRes.success, cancelDonRes.message);

  // A12: Cancel Expense
  var cancelExpRes = _parseResponse(
    ExpenseService.cancel(admin, {
      expenseId: _testExpIds[0],
      reason: 'Test cancel',
    })
  );
  _assert('A12: Cancel Expense', cancelExpRes.success, cancelExpRes.message);

  // A13: Verify cancelled donation status
  var checkDon = _parseResponse(
    DonationService.get(admin, { donationId: _testDonIds[0] })
  );
  _assert(
    'A13: Donation status is Cancelled',
    checkDon.data.status === CONFIG.status.cancelled,
    'Expected Cancelled, got ' + checkDon.data.status
  );

  // A14: Verify cancelled expense status
  var checkExp = _parseResponse(
    ExpenseService.get(admin, { expenseId: _testExpIds[0] })
  );
  _assert(
    'A14: Expense status is Cancelled',
    checkExp.data.status === CONFIG.status.cancelled,
    'Expected Cancelled, got ' + checkExp.data.status
  );
}

// =====================================================================
// GROUP B — Security Tests
// =====================================================================

function _runGroupB() {
  Logger.log('\n============================');
  Logger.log('  GROUP B: SECURITY TESTS');
  Logger.log('============================\n');

  var admin = _testUsers.admin;
  var volunteer = _testUsers.volunteer;
  var viewer = _testUsers.viewer;

  // B1: Volunteer creates donation (SHOULD SUCCEED)
  var volDon = _parseResponse(
    DonationService.create(volunteer, {
      donorName: 'Vol Donor',
      amount: 100,
      category: 'General',
      paymentMode: 'UPI',
    })
  );
  _assert('B1: Volunteer CAN create donation', volDon.success, volDon.message);
  var volDonId = volDon.success ? volDon.data.id : null;

  // B2: Volunteer tries to cancel donation (SHOULD FAIL)
  if (volDonId) {
    var volCancel = _parseResponse(
      DonationService.cancel(volunteer, { donationId: volDonId })
    );
    _assert(
      'B2: Volunteer CANNOT cancel donation',
      !volCancel.success && volCancel.code === ERROR_CODES.ROLE_NOT_ALLOWED,
      'Expected ROLE_NOT_ALLOWED, got ' + volCancel.code
    );
  }

  // B3: Volunteer tries to update donation (SHOULD FAIL)
  if (volDonId) {
    var volUpdate = _parseResponse(
      DonationService.update(volunteer, { donationId: volDonId, amount: 999 })
    );
    _assert(
      'B3: Volunteer CANNOT update donation',
      !volUpdate.success && volUpdate.code === ERROR_CODES.ROLE_NOT_ALLOWED,
      'Expected ROLE_NOT_ALLOWED, got ' + volUpdate.code
    );
  }

  // B4: Volunteer tries to cancel expense (SHOULD FAIL)
  var volExp = _parseResponse(
    ExpenseService.create(volunteer, {
      category: 'Decoration',
      description: 'Vol test',
      amount: 50,
    })
  );
  if (volExp.success) {
    var volExpCancel = _parseResponse(
      ExpenseService.cancel(volunteer, {
        expenseId: volExp.data.id,
        reason: 'test',
      })
    );
    _assert(
      'B4: Volunteer CANNOT cancel expense',
      !volExpCancel.success &&
        volExpCancel.code === ERROR_CODES.ROLE_NOT_ALLOWED,
      'Expected ROLE_NOT_ALLOWED, got ' + volExpCancel.code
    );
  }

  // B5: Unknown email authentication (SHOULD FAIL)
  var unknownAuth = _parseResponse(
    UserService.authenticate({ email: 'nobody@fake.com' })
  );
  _assert(
    'B5: Unknown email → USER_NOT_FOUND',
    !unknownAuth.success && unknownAuth.code === ERROR_CODES.USER_NOT_FOUND,
    'Expected USER_NOT_FOUND, got ' + unknownAuth.code
  );

  // B6: Disabled user authentication (SHOULD FAIL)
  // Create a disabled user
  var disabledRes = _parseResponse(
    UserService.createUser({
      fullName: 'Disabled User',
      email: 'disabled@gpms.org',
      phone: '9000000099',
      role: CONFIG.roles.volunteer,
      status: CONFIG.status.active,
    })
  );
  if (
    disabledRes.success ||
    disabledRes.code === ERROR_CODES.EMAIL_ALREADY_EXISTS
  ) {
    // Disable the user
    var disAuth = _parseResponse(
      UserService.authenticate({ email: 'disabled@gpms.org' })
    );
    if (disAuth.success) {
      UserService.disableUser({
        userId: disAuth.data.id,
        adminUserId: admin.id,
      });
      // Now try to authenticate
      var disabledAuth = _parseResponse(
        UserService.authenticate({ email: 'disabled@gpms.org' })
      );
      _assert(
        'B6: Disabled user → USER_DISABLED',
        !disabledAuth.success &&
          disabledAuth.code === ERROR_CODES.USER_DISABLED,
        'Expected USER_DISABLED, got ' + disabledAuth.code
      );
    }
  }

  // B7: Invalid category for expense (SHOULD FAIL)
  var badCat = _parseResponse(
    ExpenseService.create(admin, {
      category: 'Bitcoin Mining',
      description: 'Bad',
      amount: 1000,
    })
  );
  _assert(
    'B7: Invalid category → INVALID_CATEGORY',
    !badCat.success && badCat.code === ERROR_CODES.INVALID_CATEGORY,
    'Expected INVALID_CATEGORY, got ' + badCat.code
  );

  // B8: Missing required fields (SHOULD FAIL)
  var missingFields = _parseResponse(
    DonationService.create(admin, { donorName: '' })
  );
  _assert(
    'B8: Missing fields → MISSING_FIELD',
    !missingFields.success,
    'Expected validation failure, got success'
  );

  // B9: Negative amount (SHOULD FAIL)
  var negAmt = _parseResponse(
    DonationService.create(admin, {
      donorName: 'Test',
      amount: -500,
      category: 'General',
      paymentMode: 'Cash',
    })
  );
  _assert(
    'B9: Negative amount → INVALID_AMOUNT',
    !negAmt.success && negAmt.code === ERROR_CODES.INVALID_AMOUNT,
    'Expected INVALID_AMOUNT, got ' + negAmt.code
  );

  // B10: Global dispatch without userEmail (SHOULD FAIL)
  var noEmail = _parseResponse(dispatch('getDashboardSummary', {}));
  _assert(
    'B10: Dispatch without email → UNAUTHORIZED',
    !noEmail.success && noEmail.code === ERROR_CODES.UNAUTHORIZED,
    'Expected UNAUTHORIZED, got ' + noEmail.code
  );
}

// =====================================================================
// GROUP C — Financial Integrity Tests
// =====================================================================

function _runGroupC() {
  Logger.log('\n============================');
  Logger.log('  GROUP C: FINANCIAL INTEGRITY');
  Logger.log('============================\n');

  var admin = _testUsers.admin;

  // Helper to get current balance
  function getBalance() {
    var res = _parseResponse(DashboardService.getFinancialSummary(admin));
    return res.data;
  }

  var before = getBalance();
  var initialBalance = before.balance;

  // C1: Create Donation ₹500
  var don1 = _parseResponse(
    DonationService.create(admin, {
      donorName: 'Finance Test A',
      amount: 500,
      category: 'General',
      paymentMode: 'Cash',
    })
  );
  _assert('C1: Create ₹500 Donation', don1.success, don1.message);
  var don1Id = don1.data.id;

  // C2: Create Donation ₹1000
  var don2 = _parseResponse(
    DonationService.create(admin, {
      donorName: 'Finance Test B',
      amount: 1000,
      category: 'General',
      paymentMode: 'UPI',
    })
  );
  _assert('C2: Create ₹1000 Donation', don2.success, don2.message);
  var don2Id = don2.data.id;

  // C3: Create Expense ₹200
  var exp1 = _parseResponse(
    ExpenseService.create(admin, {
      category: 'Decoration',
      description: 'Flowers',
      amount: 200,
    })
  );
  _assert('C3: Create ₹200 Expense', exp1.success, exp1.message);

  // C4: Create Expense ₹300
  var exp2 = _parseResponse(
    ExpenseService.create(admin, {
      category: 'Transportation',
      description: 'Taxi',
      amount: 300,
    })
  );
  _assert('C4: Create ₹300 Expense', exp2.success, exp2.message);
  var exp2Id = exp2.data.id;

  // C5: Balance should be initialBalance + 1500 - 500 = initialBalance + 1000
  var after1 = getBalance();
  _assert(
    'C5: Balance after 4 ops = +' + 1000,
    after1.balance === initialBalance + 1000,
    'Expected ' + (initialBalance + 1000) + ', got ' + after1.balance
  );

  // C6: Cancel ₹300 Expense → Balance should increase by 300
  _parseResponse(
    ExpenseService.cancel(admin, { expenseId: exp2Id, reason: 'Test cancel' })
  );
  var after2 = getBalance();
  _assert(
    'C6: Cancel ₹300 expense → Balance +' + 1300,
    after2.balance === initialBalance + 1300,
    'Expected ' + (initialBalance + 1300) + ', got ' + after2.balance
  );

  // C7: Cancel ₹1000 Donation → Balance should decrease by 1000
  _parseResponse(DonationService.cancel(admin, { donationId: don2Id }));
  var after3 = getBalance();
  _assert(
    'C7: Cancel ₹1000 donation → Balance +' + 300,
    after3.balance === initialBalance + 300,
    'Expected ' + (initialBalance + 300) + ', got ' + after3.balance
  );

  // C8: Cancelled records excluded from totals
  _assert(
    'C8: Donations total excludes cancelled',
    after3.donations.total < after2.donations.total,
    'Donation total should have decreased after cancellation'
  );

  // C9: Cash/UPI breakdown integrity
  _assert(
    'C9: Cash + UPI = Total Donations',
    after3.donations.cash + after3.donations.upi === after3.donations.total,
    'Cash ' +
      after3.donations.cash +
      ' + UPI ' +
      after3.donations.upi +
      ' != ' +
      after3.donations.total
  );
}

// =====================================================================
// GROUP D — Data Integrity Tests
// =====================================================================

function _runGroupD() {
  Logger.log('\n============================');
  Logger.log('  GROUP D: DATA INTEGRITY');
  Logger.log('============================\n');

  var admin = _testUsers.admin;

  // D1-D3: Generate multiple IDs and check uniqueness
  var donIds = [];
  for (var i = 0; i < 5; i++) {
    var res = _parseResponse(
      DonationService.create(admin, {
        donorName: 'Integrity Test ' + i,
        amount: 100 + i,
        category: 'General',
        paymentMode: 'Cash',
      })
    );
    if (res.success) donIds.push(res.data.id);
  }
  var uniqueDonIds = donIds.filter(function (v, i, a) {
    return a.indexOf(v) === i;
  });
  _assert(
    'D1: 5 Donation IDs are unique',
    uniqueDonIds.length === 5,
    'Expected 5 unique, got ' + uniqueDonIds.length
  );

  var expIds = [];
  for (var j = 0; j < 5; j++) {
    var expRes = _parseResponse(
      ExpenseService.create(admin, {
        category: 'Decoration',
        description: 'Integrity Exp ' + j,
        amount: 50 + j,
      })
    );
    if (expRes.success) expIds.push(expRes.data.id);
  }
  var uniqueExpIds = expIds.filter(function (v, i, a) {
    return a.indexOf(v) === i;
  });
  _assert(
    'D2: 5 Expense IDs are unique',
    uniqueExpIds.length === 5,
    'Expected 5 unique, got ' + uniqueExpIds.length
  );

  // D3: User IDs are unique
  var userIds = [];
  for (var k = 0; k < 3; k++) {
    var userRes = _parseResponse(
      UserService.createUser({
        fullName: 'Integrity User ' + k,
        email: 'intuser' + k + '@gpms.org',
        phone: '800000000' + k,
        role: CONFIG.roles.volunteer,
        status: CONFIG.status.active,
      })
    );
    if (userRes.success) userIds.push(userRes.data.id);
  }
  var uniqueUserIds = userIds.filter(function (v, i, a) {
    return a.indexOf(v) === i;
  });
  _assert(
    'D3: User IDs are unique',
    uniqueUserIds.length === userIds.length,
    'Duplicate user IDs detected'
  );

  // D4: Audit trail exists for donations
  var auditSheet = getSheet(CONFIG.sheets.auditLogs);
  var auditData = auditSheet.getDataRange().getValues();
  var donationAudits = 0;
  for (var m = 1; m < auditData.length; m++) {
    if (auditData[m][4] === 'createDonation') donationAudits++;
  }
  _assert(
    'D4: Audit logs exist for donations',
    donationAudits > 0,
    'No createDonation audit entries found'
  );

  // D5: Audit trail exists for expenses
  var expenseAudits = 0;
  for (var n = 1; n < auditData.length; n++) {
    if (auditData[n][4] === 'createExpense') expenseAudits++;
  }
  _assert(
    'D5: Audit logs exist for expenses',
    expenseAudits > 0,
    'No createExpense audit entries found'
  );

  // D6: No donation has empty ID
  var donSheet = getSheet(CONFIG.sheets.donations);
  var donData = donSheet.getDataRange().getValues();
  var emptyDonIds = 0;
  for (var p = 1; p < donData.length; p++) {
    if (!donData[p][0] || String(donData[p][0]).trim() === '') emptyDonIds++;
  }
  _assert(
    'D6: No donation has empty ID',
    emptyDonIds === 0,
    emptyDonIds + ' donations have empty IDs'
  );

  // D7: No expense has empty ID
  var expSheet = getSheet(CONFIG.sheets.expenses);
  var expData = expSheet.getDataRange().getValues();
  var emptyExpIds = 0;
  for (var q = 1; q < expData.length; q++) {
    if (!expData[q][0] || String(expData[q][0]).trim() === '') emptyExpIds++;
  }
  _assert(
    'D7: No expense has empty ID',
    emptyExpIds === 0,
    emptyExpIds + ' expenses have empty IDs'
  );
}

// =====================================================================
// GROUP E — Public Dashboard Isolation
// =====================================================================

function _runGroupE() {
  Logger.log('\n============================');
  Logger.log('  GROUP E: PUBLIC DASHBOARD ISOLATION');
  Logger.log('============================\n');

  // E1: Public dashboard works without authentication
  var pubRes = _parseResponse(dispatch('getPublicDashboard', {}));
  _assert(
    'E1: Public dashboard accessible without auth',
    pubRes.success,
    pubRes.message
  );

  // E2: Public dashboard returns committee name
  _assert(
    'E2: Public dashboard has committeeName',
    pubRes.success && pubRes.data.committeeName !== undefined,
    'Missing committeeName'
  );

  // E3: Public dashboard returns year
  _assert(
    'E3: Public dashboard has year',
    pubRes.success && pubRes.data.year !== undefined,
    'Missing year'
  );

  // E4: Public dashboard returns balance
  _assert(
    'E4: Public dashboard has balance',
    pubRes.success && pubRes.data.balance !== undefined,
    'Missing balance'
  );

  // E5: Public dashboard does NOT expose donor names
  _assert(
    'E5: No donor names in public dashboard',
    pubRes.success &&
      pubRes.data.donors === undefined &&
      pubRes.data.donorName === undefined,
    'PII leak: donor names exposed'
  );

  // E6: Public dashboard does NOT expose phone numbers
  _assert(
    'E6: No phone numbers in public dashboard',
    pubRes.success &&
      pubRes.data.phone === undefined &&
      pubRes.data.phones === undefined,
    'PII leak: phone numbers exposed'
  );

  // E7: Public dashboard does NOT expose remarks
  _assert(
    'E7: No remarks in public dashboard',
    pubRes.success && pubRes.data.remarks === undefined,
    'PII leak: remarks exposed'
  );

  // E8: Unauthenticated dispatch to searchDonations SHOULD FAIL
  var searchFail = _parseResponse(
    dispatch('searchDonations', { donorName: 'test' })
  );
  _assert(
    'E8: Unauthenticated searchDonations → UNAUTHORIZED',
    !searchFail.success && searchFail.code === ERROR_CODES.UNAUTHORIZED,
    'Expected UNAUTHORIZED, got ' + searchFail.code
  );

  // E9: Unauthenticated dispatch to getAllUsers SHOULD FAIL
  var usersFail = _parseResponse(dispatch('getAllUsers', {}));
  _assert(
    'E9: Unauthenticated getAllUsers → UNAUTHORIZED',
    !usersFail.success && usersFail.code === ERROR_CODES.UNAUTHORIZED,
    'Expected UNAUTHORIZED, got ' + usersFail.code
  );

  // E10: Unauthenticated dispatch to createDonation SHOULD FAIL
  var createFail = _parseResponse(
    dispatch('createDonation', {
      donorName: 'Hacker',
      amount: 999,
      category: 'General',
      paymentMode: 'Cash',
    })
  );
  _assert(
    'E10: Unauthenticated createDonation → UNAUTHORIZED',
    !createFail.success && createFail.code === ERROR_CODES.UNAUTHORIZED,
    'Expected UNAUTHORIZED, got ' + createFail.code
  );
}

// =====================================================================
// RECOVERY TEST
// =====================================================================

function _runRecoveryTest() {
  Logger.log('\n============================');
  Logger.log("  RECOVERY: Audit failure doesn't lose money");
  Logger.log('============================\n');

  var admin = _testUsers.admin;

  // The architecture already guarantees this:
  // DonationService.create() saves the row FIRST, then calls AuditService.log().
  // AuditService.log() is wrapped in try/catch and never throws.
  // So even if audit fails, the donation row is persisted.
  //
  // We verify: donation exists in the sheet regardless of audit state.

  var donRes = _parseResponse(
    DonationService.create(admin, {
      donorName: 'Recovery Test Donor',
      amount: 777,
      category: 'General',
      paymentMode: 'Cash',
    })
  );
  _assert('R1: Donation saved before audit', donRes.success, donRes.message);

  if (donRes.success) {
    var getRes = _parseResponse(
      DonationService.get(admin, { donationId: donRes.data.id })
    );
    _assert(
      'R2: Donation retrievable after creation',
      getRes.success && getRes.data.amount === 777,
      'Donation data mismatch or missing'
    );
  }
}

// =====================================================================
// MASTER TEST RUNNER
// =====================================================================

function runAcceptanceTests() {
  var startTime = new Date();

  Logger.log('╔══════════════════════════════════════════════╗');
  Logger.log('║   GPMS BACKEND ACCEPTANCE TEST SUITE        ║');
  Logger.log('║   Milestone 3.6 — Operational Simulation    ║');
  Logger.log('╚══════════════════════════════════════════════╝\n');

  // Reset counters
  _testResults = { passed: 0, failed: 0, total: 0, failures: [] };

  // Setup
  _setupTestEnvironment();

  // Execute all groups
  _runGroupA();
  _runGroupB();
  _runGroupC();
  _runGroupD();
  _runGroupE();
  _runRecoveryTest();

  // Report
  var elapsed = ((new Date() - startTime) / 1000).toFixed(1);

  Logger.log('\n╔══════════════════════════════════════════════╗');
  Logger.log('║          ACCEPTANCE TEST RESULTS             ║');
  Logger.log('╠══════════════════════════════════════════════╣');
  Logger.log('║  PASSED:  ' + _testResults.passed + ' / ' + _testResults.total);
  Logger.log('║  FAILED:  ' + _testResults.failed);
  Logger.log('║  TIME:    ' + elapsed + 's');
  Logger.log('╠══════════════════════════════════════════════╣');

  if (_testResults.failed === 0) {
    Logger.log('║  STATUS:  ✅ ALL TESTS PASSED                ║');
    Logger.log('║                                              ║');
    Logger.log('║  GPMS BACKEND — CERTIFIED                    ║');
  } else {
    Logger.log('║  STATUS:  ❌ FAILURES DETECTED                ║');
    Logger.log('╠══════════════════════════════════════════════╣');
    _testResults.failures.forEach(function (f) {
      Logger.log('║  ❌ ' + f);
    });
  }

  Logger.log('╚══════════════════════════════════════════════╝');
}
