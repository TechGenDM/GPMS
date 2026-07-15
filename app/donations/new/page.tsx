'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, IndianRupee, Plus } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useFeedback } from '@/components/ui/Feedback';
import { Card, CardContent } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Button } from '@/components/ui/button';

// ── Constants matching backend expectations ──────────────────────────
const CATEGORIES = [
  'General Donation',
  'Prasad',
  'Decoration',
  'Puja Items',
  'Other',
] as const;

const PAYMENT_MODES = ['Cash', 'UPI'] as const;

// ── Types ────────────────────────────────────────────────────────────
interface DonationFormData {
  donorName: string;
  amount: string;
  category: string;
  paymentMode: string;
  upiReference: string;
  remarks: string;
}

interface CreateDonationResponse {
  id: string;
}

const INITIAL_FORM: DonationFormData = {
  donorName: '',
  amount: '',
  category: CATEGORIES[0],
  paymentMode: PAYMENT_MODES[0],
  upiReference: '',
  remarks: '',
};

// ── Validation ───────────────────────────────────────────────────────
function validateForm(form: DonationFormData): string | null {
  if (!form.donorName.trim()) return 'Donor name is required';
  if (!form.amount || Number(form.amount) <= 0) return 'Amount must be greater than zero';
  if (!form.category) return 'Please select a category';
  if (!form.paymentMode) return 'Please select a payment mode';
  return null;
}

// ══════════════════════════════════════════════════════════════════════
// Page Component
// ══════════════════════════════════════════════════════════════════════
export default function NewDonationPage() {
  const router = useRouter();
  const feedback = useFeedback();

  const [form, setForm] = useState<DonationFormData>(INITIAL_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Success state
  const [successData, setSuccessData] = useState<{
    id: string;
    donorName: string;
    amount: number;
  } | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof DonationFormData>(field: K, value: DonationFormData[K]) => {
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

      // Build remarks: prepend UPI ref if present
      let remarks = form.remarks.trim();
      if (form.paymentMode === 'UPI' && form.upiReference.trim()) {
        remarks = `UPI Ref: ${form.upiReference.trim()}${remarks ? ' | ' + remarks : ''}`;
      }

      const res = await fetchApi<CreateDonationResponse>('/donations/create', {
        method: 'POST',
        body: {
          donorName: form.donorName.trim(),
          amount: Number(form.amount),
          category: form.category,
          paymentMode: form.paymentMode,
          remarks,
        },
        showLoading: true,
        loadingMessage: 'Recording donation...',
      }, feedback);

      setSubmitting(false);

      if (res.success && res.data) {
        setSuccessData({
          id: res.data.id,
          donorName: form.donorName.trim(),
          amount: Number(form.amount),
        });
      }
    },
    [form, feedback]
  );

  const handleRecordAnother = useCallback(() => {
    setForm(INITIAL_FORM);
    setSuccessData(null);
    setValidationError(null);
  }, []);

  // ── Success State ────────────────────────────────────────────────
  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Donation Recorded</h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <p className="text-sm text-green-700 font-medium mb-1">Donation ID</p>
                <p className="text-lg font-bold text-green-900 font-mono">{successData.id}</p>
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium mb-1">{successData.donorName}</p>
                <CurrencyDisplay
                  amount={successData.amount}
                  size="lg"
                  className="justify-center text-green-900"
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleRecordAnother}
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Record Another Donation
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full h-12 text-base rounded-xl font-semibold border-slate-300"
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
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 -ml-2 mr-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Record Donation</h1>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Validation Error Banner */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
              {validationError}
            </div>
          )}

          {/* Donor Name */}
          <div>
            <label htmlFor="donorName" className="block text-sm font-medium text-slate-700 mb-1.5">
              Donor Name <span className="text-red-500">*</span>
            </label>
            <input
              id="donorName"
              type="text"
              autoFocus
              autoComplete="off"
              placeholder="Enter donor's name"
              value={form.donorName}
              onChange={(e) => updateField('donorName', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1.5">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg">₹</span>
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
                className="w-full h-14 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-2xl font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Category — Pill Chips */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => updateField('category', cat)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    form.category === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode — Toggle Buttons */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Payment Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateField('paymentMode', mode)}
                  className={`h-12 rounded-xl text-base font-semibold transition-all ${
                    form.paymentMode === mode
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-400'
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
              <label htmlFor="upiRef" className="block text-sm font-medium text-slate-700 mb-1.5">
                UPI Reference <span className="text-slate-400 text-xs">(optional)</span>
              </label>
              <input
                id="upiRef"
                type="text"
                autoComplete="off"
                placeholder="Transaction ID or UPI ref number"
                value={form.upiReference}
                onChange={(e) => updateField('upiReference', e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 mb-1.5">
              Remarks <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <textarea
              id="remarks"
              rows={2}
              placeholder="Any additional notes"
              value={form.remarks}
              onChange={(e) => updateField('remarks', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm mt-2 disabled:opacity-50"
          >
            <IndianRupee className="w-5 h-5 mr-2" />
            Record Donation
          </Button>
        </form>
      </main>
    </div>
  );
}
