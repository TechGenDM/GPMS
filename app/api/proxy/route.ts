import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const appsScriptUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!appsScriptUrl) {
      console.error('[GPMS Proxy] NEXT_PUBLIC_API_URL is not set.');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Call Apps Script
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      redirect: 'follow', // Apps Script redirects on deploy — follow it
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[GPMS Proxy] Failed to parse Apps Script response as JSON.');
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GPMS Proxy] Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
