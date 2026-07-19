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
    date: record.createdAt || record.date,
    donorPhone: record.phone ? String(record.phone) : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-[20px] border border-hair shadow-xl w-full max-w-md my-8 relative">
        <div className="flex items-center justify-between p-[20px_24px] border-b border-hair">
          <h2 className="font-playfair font-bold text-[18px] text-ink tracking-[0.02em]">
            {isDonation ? 'Donation Details' : 'Expense Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-ink hover:text-ink hover:bg-hair/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-[24px] space-y-6">
          {/* Header Area */}
          <div className="text-center space-y-2">
            {isCancelled ? (
              <XCircle className="w-12 h-12 text-maroon mx-auto" />
            ) : (
              <CheckCircle className="w-12 h-12 text-sage mx-auto" />
            )}
            
            <p className="text-[13px] font-bold text-muted-ink uppercase tracking-wider mt-2">
              {isDonation ? 'Receipt ID' : 'Expense ID'}
            </p>
            <p className="text-[24px] font-playfair font-bold text-ink">
              {isDonation ? record.receiptId : record.id}
            </p>
            
            <CurrencyDisplay
              amount={record.amount}
              size="lg"
              className={`justify-center font-bold ${isCancelled ? 'text-maroon line-through opacity-80' : 'text-ink'}`}
            />
          </div>

          {/* Details Grid */}
          <div className="bg-cream-2 border border-hair rounded-[16px] p-[16px] text-[14px]">
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
                  <div className="flex justify-between border-b border-hair/50 pb-3 mb-3">
                    <span className="text-muted-ink font-semibold">Bill</span>
                    <a href={record.billLink} target="_blank" rel="noreferrer" className="text-ink font-bold hover:underline decoration-hair underline-offset-4">
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
                <span className={isCancelled ? 'text-maroon font-bold' : 'text-sage font-bold'}>
                  {record.status}
                </span>
              }
            />
            {isCancelled && record.remarks && (
              <div className="mt-3 text-maroon text-[13px] p-3 bg-[#F4E9EB] rounded-[10px] font-semibold">
                {record.remarks}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-2">
            {!isCancelled && isDonation && (
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleDownload} variant="outline" className="w-full font-bold h-[48px]">
                  <Download className="w-[18px] h-[18px] mr-2" /> PDF
                </Button>
                <div className="flex gap-2">
                  <Button onClick={handleWhatsApp} className="flex-1 bg-sage hover:bg-sage/90 text-white border-transparent h-[48px]">
                    <MessageCircle className="w-[18px] h-[18px]" />
                  </Button>
                  <Button onClick={handleNativeShare} variant="outline" className="flex-1 h-[48px]">
                    <Share2 className="w-[18px] h-[18px]" />
                  </Button>
                </div>
              </div>
            )}

            {!isCancelled && canCancel && (
              <div className="pt-4 border-t border-hair">
                {!isCancelling ? (
                  <Button
                    onClick={() => setIsCancelling(true)}
                    variant="ghost"
                    className="w-full text-maroon hover:text-maroon hover:bg-maroon/5 font-bold h-[48px]"
                  >
                    <Ban className="w-[18px] h-[18px] mr-2" /> Cancel Record
                  </Button>
                ) : (
                  <div className="space-y-3 bg-[#F4E9EB] p-4 rounded-[14px] border border-maroon/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-maroon mt-0.5 flex-shrink-0" />
                      <div className="text-[14px] text-maroon">
                        <p className="font-bold mb-1">Cancel this record?</p>
                        <p className="opacity-90 leading-snug">This action cannot be undone. It will be marked as cancelled.</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Reason for cancellation..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-[16px] py-[12px] text-[14px] font-semibold text-ink border border-maroon/20 rounded-[12px] shadow-sm focus:ring-1 focus:ring-maroon focus:border-maroon disabled:opacity-50 disabled:bg-hair/20 placeholder:text-maroon/50"
                    />
                    <div className="flex gap-2">
                      <Button
                         onClick={handleCancelSubmit}
                         className="flex-1 bg-maroon hover:bg-maroon/90 text-white font-bold h-[42px]"
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
                         className="flex-1 text-maroon hover:bg-maroon/10 font-bold h-[42px]"
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
    <div className="flex justify-between border-b border-hair/50 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
      <span className="text-muted-ink font-semibold">{label}</span>
      <span className="font-bold text-ink text-right">{value}</span>
    </div>
  );
}
