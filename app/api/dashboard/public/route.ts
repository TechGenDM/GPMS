import { NextResponse } from 'next/server';
import {
  generateRequestId,
  fetchWithRetry,
  classifyError,
} from '@/lib/resilience';

export async function GET() {
  const requestId = generateRequestId();

  try {
    const appsScriptUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!appsScriptUrl) {
      console.error(
        `[GPMS] requestId=${requestId} action=getPublicDashboard NEXT_PUBLIC_API_URL is not set`
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
            action: 'getPublicDashboard',
            payload: { requestId },
          }),
          redirect: 'follow',
        },
        requestId,
        'getPublicDashboard'
      );
    } catch (networkErr: unknown) {
      const msg =
        networkErr instanceof Error ? networkErr.message : 'Network failure';
      console.error(
        `[GPMS] requestId=${requestId} action=getPublicDashboard network failure after all retries: ${msg}`
      );
      return NextResponse.json(
        { success: false, message: 'Backend unavailable — please try again' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      console.error(
        `[GPMS] requestId=${requestId} action=getPublicDashboard backend returned HTTP ${response.status}`
      );
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
        `[GPMS] requestId=${requestId} action=getPublicDashboard failed to parse JSON response`
      );
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    // Response structure validation — reject malformed/empty data silently
    if (
      typeof data !== 'object' ||
      data === null ||
      !('success' in data)
    ) {
      console.error(
        `[GPMS] requestId=${requestId} action=getPublicDashboard malformed response shape`
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
      data?: unknown;
    };

    if (!apiData.success) {
      const category = classifyError(apiData.code);
      console.error(
        `[GPMS] requestId=${requestId} action=getPublicDashboard backend error category=${category} code=${apiData.code ?? 'none'} message=${apiData.message ?? 'none'}`
      );
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error(
      `[GPMS] requestId=${requestId} action=getPublicDashboard unexpected error:`,
      error
    );
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
