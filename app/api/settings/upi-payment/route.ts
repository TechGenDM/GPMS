import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  generateRequestId,
  fetchWithRetry,
  createMutationTimeout,
} from '@/lib/resilience';

/**
 * GET /api/settings/upi-payment
 * Read-only — uses fetchWithRetry (5 s × 3 attempts).
 */
export async function GET() {
  const requestId = generateRequestId();

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const appsScriptUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!appsScriptUrl) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    let response: Response;
    try {
      response = await fetchWithRetry(
        appsScriptUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getUpiPaymentConfig',
            payload: { userEmail: session.user.email, requestId },
          }),
          cache: 'no-store',
          redirect: 'follow',
        },
        requestId,
        'getUpiPaymentConfig'
      );
    } catch (networkErr: unknown) {
      const msg =
        networkErr instanceof Error ? networkErr.message : 'Network failure';
      console.error(
        `[GPMS] requestId=${requestId} action=getUpiPaymentConfig network failure: ${msg}`
      );
      return NextResponse.json(
        { success: false, message: 'Backend unavailable — please try again' },
        { status: 503 }
      );
    }

    const rawText = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(
        `[GPMS] requestId=${requestId} action=getUpiPaymentConfig failed to parse JSON`
      );
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error(
      `[GPMS] requestId=${requestId} action=getUpiPaymentConfig unexpected error:`,
      error
    );
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/upi-payment
 * Mutation — no retry. Single attempt with 25 s timeout.
 */
export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined || value === null) {
      return NextResponse.json(
        { success: false, message: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Only allow updating UPI-specific keys through this endpoint
    const validKeys = [
      'UPI_PAYMENT_ID',
      'UPI_PAYEE_NAME',
      'UPI_PAYMENT_ENABLED',
    ];
    if (!validKeys.includes(key)) {
      return NextResponse.json(
        { success: false, message: 'Invalid key for this endpoint' },
        { status: 400 }
      );
    }

    const appsScriptUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!appsScriptUrl) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { controller, timeoutId } = createMutationTimeout();
    const start = Date.now();
    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSetting',
          payload: {
            userEmail: session.user.email,
            key: key,
            value: value,
            requestId,
          },
        }),
        redirect: 'follow',
        signal: controller.signal,
      });

      const durationMs = Date.now() - start;
      console.log(
        `[GPMS] requestId=${requestId} action=updateSetting(upi/${key}) status=${response.status} duration=${durationMs}ms ${response.ok ? 'OK' : 'FAILED'}`
      );

      const data = await response.json();
      return NextResponse.json(data, {
        status: response.ok ? 200 : response.status,
      });
    } catch (e: unknown) {
      const durationMs = Date.now() - start;
      const errName = e instanceof Error ? e.name : 'UnknownError';
      console.error(
        `[GPMS] requestId=${requestId} action=updateSetting(upi/${key}) error=${errName} duration=${durationMs}ms FAILED`
      );
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    console.error(
      `[GPMS] requestId=${requestId} action=updateSetting(upi) unexpected error:`,
      error
    );
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
