# GPMS Architecture

## Overview

The Ganesh Puja Management System (GPMS) is designed as a serverless, decoupled application using Next.js on the frontend and Google Apps Script + Google Sheets on the backend.

### Architecture Flow

```
[ Mobile Browser (Next.js) ]
       ↓ (HTTP POST)
[ Next.js API Routes ]
       ↓ (HTTP POST)
[ Google Apps Script ]
       ↓ (SpreadsheetApp API)
[ Google Sheets Database ]
```

## Frontend (Next.js)

- **Role:** Handles user interaction, forms, UI rendering, and client-side validation.
- **Rules:**
  - Never trusts the user input completely (backend validates everything).
  - Must display feedback (Loading, Success, Error) within 1 second.
  - Communicates exclusively with Next.js API routes (which proxy to Apps Script) to keep Apps Script URLs hidden.

## Backend (Google Apps Script)

- **Role:** The ultimate source of truth. Handles data persistence, authentication, authorization, ID generation, and validation.
- **Entry Point:** `Code.gs` contains only `doGet()` and `doPost()`.
- **Router:** `Routes.gs` maps the requested `action` to a specific service. It includes a **Global Authentication Interceptor** that requires a valid user for every route (except explicitly public ones).

### Service Responsibilities

Every module adheres to the **Single Responsibility Principle**.

| Service                 | Responsibility                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| **Config.gs**           | Centralized configuration, sheet names, status strings, error codes. |
| **Response.gs**         | Standardized JSON response formats (`success` vs `error`).           |
| **Helpers.gs**          | Pure utility functions (date formatting, row searching).             |
| **Validation.gs**       | Centralized schema and business rule validation.                     |
| **ReceiptService.gs**   | Atomic ID generation using `LockService`. Never duplicates IDs.      |
| **AuditService.gs**     | Logs every mutation (create/update/delete) with old/new values.      |
| **UserService.gs**      | Core auth, user lookups, and role-based authorization.               |
| **DonationService.gs**  | Manages the donation lifecycle.                                      |
| **ExpenseService.gs**   | Manages the expense lifecycle.                                       |
| **DashboardService.gs** | Read-only aggregations and statistical analysis.                     |
| **SettingsService.gs**  | Dynamic app configuration (Committee Name, Year, Flags).             |

## Database (Google Sheets)

- **Role:** Data storage and historical record.
- **Tables (Sheets):** Users, Donations, Expenses, Settings, Categories, AuditLogs, Metadata.
- **Rule:** Data is never permanently deleted. Records are marked as `Cancelled`.
