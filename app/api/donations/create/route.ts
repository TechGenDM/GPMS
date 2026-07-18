import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
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
      console.error('[GPMS API] NEXT_PUBLIC_API_URL is not set.');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Read donation fields from the request body
    const body = await request.json();
    const { donorName, phone, amount, paymentMode, upiRef, purpose, remarks, transactionId } =
      body;

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createDonation',
        payload: {
          userEmail: session.user.email, // Injected server-side — never from frontend
          donorName,
          phone: phone || '',
          amount,
          paymentMode,
          upiRef: upiRef || '',
          purpose: purpose || '',
          remarks: remarks || '',
          transactionId, // Included for backend idempotency
        },
      }),
      redirect: 'follow',
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(
        '[GPMS API] Failed to parse Apps Script response for createDonation.'
      );
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GPMS API] Unexpected error in createDonation:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
