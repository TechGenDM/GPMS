import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email required' },
        { status: 400 }
      );
    }

    const appsScriptUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!appsScriptUrl) {
      console.error('[GPMS verify] NEXT_PUBLIC_API_URL is not set.');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // --- Diagnostic: log outgoing request shape (no secrets/tokens) ---
    console.log('[GPMS verify] Calling Apps Script for email:', email);
    console.log(
      '[GPMS verify] Target URL prefix:',
      appsScriptUrl.substring(0, 60) + '...'
    );

    // Call Apps Script
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'authenticate',
        payload: { email },
      }),
      redirect: 'follow', // Apps Script redirects on deploy — follow it
    });

    // --- Diagnostic: log raw response metadata ---
    console.log('[GPMS verify] Apps Script HTTP status:', response.status);
    console.log('[GPMS verify] Apps Script redirected:', response.redirected);
    console.log(
      '[GPMS verify] Apps Script Content-Type:',
      response.headers.get('content-type')
    );

    const rawText = await response.text();

    // --- Diagnostic: log the raw body (safe — only contains role/status, no tokens) ---
    console.log('[GPMS verify] Apps Script raw response body:', rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(
        '[GPMS verify] Failed to parse Apps Script response as JSON.'
      );
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    // --- Diagnostic: log parsed response shape ---
    console.log(
      '[GPMS verify] Parsed response:',
      JSON.stringify({
        success: data.success,
        code: data.code,
        message: data.message,
        hasData: !!data.data,
        dataRole: data.data?.role,
        dataStatus: data.data?.status,
      })
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GPMS verify] Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
