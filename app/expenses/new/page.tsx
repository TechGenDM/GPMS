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

  const transactionIdRef = useRef<string>('');
  
  useEffect(() => {
    transactionIdRef.current = crypto.randomUUID();
  }, []);

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
            transactionId: transactionIdRef.current,
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

  const handleRecordAnother = useCallback(() => {
    setForm(INITIAL_FORM);
    setSuccessData(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    transactionIdRef.current = crypto.randomUUID();
  }, []);

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
         return (
      <div className="min-h-screen bg-cream pb-20">
        <header className="bg-cream border-b border-hair sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
            <h1 className="font-playfair text-[20px] font-bold text-ink tracking-[0.02em]">
              Expense Recorded
            </h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto rounded-[24px] overflow-hidden border-hair shadow-sm">
            <CardContent className="p-8 space-y-8">
              <div className="text-center space-y-3">
                <CheckCircle className="w-16 h-16 text-sage mx-auto" />
                <h2 className="text-[24px] font-playfair font-bold text-ink">Success!</h2>
              </div>

              <div className="bg-cream-2 rounded-[16px] p-6 text-center space-y-2 border border-hair">
                <p className="text-[13px] font-bold text-muted-ink uppercase tracking-wider">
                  Expense ID
                </p>
                <p className="text-[20px] font-playfair font-bold text-ink">
                  {successData.expenseId}
                </p>
                <div className="pt-2 border-t border-hair/50 mt-3 space-y-1">
                  <p className="text-[15px] text-ink font-bold mt-2">
                    {successData.category}
                  </p>
                  <CurrencyDisplay
                    amount={successData.amount}
                    size="lg"
                    className="justify-center font-bold text-sage"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col gap-3">
                <Button
                  onClick={handleDownloadPDF}
                  className="w-full bg-ink hover:bg-ink/90 text-cream h-[48px] font-bold rounded-[12px] border-transparent"
                >
                  <Download className="w-[18px] h-[18px] mr-2" />
                  PDF Receipt
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleWhatsAppShare}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-[48px] font-bold rounded-[12px] border-transparent"
                  >
                    <MessageCircle className="w-[18px] h-[18px] mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNativeShare}
                    className="w-full h-[48px] font-bold rounded-[12px] text-ink border-hair hover:bg-hair/30"
                  >
                    <Share2 className="w-[18px] h-[18px] mr-2" />
                    More Options
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 space-y-3 max-w-md mx-auto">
            <Button
              onClick={handleRecordAnother}
              className="w-full h-[54px] text-[16px] bg-sage hover:bg-sage/90 text-white rounded-[14px] font-bold border-transparent"
            >
              <Plus className="w-[20px] h-[20px] mr-2" />
              Record Another Expense
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
    };

    return (
      <div className="min-h-screen bg-cream pb-20">
        <header className="bg-cream border-b border-hair sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
            <h1 className="font-playfair text-[20px] font-bold text-ink tracking-[0.02em]">
              Expense Recorded
            </h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto rounded-[24px] overflow-hidden border-hair shadow-sm">
            <CardContent className="p-8 space-y-8">
              <div className="text-center space-y-3">
                <CheckCircle className="w-16 h-16 text-sage mx-auto" />
                <h2 className="text-[24px] font-playfair font-bold text-ink">Success!</h2>
              </div>

              <div className="bg-cream-2 rounded-[16px] p-6 text-center space-y-2 border border-hair">
                <p className="text-[13px] font-bold text-muted-ink uppercase tracking-wider">
                  Expense ID
                </p>
                <p className="text-[20px] font-playfair font-bold text-ink">
                  {successData.expenseId}
                </p>
                <div className="pt-2 border-t border-hair/50 mt-3 space-y-1">
                  <p className="text-[15px] text-ink font-bold mt-2">
                    {successData.category}
                  </p>
                  <CurrencyDisplay
                    amount={successData.amount}
                    size="lg"
                    className="justify-center font-bold text-sage"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col gap-3">
                <Button
                  onClick={handleDownloadPDF}
                  className="w-full bg-ink hover:bg-ink/90 text-cream h-[48px] font-bold rounded-[12px] border-transparent"
                >
                  <Download className="w-[18px] h-[18px] mr-2" />
                  PDF Receipt
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleWhatsAppShare}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-[48px] font-bold rounded-[12px] border-transparent"
                  >
                    <MessageCircle className="w-[18px] h-[18px] mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNativeShare}
                    className="w-full h-[48px] font-bold rounded-[12px] text-ink border-hair hover:bg-hair/30"
                  >
                    <Share2 className="w-[18px] h-[18px] mr-2" />
                    More Options
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 space-y-3 max-w-md mx-auto">
            <Button
              onClick={handleRecordAnother}
              className="w-full h-[54px] text-[16px] bg-sage hover:bg-sage/90 text-white rounded-[14px] font-bold border-transparent"
            >
              <Plus className="w-[20px] h-[20px] mr-2" />
              Record Another Expense
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
  // ── Form State ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header */}
      <header className="bg-cream border-b border-hair sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="p-2 -ml-2 mr-2 text-muted-ink hover:text-ink rounded-lg hover:bg-hair/50 transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-playfair text-[20px] font-bold text-ink tracking-[0.02em]">
            Record Expense
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
                autoComplete="off"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                className="w-full h-[56px] pl-[36px] pr-4 rounded-[12px] border border-hair bg-white text-ink text-[24px] font-bold placeholder:text-hair focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-shadow"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[14px] font-bold text-ink mb-2">
              Category <span className="text-maroon">*</span>
            </label>
            
            {isLoadingCategories ? (
              <div className="flex items-center space-x-2 text-muted-ink py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[14px] font-semibold">Loading categories...</span>
              </div>
            ) : categoriesError ? (
              <div className="flex items-center space-x-2 text-maroon bg-[#F4E9EB] px-3 py-2 rounded-[8px] border border-maroon/20">
                <span className="text-[14px] font-semibold">{categoriesError}</span>
                <button 
                  type="button" 
                  onClick={fetchCategories}
                  className="flex items-center ml-2 px-2 py-1 bg-white border border-maroon/20 rounded-[6px] text-[12px] font-bold hover:bg-maroon/5 transition-colors"
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
                    className={`px-[16px] py-[10px] rounded-[24px] text-[14px] font-bold transition-all ${
                      form.category === cat
                        ? 'bg-ink text-cream border-transparent shadow-sm'
                        : 'bg-white text-ink border border-hair hover:border-ink hover:text-ink'
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
              className="block text-[14px] font-bold text-ink mb-1.5"
            >
              Description <span className="text-maroon">*</span>
            </label>
            <input
              id="description"
              type="text"
              autoComplete="off"
              placeholder="e.g. Bamboo purchase for tent"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full h-[48px] px-4 rounded-[12px] border border-hair bg-white text-ink font-semibold text-[15px] placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-shadow"
            />
          </div>

          {/* Vendor */}
          <div>
            <label
              htmlFor="vendor"
              className="block text-[14px] font-bold text-ink mb-1.5"
            >
              Vendor <span className="text-muted-ink text-[12px] font-medium">(optional)</span>
            </label>
            <input
              id="vendor"
              type="text"
              autoComplete="off"
              placeholder="e.g. Sharma Traders"
              value={form.vendor}
              onChange={(e) => updateField('vendor', e.target.value)}
              className="w-full h-[48px] px-4 rounded-[12px] border border-hair bg-white text-ink font-semibold text-[15px] placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-shadow"
            />
          </div>

          {/* Bill Upload */}
          <div>
            <label
              htmlFor="billFile"
              className="block text-[14px] font-bold text-ink mb-1.5"
            >
              Upload Bill <span className="text-muted-ink text-[12px] font-medium">(optional, PDF/JPG/PNG up to 5MB)</span>
            </label>
            
            {form.billFile ? (
              <div className="flex items-center justify-between p-3 border border-hair bg-white rounded-[12px] shadow-sm">
                <div className="flex items-center truncate mr-3">
                  <div className="p-2 bg-sage/10 rounded-lg text-sage mr-3">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-[14px] font-bold text-ink truncate">{form.billFile.name}</p>
                    <p className="text-[12px] font-medium text-muted-ink">Ready to upload</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 text-muted-ink hover:text-maroon hover:bg-maroon/10 rounded-lg transition-colors"
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
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-hair bg-cream hover:bg-hair/30 rounded-[16px] transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-ink mb-2" />
                  <p className="text-[14px] font-bold text-ink">Tap to select a file</p>
                  <p className="text-[12px] font-medium text-muted-ink mt-1">PDF, JPG, PNG (Max 5MB)</p>
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingCategories}
              className="w-full h-[54px] text-[16px] bg-ink hover:bg-ink/90 text-cream rounded-[14px] font-bold shadow-sm disabled:opacity-50 border-transparent"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-[18px] h-[18px] animate-spin mr-2" />
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
