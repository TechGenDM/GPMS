'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  Plus,
  Loader2,
  Download,
  Share2,
  MessageCircle,
  Upload,
  X,
  RefreshCw,
} from 'lucide-react';
import { parseGPMSDate } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import { generateAndDownloadExpenseRecord } from '@/lib/pdfGenerator';
import { useFeedback } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

interface ExpenseFormData {
  category: string;
  description: string;
  amount: string;
  vendor: string;
  billFile: { base64: string; mimeType: string; name: string } | null;
}

const INITIAL_FORM: ExpenseFormData = {
  category: '',
  description: '',
  amount: '',
  vendor: '',
  billFile: null,
};

export default function RecordExpense() {
  const router = useRouter();
  const [form, setForm] = useState<ExpenseFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store full success data for the receipt
  const [successData, setSuccessData] = useState<{
    expenseId: string;
    amount: number;
    category: string;
    description: string;
    vendor: string;
    paidBy: string;
    date: string;
    billLink: string;
  } | null>(null);

  const { showLoading, showSuccess, showError, clear } = useFeedback();

  const fetchCategories = useCallback(() => {
    let ignore = false;
    const load = async () => {
      setIsLoadingCategories(true);
      setCategoriesError(null);
      try {
        const result = await fetchApi<string[]>('/categories', { method: 'GET' });
        if (!ignore) {
          if (result.success && result.data) {
            setCategories(result.data);
          } else {
            setCategoriesError(result.message || 'Failed to load categories');
          }
        }
      } catch (err) {
        if (!ignore) {
          setCategoriesError('Failed to load categories');
        }
      } finally {
        if (!ignore) {
          setIsLoadingCategories(false);
        }
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    const cleanup = fetchCategories();
    return cleanup;
  }, [fetchCategories]);

  const updateField = useCallback(
    <K extends keyof ExpenseFormData>(field: K, value: ExpenseFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setValidationError(null);
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('File is too large. Maximum size is 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setValidationError('Invalid file type. Only PDF, JPG, and PNG are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setValidationError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateField('billFile', {
        base64: base64String,
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    updateField('billFile', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = (): string | null => {
    if (!form.category) return 'Please select an expense category';
    if (!form.description.trim()) return 'Please enter a description';
    if (
      !form.amount ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
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

    try {
      interface CreateExpenseResponse {
        id: string;
        category: string;
        description: string;
        vendor: string;
        amount: number;
        paidBy: string;
        date: string;
        billLink: string;
      }
      const result = await fetchApi<CreateExpenseResponse>(
        '/expenses/create',
        {
          method: 'POST',
          body: {
            category: form.category,
            description: form.description.trim(),
            amount: Number(form.amount),
            vendor: form.vendor.trim() || '',
            billFile: form.billFile,
          },
          showLoading: true,
          loadingMessage: 'Recording expense...',
        },
        { showLoading, showSuccess, showError, clear }
      );

      if (result.success && result.data?.id) {
        setSuccessData({
          expenseId: result.data.id,
          amount: Number(form.amount),
          category: result.data.category,
          description: result.data.description,
          vendor: result.data.vendor,
          paidBy: result.data.paidBy,
          date: result.data.date,
          billLink: result.data.billLink,
        });
      } else if (!result.success) {
        showError(result.message || 'Failed to record expense');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError(err.message || 'An unexpected error occurred');
      } else {
        showError('An unexpected error occurred');
      }
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
    const verificationUrl = `${window.location.origin}/verify/expense/${successData.expenseId}`;

    const handleDownloadPDF = async () => {
      try {
        await generateAndDownloadExpenseRecord({
          expenseId: successData.expenseId,
          category: successData.category,
          description: successData.description,
          vendor: successData.vendor,
          amount: successData.amount,
          paidBy: successData.paidBy,
          date: successData.date,
          billLink: successData.billLink,
        });
        showSuccess('Record downloaded');
      } catch (e) {
        showError('Failed to generate PDF');
      }
    };

    const handleWhatsAppShare = () => {
      const dateStr = parseGPMSDate(successData.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const text = `Official Expense Record for GPMS 2026\n\nExpense ID: ${successData.expenseId}\nCategory: ${successData.category}\nAmount: \u20B9${successData.amount.toLocaleString('en-IN')}\nPaid By: ${successData.paidBy}\nDate: ${dateStr}\n\nVerify this expense record:\n${verificationUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleNativeShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'GPMS Expense Record',
            text: `Official Expense Record of \u20B9${successData.amount.toLocaleString('en-IN')} for GPMS 2026.`,
            url: verificationUrl,
          });
        } catch (e) {
          // User cancelled or failed
        }
      } else {
        showError('Native sharing is not supported on this device');
      }
    };

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

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={handleDownloadPDF}
                  className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-md"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Expense PDF
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleWhatsAppShare}
                    className="w-full h-12 text-base font-semibold border-slate-300 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNativeShare}
                    className="w-full h-12 text-base font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    More Options
                  </Button>
                </div>
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Record Expense
          </h1>
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
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg">
                ₹
              </span>
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
            
            {isLoadingCategories ? (
              <div className="flex items-center space-x-2 text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading categories...</span>
              </div>
            ) : categoriesError ? (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                <span className="text-sm">{categoriesError}</span>
                <button 
                  type="button" 
                  onClick={fetchCategories}
                  className="flex items-center ml-2 px-2 py-1 bg-white border border-red-200 rounded text-xs hover:bg-red-50 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
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
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
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
            <label
              htmlFor="vendor"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
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

          {/* Bill Upload */}
          <div>
            <label
              htmlFor="billFile"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Upload Bill <span className="text-slate-400 text-xs">(optional, PDF/JPG/PNG up to 5MB)</span>
            </label>
            
            {form.billFile ? (
              <div className="flex items-center justify-between p-3 border border-slate-200 bg-white rounded-xl shadow-sm">
                <div className="flex items-center truncate mr-3">
                  <div className="p-2 bg-red-50 rounded-lg text-red-600 mr-3">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-700 truncate">{form.billFile.name}</p>
                    <p className="text-xs text-slate-400">Ready to upload</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  ref={fileInputRef}
                  id="billFile"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">Tap to select a file</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingCategories}
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
