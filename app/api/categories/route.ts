import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateRequestId, fetchWithRetry } from '@/lib/resilience';

export async function GET(_request: NextRequest) {
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
            action: 'getCategories',
            payload: {
              userEmail: session.user.email,
              requestId,
            },
          }),
          redirect: 'follow',
          cache: 'no-store',
        },
        requestId,
        'getCategories'
      );
    } catch (networkErr: unknown) {
      const msg =
        networkErr instanceof Error ? networkErr.message : 'Network failure';
      console.error(
        `[GPMS] requestId=${requestId} action=getCategories network failure: ${msg}`
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
        `[GPMS] requestId=${requestId} action=getCategories failed to parse JSON`
      );
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `[GPMS] requestId=${requestId} action=getCategories unexpected error:`,
      error
    );
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
