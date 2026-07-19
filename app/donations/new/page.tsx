'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  IndianRupee,
  Plus,
  Download,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { parseGPMSDate } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import { useFeedback } from '@/components/ui/Feedback';
import { Card, CardContent } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import { generateAndDownloadReceipt } from '@/lib/pdfGenerator';
import { shareToWhatsApp, shareNative } from '@/lib/shareUtils';

// ── Constants matching backend expectations ──────────────────────────
const PURPOSES = [
  'General Donation',
  'Murti',
  'Decoration',
  'Prasad',
  'Cultural Program',
  'Other',
] as const;

const PAYMENT_MODES = ['Cash', 'UPI'] as const;

// ── Types ────────────────────────────────────────────────────────────
interface DonationFormData {
  donorName: string;
  phone: string;
  amount: string;
  purpose: string;
  paymentMode: string;
  upiRef: string;
  remarks: string;
}

interface CreateDonationResponse {
  id: string;
  receiptId: string;
  collectorName: string;
  createdAt: string;
}

const INITIAL_FORM: DonationFormData = {
  donorName: '',
  phone: '',
  amount: '',
  purpose: PURPOSES[0],
  paymentMode: PAYMENT_MODES[0],
  upiRef: '',
  remarks: '',
};

// ── Validation ───────────────────────────────────────────────────────
function validateForm(form: DonationFormData): string | null {
  if (!form.donorName.trim()) return 'Donor name is required';
  if (form.phone.trim()) {
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      return 'Please enter a valid 10-digit mobile number';
    }
  }
  if (!form.amount || Number(form.amount) <= 0)
    return 'Amount must be greater than zero';
  if (!form.paymentMode) return 'Please select a payment mode';
  return null;
}

// ══════════════════════════════════════════════════════════════════════
// Page Component
// ══════════════════════════════════════════════════════════════════════
export default function NewDonationPage() {
  const router = useRouter();
  const feedback = useFeedback();
  const transactionIdRef = useRef<string>('');

  useEffect(() => {
    transactionIdRef.current = crypto.randomUUID();
  }, []);

  const [form, setForm] = useState<DonationFormData>(INITIAL_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Success state
  const [successData, setSuccessData] = useState<{
    id: string;
    receiptId: string;
    donorName: string;
    amount: number;
    purpose: string;
    paymentMode: string;
    collectorName: string;
    date: string;
    donorPhone?: string;
  } | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof DonationFormData>(
      field: K,
      value: DonationFormData[K]
    ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setValidationError(null);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Client-side validation (mirroring backend rules)
      const err = validateForm(form);
      if (err) {
        setValidationError(err);
        return;
      }

      setSubmitting(true);

      const res = await fetchApi<CreateDonationResponse>(
        '/donations/create',
        {
          method: 'POST',
          body: {
            donorName: form.donorName.trim(),
            phone: form.phone.trim(),
            amount: Number(form.amount),
            purpose: form.purpose,
            paymentMode: form.paymentMode,
            upiRef: form.paymentMode === 'UPI' ? form.upiRef.trim() : '',
            remarks: form.remarks.trim(),
            transactionId: transactionIdRef.current,
          },
          showLoading: true,
          loadingMessage: 'Recording donation...',
        },
        feedback
      );

      setSubmitting(false);

      if (res.success && res.data) {
        setSuccessData({
          id: res.data.id,
          receiptId: res.data.receiptId,
          donorName: form.donorName.trim(),
          amount: Number(form.amount),
          purpose: form.purpose,
          paymentMode: form.paymentMode,
          collectorName: res.data.collectorName,
          date: res.data.createdAt,
          donorPhone: form.phone.trim(),
        });
      }
    },
    [form, feedback]
  );

  const handleRecordAnother = useCallback(() => {
    setForm(INITIAL_FORM);
    setSuccessData(null);
    setValidationError(null);
    transactionIdRef.current = crypto.randomUUID();
  }, []);

  // ── Success State ────────────────────────────────────────────────
  if (successData) {
    const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${successData.receiptId}`;

    const handleDownloadPdf = async () => {
      try {
        await generateAndDownloadReceipt({
          receiptId: successData.receiptId,
          donorName: successData.donorName,
          amount: successData.amount,
          paymentMode: successData.paymentMode,
          purpose: successData.purpose,
          date: successData.date,
          collectorName: successData.collectorName,
        });
        feedback.showSuccess('Receipt downloaded');
      } catch (e) {
        feedback.showError('Failed to generate PDF');
      }
    };

    const handleWhatsAppShare = () => {
      shareToWhatsApp({
        receiptId: successData.receiptId,
        donorName: successData.donorName,
        amount: successData.amount,
        paymentMode: successData.paymentMode,
        purpose: successData.purpose,
        collectorName: successData.collectorName,
        date: successData.date,
        donorPhone: successData.donorPhone,
      });
    };

    const handleNativeShare = async () => {
      const shared = await shareNative({
        receiptId: successData.receiptId,
        donorName: successData.donorName,
        amount: successData.amount,
        paymentMode: successData.paymentMode,
        purpose: successData.purpose,
        collectorName: successData.collectorName,
        date: successData.date,
        donorPhone: successData.donorPhone,
      });
      if (!shared && typeof navigator.share === 'undefined') {
        feedback.showError('Native sharing is not supported on this device');
      }
    };

    return (
      <div className="min-h-screen bg-cream pb-20">
        <header className="bg-cream border-b border-hair sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
            <h1 className="font-playfair text-[20px] font-bold text-ink tracking-[0.02em]">
              Donation Recorded
            </h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto rounded-[24px] overflow-hidden border-hair shadow-sm">
            <CardContent className="p-8 space-y-8">
              <div className="text-center space-y-3">
                <CheckCircle className="w-16 h-16 text-sage mx-auto" />
                <h2 className="text-[24px] font-playfair font-bold text-ink">Success!</h2>
                <p className="text-[14px] font-medium text-muted-ink">
                  Donation successfully recorded.
                </p>
              </div>

              <div className="bg-cream-2 rounded-[16px] p-6 text-center space-y-2 border border-hair">
                <p className="text-[13px] font-bold text-muted-ink uppercase tracking-wider">
                  Receipt ID
                </p>
                <p className="text-[20px] font-playfair font-bold text-ink">
                  {successData.receiptId}
                </p>
                <div className="pt-2 border-t border-hair/50 mt-3 space-y-1">
                  <p className="text-[15px] text-ink font-bold mt-2">
                    {successData.donorName}
                  </p>
                  <CurrencyDisplay
                    amount={successData.amount}
                    size="lg"
                    className="justify-center font-bold text-sage"
                  />
                </div>
              </div>

            <div className="pt-4 grid grid-cols-2 gap-3">
              <Button
                onClick={handleDownloadPdf}
                className="w-full bg-ink hover:bg-ink/90 text-cream h-[48px] font-bold rounded-[12px]"
              >
                <Download className="w-[18px] h-[18px] mr-2" />
                PDF
              </Button>
              <Button
                onClick={handleWhatsAppShare}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-[48px] font-bold rounded-[12px] border-transparent"
              >
                <MessageCircle className="w-[18px] h-[18px] mr-2" />
                WhatsApp
              </Button>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleNativeShare}
                className="w-full h-[48px] font-bold rounded-[12px] text-ink border-hair hover:bg-hair/30"
              >
                <Share2 className="w-[18px] h-[18px] mr-2" />
                More Sharing Options
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-3 max-w-md mx-auto">
          <Button
            onClick={handleRecordAnother}
            className="w-full h-[54px] text-[16px] bg-sage hover:bg-sage/90 text-white rounded-[14px] font-bold border-transparent"
          >
            <Plus className="w-[20px] h-[20px] mr-2" />
            Record Another Donation
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full h-[54px] text-[16px] rounded-[14px] font-bold border-hair text-ink hover:bg-hair/30"
          >
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}

  // ── Form State ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header */}
      <header className="bg-cream border-b border-hair sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 -ml-2 mr-2 text-muted-ink hover:text-ink rounded-lg hover:bg-hair/50 transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-playfair text-[20px] font-bold text-ink tracking-[0.02em]">
            Record Donation
          </h1>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Validation Error Banner */}
          {validationError && (
            <div className="bg-[#F4E9EB] border border-maroon/20 rounded-[12px] px-4 py-3 text-[14px] text-maroon font-bold">
              {validationError}
            </div>
          )}

          {/* Donor Name */}
          <div>
            <label
              htmlFor="donorName"
              className="block text-[14px] font-bold text-ink mb-1.5"
            >
              Donor Name <span className="text-maroon">*</span>
            </label>
            <input
              id="donorName"
              type="text"
              autoFocus
              autoComplete="off"
              placeholder="Enter donor's name"
              value={form.donorName}
              onChange={(e) => updateField('donorName', e.target.value)}
              className="w-full h-[48px] px-4 rounded-[12px] border border-hair bg-white text-ink font-semibold text-[15px] placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-shadow"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-[14px] font-bold text-ink mb-1.5"
            >
              Phone Number{' '}
              <span className="text-muted-ink text-[12px] font-medium">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="off"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full h-[48px] px-4 rounded-[12px] border border-hair bg-white text-ink font-semibold text-[15px] placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-shadow"
            />
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="amount"
              className="block text-[14px] font-bold text-ink mb-1.5"
            >
              Amount <span className="text-maroon">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink font-bold text-[18px]">
                ₹
              </span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={form.amount}
                onChange={(e) => {
                  // Allow only numbers and decimal point
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  updateField('amount', val);
                }}
                className="w-full h-[56px] pl-[36px] pr-4 rounded-[12px] border border-hair bg-white text-ink text-[24px] font-bold placeholder:text-hair focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-shadow"
              />
            </div>
          </div>

          {/* Purpose — Pill Chips */}
          <div>
            <label className="block text-[14px] font-bold text-ink mb-2">
              Purpose <span className="text-muted-ink text-[12px] font-medium">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.map((pur) => (
                <button
                  key={pur}
                  type="button"
                  onClick={() => updateField('purpose', pur)}
                  className={`px-[16px] py-[10px] rounded-[24px] text-[14px] font-bold transition-all ${
                    form.purpose === pur
                      ? 'bg-ink text-cream border-transparent shadow-sm'
                      : 'bg-white text-ink border border-hair hover:border-ink hover:text-ink'
                  }`}
                >
                  {pur}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode — Toggle Buttons */}
          <div>
            <label className="block text-[14px] font-bold text-ink mb-2">
              Payment Mode <span className="text-maroon">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateField('paymentMode', mode)}
                  className={`h-[48px] rounded-[12px] text-[15px] font-bold transition-all border ${
                    form.paymentMode === mode
                      ? 'bg-ink text-cream border-transparent shadow-sm'
                      : 'bg-white text-ink border-hair hover:border-ink'
                  }`}
                >
                  {mode === 'Cash' ? '💵' : '📱'} {mode}
                </button>
              ))}
            </div>
          </div>

          {/* UPI Reference — Conditional */}
          {form.paymentMode === 'UPI' && (
            <div>
              <label
                htmlFor="upiRef"
                className="block text-[14px] font-bold text-ink mb-1.5"
              >
                UPI Reference{' '}
                <span className="text-muted-ink text-[12px] font-medium">(optional)</span>
              </label>
              <input
                id="upiRef"
                type="text"
                autoComplete="off"
                placeholder="Transaction ID or UPI ref number"
                value={form.upiRef}
                onChange={(e) => updateField('upiRef', e.target.value)}
                className="w-full h-[48px] px-4 rounded-[12px] border border-hair bg-white text-ink font-semibold text-[15px] placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-shadow"
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label
              htmlFor="remarks"
              className="block text-[14px] font-bold text-ink mb-1.5"
            >
              Remarks <span className="text-muted-ink text-[12px] font-medium">(optional)</span>
            </label>
            <textarea
              id="remarks"
              rows={2}
              placeholder="Any additional notes"
              value={form.remarks}
              onChange={(e) => updateField('remarks', e.target.value)}
              className="w-full px-4 py-3 rounded-[12px] border border-hair bg-white text-ink font-semibold text-[15px] placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-shadow resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-[54px] text-[16px] bg-ink hover:bg-ink/90 text-cream rounded-[14px] font-bold shadow-sm disabled:opacity-50 border-transparent"
            >
              <IndianRupee className="w-[18px] h-[18px] mr-2" />
              Record Donation
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
