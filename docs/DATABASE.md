# GPMS Database Schema & Security

The Google Sheets database acts as the single source of truth for GPMS. This document outlines the schema, column indexes, and critical protections required to maintain data integrity.

## Strict Column Requirements

**Do not rearrange, rename, or delete columns.** The backend relies on exact column indexes (0-based) for read and write operations.

### Donations Sheet
**Required Protected Ranges:** Row 1 (Headers), Columns A & B.

| Column | Index | Header Name | Description |
|---|---|---|---|
| A | 0 | Donation ID | Primary Key (e.g. DON-2025-001) |
| B | 1 | Receipt ID | Public receipt identifier (e.g. RCT-2025-001) |
| C | 2 | Donor Name | Name of the donor |
| D | 3 | Phone | Optional contact number |
| E | 4 | Amount | Financial value in INR |
| F | 5 | Payment Mode | Cash or UPI |
| G | 6 | UPI Ref | Optional transaction reference |
| H | 7 | Collector ID | Google ID of the logged-in User |
| I | 8 | Collector Name | Full name of the logged-in User |
| J | 9 | Purpose | Donation purpose |
| K | 10 | Remarks | Optional notes |
| L | 11 | Status | `Active` or `Cancelled` |
| M | 12 | Created At | ISO Timestamp |
| N | 13 | Updated At | ISO Timestamp |
| O | 14 | Transaction ID | **(NEW)** Idempotency UUID to prevent duplicates |

### Expenses Sheet
**Required Protected Ranges:** Row 1 (Headers), Column A.

| Column | Index | Header Name | Description |
|---|---|---|---|
| A | 0 | Expense ID | Primary Key (e.g. EXP-2025-001) |
| B | 1 | Category | Expense category |
| C | 2 | Description | Justification / Description |
| D | 3 | Vendor | Recipient of funds |
| E | 4 | Amount | Financial value in INR |
| F | 5 | Paid By ID | Google ID of the logged-in User |
| G | 6 | Paid By Name | Full name of the logged-in User |
| H | 7 | Bill Link | Google Drive URL to the uploaded bill |
| I | 8 | Status | `Active` or `Cancelled` |
| J | 9 | Created At | ISO Timestamp |
| K | 10 | Updated At | ISO Timestamp |
| L | 11 | Transaction ID | **(NEW)** Idempotency UUID to prevent duplicates |

## Data Validation rules
- Amounts are strictly validated on the backend. They must be `> 0` and `<= 9,999,999`.

## Security Protections
For data safety, you must manually apply Google Sheets "Protect Range" to:
1. All Header rows (Row 1) across all sheets.
2. The ID columns (Col A/B for Donations, Col A for Expenses) to prevent accidental data deletion by committee members.
