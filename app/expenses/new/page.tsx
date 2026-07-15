'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useFeedback } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

const EXPENSE_CATEGORIES = [
  'Decoration',
  'Prasad',
  'Logistics',
  'Lighting',
  'Idol',
  'Music',
  'Miscellaneous'
];

interface ExpenseFormData {
  category: string;
  description: string;
  amount: string;
  vendor: string;
  billLink: string;
}

const INITIAL_FORM: ExpenseFormData = {
  category: '',
  description: '',
  amount: '',
  vendor: '',
  billLink: ''
};

export default function RecordExpense() {
  const router = useRouter();
  const [form, setForm] = useState<ExpenseFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Store full success data for the receipt
  const [successData, setSuccessData] = useState<{
    expenseId: string;
    amount: number;
    category: string;
  } | null>(null);

  const { showLoading, showSuccess, showError, clear } = useFeedback();

  const updateField = useCallback(
    <K extends keyof ExpenseFormData>(field: K, value: ExpenseFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setValidationError(null);
    },
    []
  );

  const validateForm = (): string | null => {
    if (!form.category) return 'Please select an expense category';
    if (!form.description.trim()) return 'Please enter a description';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      return 'Please enter a valid amount';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setValidationError(err);
      return;
    }

    setIsSubmitting(true);
    showLoading('Recording expense...');

    try {
      interface CreateExpenseResponse { expenseId: string }
      const result = await fetchApi<CreateExpenseResponse>('/expenses/create', {
        method: 'POST',
        body: {
          category: form.category,
          description: form.description.trim(),
          amount: Number(form.amount),
          vendor: form.vendor.trim() || undefined,
          billLink: form.billLink.trim() || undefined
        }
      });

      if (result.success && result.data?.expenseId) {
        setSuccessData({
          expenseId: result.data.expenseId,
          amount: Number(form.amount),
          category: form.category,
        });
        showSuccess('Expense recorded successfully!');
      } else {
        // Fallback error, the API proxy correctly bubbles this up now
        showError((result as any).error || result.message || 'Failed to record expense');
      }
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordAnother = () => {
    setForm(INITIAL_FORM);
    setSuccessData(null);
    clear();
  };

  // ── Success Screen (Receipt) ──────────────────────────────────────
  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header (Simplified) */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-center">
            <h1 className="text-lg font-bold text-slate-900">Receipt</h1>
          </div>
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
          <Card className="border-0 shadow-xl overflow-hidden rounded-2xl bg-white relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
            
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-red-600" />
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Expense Recorded
                </p>
                <h2 className="text-2xl font-bold text-slate-900">
                  {successData.expenseId}
                </h2>
              </div>

              <div className="py-6 border-y border-slate-100 border-dashed">
                <p className="text-sm text-slate-500 mb-1">Category</p>
                <p className="text-lg font-semibold text-slate-900 mb-4">
                  {successData.category}
                </p>
                
                <p className="text-sm text-slate-500 mb-1">Amount</p>
                <CurrencyDisplay
                  amount={successData.amount}
                  size="lg"
                  className="justify-center text-red-900"
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleRecordAnother}
              className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-md"
            >
              <Plus className="w-5 h-5 mr-2" />
              Record Another Expense
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full h-12 text-base rounded-xl font-semibold border-slate-300 text-slate-700"
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
            type="button"
            onClick={() => router.push('/dashboard')}
            className="p-2 -ml-2 mr-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Record Expense</h1>
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
                autoComplete="off"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                className="w-full h-14 pl-8 pr-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-xl font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => updateField('category', cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    form.category === cat
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white text-slate-600 border border-slate-300 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              id="description"
              type="text"
              autoComplete="off"
              placeholder="e.g. Bamboo purchase for tent"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Vendor */}
          <div>
            <label htmlFor="vendor" className="block text-sm font-medium text-slate-700 mb-1.5">
              Vendor <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <input
              id="vendor"
              type="text"
              autoComplete="off"
              placeholder="e.g. Sharma Traders"
              value={form.vendor}
              onChange={(e) => updateField('vendor', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Bill Link */}
          <div>
            <label htmlFor="billLink" className="block text-sm font-medium text-slate-700 mb-1.5">
              Bill/Receipt Link <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <input
              id="billLink"
              type="url"
              autoComplete="off"
              placeholder="https://drive.google.com/..."
              value={form.billLink}
              onChange={(e) => updateField('billLink', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Recording...
                </span>
              ) : (
                'Save Expense'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
