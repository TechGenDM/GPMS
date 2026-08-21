'use client';

import React, { useEffect, useState } from 'react';
import { X, QrCode, Loader2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageProvider';

interface UpiPaymentModalProps {
  isOpen: boolean;
  amount: number;
  upiId: string;
  payeeName: string;
  /**
   * Called when the user closes the modal (X button or Done button).
   * This callback MUST NOT trigger donation submission — it only closes the modal.
   */
  onCancel: () => void;
}

export function UpiPaymentModal({
  isOpen,
  amount,
  upiId,
  payeeName,
  onCancel,
}: UpiPaymentModalProps) {
  const { t } = useLanguage();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const generateQrCode = async () => {
      if (!isOpen || !amount || !upiId) return;

      setIsGenerating(true);
      try {
        const QRCode =
          (await import('qrcode')).default || (await import('qrcode'));
        // Standard UPI deep link format
        // upi://pay?pa=UPIID&pn=NAME&am=AMOUNT&cu=INR
        const encodedName = encodeURIComponent(payeeName || 'GPMS Donation');
        const upiUri = `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount}&cu=INR`;

        const dataUrl = await QRCode.toDataURL(upiUri, {
          width: 200,
          margin: 1,
          color: {
            dark: '#170F26', // ink
            light: '#FFFFFF',
          },
        });

        if (isMounted) {
          setQrCodeDataUrl(dataUrl);
        }
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    };

    generateQrCode();

    return () => {
      isMounted = false;
    };
  }, [isOpen, amount, upiId, payeeName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-ink/40 backdrop-blur-[2px] transition-opacity">
      <div className="bg-white rounded-[20px] shadow-xl w-full max-w-sm overflow-hidden transform transition-all border border-hair flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-[20px_24px_16px]">
          <h3 className="text-[18px] font-playfair font-bold text-ink tracking-[0.02em] flex items-center gap-2">
            <QrCode className="w-5 h-5 text-sage" />
            {t('forms.upiPayment')}
          </h3>
          <button
            onClick={onCancel}
            className="text-muted-ink hover:text-ink transition-colors p-1 rounded-full hover:bg-hair/30"
            aria-label="Close QR modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-[0px_24px_24px] flex flex-col items-center text-center">
          <div className="bg-cream p-4 rounded-[16px] border border-hair/50 mb-5 relative">
            {isGenerating ? (
              <div className="w-[180px] h-[180px] flex items-center justify-center bg-white rounded-lg">
                <Loader2 className="w-8 h-8 text-sage animate-spin" />
              </div>
            ) : qrCodeDataUrl ? (
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <img
                  src={qrCodeDataUrl}
                  alt="UPI QR Code"
                  className="w-[180px] h-[180px] object-contain"
                />
              </div>
            ) : (
              <div className="w-[180px] h-[180px] flex flex-col items-center justify-center bg-white rounded-lg text-maroon">
                <X className="w-8 h-8 mb-2" />
                <span className="text-[12px]">
                  {t('forms.failedToGenerateQr')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1 mb-6">
            <p className="text-[28px] font-playfair font-bold text-sage">
              ₹{Number(amount).toLocaleString('en-IN')}
            </p>
            <p className="text-[14px] font-bold text-ink">
              {payeeName || 'GPMS Donation'}
            </p>
            <p className="text-[13px] text-muted-ink">
              {t('forms.scanUsingAnyApp')}
            </p>
          </div>

          {/*
           * BUSINESS RULE: This button ONLY closes the modal.
           * It does NOT create, submit, or modify a donation.
           * Donation submission happens only after the user uploads
           * payment proof and clicks "Record Donation" on the main form.
           */}
          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-2 px-6 py-[14px] text-[15px] font-bold text-white bg-sage rounded-[14px] shadow-sm transition-all hover:bg-sage/90 active:scale-[0.98]"
          >
            <CheckCircle2 className="w-5 h-5" />
            {t('forms.doneCompletedPayment')}
          </button>

          <p className="text-[11px] text-muted-ink/70 mt-4 leading-tight">
            {t('forms.afterClosingUpload')}
          </p>
        </div>
      </div>
    </div>
  );
}
