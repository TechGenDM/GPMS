/**
 * GPMS Dashboard Integration Tests (Milestone 3.5)
 * ==================================================
 * Verifies DashboardService read-only aggregations.
 */

function runDashboardTests() {
  Logger.log("=== Starting GPMS Dashboard Tests ===");

  var testAdminEmail = "admin@gpms.org";
  var authRes = JSON.parse(UserService.authenticate({ email: testAdminEmail }).getContent());
  if (!authRes.success) {
    Logger.log("❌ Failed to authenticate test admin. Run runDonationTests first.");
    return;
  }
  var testAdminUser = authRes.data;

  // 1. Test Financial Summary
  Logger.log("1. Testing Financial Summary...");
  var summaryRes = JSON.parse(DashboardService.getFinancialSummary(testAdminUser).getContent());
  if (summaryRes.success && summaryRes.data.donations !== undefined && summaryRes.data.balance !== undefined) {
    Logger.log("✅ Passed: Financial Summary returned correct structure.");
    Logger.log("   Balance: " + summaryRes.data.balance);
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(summaryRes));
  }

  // 2. Test Recent Activity
  Logger.log("2. Testing Recent Activity (chronological merge)...");
  var activityRes = JSON.parse(DashboardService.getRecentActivity(testAdminUser, { limit: 5 }).getContent());
  if (activityRes.success && Array.isArray(activityRes.data)) {
    Logger.log("✅ Passed: Recent Activity retrieved " + activityRes.data.length + " items.");
    if (activityRes.data.length > 0) {
      Logger.log("   Latest activity type: " + activityRes.data[0].type + " - " + activityRes.data[0].title);
    }
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(activityRes));
  }

  // 3. Test Donation Stats
  Logger.log("3. Testing Donation Stats...");
  var donStatsRes = JSON.parse(DashboardService.getDonationStats(testAdminUser).getContent());
  if (donStatsRes.success && donStatsRes.data.totalDonors !== undefined) {
    Logger.log("✅ Passed: Donation stats retrieved.");
    Logger.log("   Total Donors (Unique): " + donStatsRes.data.totalDonors);
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(donStatsRes));
  }

  // 4. Test Expense Stats
  Logger.log("4. Testing Expense Stats...");
  var expStatsRes = JSON.parse(DashboardService.getExpenseStats(testAdminUser).getContent());
  if (expStatsRes.success && expStatsRes.data.highestExpense !== undefined) {
    Logger.log("✅ Passed: Expense stats retrieved.");
    Logger.log("   Highest Expense: " + expStatsRes.data.highestExpense);
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(expStatsRes));
  }

  // 5. Test Public Dashboard (Unauthenticated)
  Logger.log("5. Testing Public Dashboard (Unauthenticated via dispatch)...");
  var simulatedPostData = {
    action: "getPublicDashboard",
    payload: {} // No userEmail provided!
  };
  var pubRes = JSON.parse(dispatch(simulatedPostData.action, simulatedPostData.payload).getContent());
  if (pubRes.success && pubRes.data.committeeName !== undefined && pubRes.data.totalCollection !== undefined) {
    Logger.log("✅ Passed: Public Dashboard successfully bypassed auth and retrieved stripped data.");
    Logger.log("   Committee: " + pubRes.data.committeeName + " | Balance: " + pubRes.data.balance);
  } else {
    Logger.log("❌ Failed: Public Dashboard blocked or failed. " + JSON.stringify(pubRes));
  }

  Logger.log("=== Dashboard Tests Complete ===");
}
