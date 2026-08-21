import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateRequestId, createMutationTimeout } from '@/lib/resilience';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'Admin' && session.user.role !== 'SuperAdmin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden. Only admins can cancel records.',
        },
        { status: 403 }
      );
    }

    const payload = await req.json();
    const action =
      payload.type === 'expense' ? 'cancelExpense' : 'cancelDonation';

    const appsScriptUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!appsScriptUrl) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Mutation: single attempt, 25 s timeout. NEVER retried (state-changing).
    const { controller, timeoutId } = createMutationTimeout();
    const start = Date.now();

    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          payload: {
            ...payload,
            userEmail: session.user.email,
            requestId,
          },
        }),
        redirect: 'follow',
        signal: controller.signal,
      });

      const durationMs = Date.now() - start;
      console.log(
        `[GPMS] requestId=${requestId} action=${action} status=${response.status} duration=${durationMs}ms ${response.ok ? 'OK' : 'FAILED'}`
      );

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (e: unknown) {
      const durationMs = Date.now() - start;
      const errName = e instanceof Error ? e.name : 'UnknownError';
      console.error(
        `[GPMS] requestId=${requestId} action=${action} error=${errName} duration=${durationMs}ms FAILED`
      );
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error(
      `[GPMS] requestId=${requestId} action=cancel unexpected error:`,
      error
    );
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
