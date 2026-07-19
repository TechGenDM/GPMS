import React, { useState } from 'react';
import { ShareDonationData, shareNative, shareToWhatsApp, getVerificationUrl } from '@/lib/shareUtils';
import { generateAndDownloadReceipt } from '@/lib/pdfGenerator';
import { Button } from '@/components/ui/button';
import { parseGPMSDate } from '@/lib/utils';
import {
  X,
  Download,
  Share2,
  MessageCircle,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  type: 'donation' | 'expense';
  canCancel: boolean;
  onCancelSuccess: () => void;
  feedback: {
    showSuccess: (msg: string) => void;
    showError: (msg: string) => void;
  };
}

export function RecordDetailModal({
  isOpen,
  onClose,
  record,
  type,
  canCancel,
  onCancelSuccess,
  feedback,
}: RecordDetailModalProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!isOpen || !record) return null;

  const isDonation = type === 'donation';
  const isCancelled = record.status === 'Cancelled';

  const handleDownload = async () => {
    try {
      if (isDonation) {
        await generateAndDownloadReceipt({
          receiptId: record.receiptId,
          donorName: record.donorName,
          amount: record.amount,
          paymentMode: record.paymentMode,
          purpose: record.purpose,
          date: record.date,
          collectorName: record.collectorName || record.createdBy || '',
        });
      } else {
        // Assume expense PDF logic if it exists, otherwise just log or notify it's not implemented yet in V1
        feedback.showError('Expense PDF download is not implemented yet.');
      }
    } catch (err) {
      feedback.showError('Failed to generate PDF');
    }
  };

  const shareData: ShareDonationData = {
    receiptId: record.receiptId,
    donorName: record.donorName,
    amount: record.amount,
    paymentMode: record.paymentMode,
    purpose: record.purpose,
    collectorName: record.collectorName || record.createdBy || '',
    date: record.date,
    donorPhone: record.phone,
  };

  const handleWhatsApp = () => {
    shareToWhatsApp(shareData);
  };

  const handleNativeShare = async () => {
    const success = await shareNative(shareData);
    if (!success && typeof navigator.share === 'undefined') {
      feedback.showError('Native sharing is not supported on this device');
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      feedback.showError('Please enter a cancellation reason.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/records/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          donationId: isDonation ? record.id : undefined,
          expenseId: !isDonation ? record.id : undefined,
          cancellationReason: cancelReason.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        feedback.showSuccess('Record cancelled successfully.');
        setIsSubmitting(false);
        setIsCancelling(false);
        setCancelReason('');
        onCancelSuccess();
      } else {
        feedback.showError(json.error || json.message || 'Failed to cancel record.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      feedback.showError(err.message || 'An error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8 relative">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-slate-900">
            {isDonation ? 'Donation Details' : 'Expense Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Area */}
          <div className="text-center space-y-2">
            {isCancelled ? (
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            ) : (
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            )}
            
            <p className="text-sm font-medium text-slate-500">
              {isDonation ? 'Receipt ID' : 'Expense ID'}
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono">
              {isDonation ? record.receiptId : record.id}
            </p>
            
            <CurrencyDisplay
              amount={record.amount}
              size="lg"
              className={`justify-center ${isCancelled ? 'text-red-700' : (isDonation ? 'text-green-700' : 'text-slate-900')}`}
            />
          </div>

          {/* Details Grid */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3 text-sm">
            {isDonation ? (
              <>
                <DetailRow label="Donor Name" value={record.donorName} />
                <DetailRow label="Phone" value={record.phone || 'N/A'} />
                <DetailRow label="Purpose" value={record.purpose} />
                <DetailRow label="Payment Mode" value={record.paymentMode} />
              </>
            ) : (
              <>
                <DetailRow label="Category" value={record.category} />
                <DetailRow label="Vendor" value={record.vendor || 'N/A'} />
                <DetailRow label="Description" value={record.description} />
                <DetailRow label="Paid By" value={record.paidBy} />
                {record.billLink && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Bill</span>
                    <a href={record.billLink} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline">
                      View Bill
                    </a>
                  </div>
                )}
              </>
            )}
            
            <DetailRow
              label="Date"
              value={parseGPMSDate(record.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            />
            <DetailRow
              label="Status"
              value={
                <span className={isCancelled ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                  {record.status}
                </span>
              }
            />
            {isCancelled && record.remarks && (
              <div className="mt-2 text-red-600 text-xs p-2 bg-red-50 rounded">
                {record.remarks}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {!isCancelled && isDonation && (
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleDownload} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" /> PDF
                </Button>
                <div className="flex gap-2">
                  <Button onClick={handleWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button onClick={handleNativeShare} variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {!isCancelled && canCancel && (
              <div className="pt-4 border-t border-slate-200">
                {!isCancelling ? (
                  <Button
                    onClick={() => setIsCancelling(true)}
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Ban className="w-4 h-4 mr-2" /> Cancel Record
                  </Button>
                ) : (
                  <div className="space-y-3 bg-red-50 p-3 rounded-lg border border-red-100">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-900">
                        <p className="font-semibold mb-1">Cancel this record?</p>
                        <p>This action cannot be undone. It will be marked as cancelled.</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Reason for cancellation..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:bg-slate-100"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCancelSubmit}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-1 h-auto"
                        disabled={!cancelReason.trim() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          'Confirm'
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsCancelling(false);
                          setCancelReason('');
                        }}
                        variant="ghost"
                        disabled={isSubmitting}
                        className="flex-1 text-slate-600 hover:bg-slate-200 text-sm py-1 h-auto"
                      >
                        Abort
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}
