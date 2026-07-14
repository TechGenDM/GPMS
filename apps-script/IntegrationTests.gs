/**
 * GPMS Integration Tests (Milestone 3.2.5)
 * ========================================
 * Run these from the Apps Script editor to verify 
 * that the UserService and Foundation services are working.
 */

function runIntegrationTests() {
  Logger.log("=== Starting GPMS Integration Tests ===");
  
  var testEmail = "test.volunteer@example.com";
  var testUserPayload = {
    fullName: "Test Volunteer",
    email: testEmail,
    phone: "9876543210",
    role: CONFIG.roles.volunteer,
    status: CONFIG.status.active,
    adminUserId: "SYSTEM",
    adminUserName: "Test Runner"
  };
  
  var createdUserId = null;

  // 1. Authenticate unknown email
  Logger.log("1. Testing unknown email authentication...");
  var res1 = JSON.parse(UserService.authenticate({ email: "unknown@example.com" }).getContent());
  if (res1.success === false && res1.code === ERROR_CODES.USER_NOT_FOUND) {
    Logger.log("✅ Passed: Unknown email rejected properly.");
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res1));
  }

  // 2. Create a new user
  Logger.log("2. Testing user creation...");
  var res2 = JSON.parse(UserService.createUser(testUserPayload).getContent());
  if (res2.success === true && res2.data.id) {
    createdUserId = res2.data.id;
    Logger.log("✅ Passed: User created with ID " + createdUserId);
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res2));
  }

  // 3. Authenticate the newly created user
  Logger.log("3. Testing authentication of active user...");
  var res3 = JSON.parse(UserService.authenticate({ email: testEmail }).getContent());
  if (res3.success === true && res3.data.email === testEmail) {
    Logger.log("✅ Passed: Active user authenticated. LastLogin updated.");
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res3));
  }

  // 4. Update the user
  Logger.log("4. Testing user update...");
  var res4 = JSON.parse(UserService.updateUser({
    userId: createdUserId,
    fullName: "Updated Volunteer",
    adminUserId: "SYSTEM",
    adminUserName: "Test Runner"
  }).getContent());
  if (res4.success === true) {
    var checkUser = JSON.parse(UserService.findById(createdUserId).getContent());
    if (checkUser.data.fullName === "Updated Volunteer") {
      Logger.log("✅ Passed: User updated successfully.");
    } else {
      Logger.log("❌ Failed: Value didn't update in sheet.");
    }
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res4));
  }

  // 5. Disable the user
  Logger.log("5. Testing disable user...");
  var res5 = JSON.parse(UserService.disableUser({
    userId: createdUserId,
    adminUserId: "SYSTEM",
    adminUserName: "Test Runner"
  }).getContent());
  if (res5.success === true) {
    Logger.log("✅ Passed: User disabled.");
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res5));
  }

  // 6. Authenticate the disabled user
  Logger.log("6. Testing disabled user authentication...");
  var res6 = JSON.parse(UserService.authenticate({ email: testEmail }).getContent());
  if (res6.success === false && res6.code === ERROR_CODES.USER_DISABLED) {
    Logger.log("✅ Passed: Disabled user rejected correctly.");
  } else {
    Logger.log("❌ Failed: " + JSON.stringify(res6));
  }

  // 7. Verify authorize() helper
  Logger.log("7. Testing authorize helper...");
  var testUserObj = { role: CONFIG.roles.admin, status: CONFIG.status.active };
  var authCheck1 = UserService.authorize(testUserObj, [CONFIG.roles.admin]); // Should be true
  var authCheck2 = UserService.authorize(testUserObj, [CONFIG.roles.viewer]); // Should be false
  
  if (authCheck1 === true && authCheck2 === false) {
    Logger.log("✅ Passed: authorize() helper works correctly.");
  } else {
    Logger.log("❌ Failed: authorize() returned wrong result.");
  }

  Logger.log("=== Integration Tests Complete ===");
  Logger.log("Please check your Users, Metadata, and AuditLogs sheets in Google Sheets to confirm rows were inserted and logs were captured.");
}
