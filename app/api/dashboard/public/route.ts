import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appsScriptUrl = process.env.API_URL;
    if (!appsScriptUrl) {
      console.error('[GPMS API] API_URL is not set.');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getPublicDashboard',
        payload: {},
      }),
      redirect: 'follow',
      cache: 'no-store',
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(
        '[GPMS API] Failed to parse Apps Script response as JSON.'
      );
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[GPMS API] Unexpected error in public dashboard:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
