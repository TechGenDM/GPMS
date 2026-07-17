import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
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

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getCategories',
        payload: {
          userEmail: session.user.email,
        },
      }),
      redirect: 'follow',
      cache: 'no-store', // Avoid caching so we always get fresh categories
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GPMS API] Unexpected error in getCategories:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
