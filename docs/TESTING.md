# GPMS V1 Manual Acceptance Checklist

Before giving the green light for real users, perform this manual checklist against the Production instance. This verifies the critical infrastructure paths.

## 1. Concurrency & Idempotency
- [ ] **Double Click Test:** Fill out a new Donation. Click "Submit" twice as rapidly as you can. Verify only ONE record is created and the exact same receipt is shown twice without creating two rows in the Google Sheet.
- [ ] **Expense Double Click:** Do the same for an Expense. Verify only one Drive file is uploaded and only one row is created.

## 2. Validation Bounds
- [ ] **Zero / Negative Test:** Attempt to submit an amount of `0` or `-500`. It must be rejected.
- [ ] **Massive Number Test:** Attempt to submit an amount of `10000000` (1 Crore). It must be rejected.

## 3. Financial Consistency
- [ ] **Cancel Record:** Create a dummy donation. Check the total on the Dashboard. Cancel the donation. Check the Dashboard again to verify the amount is correctly subtracted from the total.
- [ ] **Cancel Expense:** Repeat the above process for an Expense.

## 4. Drive Integrity
- [ ] **Bill Upload Verification:** Submit an expense with a bill attachment. Go to Google Drive and verify the file is named correctly (e.g., `EXP-XXXX_filename.jpg`) and is located exactly in the target folder.

## 5. Security & Roles
- [ ] **Role Enforcement:** Log in as a regular User. Try to visit `/records` or `/users` manually. You should be blocked. Try to cancel a record. You should be blocked.

## 6. Structural Google Sheets Integrity
- [ ] Ensure you have manually protected Row 1 (Headers) in all sheets.
- [ ] Ensure you have manually protected Columns A and B in Donations.
- [ ] Ensure you have manually protected Column A in Expenses.
- [ ] Try to delete a header as an Admin user in Sheets (should be blocked if you are not the owner).
