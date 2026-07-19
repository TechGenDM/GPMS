'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { parseGPMSDate } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface VerifyResponse {
  donationId: string;
  receiptId: string;
  donorName: string;
  amount: number;
  purpose: string;
  status: string;
  createdAt: string;
  collectorName?: string;
}

export default function VerifyReceiptPage() {
  const params = useParams();
  const receiptId = params.receiptId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptId) return;

    async function verify() {
      try {
        setLoading(true);
        // Using the public verifyReceipt endpoint
        // fetchApi unwraps {success: true, data: ...}, but in this custom unauth endpoint,
        // wait, we just mapped verifyReceipt in Routes.gs to accept {action: 'verifyReceipt'}.
        // The fetchApi wrapper in lib/api.ts automatically wraps { action, payload: body }.
        // BUT fetchApi usually attaches the userEmail from session!
        // We might need to make sure fetchApi works without a session, or just call standard fetch.
        // Let's use standard fetch to be safe if fetchApi forces auth redirects.

        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verifyReceipt',
            payload: { receiptId },
          }),
        });

        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || json.message || 'Receipt not found');
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
  }, [receiptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-maroon animate-spin" />
          <p className="font-bold text-muted-ink">Verifying Receipt...</p>
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
                  ? 'Receipt Cancelled'
                  : 'Valid GPMS Receipt'}
              </CardTitle>
              <p className="text-[14px] font-medium text-muted-ink mt-1">Ganesh Puja 2026</p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-maroon mx-auto mb-4" />
              <CardTitle className="font-playfair text-[24px] font-bold text-ink">
                Receipt Not Found
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
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Receipt ID</span>
                <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                  {data.receiptId}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-hair">
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Donor Name</span>
                <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                  {data.donorName}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-hair">
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Amount</span>
                <span className={`col-span-2 font-bold text-right text-[18px] ${data.status === 'Cancelled' ? 'text-maroon line-through' : 'text-sage'}`}>
                  ₹{Number(data.amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-hair">
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Purpose</span>
                <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                  {data.purpose}
                </span>
              </div>
              {data.collectorName && (
                <div className="grid grid-cols-3 gap-2 py-3 border-b border-hair">
                  <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Collected By</span>
                  <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                    {data.collectorName}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 py-3">
                <span className="text-muted-ink text-[13px] font-bold uppercase tracking-wider">Date</span>
                <span className="col-span-2 font-bold text-right text-ink text-[15px]">
                  {data.createdAt ? parseGPMSDate(data.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  }) : '-'}
                </span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
