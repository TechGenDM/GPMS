import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const scriptUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!scriptUrl) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(scriptUrl, {
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
          vendor: body.vendor,
          billLink: body.billLink
        }
      }),
      redirect: 'follow',
    });

    const rawText = await response.text();
    console.log('[GPMS API] Raw Apps Script Response:', rawText);
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[GPMS API] Failed to parse Apps Script response for createExpense.');
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    if (!response.ok || !data.success) {
      console.error('[GPMS API] Apps Script Error:', data);
      return NextResponse.json(
        { success: false, error: data.message || 'Failed to record expense' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { expenseId: data.data?.id },
      message: 'Expense recorded successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
