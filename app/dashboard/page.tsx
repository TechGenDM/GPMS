'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  RefreshCw,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useFeedback } from '@/components/ui/Feedback';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Button } from '@/components/ui/button';

interface DashboardSummary {
  donations: { total: number; today: number; cash: number; upi: number };
  expenses: { total: number; today: number };
  expensesByCategory: Record<string, number>;
  balance: number;
}

interface Activity {
  type: 'Donation' | 'Expense';
  id: string;
  date: string;
  title: string;
  amount: number;
  status: string;
}

interface DashboardData {
  summary: DashboardSummary;
  recentActivity: Activity[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const feedback = useFeedback();

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        setError(null);

        const res = await fetchApi<DashboardData>(
          '/dashboard/summary',
          {
            method: 'POST',
            showLoading: !isRefresh,
            loadingMessage: 'Loading dashboard...',
          },
          isRefresh ? undefined : feedback
        );

        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to load dashboard');
        }
      } catch {
        setError('Network error — please check your connection');
      } finally {
        setRefreshing(false);
      }
    },
    [feedback]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  // Sort categories by amount descending for the breakdown
  const categoryEntries = data?.summary.expensesByCategory
    ? Object.entries(data.summary.expensesByCategory).sort(
        ([, a], [, b]) => b - a
      )
    : [];
  const maxCategoryAmount =
    categoryEntries.length > 0 ? categoryEntries[0][1] : 0;

  // Category bar colours — rotate through a palette
  const catColors = [
    'bg-red-500',
    'bg-amber-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-orange-500',
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            GPMS Dashboard
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="text-slate-500 hover:text-slate-900"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-slate-600 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Error State */}
        {error && !data && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 font-medium mb-1">
                Could not load dashboard
              </p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => loadDashboard()}
                className="inline-flex items-center gap-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </CardContent>
          </Card>
        )}

        {/* Balance Card */}
        {!data && !error ? (
          /* Skeleton */
          <Card className="bg-blue-600 border-transparent shadow-md">
            <CardContent className="pt-6 pb-4 text-center animate-pulse">
              <div className="h-4 w-28 bg-blue-400 rounded mx-auto mb-3" />
              <div className="h-9 w-40 bg-blue-400 rounded-lg mx-auto" />
            </CardContent>
          </Card>
        ) : data ? (
          <Card className="bg-blue-600 border-transparent shadow-md text-white">
            <CardContent className="pt-6 text-center">
              <p className="text-blue-100 font-medium mb-1">Current Balance</p>
              <CurrencyDisplay
                amount={data.summary.balance}
                size="xl"
                className="justify-center text-white font-extrabold tracking-tighter"
              />
            </CardContent>
          </Card>
        ) : null}

        {/* Collections & Expenses Cards */}
        {!data && !error ? (
          /* Skeleton */
          <div className="grid grid-cols-2 gap-4 animate-pulse">
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-7 w-28 bg-slate-200 rounded" />
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-7 w-28 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 font-medium flex items-center">
                  <ArrowUpRight className="w-4 h-4 mr-1 text-green-500" />
                  Collections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CurrencyDisplay
                  amount={data.summary.donations.total}
                  size="md"
                />
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Cash</span>
                    <span className="font-medium">
                      ₹{fmt(data.summary.donations.cash)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>UPI</span>
                    <span className="font-medium">
                      ₹{fmt(data.summary.donations.upi)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 font-medium flex items-center">
                  <ArrowDownRight className="w-4 h-4 mr-1 text-red-500" />
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CurrencyDisplay
                  amount={data.summary.expenses.total}
                  size="md"
                />
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Today's Stats */}
        {!data && !error ? (
          /* Skeleton */
          <div className="grid grid-cols-2 gap-4 animate-pulse">
            <Card>
              <CardContent className="p-4">
                <div className="h-3 w-28 bg-slate-200 rounded mb-2" />
                <div className="h-6 w-20 bg-slate-200 rounded" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="h-3 w-28 bg-slate-200 rounded mb-2" />
                <div className="h-6 w-20 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-slate-500 font-medium">
                    Today&apos;s Collections
                  </span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  +₹{fmt(data.summary.donations.today)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs text-slate-500 font-medium">
                    Today&apos;s Expenses
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-900">
                  -₹{fmt(data.summary.expenses.today)}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Expense by Category */}
        {data && categoryEntries.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              Expenses by Category
            </h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                {categoryEntries.map(([cat, amount], idx) => (
                  <div key={cat}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium text-slate-700 truncate pr-2">
                        {cat}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 shrink-0">
                        ₹{fmt(amount)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${catColors[idx % catColors.length]}`}
                        style={{
                          width: `${maxCategoryAmount > 0 ? (amount / maxCategoryAmount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Recent Activity
          </h2>

          {!data ? (
            // Skeleton loader
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      <div className="h-3 w-32 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-5 w-16 bg-slate-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data.recentActivity.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">
                <p>No recent activity found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((activity, idx) => (
                <Card key={`${activity.id}-${idx}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center overflow-hidden">
                      <div
                        className={`p-2 rounded-full mr-3 shrink-0 ${activity.type === 'Donation' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                      >
                        {activity.type === 'Donation' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="font-medium text-slate-900 truncate pr-2"
                          title={activity.title}
                        >
                          {activity.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-semibold ${activity.type === 'Donation' ? 'text-green-600' : 'text-slate-900'}`}
                      >
                        {activity.type === 'Donation' ? '+' : '-'}₹
                        {fmt(activity.amount)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Buttons — Primary volunteer actions */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-10 max-w-3xl mx-auto flex gap-3">
        <button
          onClick={() => router.push('/donations/new')}
          className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Donation
        </button>
        <button
          onClick={() => router.push('/expenses/new')}
          className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Minus className="w-5 h-5" />
          Expense
        </button>
      </div>
    </div>
  );
}
