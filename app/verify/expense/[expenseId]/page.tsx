'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { parseGPMSDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface VerifyExpenseResponse {
  expenseId: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  paidByName: string;
  date: string;
  status: string;
  hasBill: boolean;
}

export default function VerifyExpensePage() {
  const params = useParams();
  const expenseId = params.expenseId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifyExpenseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expenseId) return;

    async function verify() {
      try {
        setLoading(true);
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verifyExpense',
            payload: { expenseId },
          }),
        });

        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || json.message || 'Expense record not found');
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'An error occurred during verification');
        } else {
          setError('An error occurred during verification');
        }
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [expenseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Verifying Record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full mx-auto">
        <CardHeader className="text-center pb-2">
          {data ? (
            <>
              {data.status === 'Cancelled' ? (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              ) : (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              )}
              <CardTitle className="text-2xl font-bold">
                {data.status === 'Cancelled'
                  ? 'Record Cancelled'
                  : 'Official Expense Record'}
              </CardTitle>
              <p className="text-gray-500 mt-1 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                Verified GPMS 2026
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold">
                Record Not Found
              </CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          {error && !data ? (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="text-gray-500 text-sm">Expense ID</span>
                <span className="col-span-2 font-medium text-right text-gray-900">
                  {data.expenseId}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="text-gray-500 text-sm">Category</span>
                <span className="col-span-2 font-medium text-right text-gray-900">
                  {data.category}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="text-gray-500 text-sm">Description</span>
                <span className="col-span-2 font-medium text-right text-gray-900">
                  {data.description}
                </span>
              </div>
              {data.vendor && (
                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                  <span className="text-gray-500 text-sm">Vendor</span>
                  <span className="col-span-2 font-medium text-right text-gray-900">
                    {data.vendor}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="text-gray-500 text-sm">Amount</span>
                <span className="col-span-2 font-medium text-right text-red-600">
                  ₹{Number(data.amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="text-gray-500 text-sm">Paid By</span>
                <span className="col-span-2 font-medium text-right text-gray-900">
                  {data.paidByName}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2">
                <span className="text-gray-500 text-sm">Date</span>
                <span className="col-span-2 font-medium text-right text-gray-900">
                  {parseGPMSDate(data.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2">
                <span className="text-gray-500 text-sm">Bill Attached</span>
                <span className="col-span-2 font-medium text-right text-gray-900">
                  {data.hasBill ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
