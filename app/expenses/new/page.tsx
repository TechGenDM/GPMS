'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, IndianRupee, Minus, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useFeedback } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';

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
  const [formData, setFormData] = useState<ExpenseFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const { showLoading, showSuccess, showError, clear } = useFeedback();

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clear();
  }, [clear]);

  const validateForm = (): boolean => {
    if (!formData.category) {
      showError('Please select an expense category');
      return false;
    }
    if (!formData.description.trim()) {
      showError('Please enter a description');
      return false;
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      showError('Please enter a valid amount');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    showLoading('Recording expense...');

    try {
      interface CreateExpenseResponse { expenseId: string }
      const result = await fetchApi<CreateExpenseResponse>('/expenses/create', {
        method: 'POST',
        body: {
          category: formData.category,
          description: formData.description.trim(),
          amount: Number(formData.amount),
          vendor: formData.vendor.trim() || undefined,
          billLink: formData.billLink.trim() || undefined
        }
      });

      if (result.success) {
        setSuccessId(result.data?.expenseId || null);
        showSuccess('Expense recorded successfully!');
      } else {
        showError(result.message || 'Failed to record expense');
      }
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setSuccessId(null);
    clear();
  };

  if (successId) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-12">
        <Card className="p-8 text-center space-y-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Expense Recorded</h2>
            <p className="text-gray-600">The expense has been successfully logged.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-red-100 space-y-2">
            <p className="text-sm text-gray-500">Expense ID</p>
            <p className="text-lg font-mono font-medium text-gray-900">{successId}</p>
          </div>

          <div className="pt-6 space-y-3">
            <Button onClick={resetForm} className="w-full bg-red-600 hover:bg-red-700 text-white shadow-md">
              <Minus className="w-4 h-4 mr-2" /> Record Another Expense
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="w-full border-red-200 text-red-700 hover:bg-red-50"
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Record Expense</h1>
          <p className="text-sm text-gray-500">Log a new expense to the GPMS Database</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Amount (Hero Input) */}
        <Card className="p-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Amount (₹) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IndianRupee className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="block w-full pl-12 pr-4 py-4 text-3xl font-bold text-gray-900 border-gray-300 rounded-xl focus:ring-red-500 focus:border-red-500 bg-gray-50 transition-colors placeholder:text-gray-300"
                placeholder="0"
                required
                min="1"
                step="0.01"
              />
            </div>
          </div>
        </Card>

        {/* Category Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Category *</label>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, category }));
                  clear();
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  formData.category === category
                    ? 'bg-red-600 text-white shadow-md scale-105'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-red-200 hover:bg-red-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Details Section */}
        <Card className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="e.g. Bamboo purchase for tent"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Vendor (Optional)</label>
            <input
              type="text"
              name="vendor"
              value={formData.vendor}
              onChange={handleInputChange}
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="e.g. Sharma Traders"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Bill/Receipt Link (Optional)</label>
            <input
              type="url"
              name="billLink"
              value={formData.billLink}
              onChange={handleInputChange}
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="https://drive.google.com/..."
            />
            <p className="text-xs text-gray-500">Paste a Google Drive or image URL for the receipt</p>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="pt-4 pb-12">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Recording...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Save Expense
              </span>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}
