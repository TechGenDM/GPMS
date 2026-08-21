import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateRequestId, fetchWithRetry } from '@/lib/resilience';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'Volunteer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '500';

    const appsScriptUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!appsScriptUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
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
            action: 'getRecentLogs',
            payload: {
              userEmail: session.user.email,
              limit: parseInt(limit, 10),
              requestId,
            },
          }),
          redirect: 'follow',
        },
        requestId,
        'getRecentLogs'
      );
    } catch (networkErr: unknown) {
      const msg =
        networkErr instanceof Error ? networkErr.message : 'Network failure';
      console.error(
        `[GPMS] requestId=${requestId} action=getRecentLogs network failure: ${msg}`
      );
      return NextResponse.json(
        { error: 'Backend unavailable — please try again' },
        { status: 503 }
      );
    }

    const rawText = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(
        `[GPMS] requestId=${requestId} action=getRecentLogs failed to parse JSON`
      );
      return NextResponse.json(
        { error: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `[GPMS] requestId=${requestId} action=getRecentLogs unexpected error:`,
      error
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
