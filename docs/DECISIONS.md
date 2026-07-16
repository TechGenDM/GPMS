# Architectural Decisions

This document records major architectural decisions made during the development of GPMS. This ensures future maintainers understand _why_ a decision was made, not just _what_ it is.

---

### 2026-06-25 — Database Selection

**Decision:** Use Google Sheets as the database for v1.0.  
**Reason:** Unmatched speed of delivery, zero hosting costs, and ultimate familiarity for the Puja Committee (who already know how to view/export a spreadsheet if absolutely necessary).  
**Alternatives Considered:** Firebase, Supabase, Postgres.  
**Status:** Accepted.

---

### 2026-07-02 — Architecture Split

**Decision:** Separate the frontend (Next.js) from the backend (Apps Script). Next.js will proxy requests to Apps Script via its own API routes.  
**Reason:** Apps Script web apps are notoriously slow to render UI and have restrictive CORS/iframe policies. Using Next.js gives us a modern, fast, mobile-first UI, while keeping Apps Script purely as an API layer hides the Google execution URL from the public.  
**Status:** Accepted.

---

### 2026-07-10 — ID Generation

**Decision:** Use Google Apps Script `LockService` for generating Receipt, Donation, and Expense IDs.  
**Reason:** To prevent race conditions when multiple volunteers submit a donation at the exact same millisecond. Duplicate receipt numbers are unacceptable in financial tracking.  
**Status:** Accepted.

---

### 2026-07-12 — Global Authentication Interceptor

**Decision:** Use a single `dispatch()` function in `Routes.gs` that automatically authenticates the user based on payload email before routing to the service.  
**Reason:** Prevents developers from forgetting to add auth checks in new services. Ensures every service receives a guaranteed `user` object.  
**Status:** Accepted.

---

### 2026-07-14 — Soft Deletes Only

**Decision:** Financial records (Donations, Expenses) are never permanently deleted from the database. Instead, their `Status` is set to `Cancelled`.  
**Reason:** To satisfy the constitutional requirement for total auditability. Money traces must never vanish.  
**Status:** Accepted.

---

### 2026-07-14 — Version Scope Freeze

**Decision:** Strictly define the scope of v1.0. New feature requests (QR codes, offline mode, SMS) are automatically deferred to v1.1.  
**Reason:** "Does this help us successfully run this year's Ganesh Puja?" is the ultimate metric. We must launch on time. Scope creep is the enemy of launch.  
**Status:** Accepted.
