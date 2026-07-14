/**
 * GPMS Backend Configuration
 * ==========================
 * Single source of truth for all constants.
 * No magic strings anywhere else.
 */

const CONFIG = {
  // Replace with your actual Spreadsheet ID after creating the Google Sheet
  spreadsheetId: '',

  sheets: {
    users: 'Users',
    donations: 'Donations',
    expenses: 'Expenses',
    settings: 'Settings',
    categories: 'Categories',
    auditLogs: 'AuditLogs',
    metadata: 'Metadata',
  },

  // ID prefixes for generated IDs
  prefixes: {
    donation: 'DON',
    expense: 'EXP',
    receipt: 'RCT',
    user: 'USR',
  },

  // Timezone for all date operations
  timezone: 'Asia/Kolkata',

  // Date format used across the app
  dateFormat: 'dd/MM/yyyy HH:mm:ss',

  // Statuses
  status: {
    active: 'Active',
    cancelled: 'Cancelled',
    pending: 'Pending',
  },

  // Roles
  roles: {
    admin: 'Admin',
    volunteer: 'Volunteer',
    viewer: 'Viewer',
  },
};
