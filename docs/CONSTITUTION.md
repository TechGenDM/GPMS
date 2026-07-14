# GPMS Constitution

> The Constitution of the Ganesh Puja Management System (GPMS)

Version: 1.0

---

# Purpose

GPMS exists to provide a reliable, transparent, secure and simple digital management system for Ganesh Puja committees.

Every engineering decision must support this purpose.

---

# Core Principles

Priority order:

1. Reliability
2. Simplicity
3. Transparency
4. Security
5. Auditability

If two principles conflict, the higher priority wins.

---

# Article 1 — Financial Integrity

Money is the most important asset managed by GPMS.

Therefore:

- Financial records must never be silently lost.
- Every financial action must be recoverable.
- Financial calculations must always be deterministic.
- Balance must have exactly one source of truth.

---

# Article 2 — No Permanent Deletes

Financial records are never permanently deleted.

Instead:

- Active
- Cancelled

are valid lifecycle states.

---

# Article 3 — Auditability

Every important action must leave an audit trail.

Examples:

- Create Donation
- Update Donation
- Cancel Donation
- Create Expense
- Update Expense
- Cancel Expense
- User Creation
- User Update
- User Disable

Audit failures must never destroy financial data.

---

# Article 4 — Single Responsibility

Every module has one responsibility.

Examples:

ReceiptService
→ Generates IDs.

DashboardService
→ Calculates statistics.

DonationService
→ Donation logic only.

ExpenseService
→ Expense logic only.

---

# Article 5 — Backend Authority

The backend is always the source of truth.

The frontend is never trusted.

Validation happens on the backend.

---

# Article 6 — Authentication

Authentication verifies identity.

Authorization verifies permissions.

Every protected action requires both.

---

# Article 7 — Public Safety

Public endpoints must never expose:

- Phone Numbers
- Emails
- User IDs
- Internal IDs
- Remarks
- Private committee data

Only public financial summaries may be exposed.

---

# Article 8 — ID Generation

Every generated ID must be unique.

Receipt IDs are generated using locking.

Duplicate IDs are unacceptable.

---

# Article 9 — Testing

No milestone is complete without tests.

Required tests include:

- Functional
- Security
- Financial
- Data Integrity
- Recovery
- Acceptance
- Stress

---

# Article 10 — Mobile First

The application is designed primarily for volunteers using smartphones.

Desktop is secondary.

---

# Article 11 — Engineering Rules

Always:

- Prefer readability.
- Prefer maintainability.
- Prefer explicit code over clever code.
- Prefer composition over duplication.
- Keep services independent.

---

# Article 12 — API Contracts

API contracts are stable.

Changing them requires updating:

- Backend
- Frontend
- Documentation
- Tests

---

# Article 13 — Documentation

Every major architectural decision must be documented.

Future contributors should never guess.

---

# Article 14 — Definition of Done

A feature is complete only if:

- Code works.
- Validation exists.
- Authorization exists.
- Audit exists.
- Tests pass.
- Documentation updated.
- No console errors.

---

# Article 15 — Production Rules

Production data is never used for stress testing.

Acceptance tests run only against a dedicated test database.

---

# Article 16 — Versioning

Stable backend releases are tagged.

Major architectural changes require a new version.

---

# Article 17 — Evolution Before Optimization

GPMS should first be correct, then reliable, then maintainable, and only then optimized.

That means:

Build the feature correctly.
Make it reliable.
Write tests.
Document it.
Optimize performance only if measurements show it's necessary.

This single rule prevents premature optimization and keeps the project focused on what matters most.

---

# Final Principle

Whenever uncertainty exists, ask:

"Which decision makes GPMS more reliable for the committee during the actual Ganesh Puja?"

That decision wins.