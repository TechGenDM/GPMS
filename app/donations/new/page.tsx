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
  Upload,
  X as XIcon,
  ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { parseGPMSDate } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import { useFeedback } from '@/components/ui/Feedback';
import { Card, CardContent } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import { generateAndDownloadReceipt } from '@/lib/pdfGenerator';
import { shareToWhatsApp, shareNative } from '@/lib/shareUtils';
import { UpiPaymentModal } from '@/components/donation/UpiPaymentModal';
import { useLanguage } from '@/components/i18n/LanguageProvider';

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

const PRESET_AMOUNTS = ['51', '101', '251', '501', '1001'];

// ── Types ────────────────────────────────────────────────────────────
interface ProofFile {
  base64: string;
  mimeType: string;
  name: string;
}

interface DonationFormData {
  donorName: string;
  phone: string;
  amount: string;
  purpose: string;
  paymentMode: string;
  remarks: string;
  paymentProofFile: ProofFile | null;
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
  remarks: '',
  paymentProofFile: null,
};

// ── Image Processing Utility ──────────────────────────────────────────
const compressImage = async (
  file: File
): Promise<{ base64: string; mimeType: string; name: string }> => {
  return new Promise((resolve, reject) => {
    // createObjectURL respects native EXIF orientation when drawn to canvas
    // and strips the EXIF metadata in the output.
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;
      const MAX_DIMENSION = 1920;

      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      const newName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
      resolve({ base64: dataUrl, mimeType: 'image/jpeg', name: newName });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };
    img.src = url;
  });
};

// ── Validation ───────────────────────────────────────────────────────
function validateForm(form: DonationFormData, t: any): string | null {
  if (!form.donorName.trim()) return t('forms.reqDonorName');
  if (form.phone.trim()) {
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      return (
        t('forms.reqValidPhone') ||
        'Please enter a valid 10-digit mobile number'
      );
    }
  }
  if (!form.amount || Number(form.amount) <= 0)
    return t('forms.reqAmountPositive');
  if (!form.paymentMode)
    return t('forms.reqValidAmount') || 'Please select a payment mode';
  if (form.paymentMode === 'UPI' && !form.paymentProofFile) {
    return t('forms.reqUpiProof');
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════
// Page Component
// ══════════════════════════════════════════════════════════════════════
export default function NewDonationPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const feedback = useFeedback();
  const transactionIdRef = useRef<string>('');

  useEffect(() => {
    transactionIdRef.current = crypto.randomUUID();
  }, []);

  const [form, setForm] = useState<DonationFormData>(INITIAL_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // UPI Configuration State
  const [upiConfig, setUpiConfig] = useState({
    upiId: '',
    payeeName: '',
    enabled: false,
    loaded: false,
  });

  // Modal State
  const [showUpiModal, setShowUpiModal] = useState(false);

  // Payment proof file input ref
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch UPI Config on load
  useEffect(() => {
    let isMounted = true;
    const loadUpiConfig = async () => {
      try {
        const res = await fetch('/api/settings/upi-payment');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && isMounted) {
            setUpiConfig({
              upiId: data.data.upiId,
              payeeName: data.data.payeeName,
              enabled: data.data.enabled,
              loaded: true,
            });
            // Auto-select Cash if UPI is disabled and currently selected
            if (!data.data.enabled && form.paymentMode === 'UPI') {
              setForm((prev) => ({ ...prev, paymentMode: 'Cash' }));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load UPI config', e);
      }
    };
    loadUpiConfig();

    return () => {
      isMounted = false;
    };
  }, [form.paymentMode]);

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

  const submitDonation = useCallback(async () => {
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
          remarks: form.remarks.trim(),
          transactionId: transactionIdRef.current,
          // Only send proof file for UPI payments
          paymentProofFile:
            form.paymentMode === 'UPI' ? form.paymentProofFile : null,
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
  }, [form, feedback]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Client-side validation (mirrors backend rules, including UPI proof requirement)
      const err = validateForm(form, t);
      if (err) {
        setValidationError(err);
        return;
      }

      // Submit directly — QR was already shown when user selected UPI mode
      await submitDonation();
    },
    [form, submitDonation, t]
  );

  // ── Payment Proof File Handlers ──────────────────────────────────
  const MAX_PROOF_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB — safe Vercel payload limit

  const handleProofFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setValidationError(null);

      if (file.type === 'application/pdf') {
        if (file.size > MAX_PROOF_SIZE_BYTES) {
          setValidationError('PDF must be smaller than 3 MB.');
          if (proofFileInputRef.current) proofFileInputRef.current.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setForm((prev) => ({
            ...prev,
            paymentProofFile: { base64, mimeType: file.type, name: file.name },
          }));
        };
        reader.readAsDataURL(file);
        return;
      }

      if (file.type.startsWith('image/')) {
        try {
          setIsProcessingImage(true);
          const processedImage = await compressImage(file);

          const base64Size = Math.round((processedImage.base64.length * 3) / 4);
          if (base64Size > MAX_PROOF_SIZE_BYTES) {
            setValidationError(
              'Processed image is still larger than 3 MB. Please try a different photo.'
            );
            if (proofFileInputRef.current) proofFileInputRef.current.value = '';
            return;
          }

          setForm((prev) => ({
            ...prev,
            paymentProofFile: processedImage,
          }));
        } catch (error) {
          console.error('Image processing failed', error);
          setValidationError('Failed to process image. Please try again.');
          if (proofFileInputRef.current) proofFileInputRef.current.value = '';
        } finally {
          setIsProcessingImage(false);
        }
        return;
      }

      setValidationError('Invalid file type. Please upload an Image or PDF.');
      if (proofFileInputRef.current) proofFileInputRef.current.value = '';
    },
    [proofFileInputRef]
  );

  const removeProofFile = useCallback(() => {
    setForm((prev) => ({ ...prev, paymentProofFile: null }));
    if (proofFileInputRef.current) proofFileInputRef.current.value = '';
  }, [proofFileInputRef]);

  const handleRecordAnother = useCallback(() => {
    setForm(INITIAL_FORM);
    setSuccessData(null);
    setValidationError(null);
    transactionIdRef.current = crypto.randomUUID();
    if (proofFileInputRef.current) proofFileInputRef.current.value = '';
  }, [proofFileInputRef]);

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
              {t('forms.donationRecordedSuccess')}
            </h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto rounded-[24px] overflow-hidden border-hair shadow-sm">
            <CardContent className="p-8 space-y-8">
              <div className="text-center space-y-3">
                <CheckCircle className="w-16 h-16 text-sage mx-auto" />
                <h2 className="text-[24px] font-playfair font-bold text-ink">
                  Success!
                </h2>
                <p className="text-[14px] font-medium text-muted-ink">
                  {t('forms.donationRecordedSuccess')}
                </p>
              </div>

              <div className="bg-cream-2 rounded-[16px] p-6 text-center space-y-2 border border-hair">
                <p className="text-[13px] font-bold text-muted-ink uppercase tracking-wider">
                  {t('forms.receiptId')}
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
                  {t('forms.shareReceipt')}
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
              {t('forms.recordAnotherDonation')}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full h-[54px] text-[16px] rounded-[14px] font-bold border-hair text-ink hover:bg-hair/30"
            >
              {t('forms.returnToDashboard')}
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
            {t('forms.newDonation')}
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
              {t('forms.donorName')} <span className="text-maroon">*</span>
            </label>
            <input
              id="donorName"
              type="text"
              autoFocus
              autoComplete="off"
              placeholder={t('forms.donorNamePlaceholder')}
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
              {t('forms.phoneOptional')
                .replace(' (Optional)', '')
                .replace(' (वैकल्पिक)', '')}{' '}
              <span className="text-muted-ink text-[12px] font-medium">
                (
                {t('forms.phoneOptional').includes('Optional')
                  ? 'optional'
                  : 'वैकल्पिक'}
                )
              </span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="off"
              placeholder={t('forms.phonePlaceholder')}
              value={form.phone}
              onChange={(e) =>
                updateField(
                  'phone',
                  e.target.value.replace(/\D/g, '').slice(0, 10)
                )
              }
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
              {t('forms.amount')} <span className="text-maroon">*</span>
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
          {/* Amount Presets */}
          <div className="flex flex-wrap gap-2 mt-3">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => updateField('amount', preset)}
                className={`px-[16px] py-[10px] rounded-[24px] text-[14px] font-bold transition-all ${
                  form.amount === preset
                    ? 'bg-ink text-cream border-transparent shadow-sm'
                    : 'bg-white text-ink border border-hair hover:border-ink hover:text-ink'
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>

          {/* Purpose — Pill Chips */}
          <div>
            <label className="block text-[14px] font-bold text-ink mb-2">
              {t('forms.purpose')}{' '}
              <span className="text-muted-ink text-[12px] font-medium">
                (
                {t('forms.phoneOptional').includes('Optional')
                  ? 'optional'
                  : 'वैकल्पिक'}
                )
              </span>
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
                  {pur === 'General Donation'
                    ? t('forms.purposes.generalDonation')
                    : pur === 'Murti'
                      ? t('forms.purposes.murti')
                      : pur === 'Decoration'
                        ? t('forms.purposes.decoration')
                        : pur === 'Prasad'
                          ? t('forms.purposes.prasad')
                          : pur === 'Cultural Program'
                            ? t('forms.purposes.culturalProgram')
                            : pur === 'Other'
                              ? t('forms.purposes.other')
                              : pur}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode — Toggle Buttons */}
          <div>
            <label className="block text-[14px] font-bold text-ink mb-2">
              {t('forms.paymentMode')} <span className="text-maroon">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Cash button */}
              <button
                type="button"
                onClick={() => {
                  // Switching to Cash — clear any uploaded proof
                  setForm((prev) => ({
                    ...prev,
                    paymentMode: 'Cash',
                    paymentProofFile: null,
                  }));
                  if (proofFileInputRef.current)
                    proofFileInputRef.current.value = '';
                  setValidationError(null);
                }}
                className={`h-[48px] rounded-[12px] text-[15px] font-bold transition-all border ${
                  form.paymentMode === 'Cash'
                    ? 'bg-ink text-cream border-transparent shadow-sm'
                    : 'bg-white text-ink border-hair hover:border-ink'
                }`}
              >
                💵 {t('forms.cash')}
              </button>

              {/* UPI button — opens QR modal immediately with amount validation */}
              {(() => {
                const upiDisabled = upiConfig.loaded && !upiConfig.enabled;
                return (
                  <button
                    type="button"
                    disabled={upiDisabled}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, paymentMode: 'UPI' }));
                      setValidationError(null);
                      // Adjustment 1: validate amount before opening QR modal
                      if (upiConfig.enabled && upiConfig.upiId) {
                        const parsedAmount = Number(form.amount);
                        if (!parsedAmount || parsedAmount <= 0) {
                          setValidationError(
                            t('forms.reqValidAmount') ||
                              'Please enter a valid amount before viewing the UPI QR code.'
                          );
                          return;
                        }
                        setShowUpiModal(true);
                      }
                    }}
                    className={`h-[48px] rounded-[12px] text-[15px] font-bold transition-all border ${
                      form.paymentMode === 'UPI'
                        ? 'bg-ink text-cream border-transparent shadow-sm'
                        : upiDisabled
                          ? 'bg-hair/30 text-muted-ink border-transparent cursor-not-allowed'
                          : 'bg-white text-ink border-hair hover:border-ink'
                    }`}
                    title={
                      upiDisabled ? 'UPI payments are currently disabled' : ''
                    }
                  >
                    📱 {t('forms.upi')}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Payment Proof Upload — shown only for UPI donations */}
          {form.paymentMode === 'UPI' && (
            <div>
              <label className="block text-[14px] font-bold text-ink mb-1.5">
                {t('forms.uploadProof')
                  .replace(' (Optional)', '')
                  .replace(' (वैकल्पिक)', '')}{' '}
                <span className="text-maroon">*</span>
                <span className="text-muted-ink text-[12px] font-medium ml-1">
                  ({t('forms.reqUpiProof').split('.')[0]})
                </span>
              </label>

              {form.paymentProofFile ? (
                // File selected — show preview row
                <div className="flex items-center gap-3 p-3 rounded-[12px] border border-hair bg-cream">
                  <ImageIcon className="w-5 h-5 text-sage flex-shrink-0" />
                  <span className="flex-1 text-[14px] font-semibold text-ink truncate">
                    {form.paymentProofFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={removeProofFile}
                    className="p-1 rounded-full text-muted-ink hover:text-maroon hover:bg-maroon/10 transition-colors flex-shrink-0"
                    aria-label="Remove proof file"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // No file — show upload trigger
                <button
                  type="button"
                  onClick={() => proofFileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  className="w-full h-[56px] rounded-[12px] border-2 border-dashed border-hair bg-white text-muted-ink text-[14px] font-semibold flex items-center justify-center gap-2 hover:border-ink hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingImage ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t('forms.processingImage')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {t('forms.clickToUploadProof')}
                    </>
                  )}
                </button>
              )}

              {/* Hidden file input */}
              <input
                ref={proofFileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleProofFileChange}
              />

              <p className="text-[11px] text-muted-ink mt-1.5">
                {t('forms.imagesOrPdfMax3mb')}
              </p>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label
              htmlFor="remarks"
              className="block text-[14px] font-bold text-ink mb-1.5"
            >
              {t('forms.remarksOptional')
                .replace(' (Optional)', '')
                .replace(' (वैकल्पिक)', '')}{' '}
              <span className="text-muted-ink text-[12px] font-medium">
                (
                {t('forms.remarksOptional').includes('Optional')
                  ? 'optional'
                  : 'वैकल्पिक'}
                )
              </span>
            </label>
            <textarea
              id="remarks"
              rows={2}
              placeholder={t('forms.remarksPlaceholder')}
              value={form.remarks}
              onChange={(e) => updateField('remarks', e.target.value)}
              className="w-full px-4 py-3 rounded-[12px] border border-hair bg-white text-ink font-semibold text-[15px] placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-shadow resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting || isProcessingImage}
              className="w-full h-[54px] text-[16px] bg-ink hover:bg-ink/90 text-cream rounded-[14px] font-bold shadow-sm disabled:opacity-50 border-transparent"
            >
              <IndianRupee className="w-[18px] h-[18px] mr-2" />
              {submitting
                ? t('forms.recordingDonation')
                : t('forms.recordDonation')}
            </Button>
          </div>
        </form>
      </main>

      {/* UPI QR Payment Modal — display only, never submits a donation */}
      <UpiPaymentModal
        isOpen={showUpiModal}
        amount={Number(form.amount) || 0}
        upiId={upiConfig.upiId}
        payeeName={upiConfig.payeeName}
        onCancel={() => setShowUpiModal(false)}
      />
    </div>
  );
}
