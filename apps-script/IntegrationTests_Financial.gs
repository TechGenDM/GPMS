/**
 * GPMS Financial Consistency Tests (Milestone 3.4.5)
 * ===================================================
 * Verifies that money in (Donations) and money out (Expenses)
 * calculate to the correct balance, and that cancelling an expense
 * restores the balance.
 *
 * Note: DashboardService will eventually own this logic, but
 * these tests prove the foundational data is accurate.
 */

function runFinancialConsistencyTests() {
  Logger.log('=== Starting GPMS Financial Consistency Tests ===');

  var testAdminEmail = 'admin@gpms.org';

  // Create a temporary Admin user for testing purposes
  var adminPayload = {
    fullName: 'Test Admin',
    email: testAdminEmail,
    phone: '1111111111',
    role: CONFIG.roles.admin,
    status: CONFIG.status.active,
  };

  UserService.createUser(adminPayload); // Ignore if exists
  var authRes = JSON.parse(
    UserService.authenticate({ email: testAdminEmail }).getContent()
  );
  if (!authRes.success) {
    Logger.log('❌ Failed to authenticate test admin.');
    return;
  }
  var testAdminUser = authRes.data;

  // Ensure Categories exist for the test
  var catSheet = getSheet(CONFIG.sheets.categories);
  var categoriesData = catSheet.getDataRange().getValues();
  var expenseCatExists = false;
  var donationCatExists = false;

  for (var i = 1; i < categoriesData.length; i++) {
    if (
      categoriesData[i][0] === 'Transportation' &&
      categoriesData[i][1] === 'Expense'
    )
      expenseCatExists = true;
    if (
      categoriesData[i][0] === 'General' &&
      categoriesData[i][1] === 'Donation'
    )
      donationCatExists = true;
  }
  if (!expenseCatExists) catSheet.appendRow(['Transportation', 'Expense']);
  if (!donationCatExists) catSheet.appendRow(['General', 'Donation']);

  // --- Helper to calculate current balance from sheets directly ---
  function calculateMockBalance() {
    var donSheet = getSheet(CONFIG.sheets.donations);
    var expSheet = getSheet(CONFIG.sheets.expenses);

    var donData = donSheet.getDataRange().getValues();
    var expData = expSheet.getDataRange().getValues();

    var totalDonations = 0;
    for (var i = 1; i < donData.length; i++) {
      if (donData[i][0] && donData[i][6] === CONFIG.status.active) {
        totalDonations += parseFloat(donData[i][3]) || 0;
      }
    }

    var totalExpenses = 0;
    for (var j = 1; j < expData.length; j++) {
      if (expData[j][0] && expData[j][7] === CONFIG.status.active) {
        totalExpenses += parseFloat(expData[j][5]) || 0;
      }
    }

    return totalDonations - totalExpenses;
  }

  var initialBalance = calculateMockBalance();
  Logger.log('Initial Balance: ₹' + initialBalance);

  // 1. Create a Donation (₹500)
  Logger.log('1. Creating Donation (₹500)...');
  var donPayload = {
    donorName: 'Financial Test Donor',
    amount: 500,
    category: 'General',
    paymentMode: 'Cash',
  };
  var donRes = JSON.parse(
    DonationService.create(testAdminUser, donPayload).getContent()
  );
  if (!donRes.success) {
    Logger.log('❌ Failed to create donation: ' + JSON.stringify(donRes));
    return;
  }

  var balanceAfterDonation = calculateMockBalance();
  if (balanceAfterDonation === initialBalance + 500) {
    Logger.log('✅ Passed: Balance increased by ₹500.');
  } else {
    Logger.log(
      '❌ Failed: Balance is ' +
        balanceAfterDonation +
        ', expected ' +
        (initialBalance + 500)
    );
  }

  // 2. Create an Expense (₹200)
  Logger.log('2. Creating Expense (₹200)...');
  var expPayload = {
    category: 'Transportation',
    description: 'Test Cab',
    amount: 200,
  };
  var expRes = JSON.parse(
    ExpenseService.create(testAdminUser, expPayload).getContent()
  );
  if (!expRes.success) {
    Logger.log('❌ Failed to create expense: ' + JSON.stringify(expRes));
    return;
  }
  var expenseId = expRes.data.id;

  var balanceAfterExpense = calculateMockBalance();
  if (balanceAfterExpense === initialBalance + 300) {
    Logger.log('✅ Passed: Balance decreased by ₹200 (Total diff: ₹300).');
  } else {
    Logger.log(
      '❌ Failed: Balance is ' +
        balanceAfterExpense +
        ', expected ' +
        (initialBalance + 300)
    );
  }

  // 3. Cancel the Expense
  Logger.log('3. Cancelling the Expense...');
  var cancelRes = JSON.parse(
    ExpenseService.cancel(testAdminUser, {
      expenseId: expenseId,
      reason: 'Testing refund',
    }).getContent()
  );
  if (!cancelRes.success) {
    Logger.log('❌ Failed to cancel expense: ' + JSON.stringify(cancelRes));
    return;
  }

  var balanceAfterCancel = calculateMockBalance();
  if (balanceAfterCancel === initialBalance + 500) {
    Logger.log(
      '✅ Passed: Balance restored to ₹500 diff after expense cancellation.'
    );
  } else {
    Logger.log(
      '❌ Failed: Balance is ' +
        balanceAfterCancel +
        ', expected ' +
        (initialBalance + 500)
    );
  }

  Logger.log('=== Financial Consistency Tests Complete ===');
}
