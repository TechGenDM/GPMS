import React, { useState, useEffect } from 'react';
import {
  ShareDonationData,
  shareNative,
  shareToWhatsApp,
  getVerificationUrl,
} from '@/lib/shareUtils';
import { generateAndDownloadReceipt } from '@/lib/pdfGenerator';
import { Button } from '@/components/ui/button';
import { parseGPMSDate } from '@/lib/utils';
import { DocumentPreviewModal } from '@/components/records/DocumentPreviewModal';
import {
  X,
  Download,
  Share2,
  MessageCircle,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { useLanguage } from '@/components/i18n/LanguageProvider';

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
  const { t } = useLanguage();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [previewDocument, setPreviewDocument] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Prevent background scrolling when the modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
        feedback.showError(t('records.expensePdfNotImplemented'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GPMS] PDF generation failed:', err);
      feedback.showError(`PDF Error: ${msg}`);
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
      feedback.showError(t('records.nativeShareNotSupported'));
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      feedback.showError(t('records.reqCancelReason'));
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
        feedback.showSuccess(t('records.recordCancelledSuccess'));
        setIsSubmitting(false);
        setIsCancelling(false);
        setCancelReason('');
        onCancelSuccess();
      } else {
        feedback.showError(
          json.error || json.message || 'Failed to cancel record.'
        );
        setIsSubmitting(false);
      }
    } catch (err: any) {
      feedback.showError(err.message || 'An error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-[2px] p-4 sm:p-6 sm:pb-[env(safe-area-inset-bottom,16px)]">
      <div className="bg-white rounded-[20px] border border-hair shadow-xl w-full max-w-md max-h-[90dvh] flex flex-col relative overflow-hidden">
        {/* Header - Sticky */}
        <div className="flex-none flex items-center justify-between p-[20px_24px] border-b border-hair bg-white z-10">
          <h2 className="font-playfair font-bold text-[18px] text-ink tracking-[0.02em]">
            {isDonation
              ? t('records.donationDetails')
              : t('records.expenseDetails')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-ink hover:text-ink hover:bg-hair/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-[24px] space-y-6">
          {/* Header Area */}
          <div className="text-center space-y-2">
            {isCancelled ? (
              <XCircle className="w-12 h-12 text-maroon mx-auto" />
            ) : (
              <CheckCircle className="w-12 h-12 text-sage mx-auto" />
            )}

            <p className="text-[13px] font-bold text-muted-ink uppercase tracking-wider mt-2">
              {isDonation ? t('records.receiptId') : t('records.expenseId')}
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
                <DetailRow
                  label={t('records.donorName')}
                  value={record.donorName}
                />
                <DetailRow
                  label={t('records.phone')}
                  value={record.phone || 'N/A'}
                />
                <DetailRow
                  label={t('records.purpose')}
                  value={record.purpose}
                />
                <DetailRow
                  label={t('records.paymentMode')}
                  value={record.paymentMode}
                />
              </>
            ) : (
              <>
                <DetailRow
                  label={t('records.category')}
                  value={record.category}
                />
                <DetailRow
                  label={t('records.description')}
                  value={record.description || 'N/A'}
                />
                <DetailRow
                  label={t('records.vendor')}
                  value={record.vendor || 'N/A'}
                />
                <DetailRow
                  label={t('records.paidBy')}
                  value={record.paidByName || record.paidBy || 'N/A'}
                />
              </>
            )}
            <div className="my-2 border-t border-hair" />
            <DetailRow
              label={t('records.date')}
              value={parseGPMSDate(
                record.createdAt || record.date
              ).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            {isDonation && (
              <DetailRow
                label={t('records.collector')}
                value={record.collectorName || record.createdBy || 'Unknown'}
              />
            )}
            <DetailRow
              label={t('records.status')}
              value={
                <span
                  className={
                    isCancelled
                      ? 'text-maroon font-bold'
                      : 'text-sage font-bold'
                  }
                >
                  {record.status}
                </span>
              }
            />
            {isCancelled && (
              <div className="mt-4 p-3 bg-maroon/5 rounded-[12px] border border-maroon/20 space-y-1">
                <DetailRow
                  label={t('records.cancellationReason')}
                  value={record.cancellationReason || 'N/A'}
                />
                <DetailRow
                  label={t('records.cancelledOn')}
                  value={
                    record.cancelledAt
                      ? parseGPMSDate(record.cancelledAt).toLocaleDateString(
                          'en-IN'
                        )
                      : 'N/A'
                  }
                />
                <DetailRow
                  label={t('records.cancelledBy')}
                  value={record.cancelledByName || record.cancelledBy || 'N/A'}
                />
              </div>
            )}
          </div>

          {/* Payment Proof / Document Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-[14px] text-ink uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-ink" />
              {t('records.paymentProof')}
            </h3>
            {(isDonation ? record.paymentProofLink : record.billLink) ? (
              <button
                onClick={() =>
                  setPreviewDocument({
                    url: isDonation ? record.paymentProofLink : record.billLink,
                    title: t('records.paymentProof'),
                  })
                }
                className="group flex items-center justify-between w-full p-4 bg-white border border-hair rounded-[12px] hover:border-sage transition-colors"
              >
                <span className="font-bold text-[14px] text-ink">
                  {t('records.viewDocument')}
                </span>
                <ExternalLink className="w-4 h-4 text-muted-ink opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <div className="p-4 bg-hair/30 rounded-[12px] border border-hair border-dashed text-center">
                <p className="text-[13px] text-muted-ink">
                  {t('records.noDocument')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-none p-[20px_24px] border-t border-hair bg-cream-2 space-y-4">
          {!isCancelled && isDonation && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full font-bold h-[48px]"
              >
                <Download className="w-[18px] h-[18px] mr-2" /> PDF
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={handleWhatsApp}
                  className="flex-1 bg-sage hover:bg-sage/90 text-white border-transparent h-[48px]"
                >
                  <MessageCircle className="w-[18px] h-[18px]" />
                </Button>
                <Button
                  onClick={handleNativeShare}
                  variant="outline"
                  className="flex-1 h-[48px]"
                >
                  <Share2 className="w-[18px] h-[18px]" />
                </Button>
              </div>
            </div>
          )}

          {canCancel && !isCancelled && !isCancelling && (
            <Button
              variant="outline"
              className="w-full text-maroon border-maroon/20 hover:bg-maroon/5 flex items-center justify-center gap-2 h-12 rounded-[12px]"
              onClick={() => setIsCancelling(true)}
            >
              <Ban className="w-[18px] h-[18px]" />
              <span className="font-bold">{t('records.cancelRecord')}</span>
            </Button>
          )}

          {isCancelling && (
            <div className="bg-white p-4 rounded-[14px] border border-maroon/20 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <h4 className="font-bold text-maroon flex items-center gap-2 mb-2">
                <AlertCircle className="w-[18px] h-[18px]" />
                {t('records.confirmCancel')}
              </h4>
              <p className="text-[13px] text-muted-ink mb-3 leading-relaxed">
                {t('records.cancelWarning')}
              </p>
              <input
                type="text"
                placeholder={t('records.reasonPlaceholder')}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-[16px] py-[12px] text-[14px] font-semibold text-ink border border-maroon/20 rounded-[12px] shadow-sm focus:ring-1 focus:ring-maroon focus:border-maroon disabled:opacity-50 disabled:bg-hair/20 placeholder:text-maroon/50"
              />
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleCancelSubmit}
                  className="flex-1 bg-maroon hover:bg-maroon/90 text-white font-bold h-[42px]"
                  disabled={!cancelReason.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {t('records.cancelling')}
                    </>
                  ) : (
                    t('records.confirm')
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
                  {t('records.abort')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        documentUrl={previewDocument?.url || ''}
        title={previewDocument?.title}
      />
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between border-b border-hair/50 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
      <span className="text-muted-ink font-semibold">{label}</span>
      <span className="font-bold text-ink text-right">{value}</span>
    </div>
  );
}
