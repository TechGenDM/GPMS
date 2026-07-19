'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  RefreshCw,
  Calendar,
  AlertCircle,
  Users,
  Activity,
  FileText,
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
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const feedback = useFeedback();

  const userRole = session?.user?.role;
  const canManageUsers = userRole === 'Admin' || userRole === 'SuperAdmin';

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
          }
        );

        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to load dashboard data');
        }
      } catch (err) {
        setError('Error connecting to server. Please try again.');
      } finally {
        if (isRefresh) setRefreshing(false);
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
    'bg-[#B4823A]', // gold-soft
    'bg-[#C9832E]', // gold
    'bg-[#170F26]', // ink
    'bg-[#241A3D]', // ink-2
    'bg-[#798C7B]', // sage
    'bg-[#A4434F]', // maroon
    'bg-[#E66255]', // ember
    'bg-[#32234A]', // ink-glow
  ];

  return (
    <div className="min-h-screen bg-cream pb-20 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between p-[18px_20px] bg-cream border-b border-hair sticky top-0 z-10">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-[9px]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#B4823A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#B4823A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#B4823A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-playfair font-bold text-[18px] text-transparent bg-clip-text bg-gradient-to-br from-gold-soft to-ember tracking-[0.02em]">GPMS</span>
          </div>
          <div className="flex items-center gap-1">
            {canManageUsers && (
              <>
                <button
                  onClick={() => router.push('/audit')}
                  className="p-[6px] rounded-lg text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors flex items-center gap-1"
                  title="Audit Logs"
                  aria-label="Audit Logs"
                >
                  <Activity className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline text-[13px] font-semibold">Audit Logs</span>
                </button>
                <button
                  onClick={() => router.push('/users')}
                  className="p-[6px] rounded-lg text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors flex items-center gap-1"
                  title="Users"
                  aria-label="Users"
                >
                  <Users className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline text-[13px] font-semibold">Users</span>
                </button>
              </>
            )}
            <button
              onClick={() => router.push('/records')}
              className="p-[6px] rounded-lg text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors flex items-center gap-1"
              title="Records"
              aria-label="Records"
            >
              <FileText className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline text-[13px] font-semibold">Records</span>
            </button>
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="p-[6px] rounded-lg text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors disabled:opacity-50"
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-[18px] h-[18px] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-[6px] rounded-lg text-muted-ink hover:text-maroon hover:bg-maroon/5 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Error State */}
        {error && !data && (
          <Card className="border-maroon/20 bg-[#F4E9EB] shadow-sm rounded-[24px]">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-maroon mx-auto mb-3" />
              <p className="text-maroon font-bold mb-1">
                Could not load dashboard
              </p>
              <p className="text-maroon/80 text-[13px] font-bold mb-4">{error}</p>
              <button
                onClick={() => loadDashboard()}
                className="inline-flex items-center gap-2 text-[14px] font-bold text-maroon bg-white border border-maroon/20 hover:bg-maroon/5 px-4 py-2 rounded-[12px] transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </CardContent>
          </Card>
        )}

        {/* Balance Card */}
        {!data && !error ? (
          /* Skeleton */
          <Card className="bg-ink border-transparent shadow-md relative h-[120px]">
            <CardContent className="pt-[24px] pb-[20px] text-center animate-pulse flex flex-col items-center justify-center h-full">
              <div className="h-4 w-28 bg-ink-glow rounded mx-auto mb-3" />
              <div className="h-9 w-40 bg-ink-glow rounded-lg mx-auto" />
            </CardContent>
          </Card>
        ) : data ? (
          <Card className="bg-ink border-transparent shadow-md text-cream relative">
            <CardContent className="pt-[24px] pb-[20px] text-center flex flex-col justify-center h-full">
              <p className="text-cream/80 text-[12.5px] font-semibold uppercase tracking-wider mb-2">Current Balance</p>
              <div className="flex justify-center text-white font-playfair font-bold text-[36px] tracking-[-0.03em] leading-none">
                <span className="font-sans mr-[2px]">₹</span>{fmt(data.summary.balance)}
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold-soft to-ember" />
          </Card>
        ) : null}

        {/* Collections & Expenses Cards */}
        {!data && !error ? (
          /* Skeleton */
          <div className="grid grid-cols-2 gap-4 animate-pulse">
            <Card className="h-[140px]">
              <CardContent className="p-5 space-y-3">
                <div className="h-3 w-20 bg-hair rounded" />
                <div className="h-7 w-28 bg-hair rounded" />
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-cream-2 rounded" />
                  <div className="h-3 w-full bg-cream-2 rounded" />
                </div>
              </CardContent>
            </Card>
            <Card className="h-[140px]">
              <CardContent className="p-5 space-y-3">
                <div className="h-3 w-20 bg-hair rounded" />
                <div className="h-7 w-28 bg-hair rounded" />
              </CardContent>
            </Card>
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-4">
            <Card className="relative flex flex-col">
              <CardContent className="p-5 flex-1">
                <div className="flex items-center text-[12.5px] font-semibold text-muted-ink uppercase tracking-wider mb-2">
                  <ArrowUpRight className="w-4 h-4 mr-1 text-sage" />
                  Collections
                </div>
                <div className="font-playfair font-bold text-[32px] text-ink tracking-[-0.03em] leading-none mb-3">
                  <span className="font-sans mr-[2px]">₹</span>{fmt(data.summary.donations.total)}
                </div>
                <div className="text-[13px] text-muted-ink space-y-1">
                  <div className="flex justify-between">
                    <span>Cash</span>
                    <span className="font-semibold text-ink">₹{fmt(data.summary.donations.cash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UPI</span>
                    <span className="font-semibold text-ink">₹{fmt(data.summary.donations.upi)}</span>
                  </div>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold-soft to-ember" />
            </Card>

            <Card className="relative flex flex-col">
              <CardContent className="p-5 flex-1">
                <div className="flex items-center text-[12.5px] font-semibold text-muted-ink uppercase tracking-wider mb-2">
                  <ArrowDownRight className="w-4 h-4 mr-1 text-maroon" />
                  Expenses
                </div>
                <div className="font-playfair font-bold text-[32px] text-ink tracking-[-0.03em] leading-none mb-3">
                  <span className="font-sans mr-[2px]">₹</span>{fmt(data.summary.expenses.total)}
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold-soft to-ember" />
            </Card>
          </div>
        ) : null}

        {/* Today's Stats */}
        {!data && !error ? (
          /* Skeleton */
          <div className="grid grid-cols-2 gap-4 animate-pulse">
            <Card>
              <CardContent className="p-4">
                <div className="h-3 w-28 bg-hair rounded mb-2" />
                <div className="h-6 w-20 bg-hair rounded" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="h-3 w-28 bg-hair rounded mb-2" />
                <div className="h-6 w-20 bg-hair rounded" />
              </CardContent>
            </Card>
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1 text-[12.5px] font-semibold text-muted-ink uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-sage" />
                  <span>Today's Col</span>
                </div>
                <p className="text-[20px] font-playfair font-bold text-ink">
                  +₹{fmt(data.summary.donations.today)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1 text-[12.5px] font-semibold text-muted-ink uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-maroon" />
                  <span>Today's Exp</span>
                </div>
                <p className="text-[20px] font-playfair font-bold text-ink">
                  -₹{fmt(data.summary.expenses.today)}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Expense by Category */}
        {data && categoryEntries.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="font-playfair font-bold text-[22px] text-ink tracking-[0.02em]">
              Expenses by Category
            </h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                {categoryEntries.map(([cat, amount], idx) => (
                  <div key={cat}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[14px] font-semibold text-ink truncate pr-2">
                        {cat}
                      </span>
                      <span className="text-[14px] font-bold text-ink shrink-0">
                        ₹{fmt(amount)}
                      </span>
                    </div>
                    <div className="w-full bg-cream-2 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${catColors[idx % catColors.length]}`}
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
        <div className="space-y-4 pt-4">
          <h2 className="font-playfair font-bold text-[22px] text-ink tracking-[0.02em]">
            Recent Activity
          </h2>

          {!data ? (
            // Skeleton loader
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-hair rounded"></div>
                      <div className="h-3 w-32 bg-cream-2 rounded"></div>
                    </div>
                    <div className="h-5 w-16 bg-hair rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data.recentActivity.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-ink font-semibold">
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
                        className={`p-2 rounded-full mr-3 shrink-0 ${activity.type === 'Donation' ? 'bg-[#EAF3EA] text-sage' : 'bg-[#F4E9EB] text-maroon'}`}
                      >
                        {activity.type === 'Donation' ? (
                          <ArrowUpRight className="w-[18px] h-[18px]" />
                        ) : (
                          <ArrowDownRight className="w-[18px] h-[18px]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="font-bold text-[14px] text-ink truncate pr-2"
                          title={activity.title}
                        >
                          {activity.title || 'Untitled'}
                        </p>
                        <p className="text-[12px] font-medium text-muted-ink">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-bold text-[15px] ${activity.type === 'Donation' ? 'text-sage' : 'text-ink'}`}
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
          className="flex-1 h-[56px] bg-gradient-to-r from-gold-soft to-ember text-white rounded-[14px] font-bold text-[16px] shadow-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Donation
        </button>
        <button
          onClick={() => router.push('/expenses/new')}
          className="flex-1 h-[56px] bg-white border border-hair text-ink rounded-[14px] font-bold text-[16px] shadow-sm flex items-center justify-center gap-2 transition-all hover:bg-hair/30 active:scale-[0.98]"
        >
          <Minus className="w-5 h-5" />
          Expense
        </button>
      </div>
    </div>
  );
}
