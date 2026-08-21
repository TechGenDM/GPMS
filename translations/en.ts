export type Dictionary = {
  language: {
    english: string;
    hindi: string;
  };
  publicDashboard: {
    systemName: string;
    login: string;
    couldNotLoad: string;
    networkError: string;
    tryAgain: string;
    ourCommittee: string;
    financialTransparency: string;
    buildingTrust: string;
    liveDarshan: string;
    liveStream: string;
    watchLive: string;
    update: string;
    financialOverview: string;
    totalDonations: string;
    thankYouGenerosity: string;
    totalExpenses: string;
    everyExpenseRecorded: string;
    allFundsManaged: string;
    donationsTracked: string;
    followUs: string;
    builtBy: string;
    softwareDeveloper: string;
  };
  login: {
    ganeshPuja: string;
    managementSystem: string;
    accessDenied: string;
    unauthorizedAccount: string;
    contactAdmin: string;
    authenticationError: string;
    problemSigningIn: string;
    committeeMemberLogin: string;
    signInWithGoogle: string;
    authorizedVolunteersOnly: string;
  };
  dashboard: {
    auditLogs: string;
    users: string;
    records: string;
    refresh: string;
    logout: string;
    couldNotLoad: string;
    retry: string;
    serverError: string;
    fetchFailed: string;
    currentBalance: string;
    collections: string;
    cash: string;
    upi: string;
    expenses: string;
    todayCol: string;
    todayExp: string;
    liveDarshan: string;
    configured: string;
    notConfigured: string;
    isConfiguredDesc: string;
    tapToConfigureDesc: string;
    liveDarshanModalDesc: string;
    youtubeLiveUrl: string;
    youtubeUrlPlaceholder: string;
    cancel: string;
    saveUrl: string;
    saving: string;
    announcement: string;
    active: string;
    none: string;
    tapToSetAnnouncement: string;
    announcementModalDesc: string;
    announcementTextLabel: string;
    announcementTextPlaceholder: string;
    dateSubtitleLabel: string;
    datePlaceholder: string;
    saveAnnouncement: string;
    expensesByCategory: string;
    recentActivity: string;
    noRecentActivity: string;
    untitled: string;
    donation: string;
    expense: string;
    volunteer: string;
    signOut: string;
    liveDarshanInvalidUrl: string;
    liveDarshanUpdateFailed: string;
    liveDarshanUpdateSuccess: string;
    announcementTooLong: string;
    announcementUpdateFailed: string;
    announcementUpdateSuccess: string;
    currentStatus: string;
    lastUpdated: string;
    by: string;
  };
  forms: {
    // Shared
    cancel: string;
    back: string;
    amount: string;
    remarksOptional: string;
    uploadProof: string;
    clickToUploadProof: string;
    changeImage: string;
    remove: string;
    imageProcessingFailed: string;
    receiptId: string;
    date: string;
    donor: string;
    collectedBy: string;
    downloadReceipt: string;
    shareReceipt: string;
    returnToDashboard: string;
    processing: string;
    descriptionPlaceholder: string;
    optional: string;
    vendorPlaceholder: string;
    uploadBill: string;
    readyToUpload: string;
    processingImage: string;
    tapToSelectFile: string;
    pdfJpgPngMax: string;

    // Donation
    newDonation: string;
    donorName: string;
    phoneOptional: string;
    purpose: string;
    paymentMode: string;
    recordDonation: string;
    recordingDonation: string;
    donationRecordedSuccess: string;
    recordAnotherDonation: string;
    shareDonationMessage: string;

    // Expense
    newExpense: string;
    category: string;
    description: string;
    vendorName: string;
    billImageOptional: string;
    recordExpense: string;
    recordingExpense: string;
    expenseRecordedSuccess: string;
    recordAnotherExpense: string;
    shareExpenseMessage: string;
    expenseId: string;
    vendor: string;
    recordedBy: string;
    downloadVoucher: string;
    shareVoucher: string;

    // Validation & Errors
    reqDonorName: string;
    reqValidPhone: string;
    reqValidAmount: string;
    donorNamePlaceholder: string;
    phonePlaceholder: string;
    remarksPlaceholder: string;
    imagesOrPdfMax3mb: string;
    cash: string;
    upi: string;
    purposes: {
      generalDonation: string;
      murti: string;
      decoration: string;
      prasad: string;
      culturalProgram: string;
      other: string;
    };
    reqAmountPositive: string;
    reqPurpose: string;
    reqRemarksOther: string;
    reqUpiProof: string;
    reqCategory: string;
    reqDescription: string;
    reqVendor: string;

    // UPI Modal
    scanToPay: string;
    payeeName: string;
    uploadScreenshot: string;
    verifying: string;
    done: string;
    continueButton: string;
    failedToFetchUpi: string;
    upiPayment: string;
    failedToGenerateQr: string;
    scanUsingAnyApp: string;
    doneCompletedPayment: string;
    afterClosingUpload: string;
  };
  records: {
    title: string;
    exportCsv: string;
    export: string;
    donations: string;
    expenses: string;
    searchDonations: string;
    searchExpenses: string;
    refreshData: string;
    receiptId: string;
    expenseId: string;
    donor: string;
    vendor: string;
    amount: string;
    date: string;
    status: string;
    loadingRecords: string;
    noRecordsFound: string;
    showing: string;
    of: string;
    recordsLabel: string;
    previous: string;
    next: string;
    page: string;
    hasAttachment: string;
    exportSuccessful: string;
    exportFailed: string;
    noRecordsToExport: string;

    // Modals
    donationDetails: string;
    expenseDetails: string;
    donorName: string;
    phone: string;
    paymentMode: string;
    purpose: string;
    collector: string;
    category: string;
    description: string;
    paidBy: string;
    cancellationReason: string;
    cancelledOn: string;
    cancelledBy: string;
    paymentProof: string;
    viewDocument: string;
    noDocument: string;
    cancelRecord: string;
    confirmCancel: string;
    cancelWarning: string;
    reasonPlaceholder: string;
    nevermind: string;
    confirmCancellation: string;
    cancelling: string;
    expensePdfNotImplemented: string;
    nativeShareNotSupported: string;
    reqCancelReason: string;
    recordCancelledSuccess: string;
    confirm: string;
    abort: string;

    // Document Preview
    documentPreview: string;
    openInDrive: string;
    download: string;
  };
  audit: {
    systemAuditLogs: string;
    searchLogs: string;
    allModules: string;
    refresh: string;
    exportCsv: string;
    noLogsFound: string;
    timestamp: string;
    user: string;
    module: string;
    action: string;
    recordId: string;
    previousValue: string;
    newValue: string;
    loadingLogs: string;
    showingLatest: string;
    tryAgain: string;
  };
  users: {
    userManagement: string;
    searchUsers: string;
    addUser: string;
    nameEmail: string;
    phone: string;
    role: string;
    status: string;
    actions: string;
    loadingUsers: string;
    noUsersFound: string;
    active: string;
    disabled: string;
    volunteer: string;
    admin: string;
    superAdmin: string;
    editUser: string;
    addNewUser: string;
    fullName: string;
    email: string;
    cancel: string;
    saveUser: string;
    saving: string;
    disableUserTitle: string;
    disableUserMessage: string;
    disable: string;
  };
};

export const en: Dictionary = {
  language: {
    english: 'English',
    hindi: 'हिंदी',
  },
  publicDashboard: {
    systemName: 'GANESH PUJA MANAGEMENT SYSTEM',
    login: 'Login',
    couldNotLoad: 'Could not load dashboard — please try again',
    networkError: 'Network error — please check your connection',
    tryAgain: 'Try again',
    ourCommittee: 'Our committee',
    financialTransparency: 'Financial transparency',
    buildingTrust: 'Building trust through clarity and accountability.',
    liveDarshan: 'LIVE DARSHAN',
    liveStream: 'LIVE STREAM',
    watchLive: 'Watch Live on YouTube',
    update: 'Update',
    financialOverview: 'Financial Overview',
    totalDonations: 'Total Donations',
    thankYouGenerosity: 'Thank you for your generosity!',
    totalExpenses: 'Total Expenses',
    everyExpenseRecorded: 'Every expense is recorded.',
    allFundsManaged: 'All funds are managed by the organizing committee.',
    donationsTracked:
      'Donations and expenses are tracked digitally for full transparency.',
    followUs: 'Follow us',
    builtBy: 'Built by TechGenDM',
    softwareDeveloper: 'Software Developer',
  },
  login: {
    ganeshPuja: 'Ganesh Puja',
    managementSystem: 'Management system (GPMS)',
    accessDenied: 'Access Denied',
    unauthorizedAccount:
      'This Google account is not authorized to access the GPMS management system.',
    contactAdmin:
      'Please contact a GPMS administrator to have your account added.',
    authenticationError: 'Authentication Error',
    problemSigningIn:
      'There was a problem signing you in. Please try again or use a different account.',
    committeeMemberLogin: 'Committee member login',
    signInWithGoogle: 'Sign in with Google',
    authorizedVolunteersOnly:
      "Authorized volunteers only. By signing in, you agree to the committee's data policies.",
  },
  dashboard: {
    auditLogs: 'Audit Logs',
    users: 'Users',
    records: 'Records',
    refresh: 'Refresh',
    logout: 'Logout',
    couldNotLoad: 'Could not load dashboard',
    retry: 'Retry',
    serverError: 'Error connecting to server. Please try again.',
    fetchFailed: 'Failed to load dashboard data',
    currentBalance: 'Current Balance',
    collections: 'Collections',
    cash: 'Cash',
    upi: 'UPI',
    expenses: 'Expenses',
    todayCol: "Today's Col",
    todayExp: "Today's Exp",
    liveDarshan: 'Live Darshan',
    configured: 'Configured',
    notConfigured: 'Not configured',
    isConfiguredDesc: 'YouTube Live is configured',
    tapToConfigureDesc: 'Tap to configure YouTube Live URL',
    liveDarshanModalDesc:
      'Paste your YouTube Live link to show on the public page.',
    youtubeLiveUrl: 'YouTube Live URL',
    youtubeUrlPlaceholder: 'e.g., https://youtube.com/live/...',
    cancel: 'Cancel',
    saveUrl: 'Save URL',
    saving: 'Saving...',
    announcement: 'Announcement',
    active: 'Active',
    none: 'None',
    tapToSetAnnouncement: 'Tap to set an announcement',
    announcementModalDesc:
      'Set a public announcement to show on the dashboard.',
    announcementTextLabel: 'Announcement Text (max 300 chars)',
    announcementTextPlaceholder: 'Type your announcement here...',
    dateSubtitleLabel: 'Date / Subtitle (Optional)',
    datePlaceholder: 'e.g., Nov 25, 2024',
    saveAnnouncement: 'Save Announcement',
    expensesByCategory: 'Expenses by Category',
    recentActivity: 'Recent Activity',
    noRecentActivity: 'No recent activity found.',
    untitled: 'Untitled',
    donation: 'Donation',
    expense: 'Expense',
    volunteer: 'Volunteer',
    signOut: 'Sign out',
    liveDarshanInvalidUrl:
      'Invalid YouTube URL. Use youtube.com/watch?v=, youtube.com/live/, or youtu.be/ format.',
    liveDarshanUpdateFailed: "Couldn't update Live Darshan. Please try again.",
    liveDarshanUpdateSuccess: 'Live Darshan updated successfully.',
    announcementTooLong: 'Announcement text must be under 300 characters.',
    announcementUpdateFailed: "Couldn't update Announcement. Please try again.",
    announcementUpdateSuccess: 'Announcement updated successfully.',
    currentStatus: 'Current Status:',
    lastUpdated: 'Last updated:',
    by: 'by',
  },
  forms: {
    // Shared
    cancel: 'Cancel',
    back: 'Back',
    amount: 'Amount',
    remarksOptional: 'Remarks (Optional)',
    uploadProof: 'Payment Proof (Optional)',
    clickToUploadProof: 'Click to upload screenshot',
    changeImage: 'Change image',
    remove: 'Remove',
    imageProcessingFailed: 'Failed to process image. Please try again.',
    receiptId: 'Receipt ID',
    date: 'Date',
    donor: 'Donor',
    collectedBy: 'Collected by',
    downloadReceipt: 'Download Receipt',
    shareReceipt: 'Share Receipt',
    returnToDashboard: 'Back to Dashboard',
    processing: 'Processing...',
    descriptionPlaceholder: 'e.g. Bamboo purchase for tent',
    optional: '(optional)',
    vendorPlaceholder: 'e.g. Sharma Traders',
    uploadBill: 'Upload Bill',
    readyToUpload: 'Ready to upload',
    processingImage: 'Processing image...',
    tapToSelectFile: 'Tap to select a file',
    pdfJpgPngMax: 'PDF, JPG, PNG (Max 5MB)',

    // Donation
    newDonation: 'New Donation',
    donorName: 'Donor Name',
    phoneOptional: 'Phone Number (Optional)',
    purpose: 'Purpose',
    paymentMode: 'Payment Mode',
    recordDonation: 'Record Donation',
    recordingDonation: 'Recording donation...',
    donationRecordedSuccess: 'Donation Recorded Successfully!',
    recordAnotherDonation: 'Record Another Donation',
    shareDonationMessage: 'Check out this donation receipt: ',

    // Expense
    newExpense: 'New Expense',
    category: 'Category',
    description: 'Description',
    vendorName: 'Vendor Name',
    billImageOptional: 'Bill / Receipt Image (Optional)',
    recordExpense: 'Record Expense',
    recordingExpense: 'Recording expense...',
    expenseRecordedSuccess: 'Expense Recorded Successfully!',
    recordAnotherExpense: 'Record Another Expense',
    shareExpenseMessage: 'Check out this expense voucher: ',
    expenseId: 'Expense ID',
    vendor: 'Vendor',
    recordedBy: 'Recorded by',
    downloadVoucher: 'Download Voucher',
    shareVoucher: 'Share Voucher',

    // Validation & Errors
    reqDonorName: 'Please enter donor name',
    reqValidPhone: 'Please enter a valid 10-digit mobile number',
    reqValidAmount: 'Please enter a valid amount',
    donorNamePlaceholder: "Enter donor's name",
    phonePlaceholder: 'e.g. 9876543210',
    remarksPlaceholder: 'Any additional notes',
    imagesOrPdfMax3mb: 'Images or PDF · Max 3 MB',
    cash: 'Cash',
    upi: 'UPI',
    purposes: {
      generalDonation: 'General Donation',
      murti: 'Murti',
      decoration: 'Decoration',
      prasad: 'Prasad',
      culturalProgram: 'Cultural Program',
      other: 'Other',
    },
    reqAmountPositive: 'Amount must be at least ₹1',
    reqPurpose: 'Please select a purpose',
    reqRemarksOther: "Please provide remarks for 'Other' purpose",
    reqUpiProof: 'UPI payment requires proof. Please upload a screenshot.',
    reqCategory: 'Please select a category',
    reqDescription: 'Please enter a description',
    reqVendor: 'Please enter vendor name',

    // UPI Modal
    scanToPay: 'Scan to Pay',
    payeeName: 'Payee Name',
    uploadScreenshot: 'Upload Screenshot',
    verifying: 'Verifying...',
    done: 'Done',
    continueButton: 'Continue',
    failedToFetchUpi: 'Failed to fetch UPI config',
    upiPayment: 'UPI Payment',
    failedToGenerateQr: 'Failed to generate QR',
    scanUsingAnyApp: 'Scan using any UPI app to pay',
    doneCompletedPayment: "Done — I've completed the payment",
    afterClosingUpload:
      'After closing, upload your payment screenshot to complete the donation record.',
  },

  records: {
    title: 'Records',
    exportCsv: 'Export CSV',
    export: 'Export',
    donations: 'Donations',
    expenses: 'Expenses',
    searchDonations: 'Search Receipt ID, Name, Phone...',
    searchExpenses: 'Search Expense ID, Vendor, Desc...',
    refreshData: 'Refresh data',
    receiptId: 'Receipt ID',
    expenseId: 'Expense ID',
    donor: 'Donor',
    vendor: 'Vendor',
    amount: 'Amount',
    date: 'Date',
    status: 'Status',
    loadingRecords: 'Loading records...',
    noRecordsFound: 'No records found matching your filters.',
    showing: 'Showing',
    of: 'of',
    recordsLabel: 'records',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    hasAttachment: 'Has attachment',
    exportSuccessful: 'Export successful',
    exportFailed: 'Export failed',
    noRecordsToExport: 'No records to export matching current filters',

    // Modals
    donationDetails: 'Donation Details',
    expenseDetails: 'Expense Details',
    donorName: 'Donor Name',
    phone: 'Phone',
    paymentMode: 'Payment Mode',
    purpose: 'Purpose',
    collector: 'Collector',
    category: 'Category',
    description: 'Description',
    paidBy: 'Paid By',
    cancellationReason: 'Cancellation Reason',
    cancelledOn: 'Cancelled On',
    cancelledBy: 'Cancelled By',
    paymentProof: 'Payment Proof',
    viewDocument: 'View Document',
    noDocument: 'No document attached',
    cancelRecord: 'Cancel Record',
    confirmCancel: 'Confirm Cancel',
    cancelWarning:
      'Are you sure you want to cancel this record? This action cannot be undone.',
    reasonPlaceholder: 'Enter reason for cancellation...',
    nevermind: 'Nevermind',
    confirmCancellation: 'Yes, Cancel Record',
    cancelling: 'Cancelling...',
    expensePdfNotImplemented: 'Expense PDF download is not implemented yet.',
    nativeShareNotSupported: 'Native sharing is not supported on this device',
    reqCancelReason: 'Please enter a cancellation reason.',
    recordCancelledSuccess: 'Record cancelled successfully.',
    confirm: 'Confirm',
    abort: 'Abort',

    // Document Preview
    documentPreview: 'Document Preview',
    openInDrive: 'Open in New Tab',
    download: 'Download',
  },
  audit: {
    systemAuditLogs: 'System Audit Logs',
    searchLogs: 'Search user, action...',
    allModules: 'All Modules',
    refresh: 'Refresh',
    exportCsv: 'Export CSV',
    noLogsFound: 'No audit logs found matching your filters.',
    timestamp: 'Timestamp',
    user: 'User',
    module: 'Module',
    action: 'Action',
    recordId: 'Record ID',
    previousValue: 'Previous Value',
    newValue: 'New Value',
    loadingLogs: 'Loading audit logs...',
    showingLatest: 'Showing latest {count} records',
    tryAgain: 'Try Again',
  },
  users: {
    userManagement: 'User Management',
    searchUsers: 'Search users...',
    addUser: 'Add User',
    nameEmail: 'Name / Email',
    phone: 'Phone',
    role: 'Role',
    status: 'Status',
    actions: 'Actions',
    loadingUsers: 'Loading users...',
    noUsersFound: 'No users found.',
    active: 'Active',
    disabled: 'Disabled',
    volunteer: 'Volunteer',
    admin: 'Admin',
    superAdmin: 'SuperAdmin',
    editUser: 'Edit User',
    addNewUser: 'Add New User',
    fullName: 'Full Name',
    email: 'Email',
    cancel: 'Cancel',
    saveUser: 'Save User',
    saving: 'Saving...',
    disableUserTitle: 'Disable User',
    disableUserMessage:
      'Are you sure you want to disable access for {name}? They will no longer be able to log in.',
    disable: 'Disable',
  },
};
