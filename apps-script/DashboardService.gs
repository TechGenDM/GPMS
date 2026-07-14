/**
 * GPMS Dashboard Service
 * =======================
 * Financial Intelligence Layer.
 * STRICTLY READ-ONLY. Never modifies data.
 */

var DashboardService = {
  /**
   * Returns a financial snapshot.
   *
   * @param {Object} user - Authenticated user.
   * @param {Object} payload - Optional filters.
   * @returns {ContentOutput} JSON response.
   */
  getFinancialSummary: function (user, payload) {
    var snapshot = DashboardService._calculateSnapshot();
    return success('Financial summary retrieved', snapshot);
  },

  /**
   * Returns recent chronological activity (Donations + Expenses merged).
   *
   * @param {Object} user - Authenticated user.
   * @param {Object} payload - Limit parameter.
   * @returns {ContentOutput} JSON response.
   */
  getRecentActivity: function (user, payload) {
    var limit = payload && payload.limit ? parseInt(payload.limit, 10) : 10;
    var activity = DashboardService._getMergedActivity(limit);
    return success('Recent activity retrieved', activity);
  },

  /**
   * Returns detailed donation statistics.
   *
   * @param {Object} user - Authenticated user.
   * @param {Object} payload - Optional filters.
   * @returns {ContentOutput} JSON response.
   */
  getDonationStats: function (user, payload) {
    var donSheet = getSheet(CONFIG.sheets.donations);
    var donData = donSheet.getDataRange().getValues();
    
    var stats = {
      totalDonors: 0,
      highestDonation: 0,
      averageDonation: 0,
      cash: 0,
      upi: 0,
      totalCount: 0
    };
    
    var donorNames = {};
    var sum = 0;

    for (var i = 1; i < donData.length; i++) {
      if (!donData[i][0] || donData[i][6] !== CONFIG.status.active) continue;
      
      var amt = parseFloat(donData[i][3]) || 0;
      var mode = String(donData[i][5]).toLowerCase();
      var name = String(donData[i][2]).toLowerCase().trim();
      
      stats.totalCount++;
      sum += amt;
      
      if (amt > stats.highestDonation) stats.highestDonation = amt;
      if (mode.indexOf('cash') !== -1) stats.cash += amt;
      else if (mode.indexOf('upi') !== -1) stats.upi += amt;
      else stats.cash += amt; // Defaulting unknown to cash
      
      if (name) donorNames[name] = true;
    }
    
    stats.totalDonors = Object.keys(donorNames).length;
    stats.averageDonation = stats.totalCount > 0 ? (sum / stats.totalCount) : 0;

    return success('Donation stats retrieved', stats);
  },

  /**
   * Returns detailed expense statistics.
   *
   * @param {Object} user - Authenticated user.
   * @param {Object} payload - Optional filters.
   * @returns {ContentOutput} JSON response.
   */
  getExpenseStats: function (user, payload) {
    var expSheet = getSheet(CONFIG.sheets.expenses);
    var expData = expSheet.getDataRange().getValues();
    
    var stats = {
      highestExpense: 0,
      averageExpense: 0,
      todaysExpense: 0,
      perCategory: {},
      totalCount: 0
    };
    
    var sum = 0;
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (var i = 1; i < expData.length; i++) {
      if (!expData[i][0] || expData[i][7] !== CONFIG.status.active) continue;
      
      var amt = parseFloat(expData[i][5]) || 0;
      var cat = String(expData[i][2]);
      var expDateStr = expData[i][1];
      
      stats.totalCount++;
      sum += amt;
      
      if (amt > stats.highestExpense) stats.highestExpense = amt;
      
      if (!stats.perCategory[cat]) stats.perCategory[cat] = 0;
      stats.perCategory[cat] += amt;
      
      // Try to parse date string back to Date object
      var expDate;
      if (expDateStr instanceof Date) {
        expDate = expDateStr;
      } else {
        // Very basic parse, relying on standard format or JS parsing
        // If it fails to parse properly, today's expense might be slightly off.
        expDate = new Date(expDateStr);
      }
      
      if (expDate >= todayStart) {
        stats.todaysExpense += amt;
      }
    }
    
    stats.averageExpense = stats.totalCount > 0 ? (sum / stats.totalCount) : 0;

    return success('Expense stats retrieved', stats);
  },

  /**
   * Returns combined summary and activity.
   *
   * @param {Object} user - Authenticated user.
   * @param {Object} payload - Optional filters.
   * @returns {ContentOutput} JSON response.
   */
  getDashboardSummary: function (user, payload) {
    var snapshot = DashboardService._calculateSnapshot();
    var activity = DashboardService._getMergedActivity(10);
    
    return success('Dashboard summary retrieved', {
      summary: snapshot,
      recentActivity: activity
    });
  },

  /**
   * Public dashboard for unauthenticated users.
   * Strips all PII.
   *
   * @param {Object} user - Ignored (can be null/undefined).
   * @param {Object} payload - Optional.
   * @returns {ContentOutput} JSON response.
   */
  getPublicDashboard: function (user, payload) {
    var snapshot = DashboardService._calculateSnapshot();
    
    // Retrieve settings (ignoring auth)
    var settingsSheet = getSheet(CONFIG.sheets.settings);
    var settingsData = settingsSheet.getDataRange().getValues();
    var committeeName = 'Our Committee';
    var year = '2026';
    
    for (var i = 1; i < settingsData.length; i++) {
      if (settingsData[i][0] === 'COMMITTEE_NAME') committeeName = settingsData[i][1];
      if (settingsData[i][0] === 'YEAR') year = settingsData[i][1];
    }
    
    return success('Public dashboard retrieved', {
      committeeName: committeeName,
      year: year,
      totalCollection: snapshot.donations.total,
      totalExpense: snapshot.expenses.total,
      balance: snapshot.balance
    });
  },

  // ==========================================
  // Internal Helpers
  // ==========================================

  /**
   * Calculates the core financial snapshot.
   * @private
   */
  _calculateSnapshot: function() {
    var donSheet = getSheet(CONFIG.sheets.donations);
    var expSheet = getSheet(CONFIG.sheets.expenses);
    
    var donData = donSheet.getDataRange().getValues();
    var expData = expSheet.getDataRange().getValues();
    
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    var snapshot = {
      donations: { total: 0, today: 0, cash: 0, upi: 0 },
      expenses: { total: 0, today: 0 },
      balance: 0
    };

    // Process Donations
    for (var i = 1; i < donData.length; i++) {
      if (!donData[i][0] || donData[i][6] !== CONFIG.status.active) continue;
      
      var amt = parseFloat(donData[i][3]) || 0;
      var mode = String(donData[i][5]).toLowerCase();
      var donDateStr = donData[i][1];
      
      snapshot.donations.total += amt;
      
      if (mode.indexOf('cash') !== -1) snapshot.donations.cash += amt;
      else if (mode.indexOf('upi') !== -1) snapshot.donations.upi += amt;
      else snapshot.donations.cash += amt; // default unknown to cash
      
      var donDate = donDateStr instanceof Date ? donDateStr : new Date(donDateStr);
      if (donDate >= todayStart) {
        snapshot.donations.today += amt;
      }
    }

    // Process Expenses
    for (var j = 1; j < expData.length; j++) {
      if (!expData[j][0] || expData[j][7] !== CONFIG.status.active) continue;
      
      var expAmt = parseFloat(expData[j][5]) || 0;
      var expDateStr = expData[j][1];
      
      snapshot.expenses.total += expAmt;
      
      var expDate = expDateStr instanceof Date ? expDateStr : new Date(expDateStr);
      if (expDate >= todayStart) {
        snapshot.expenses.today += expAmt;
      }
    }

    // Authoritative Balance
    snapshot.balance = snapshot.donations.total - snapshot.expenses.total;
    
    return snapshot;
  },

  /**
   * Returns merged, sorted recent activity.
   * @private
   */
  _getMergedActivity: function(limit) {
    var donSheet = getSheet(CONFIG.sheets.donations);
    var expSheet = getSheet(CONFIG.sheets.expenses);
    
    var donData = donSheet.getDataRange().getValues();
    var expData = expSheet.getDataRange().getValues();
    
    var combined = [];
    
    // Add Donations (Active only)
    for (var i = 1; i < donData.length; i++) {
      if (!donData[i][0] || donData[i][6] !== CONFIG.status.active) continue;
      combined.push({
        type: 'Donation',
        id: donData[i][0],
        date: donData[i][1] instanceof Date ? donData[i][1].getTime() : new Date(donData[i][1]).getTime(),
        title: donData[i][2], // Donor Name
        amount: parseFloat(donData[i][3]) || 0,
        status: donData[i][6]
      });
    }

    // Add Expenses (Active only)
    for (var j = 1; j < expData.length; j++) {
      if (!expData[j][0] || expData[j][7] !== CONFIG.status.active) continue;
      combined.push({
        type: 'Expense',
        id: expData[j][0],
        date: expData[j][1] instanceof Date ? expData[j][1].getTime() : new Date(expData[j][1]).getTime(),
        title: expData[j][3], // Description
        amount: parseFloat(expData[j][5]) || 0,
        status: expData[j][7]
      });
    }

    // Sort descending by date
    combined.sort(function(a, b) {
      return b.date - a.date;
    });

    // Format dates back and truncate
    var results = [];
    for (var k = 0; k < Math.min(limit, combined.length); k++) {
      var item = combined[k];
      item.date = Utilities.formatDate(new Date(item.date), CONFIG.timezone, CONFIG.dateFormat);
      results.push(item);
    }
    
    return results;
  }
};
