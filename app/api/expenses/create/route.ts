import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
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
      console.error('[GPMS API] NEXT_PUBLIC_API_URL is not set.');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createExpense',
        payload: {
          userEmail: session.user.email,
          category: body.category,
          description: body.description,
          amount: body.amount,
          vendor: body.vendor || '',
          billLink: body.billLink || '',
          billFile: body.billFile || null,
          transactionId: body.transactionId,
        },
      }),
      redirect: 'follow',
    });

    const rawText = await response.text();
    console.log(
      '[GPMS API] createExpense payload sent:',
      JSON.stringify({
        action: 'createExpense',
        payload: {
          userEmail: session.user.email,
          category: body.category,
          description: body.description,
          amount: body.amount,
        },
      })
    );
    console.log('[GPMS API] Raw Apps Script Response:', rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(
        '[GPMS API] Failed to parse Apps Script response for createExpense.'
      );
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    // Pass through the Apps Script response directly (same pattern as donations)
    return NextResponse.json(data);
  } catch (error) {
    console.error('[GPMS API] Unexpected error in createExpense:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
