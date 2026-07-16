# GPMS Coding & UI Standards

## UI Principles (The Volunteer Experience)

Every frontend page must adhere to these absolute rules:

1. **Rule 1 — The 10 Second Rule:** A volunteer should understand how to use a screen in under 10 seconds. No complex menus, no hidden gestures.
2. **Rule 2 — Max 3 Taps:** It must never take more than 3 taps to record a standard donation. Optimize the main flow.
3. **Rule 3 — No Endless Scrolling:** Use discrete `Card` components. Content must fit neatly on a mobile screen. Long lists must be paginated or lazy-loaded within constraints.
4. **Rule 4 — Destructive Confirmation:** Every destructive action (Cancel Donation, Disable User) MUST trigger a `ConfirmModal`.
5. **Rule 5 — Financial Typography:** Financial numbers must be Large, Bold, and easy to read. Always include the currency symbol (₹) and use the `<CurrencyDisplay />` component.
6. **Rule 6 — Explicit Feedback:** Never leave the user guessing. Always show `Saving...`, `Success`, or `Failed` via the global `<Feedback />` component.

## Coding Conventions

### Backend (Apps Script)

- **Names:** CamelCase for functions (`createDonation`), PascalCase for Services (`DonationService`).
- **Purity:** Services must not manipulate raw HTTP `doPost` objects. They accept `(user, payload)`.
- **Validation:** Always validate payloads in `Validation.gs` before doing any business logic.
- **Errors:** Always use the `error()` wrapper from `Response.gs` and refer to `ERROR_CODES`. Never return bare strings.
- **Audit:** Call `AuditService.log()` for every data mutation.

### Frontend (Next.js & React)

- **Framework:** Next.js (App Router), React, Tailwind CSS, TypeScript.
- **Components:** Functional components with React Hooks.
- **Styling:** Tailwind CSS strictly. Do not use inline styles.
- **State:** Keep state as close to where it's needed as possible. Use Context only for global concerns (Auth, Feedback).
- **API Calls:** Use the centralized `lib/api.ts` fetch wrapper for all external requests to ensure uniform error handling and loading states.
- **File Structure:**
  - `components/ui/` — Dumb, reusable presentation components (Cards, Buttons, Inputs).
  - `components/features/` — Smart components handling domain logic (DonationForm).
  - `app/` — Pages and routing.
  - `lib/` — Utilities, API wrappers, types.
