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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Verifying Receipt...</p>
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
                  ? 'Receipt Cancelled'
                  : 'Valid GPMS Receipt'}
              </CardTitle>
              <p className="text-gray-500 mt-1">Ganesh Puja 2026</p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold">
                Receipt Not Found
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
                <span className="text-gray-500 text-sm">Receipt ID</span>
                <span className="col-span-2 font-medium text-right text-gray-900">
                  {data.receiptId}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="text-gray-500 text-sm">Donor Name</span>
                <span className="col-span-2 font-medium text-right text-gray-900">
                  {data.donorName}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="text-gray-500 text-sm">Amount</span>
                <span className="col-span-2 font-medium text-right text-green-600">
                  ₹{Number(data.amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="text-gray-500 text-sm">Purpose</span>
                <span className="col-span-2 font-medium text-right text-gray-900">
                  {data.purpose}
                </span>
              </div>
              {data.collectorName && (
                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                  <span className="text-gray-500 text-sm">Collected By</span>
                  <span className="col-span-2 font-medium text-right text-gray-900">
                    {data.collectorName}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 py-2">
                <span className="text-gray-500 text-sm">Date</span>
                <span className="col-span-2 font-medium text-right text-gray-900">
                  {parseGPMSDate(data.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {data.status === 'Cancelled' && (
                <div className="mt-6 p-3 bg-red-50 text-red-700 text-sm text-center rounded-lg border border-red-200">
                  This receipt has been cancelled and is no longer valid.
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
