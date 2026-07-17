import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

async function proxyToAppsScript(action: string, sessionEmail: string, payload: any) {
  const appsScriptUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!appsScriptUrl) {
    console.error('[GPMS API] NEXT_PUBLIC_API_URL is not set.');
    return { success: false, message: 'Server configuration error' };
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        payload: {
          userEmail: sessionEmail,
          ...payload,
        },
      }),
      redirect: 'follow',
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(`[GPMS API] Failed to parse response for ${action}.`, rawText);
      return { success: false, message: 'Invalid response from backend' };
    }
    return data;
  } catch (error) {
    console.error(`[GPMS API] Unexpected error in ${action}:`, error);
    return { success: false, message: 'Internal server error' };
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await proxyToAppsScript('getAllUsers', session.user.email, {});
  return NextResponse.json(data, { status: data.success ? 200 : 400 });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  console.log('[POST] Received body:', body);
  const data = await proxyToAppsScript('createUser', session.user.email, body);
  return NextResponse.json(data, { status: data.success ? 200 : 400 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const data = await proxyToAppsScript('updateUser', session.user.email, body);
  return NextResponse.json(data, { status: data.success ? 200 : 400 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  console.log('[DELETE] Received body:', body);
  const data = await proxyToAppsScript('disableUser', session.user.email, { userId: body.userId });
  return NextResponse.json(data, { status: data.success ? 200 : 400 });
}
