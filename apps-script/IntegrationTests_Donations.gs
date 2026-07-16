/**
 * GPMS Donation Integration Tests (Milestone 3.3.5)
 * =================================================
 * Run this function from the Apps Script editor to verify
 * DonationService functionality.
 *
 * NOTE: Ensure IntegrationTests.gs (runIntegrationTests) was run first
 * so that a test volunteer and admin exist, or adjust the emails below.
 */

function runDonationTests() {
  Logger.log('=== Starting GPMS Donation Tests ===');

  var testAdminEmail = 'admin@gpms.org'; // Replace with your actual admin email later, or just create one temporarily.

  // Create a temporary Admin user for testing purposes
  var adminPayload = {
    fullName: 'Test Admin',
    email: testAdminEmail,
    phone: '1111111111',
    role: CONFIG.roles.admin,
    status: CONFIG.status.active,
  };

  // Try to create the admin, ignore EMAIL_ALREADY_EXISTS
  var adminCreateRes = JSON.parse(
    UserService.createUser(adminPayload).getContent()
  );
  if (
    adminCreateRes.success === false &&
    adminCreateRes.code !== ERROR_CODES.EMAIL_ALREADY_EXISTS
  ) {
    Logger.log(
      '❌ Failed to create test admin: ' + JSON.stringify(adminCreateRes)
    );
    return;
  }

  // Authenticate to get the user object for dispatch
  var authRes = JSON.parse(
    UserService.authenticate({ email: testAdminEmail }).getContent()
  );
  if (!authRes.success) {
    Logger.log(
      '❌ Failed to authenticate test admin: ' + JSON.stringify(authRes)
    );
    return;
  }

  var testAdminUser = authRes.data;
  var createdDonationId = null;

  // 1. Create a donation
  Logger.log('1. Testing donation creation...');
  var donationPayload = {
    donorName: 'John Doe',
    amount: 5000,
    category: 'General',
    paymentMode: 'Cash',
    remarks: 'Initial test donation',
  };

  // Using direct service call here since we have the user object
  var res1 = JSON.parse(
    DonationService.create(testAdminUser, donationPayload).getContent()
  );
  if (res1.success && res1.data.id) {
    createdDonationId = res1.data.id;
    Logger.log('✅ Passed: Donation created with ID ' + createdDonationId);
  } else {
    Logger.log('❌ Failed: ' + JSON.stringify(res1));
    return; // Stop if we can't create
  }

  // 2. Retrieve donation
  Logger.log('2. Testing donation retrieval...');
  var res2 = JSON.parse(
    DonationService.get(testAdminUser, {
      donationId: createdDonationId,
    }).getContent()
  );
  if (res2.success && res2.data.donorName === 'John Doe') {
    Logger.log('✅ Passed: Donation retrieved correctly.');
  } else {
    Logger.log('❌ Failed: ' + JSON.stringify(res2));
  }

  // 3. Search donations
  Logger.log('3. Testing donation search...');
  var res3 = JSON.parse(
    DonationService.search(testAdminUser, { category: 'General' }).getContent()
  );
  if (res3.success && res3.data.length > 0) {
    var found = res3.data.some(function (d) {
      return d.id === createdDonationId;
    });
    if (found) {
      Logger.log('✅ Passed: Donation found in search results.');
    } else {
      Logger.log('❌ Failed: Donation not in search results.');
    }
  } else {
    Logger.log('❌ Failed: ' + JSON.stringify(res3));
  }

  // 4. Update donation (Admin)
  Logger.log('4. Testing donation update (Admin)...');
  var updatePayload = {
    donationId: createdDonationId,
    amount: 10000,
    remarks: 'Updated to 10k',
  };
  var res4 = JSON.parse(
    DonationService.update(testAdminUser, updatePayload).getContent()
  );
  if (res4.success) {
    var checkRes = JSON.parse(
      DonationService.get(testAdminUser, {
        donationId: createdDonationId,
      }).getContent()
    );
    if (checkRes.data.amount === 10000) {
      Logger.log('✅ Passed: Donation updated successfully.');
    } else {
      Logger.log('❌ Failed: Sheet value did not update.');
    }
  } else {
    Logger.log('❌ Failed: ' + JSON.stringify(res4));
  }

  // 5. Cancel donation (Admin)
  Logger.log('5. Testing donation cancellation (Admin)...');
  var res5 = JSON.parse(
    DonationService.cancel(testAdminUser, {
      donationId: createdDonationId,
    }).getContent()
  );
  if (res5.success) {
    var checkRes2 = JSON.parse(
      DonationService.get(testAdminUser, {
        donationId: createdDonationId,
      }).getContent()
    );
    if (checkRes2.data.status === CONFIG.status.cancelled) {
      Logger.log('✅ Passed: Donation cancelled successfully.');
    } else {
      Logger.log('❌ Failed: Status did not change to Cancelled.');
    }
  } else {
    Logger.log('❌ Failed: ' + JSON.stringify(res5));
  }

  // 6. Test global dispatch via doPost simulation
  Logger.log('6. Testing global authentication interceptor via dispatch...');
  var simulatedPostData = {
    action: 'getDonation',
    payload: {
      userEmail: testAdminEmail,
      donationId: createdDonationId,
    },
  };
  var res6 = JSON.parse(
    dispatch(simulatedPostData.action, simulatedPostData.payload).getContent()
  );
  if (res6.success && res6.data.id === createdDonationId) {
    Logger.log(
      '✅ Passed: Global dispatch correctly authenticated user and routed the request.'
    );
  } else {
    Logger.log('❌ Failed: Global dispatch failed - ' + JSON.stringify(res6));
  }

  Logger.log('=== Donation Tests Complete ===');
  Logger.log(
    'Please check your Donations, Metadata, and AuditLogs sheets in Google Sheets.'
  );
}
