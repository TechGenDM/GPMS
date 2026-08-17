import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * GET /api/settings/upi-payment
 * Reads the UPI configuration via the scoped getUpiPaymentConfig action.
 */
export async function GET() {
  try {
    // Authenticate using NextAuth session
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

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getUpiPaymentConfig',
        payload: { userEmail: session.user.email },
      }),
      cache: 'no-store',
      redirect: 'follow',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('[GPMS API] Error fetching UPI Payment config:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/upi-payment
 * Updates UPI configuration keys.
 */
export async function POST(req: NextRequest) {
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

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateSetting',
        payload: {
          userEmail: session.user.email,
          key: key,
          value: value,
        },
      }),
      redirect: 'follow',
    });

    const data = await response.json();
    return NextResponse.json(data, {
      status: response.ok ? 200 : response.status,
    });
  } catch (error: unknown) {
    console.error('[GPMS API] Error updating UPI Payment config:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
