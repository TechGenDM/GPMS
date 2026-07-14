import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 });
    }

    const appsScriptUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!appsScriptUrl) {
      console.error('NEXT_PUBLIC_API_URL is not set.');
      // Fallback for development if you want to bypass apps script temporarily
      // return NextResponse.json({ success: true, data: { status: 'Active', role: 'Admin' } });
      return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
    }

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
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error verifying auth with Apps Script:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
