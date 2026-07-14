/**
 * GPMS Expense Integration Tests (Milestone 3.4)
 * ===============================================
 * Run this function from the Apps Script editor to verify
 * ExpenseService functionality and dynamic category validation.
 */

function runExpenseTests() {
  Logger.log("=== Starting GPMS Expense Tests ===");

  var testAdminEmail = "admin@gpms.org";
  
  // Create a temporary Admin user for testing purposes
  var adminPayload = {
    fullName: "Test Admin",
    email: testAdminEmail,
    phone: "1111111111",
    role: CONFIG.roles.admin,
    status: CONFIG.status.active
  };
  
  var adminCreateRes = JSON.parse(UserService.createUser(adminPayload).getContent());
  if (adminCreateRes.success === false && adminCreateRes.code !== ERROR_CODES.EMAIL_ALREADY_EXISTS) {
    Logger.log("❌ Failed to create test admin: " + JSON.stringify(adminCreateRes));
    return;
  }
  
  var authRes = JSON.parse(UserService.authenticate({ email: testAdminEmail }).getContent());
  if (!authRes.success) {
    Logger.log("❌ Failed to authenticate test admin: " + JSON.stringify(authRes));
    return;
  }
  
  var testAdminUser = authRes.data;

  // 1. Setup Categories (Add a valid expense category for testing)
  Logger.log("1. Setting up Test Category...");
  var catSheet = getSheet(CONFIG.sheets.categories);
  // Clear and setup fresh for testing predictability if needed, or just append
  // Ensure "Transportation" (Expense) is in the sheet
  var categoriesData = catSheet.getDataRange().getValues();
  var catExists = false;
  for (var i = 1; i < categoriesData.length; i++) {
    if (categoriesData[i][0] === "Transportation" && categoriesData[i][1] === "Expense") {
      catExists = true; break;
    }
  }
  if (!catExists) {
    catSheet.appendRow(["Transportation", "Expense"]);
  }

  // 2. Test Invalid Category
  Logger.log("2. Testing invalid category rejection...");
  var invalidPayload = {
    category: "Bitcoin Mining",
    description: "Buying miners",
    amount: 100000
  };
  var resInvalid = JSON.parse(ExpenseService.create(testAdminUser, invalidPayload).getContent());
  if (!resInvalid.success && resInvalid.code === ERROR_CODES.INVALID_CATEGORY) {
    Logger.log("✅ Passed: Rejected invalid category correctly.");
  } else {
    Logger.log("❌ Failed: Did not reject invalid category as expected. " + JSON.stringify(resInvalid));
  }

  // 3. Test Invalid Amount
  Logger.log("3. Testing invalid amount rejection...");
  var invalidAmtPayload = {
    category: "Transportation",
    description: "Taxi",
    amount: -500
  };
  var resAmt = JSON.parse(ExpenseService.create(testAdminUser, invalidAmtPayload).getContent());
  if (!resAmt.success && resAmt.code === ERROR_CODES.INVALID_AMOUNT) {
    Logger.log("✅ Passed: Rejected negative amount correctly.");
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(resAmt));
  }
  
  // 4. Test Missing Category
  Logger.log("4. Testing missing category rejection...");
  var resCat = JSON.parse(ExpenseService.create(testAdminUser, { description: "Taxi", amount: 500 }).getContent());
  if (!resCat.success && resCat.code === ERROR_CODES.MISSING_FIELD) {
    Logger.log("✅ Passed: Rejected missing category.");
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(resCat));
  }

  var createdExpenseId = null;

  // 5. Create a valid expense
  Logger.log("5. Testing valid expense creation...");
  var expensePayload = {
    category: "Transportation",
    description: "Taxi for event",
    vendor: "Uber",
    amount: 500,
    billLink: "http://example.com/bill"
  };
  
  var res1 = JSON.parse(ExpenseService.create(testAdminUser, expensePayload).getContent());
  if (res1.success && res1.data.id) {
    createdExpenseId = res1.data.id;
    Logger.log("✅ Passed: Expense created with ID " + createdExpenseId);
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res1));
    return;
  }

  // 6. Retrieve expense
  Logger.log("6. Testing expense retrieval...");
  var res2 = JSON.parse(ExpenseService.get(testAdminUser, { expenseId: createdExpenseId }).getContent());
  if (res2.success && res2.data.description === "Taxi for event") {
    Logger.log("✅ Passed: Expense retrieved correctly.");
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res2));
  }

  // 7. Search expenses
  Logger.log("7. Testing expense search...");
  var res3 = JSON.parse(ExpenseService.search(testAdminUser, { vendor: "Uber" }).getContent());
  if (res3.success && res3.data.length > 0) {
    var found = res3.data.some(function(e) { return e.id === createdExpenseId; });
    if (found) {
      Logger.log("✅ Passed: Expense found in search results.");
    } else {
      Logger.log("❌ Failed: Expense not in search results.");
    }
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res3));
  }

  // 8. Update expense (Admin)
  Logger.log("8. Testing expense update (Admin)...");
  var updatePayload = {
    expenseId: createdExpenseId,
    amount: 600,
    vendor: "Ola"
  };
  var res4 = JSON.parse(ExpenseService.update(testAdminUser, updatePayload).getContent());
  if (res4.success) {
    var checkRes = JSON.parse(ExpenseService.get(testAdminUser, { expenseId: createdExpenseId }).getContent());
    if (checkRes.data.amount === 600 && checkRes.data.vendor === "Ola") {
       Logger.log("✅ Passed: Expense updated successfully.");
    } else {
       Logger.log("❌ Failed: Sheet value did not update.");
    }
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res4));
  }

  // 9. Cancel expense (Admin)
  Logger.log("9. Testing expense cancellation (Admin)...");
  var res5 = JSON.parse(ExpenseService.cancel(testAdminUser, { expenseId: createdExpenseId, reason: "Wrong amount entered" }).getContent());
  if (res5.success) {
    var checkRes2 = JSON.parse(ExpenseService.get(testAdminUser, { expenseId: createdExpenseId }).getContent());
    if (checkRes2.data.status === CONFIG.status.cancelled && checkRes2.data.remarks === "Wrong amount entered") {
       Logger.log("✅ Passed: Expense cancelled successfully with reason.");
    } else {
       Logger.log("❌ Failed: Status/remarks did not change.");
    }
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res5));
  }

  Logger.log("=== Expense Tests Complete ===");
  Logger.log("Check Expenses, AuditLogs, and Categories sheets.");
}
