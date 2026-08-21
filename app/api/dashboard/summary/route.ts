import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  generateRequestId,
  fetchWithRetry,
  classifyError,
} from '@/lib/resilience';

export async function POST(_request: NextRequest) {
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
        `[GPMS] requestId=${requestId} action=getDashboardSummary NEXT_PUBLIC_API_URL is not set`
      );
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
            action: 'getDashboardSummary',
            payload: {
              userEmail: session.user.email,
              requestId,
            },
          }),
          redirect: 'follow',
        },
        requestId,
        'getDashboardSummary'
      );
    } catch (networkErr: unknown) {
      const msg =
        networkErr instanceof Error ? networkErr.message : 'Network failure';
      console.error(
        `[GPMS] requestId=${requestId} action=getDashboardSummary network failure after all retries: ${msg}`
      );
      return NextResponse.json(
        { success: false, message: 'Backend unavailable — please try again' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Backend unavailable — please try again' },
        { status: response.status }
      );
    }

    const rawText = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(
        `[GPMS] requestId=${requestId} action=getDashboardSummary failed to parse JSON response`
      );
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    if (typeof data !== 'object' || data === null || !('success' in data)) {
      console.error(
        `[GPMS] requestId=${requestId} action=getDashboardSummary malformed response shape`
      );
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    const apiData = data as {
      success: boolean;
      code?: string;
      message?: string;
    };
    if (!apiData.success) {
      const category = classifyError(apiData.code);
      console.error(
        `[GPMS] requestId=${requestId} action=getDashboardSummary backend error category=${category} code=${apiData.code ?? 'none'}`
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `[GPMS] requestId=${requestId} action=getDashboardSummary unexpected error:`,
      error
    );
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

