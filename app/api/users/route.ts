import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  generateRequestId,
  fetchWithRetry,
  createMutationTimeout,
} from '@/lib/resilience';

/**
 * Proxies a mutation action to Apps Script with a single timeout.
 * NEVER retried — mutations risk creating duplicate financial records.
 */
async function mutationProxy(
  action: string,
  sessionEmail: string,
  payload: unknown,
  requestId: string
) {
  const appsScriptUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!appsScriptUrl) {
    console.error(
      `[GPMS] requestId=${requestId} action=${action} NEXT_PUBLIC_API_URL is not set`
    );
    return { success: false, message: 'Server configuration error' };
  }

  const { controller, timeoutId } = createMutationTimeout();
  const start = Date.now();
  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        payload: {
          userEmail: sessionEmail,
          ...(payload as object),
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
        `[GPMS] requestId=${requestId} action=${action} failed to parse JSON response. duration=${durationMs}ms`
      );
      return { success: false, message: 'Invalid response from backend' };
    }

    console.log(
      `[GPMS] requestId=${requestId} action=${action} status=${response.status} duration=${durationMs}ms ${response.ok ? 'OK' : 'FAILED'}`
    );
    return data as { success: boolean; message?: string };
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    const errName = error instanceof Error ? error.name : 'UnknownError';
    console.error(
      `[GPMS] requestId=${requestId} action=${action} error=${errName} duration=${durationMs}ms FAILED`
    );
    return { success: false, message: 'Internal server error' };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** GET /api/users — read-only, uses fetchWithRetry */
export async function GET() {
  const requestId = generateRequestId();
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
          action: 'getAllUsers',
          payload: { userEmail: session.user.email, requestId },
        }),
        redirect: 'follow',
      },
      requestId,
      'getAllUsers'
    );
  } catch (networkErr: unknown) {
    const msg =
      networkErr instanceof Error ? networkErr.message : 'Network failure';
    console.error(
      `[GPMS] requestId=${requestId} action=getAllUsers network failure: ${msg}`
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
      `[GPMS] requestId=${requestId} action=getAllUsers failed to parse JSON`
    );
    return NextResponse.json(
      { success: false, message: 'Invalid response from backend' },
      { status: 502 }
    );
  }

  const typedData = data as { success: boolean };
  return NextResponse.json(data, { status: typedData.success ? 200 : 400 });
}

/** POST /api/users — mutation, no retry */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  console.log(`[GPMS] requestId=${requestId} action=createUser invoked`);
  const data = await mutationProxy('createUser', session.user.email, body, requestId);
  return NextResponse.json(data, { status: data.success ? 200 : 400 });
}

/** PUT /api/users — mutation, no retry */
export async function PUT(request: NextRequest) {
  const requestId = generateRequestId();
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const data = await mutationProxy('updateUser', session.user.email, body, requestId);
  return NextResponse.json(data, { status: data.success ? 200 : 400 });
}

/** DELETE /api/users — mutation, no retry */
export async function DELETE(request: NextRequest) {
  const requestId = generateRequestId();
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  console.log(`[GPMS] requestId=${requestId} action=disableUser invoked`);
  const data = await mutationProxy('disableUser', session.user.email, { userId: body.userId }, requestId);
  return NextResponse.json(data, { status: data.success ? 200 : 400 });
}
