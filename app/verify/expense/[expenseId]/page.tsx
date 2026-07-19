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
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-maroon animate-spin" />
          <p className="font-bold text-muted-ink">Verifying Record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Card className="max-w-md w-full mx-auto rounded-[24px] border-hair shadow-sm">
        <CardHeader className="text-center pb-2">
          {data ? (
            <>
              {data.status === 'Cancelled' ? (
                <XCircle className="w-16 h-16 text-maroon mx-auto mb-4" />
              ) : (
                <CheckCircle className="w-16 h-16 text-sage mx-auto mb-4" />
              )}
              <CardTitle className="font-playfair text-[24px] font-bold text-ink">
                {data.status === 'Cancelled'
                  ? 'Record Cancelled'
                  : 'Official Expense Record'}
              </CardTitle>
              <p className="text-[14px] font-medium text-muted-ink mt-1 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-1 text-sage" />
                Verified GPMS 2026
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-maroon mx-auto mb-4" />
              <CardTitle className="font-playfair text-[24px] font-bold text-ink">
                Record Not Found
              </CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          {error && !data ? (
            <div className="text-center text-maroon bg-[#F4E9EB] p-4 rounded-[12px] border border-maroon/20 font-bold">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-hair">
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Expense ID</span>
                <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                  {data.expenseId}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-hair">
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Category</span>
                <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                  {data.category}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-hair">
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Description</span>
                <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                  {data.description}
                </span>
              </div>
              {data.vendor && (
                <div className="grid grid-cols-3 gap-2 py-3 border-b border-hair">
                  <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Vendor</span>
                  <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                    {data.vendor}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-hair">
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Amount</span>
                <span className={`col-span-2 font-bold text-right text-[18px] ${data.status === 'Cancelled' ? 'text-maroon line-through' : 'text-sage'}`}>
                  ₹{Number(data.amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-hair">
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Paid By</span>
                <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                  {data.paidByName}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3">
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Date</span>
                <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                  {data.date ? parseGPMSDate(data.date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  }) : '-'}
                </span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      
      <div className="fixed bottom-6 w-full text-center px-4">
        <p className="text-[12px] font-bold text-muted-ink uppercase tracking-widest">
          Verified by GPMS
        </p>
      </div>
    </div>
  );
}
