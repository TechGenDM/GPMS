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

    var donH = DashboardService._findHeaders(donData, 'Donation ID');
    var donCols = donH.cols;
    var donIdCol =
      donCols['Donation ID'] !== undefined
        ? donCols['Donation ID']
        : donCols['ID'] !== undefined
          ? donCols['ID']
          : 0;
    var donAmtCol = donCols['Amount'] !== undefined ? donCols['Amount'] : 3;
    var donModeCol =
      donCols['Payment Mode'] !== undefined
        ? donCols['Payment Mode']
        : donCols['PaymentMode'] !== undefined
          ? donCols['PaymentMode']
          : 5;
    var donStatusCol = donCols['Status'] !== undefined ? donCols['Status'] : 6;
    var donNameCol =
      donCols['Donor Name'] !== undefined
        ? donCols['Donor Name']
        : donCols['DonorName'] !== undefined
          ? donCols['DonorName']
          : 2;

    var stats = {
      totalDonors: 0,
      highestDonation: 0,
      averageDonation: 0,
      cash: 0,
      upi: 0,
      totalCount: 0,
    };

    var donorNames = {};
    var sum = 0;

    for (var i = donH.headerIndex + 1; i < donData.length; i++) {
      if (
        !donData[i][donIdCol] ||
        String(donData[i][donStatusCol]) !== CONFIG.status.active
      )
        continue;

      var amt = parseFloat(donData[i][donAmtCol]) || 0;
      var mode = String(donData[i][donModeCol] || '').toLowerCase();
      var name = String(donData[i][donNameCol] || '')
        .toLowerCase()
        .trim();

      stats.totalCount++;
      sum += amt;

      if (amt > stats.highestDonation) stats.highestDonation = amt;
      if (mode.indexOf('cash') !== -1) stats.cash += amt;
      else if (mode.indexOf('upi') !== -1) stats.upi += amt;
      else stats.cash += amt; // Defaulting unknown to cash

      if (name) donorNames[name] = true;
    }

    stats.totalDonors = Object.keys(donorNames).length;
    stats.averageDonation = stats.totalCount > 0 ? sum / stats.totalCount : 0;

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

    var expH = DashboardService._findHeaders(expData, 'Expense ID');
    var expCols = expH.cols;
    var expIdCol =
      expCols['Expense ID'] !== undefined
        ? expCols['Expense ID']
        : expCols['ID'] !== undefined
          ? expCols['ID']
          : 0;
    var expAmtCol = expCols['Amount'] !== undefined ? expCols['Amount'] : 5;
    var expCatCol = expCols['Category'] !== undefined ? expCols['Category'] : 2;
    var expStatusCol = expCols['Status'] !== undefined ? expCols['Status'] : 7;
    var expDateCol =
      expCols['Date'] !== undefined
        ? expCols['Date']
        : expCols['Created At'] !== undefined
          ? expCols['Created At']
          : 1;

    var stats = {
      highestExpense: 0,
      averageExpense: 0,
      todaysExpense: 0,
      perCategory: {},
      totalCount: 0,
    };

    var sum = 0;
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (var i = expH.headerIndex + 1; i < expData.length; i++) {
      if (
        !expData[i][expIdCol] ||
        String(expData[i][expStatusCol]) !== CONFIG.status.active
      )
        continue;

      var amt = parseFloat(expData[i][expAmtCol]) || 0;
      var cat = String(expData[i][expCatCol]);
      var expDateStr = expData[i][expDateCol];

      stats.totalCount++;
      sum += amt;

      if (amt > stats.highestExpense) stats.highestExpense = amt;

      if (!stats.perCategory[cat]) stats.perCategory[cat] = 0;
      stats.perCategory[cat] += amt;

      var expDate;
      if (expDateStr instanceof Date) {
        expDate = expDateStr;
      } else {
        expDate = new Date(expDateStr);
      }

      if (!isNaN(expDate.getTime()) && expDate >= todayStart) {
        stats.todaysExpense += amt;
      }
    }

    stats.averageExpense = stats.totalCount > 0 ? sum / stats.totalCount : 0;

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
      recentActivity: activity,
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
      if (settingsData[i][0] === 'COMMITTEE_NAME')
        committeeName = settingsData[i][1];
      if (settingsData[i][0] === 'YEAR') year = settingsData[i][1];
    }

    return success('Public dashboard retrieved', {
      committeeName: committeeName,
      year: year,
      totalCollection: snapshot.donations.total,
      totalExpense: snapshot.expenses.total,
      balance: snapshot.balance,
    });
  },

  /**
   * Finds the header row index and builds a column-name-to-index map.
   * Handles sheets that have summary/title rows above the actual header.
   *
   * @param {Array[]} data - 2D array from getDataRange().getValues().
   * @param {string} firstColName - Expected name of the first column (e.g. 'Expense ID').
   * @returns {{ headerIndex: number, cols: Object }} Header row index and column map.
   * @private
   */
  _findHeaders: function (data, firstColName) {
    for (var r = 0; r < data.length; r++) {
      var cell = String(data[r][0]).trim();
      if (cell.toLowerCase() === firstColName.toLowerCase()) {
        var cols = {};
        for (var c = 0; c < data[r].length; c++) {
          var name = String(data[r][c]).trim();
          if (name) cols[name] = c;
        }
        return { headerIndex: r, cols: cols };
      }
    }
    // Fallback: treat row 0 as header
    var fallbackCols = {};
    for (var fc = 0; fc < data[0].length; fc++) {
      var fname = String(data[0][fc]).trim();
      if (fname) fallbackCols[fname] = fc;
    }
    return { headerIndex: 0, cols: fallbackCols };
  },

  /**
   * Calculates the core financial snapshot.
   * Uses header-based column lookup to handle varying sheet layouts.
   * @private
   */
  _calculateSnapshot: function () {
    var donSheet = getSheet(CONFIG.sheets.donations);
    var expSheet = getSheet(CONFIG.sheets.expenses);

    var donData = donSheet.getDataRange().getValues();
    var expData = expSheet.getDataRange().getValues();

    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    var snapshot = {
      donations: { total: 0, today: 0, cash: 0, upi: 0 },
      expenses: { total: 0, today: 0 },
      balance: 0,
    };

    // --- Donations (header-based) ---
    var donH = DashboardService._findHeaders(donData, 'Donation ID');
    var donCols = donH.cols;
    // Resolve column indexes by name (with fallbacks for alternate header names)
    var donIdCol =
      donCols['Donation ID'] !== undefined
        ? donCols['Donation ID']
        : donCols['ID'] !== undefined
          ? donCols['ID']
          : 0;
    var donAmtCol = donCols['Amount'] !== undefined ? donCols['Amount'] : 3;
    var donModeCol =
      donCols['Payment Mode'] !== undefined
        ? donCols['Payment Mode']
        : donCols['PaymentMode'] !== undefined
          ? donCols['PaymentMode']
          : 5;
    var donStatusCol = donCols['Status'] !== undefined ? donCols['Status'] : 6;
    var donDateCol =
      donCols['Date'] !== undefined
        ? donCols['Date']
        : donCols['Created At'] !== undefined
          ? donCols['Created At']
          : 1;

    for (var i = donH.headerIndex + 1; i < donData.length; i++) {
      if (
        !donData[i][donIdCol] ||
        String(donData[i][donStatusCol]) !== CONFIG.status.active
      )
        continue;

      var amt = parseFloat(donData[i][donAmtCol]) || 0;
      var mode = String(donData[i][donModeCol] || '').toLowerCase();
      var donDateStr = donData[i][donDateCol];

      snapshot.donations.total += amt;

      if (mode.indexOf('cash') !== -1) snapshot.donations.cash += amt;
      else if (mode.indexOf('upi') !== -1) snapshot.donations.upi += amt;
      else snapshot.donations.cash += amt; // default unknown to cash

      var donDate =
        donDateStr instanceof Date ? donDateStr : new Date(donDateStr);
      if (!isNaN(donDate.getTime()) && donDate >= todayStart) {
        snapshot.donations.today += amt;
      }
    }

    // --- Expenses (header-based) ---
    var expH = DashboardService._findHeaders(expData, 'Expense ID');
    var expCols = expH.cols;
    var expIdCol =
      expCols['Expense ID'] !== undefined
        ? expCols['Expense ID']
        : expCols['ID'] !== undefined
          ? expCols['ID']
          : 0;
    var expAmtCol = expCols['Amount'] !== undefined ? expCols['Amount'] : 5;
    var expStatusCol = expCols['Status'] !== undefined ? expCols['Status'] : 7;
    var expDateCol =
      expCols['Date'] !== undefined
        ? expCols['Date']
        : expCols['Created At'] !== undefined
          ? expCols['Created At']
          : 1;

    for (var j = expH.headerIndex + 1; j < expData.length; j++) {
      if (
        !expData[j][expIdCol] ||
        String(expData[j][expStatusCol]) !== CONFIG.status.active
      )
        continue;

      var expAmt = parseFloat(expData[j][expAmtCol]) || 0;
      var expDateStr = expData[j][expDateCol];

      snapshot.expenses.total += expAmt;

      var expDate =
        expDateStr instanceof Date ? expDateStr : new Date(expDateStr);
      if (!isNaN(expDate.getTime()) && expDate >= todayStart) {
        snapshot.expenses.today += expAmt;
      }
    }

    // Authoritative Balance
    snapshot.balance = snapshot.donations.total - snapshot.expenses.total;

    return snapshot;
  },

  /**
   * Returns merged, sorted recent activity.
   * Uses header-based column lookup to handle varying sheet layouts.
   * @private
   */
  _getMergedActivity: function (limit) {
    var donSheet = getSheet(CONFIG.sheets.donations);
    var expSheet = getSheet(CONFIG.sheets.expenses);

    var donData = donSheet.getDataRange().getValues();
    var expData = expSheet.getDataRange().getValues();

    var combined = [];

    // --- Donations (header-based) ---
    var donH = DashboardService._findHeaders(donData, 'Donation ID');
    var donCols = donH.cols;
    var donIdCol =
      donCols['Donation ID'] !== undefined
        ? donCols['Donation ID']
        : donCols['ID'] !== undefined
          ? donCols['ID']
          : 0;
    var donDateCol =
      donCols['Date'] !== undefined
        ? donCols['Date']
        : donCols['Created At'] !== undefined
          ? donCols['Created At']
          : 1;
    var donNameCol =
      donCols['Donor Name'] !== undefined
        ? donCols['Donor Name']
        : donCols['DonorName'] !== undefined
          ? donCols['DonorName']
          : 2;
    var donAmtCol = donCols['Amount'] !== undefined ? donCols['Amount'] : 3;
    var donStatusCol = donCols['Status'] !== undefined ? donCols['Status'] : 6;

    for (var i = donH.headerIndex + 1; i < donData.length; i++) {
      if (
        !donData[i][donIdCol] ||
        String(donData[i][donStatusCol]) !== CONFIG.status.active
      )
        continue;
      var dDateVal = donData[i][donDateCol];
      var dTime =
        dDateVal instanceof Date
          ? dDateVal.getTime()
          : new Date(dDateVal).getTime();
      if (isNaN(dTime)) dTime = 0;
      combined.push({
        type: 'Donation',
        id: donData[i][donIdCol],
        date: dTime,
        title: donData[i][donNameCol],
        amount: parseFloat(donData[i][donAmtCol]) || 0,
        status: donData[i][donStatusCol],
      });
    }

    // --- Expenses (header-based) ---
    var expH = DashboardService._findHeaders(expData, 'Expense ID');
    var expCols = expH.cols;
    var expIdCol =
      expCols['Expense ID'] !== undefined
        ? expCols['Expense ID']
        : expCols['ID'] !== undefined
          ? expCols['ID']
          : 0;
    var expDateCol =
      expCols['Date'] !== undefined
        ? expCols['Date']
        : expCols['Created At'] !== undefined
          ? expCols['Created At']
          : 1;
    var expDescCol =
      expCols['Description'] !== undefined ? expCols['Description'] : 3;
    var expAmtCol = expCols['Amount'] !== undefined ? expCols['Amount'] : 5;
    var expStatusCol = expCols['Status'] !== undefined ? expCols['Status'] : 7;

    for (var j = expH.headerIndex + 1; j < expData.length; j++) {
      if (
        !expData[j][expIdCol] ||
        String(expData[j][expStatusCol]) !== CONFIG.status.active
      )
        continue;
      var eDateVal = expData[j][expDateCol];
      var eTime =
        eDateVal instanceof Date
          ? eDateVal.getTime()
          : new Date(eDateVal).getTime();
      if (isNaN(eTime)) eTime = 0;
      combined.push({
        type: 'Expense',
        id: expData[j][expIdCol],
        date: eTime,
        title: expData[j][expDescCol],
        amount: parseFloat(expData[j][expAmtCol]) || 0,
        status: expData[j][expStatusCol],
      });
    }

    // Sort descending by date
    combined.sort(function (a, b) {
      return b.date - a.date;
    });

    // Format dates back and truncate
    var results = [];
    for (var k = 0; k < Math.min(limit, combined.length); k++) {
      var item = combined[k];
      if (item.date > 0) {
        item.date = Utilities.formatDate(
          new Date(item.date),
          CONFIG.timezone,
          CONFIG.dateFormat
        );
      } else {
        item.date = '';
      }
      results.push(item);
    }

    return results;
  },
};
