/**
 * GPMS V2.6 — Resilience Utility
 * ================================
 * Conservative retry + timeout + correlation ID for read-only, idempotent
 * operations. Mutations must never use fetchWithRetry.
 *
 * Retry policy (Vercel-safe):
 *   Attempt 1 — 5 s timeout
 *   Attempt 2 — 500 ms backoff — 5 s timeout
 *   Attempt 3 — 1500 ms backoff — 5 s timeout
 *   Total worst case: 5 + 0.5 + 5 + 1.5 + 5 = ~17 s
 *
 * Only retries on:
 *   - Network failures (TypeError, AbortError = timeout)
 *   - HTTP 502, 503, 504
 *
 * Never retries on:
 *   - 400, 401, 403, 404, 422, 429, 500
 *   - Apps Script business-rule errors (success: false with known code)
 */

// ─── Constants ──────────────────────────────────────────────────────────────

/** Per-attempt timeout for read operations (ms). */
const READ_TIMEOUT_MS = 5_000;

/** Backoff delays between retry attempts (ms). */
const BACKOFF_MS = [500, 1_500] as const;

/** Maximum total attempts (1 initial + 2 retries). */
const MAX_ATTEMPTS = 3;

// ─── Types ───────────────────────────────────────────────────────────────────

export type ErrorCategory =
  | 'TRANSIENT_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'BUSINESS_ERROR'
  | 'INTERNAL_ERROR';

export interface FetchWithRetryOptions {
  /** Max attempts (default: MAX_ATTEMPTS = 3). Override for testing. */
  maxAttempts?: number;
  /** Timeout per attempt in ms (default: READ_TIMEOUT_MS = 5000). */
  timeoutMs?: number;
}

// ─── Request ID ──────────────────────────────────────────────────────────────

/**
 * Generates a lightweight correlation ID for log tracing.
 * Format: gpms-<unix-ms>-<6-char random>
 * Example: gpms-1724174400000-a3f7b2
 *
 * Visible in Next.js server logs AND Apps Script execution logs
 * (when echoed back via the payload).
 */
export function generateRequestId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `gpms-${ts}-${rand}`;
}

// ─── Transient Error Detection ───────────────────────────────────────────────

/**
 * Returns true only for HTTP status codes that are plausibly transient
 * and safe to retry on an idempotent read operation.
 *
 * NOT retried: 400, 401, 403, 404, 422, 429, 500 — these indicate
 * deterministic failures where a retry would produce the same result.
 */
export function isTransientStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

// ─── Error Classification ────────────────────────────────────────────────────

/**
 * Maps a machine-readable Apps Script error code to a category.
 * Used to surface safe, actionable errors to users without exposing
 * internal stack traces.
 */
export function classifyError(code: string | undefined): ErrorCategory {
  if (!code) return 'INTERNAL_ERROR';

  switch (code) {
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
    case 'USER_DISABLED':
    case 'ROLE_NOT_ALLOWED':
    case 'INVALID_ROLE':
      return 'AUTH_ERROR';

    case 'VALIDATION_ERROR':
    case 'INVALID_AMOUNT':
    case 'INVALID_CATEGORY':
    case 'MISSING_FIELD':
      return 'VALIDATION_ERROR';

    case 'USER_NOT_FOUND':
    case 'DONATION_NOT_FOUND':
    case 'EXPENSE_NOT_FOUND':
    case 'SETTING_NOT_FOUND':
    case 'SHEET_NOT_FOUND':
      return 'NOT_FOUND';

    case 'EMAIL_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS':
    case 'LOCK_TIMEOUT':
    case 'RECEIPT_GENERATION_FAILED':
    case 'FILE_TOO_LARGE':
    case 'INVALID_FILE_TYPE':
    case 'UPLOAD_FAILED':
      return 'BUSINESS_ERROR';

    case 'INTERNAL_ERROR':
    case 'UNKNOWN_ACTION':
    case 'MISSING_ACTION':
    default:
      return 'INTERNAL_ERROR';
  }
}

// ─── Duration/Status Logger ───────────────────────────────────────────────────

/**
 * Logs a mandatory summary line for every Apps Script call.
 * This is the primary observability tool for diagnosing future failures.
 *
 * Success:
 *   [GPMS] requestId=gpms-... action=getPublicDashboard attempt=1 status=200 duration=432ms OK
 * Transient retry:
 *   [GPMS] requestId=gpms-... action=getDashboardSummary attempt=2 status=503 duration=5001ms RETRYING
 * Final failure:
 *   [GPMS] requestId=gpms-... action=getAllUsers attempt=3 status=503 duration=5001ms FAILED
 * Network error:
 *   [GPMS] requestId=gpms-... action=searchDonations attempt=1 error=AbortError duration=5001ms RETRYING
 */
export function logRequest({
  requestId,
  action,
  attempt,
  status,
  error,
  durationMs,
  outcome,
}: {
  requestId: string;
  action: string;
  attempt: number;
  status?: number;
  error?: string;
  durationMs: number;
  outcome: 'OK' | 'RETRYING' | 'FAILED';
}): void {
  const statusPart = status !== undefined ? ` status=${status}` : '';
  const errorPart = error ? ` error=${error}` : '';
  console.log(
    `[GPMS] requestId=${requestId} action=${action} attempt=${attempt}${statusPart}${errorPart} duration=${durationMs}ms ${outcome}`
  );
}

// ─── fetchWithRetry ───────────────────────────────────────────────────────────

/**
 * Fetches a URL with per-attempt timeout and bounded retries.
 *
 * USE ONLY for idempotent READ operations (dashboard, records,
 * settings reads, users list, categories, audit logs).
 *
 * DO NOT use for mutations (createDonation, createExpense, cancel*,
 * update*, disable*, logExport). Mutations use plain fetch with
 * a single AbortController timeout via createMutationTimeout().
 *
 * @param url        - The Apps Script URL to call.
 * @param init       - Standard RequestInit (method, headers, body, redirect).
 * @param requestId  - Correlation ID for log tracing.
 * @param action     - Action name string for log readability.
 * @param options    - Optional overrides for maxAttempts / timeoutMs.
 * @returns          - The last Response object on success or non-transient failure.
 * @throws           - The last Error on network/timeout failure after all retries.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  requestId: string,
  action: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const timeoutMs = options.timeoutMs ?? READ_TIMEOUT_MS;
  const backoff = BACKOFF_MS;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      const durationMs = Date.now() - start;

      if (!isTransientStatus(response.status)) {
        // Non-transient: 200 (OK), 400, 401, 403, 404, 500 — return immediately
        logRequest({
          requestId,
          action,
          attempt,
          status: response.status,
          durationMs,
          outcome: response.ok ? 'OK' : 'FAILED',
        });
        return response;
      }

      // Transient status (502, 503, 504) — may retry
      const isLastAttempt = attempt === maxAttempts;
      logRequest({
        requestId,
        action,
        attempt,
        status: response.status,
        durationMs,
        outcome: isLastAttempt ? 'FAILED' : 'RETRYING',
      });

      if (isLastAttempt) {
        return response; // Propagate the bad response for upstream error handling
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (e: unknown) {
      const durationMs = Date.now() - start;
      const isLastAttempt = attempt === maxAttempts;
      const errName = e instanceof Error ? e.name : 'UnknownError';

      logRequest({
        requestId,
        action,
        attempt,
        error: errName,
        durationMs,
        outcome: isLastAttempt ? 'FAILED' : 'RETRYING',
      });

      lastError = e instanceof Error ? e : new Error(String(e));

      if (isLastAttempt) {
        throw lastError;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // Wait before next attempt
    const delayMs = backoff[attempt - 1] ?? backoff[backoff.length - 1];
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  }

  // Should be unreachable, but TypeScript requires it
  throw lastError ?? new Error('fetchWithRetry: exhausted all attempts');
}

// ─── Mutation timeout helper ──────────────────────────────────────────────────

/**
 * Creates an AbortController that fires after `ms` milliseconds.
 * Use for mutation routes that must never be retried.
 * Call clearTimeout(timeoutId) in a finally block.
 *
 * Default: 25 s (mutations can be slow due to Sheets locking + Drive uploads).
 */
export function createMutationTimeout(ms = 25_000): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return { controller, timeoutId };
}
