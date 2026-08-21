import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateRequestId, createMutationTimeout } from '@/lib/resilience';

export async function POST(request: NextRequest) {
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
      console.error(
        `[GPMS] requestId=${requestId} action=createDonation NEXT_PUBLIC_API_URL is not set`
      );
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Read donation fields from the request body
    const body = await request.json();
    const {
      donorName,
      phone,
      amount,
      paymentMode,
      purpose,
      remarks,
      transactionId,
      paymentProofFile,
    } = body;

    // Mutation: single attempt, 25 s timeout. NEVER retried (duplicate record risk).
    const { controller, timeoutId } = createMutationTimeout();
    const start = Date.now();

    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createDonation',
          payload: {
            userEmail: session.user.email, // Injected server-side — never from frontend
            donorName,
            phone: phone || '',
            amount,
            paymentMode,
            purpose: purpose || '',
            remarks: remarks || '',
            transactionId, // Included for backend idempotency
            paymentProofFile: paymentProofFile || null, // Base64 proof for UPI donations
            requestId,
          },
        }),
        redirect: 'follow',
        signal: controller.signal,
      });

      const durationMs = Date.now() - start;

      const rawText = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error(
          `[GPMS] requestId=${requestId} action=createDonation failed to parse JSON. duration=${durationMs}ms`
        );
        return NextResponse.json(
          { success: false, message: 'Invalid response from backend' },
          { status: 502 }
        );
      }

      console.log(
        `[GPMS] requestId=${requestId} action=createDonation status=${response.status} duration=${durationMs}ms ${response.ok ? 'OK' : 'FAILED'}`
      );

      return NextResponse.json(data);
    } catch (e: unknown) {
      const durationMs = Date.now() - start;
      const errName = e instanceof Error ? e.name : 'UnknownError';
      console.error(
        `[GPMS] requestId=${requestId} action=createDonation error=${errName} duration=${durationMs}ms FAILED`
      );
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error(
      `[GPMS] requestId=${requestId} action=createDonation unexpected error:`,
      error
    );
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
