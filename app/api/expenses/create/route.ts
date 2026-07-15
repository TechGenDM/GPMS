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

    const payload = {
      action: 'createExpense',
      userEmail: session.user.email,
      payload: {
        category: body.category,
        description: body.description,
        amount: body.amount,
        vendor: body.vendor,
        billLink: body.billLink
      }
    };

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      console.error('Apps Script Error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to record expense' },
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
