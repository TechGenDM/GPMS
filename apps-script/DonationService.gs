/**
 * GPMS Donation Service
 * ======================
 * ONLY donation logic lives here.
 * Nothing related to expenses, users, or settings.
 */

var DonationService = {
  /**
   * Creates a new donation record.
   * @param {Object} payload - Donation data.
   * @returns {ContentOutput} JSON response.
   */
  create: function (payload) {
    // TODO: Implement in Milestone 3
    // 1. Validate → validateDonation(payload)
    // 2. Generate ID → ReceiptService.generateDonationID()
    // 3. Save to sheet
    // 4. Audit log → AuditService.log()
    // 5. Return success with donation ID
    return success('DonationService.create not yet implemented');
  },

  /**
   * Updates an existing donation.
   * @param {Object} payload - Must include donationId + fields to update.
   * @returns {ContentOutput} JSON response.
   */
  update: function (payload) {
    // TODO: Implement in Milestone 3
    return success('DonationService.update not yet implemented');
  },

  /**
   * Cancels a donation (soft delete — sets status to Cancelled).
   * @param {Object} payload - Must include donationId.
   * @returns {ContentOutput} JSON response.
   */
  cancel: function (payload) {
    // TODO: Implement in Milestone 3
    return success('DonationService.cancel not yet implemented');
  },

  /**
   * Retrieves a single donation by ID.
   * @param {Object} payload - Must include donationId.
   * @returns {ContentOutput} JSON response.
   */
  get: function (payload) {
    // TODO: Implement in Milestone 3
    return success('DonationService.get not yet implemented');
  },

  /**
   * Searches donations by criteria (name, date range, category, etc.).
   * @param {Object} payload - Search filters.
   * @returns {ContentOutput} JSON response.
   */
  search: function (payload) {
    // TODO: Implement in Milestone 3
    return success('DonationService.search not yet implemented');
  },
};
