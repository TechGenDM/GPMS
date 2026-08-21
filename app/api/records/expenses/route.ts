import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateRequestId, fetchWithRetry } from '@/lib/resilience';

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
          message: 'Forbidden. Only admins can search expenses.',
        },
        { status: 403 }
      );
    }

    const payload = await req.json();

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
            action: 'searchExpenses',
            payload: {
              ...payload,
              userEmail: session.user.email,
              requestId,
            },
          }),
          redirect: 'follow',
        },
        requestId,
        'searchExpenses'
      );
    } catch (networkErr: unknown) {
      const msg =
        networkErr instanceof Error ? networkErr.message : 'Network failure';
      console.error(
        `[GPMS] requestId=${requestId} action=searchExpenses network failure: ${msg}`
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
        `[GPMS] requestId=${requestId} action=searchExpenses failed to parse JSON response`
      );
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error(
      `[GPMS] requestId=${requestId} action=searchExpenses unexpected error:`,
      error
    );
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}

