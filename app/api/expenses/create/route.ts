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
        `[GPMS] requestId=${requestId} action=createExpense NEXT_PUBLIC_API_URL is not set`
      );
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Mutation: single attempt, 25 s timeout. NEVER retried (duplicate record risk).
    const { controller, timeoutId } = createMutationTimeout();
    const start = Date.now();

    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createExpense',
          payload: {
            userEmail: session.user.email,
            category: body.category,
            description: body.description,
            amount: body.amount,
            vendor: body.vendor || '',
            billLink: body.billLink || '',
            billFile: body.billFile || null,
            transactionId: body.transactionId,
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
          `[GPMS] requestId=${requestId} action=createExpense failed to parse JSON. duration=${durationMs}ms`
        );
        return NextResponse.json(
          { success: false, message: 'Invalid response from backend' },
          { status: 502 }
        );
      }

      console.log(
        `[GPMS] requestId=${requestId} action=createExpense status=${response.status} duration=${durationMs}ms ${response.ok ? 'OK' : 'FAILED'}`
      );

      // Pass through the Apps Script response directly (same pattern as donations)
      return NextResponse.json(data);
    } catch (e: unknown) {
      const durationMs = Date.now() - start;
      const errName = e instanceof Error ? e.name : 'UnknownError';
      console.error(
        `[GPMS] requestId=${requestId} action=createExpense error=${errName} duration=${durationMs}ms FAILED`
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
      `[GPMS] requestId=${requestId} action=createExpense unexpected error:`,
      error
    );
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
