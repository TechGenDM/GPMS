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
  ChevronRight,
  X,
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

// ─── YouTube URL Validation ────────────────────────────────
const YOUTUBE_URL_PATTERN = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|live\/|@[\w.-]+\/live)|youtu\.be\/)/i;

function isValidYoutubeUrl(url: string): boolean {
  if (!url.trim()) return true; // empty is valid (clearing)
  return YOUTUBE_URL_PATTERN.test(url.trim());
}

// ─── Live Darshan Config ───────────────────────────────────
interface LiveDarshanConfig {
  youtubeUrl: string;
  updatedAt: string;
  updatedBy: string;
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
  const canManageLiveDarshan = userRole === 'SuperAdmin' || userRole === 'Admin' || userRole === 'Volunteer';

  // Live Darshan state
  const [liveDarshanModalOpen, setLiveDarshanModalOpen] = useState(false);
  const [liveDarshanConfig, setLiveDarshanConfig] = useState<LiveDarshanConfig | null>(null);
  const [liveDarshanUrl, setLiveDarshanUrl] = useState('');
  const [liveDarshanSaving, setLiveDarshanSaving] = useState(false);
  const [liveDarshanError, setLiveDarshanError] = useState<string | null>(null);

  // Fetch Live Darshan config
  const loadLiveDarshanConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/live-darshan');
      const json = await res.json();
      if (json.success && json.data) {
        setLiveDarshanConfig(json.data);
      }
    } catch {
      // Silently fail — not critical for dashboard load
    }
  }, []);

  useEffect(() => {
    if (canManageLiveDarshan) {
      loadLiveDarshanConfig();
    }
  }, [canManageLiveDarshan, loadLiveDarshanConfig]);

  const openLiveDarshanModal = () => {
    setLiveDarshanUrl(liveDarshanConfig?.youtubeUrl || '');
    setLiveDarshanError(null);
    setLiveDarshanModalOpen(true);
  };

  const saveLiveDarshanUrl = async () => {
    const trimmedUrl = liveDarshanUrl.trim();

    // Frontend validation
    if (trimmedUrl && !isValidYoutubeUrl(trimmedUrl)) {
      setLiveDarshanError('Invalid YouTube URL. Use youtube.com/watch?v=, youtube.com/live/, or youtu.be/ format.');
      return;
    }

    setLiveDarshanSaving(true);
    setLiveDarshanError(null);

    try {
      const res = await fetch('/api/settings/live-darshan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: trimmedUrl }),
      });
      const json = await res.json();

      if (json.success) {
        feedback.showSuccess('Live Darshan updated successfully.');
        setLiveDarshanModalOpen(false);
        loadLiveDarshanConfig();
      } else {
        setLiveDarshanError(json.message || 'Couldn\u2019t update Live Darshan. Please try again.');
      }
    } catch {
      setLiveDarshanError('Couldn\u2019t update Live Darshan. Please try again.');
    } finally {
      setLiveDarshanSaving(false);
    }
  };

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

        {/* Live Darshan Card */}
        {canManageLiveDarshan && (
          <button
            onClick={openLiveDarshanModal}
            className="w-full text-left"
          >
            <Card className="relative overflow-hidden border-gold-soft/30 hover:border-gold-soft/60 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                {/* Broadcast icon */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9832E]/15 to-[#E66255]/15 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9832E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
                    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
                    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
                    <circle cx="12" cy="12" r="2" fill="#C9832E" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-ink">Live Darshan</span>
                    {liveDarshanConfig?.youtubeUrl ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-sage/15 text-sage px-2 py-0.5 rounded-full">Configured</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-muted-ink/10 text-muted-ink px-2 py-0.5 rounded-full">Not configured</span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted-ink mt-0.5 truncate">
                    {liveDarshanConfig?.youtubeUrl
                      ? 'YouTube Live is configured'
                      : 'Tap to configure YouTube Live URL'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-ink shrink-0" />
              </CardContent>
            </Card>
          </button>
        )}

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

      {/* Live Darshan Modal */}
      {liveDarshanModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-md shadow-xl max-h-[85vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9832E]/15 to-[#E66255]/15 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9832E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
                    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
                    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
                    <circle cx="12" cy="12" r="2" fill="#C9832E" />
                  </svg>
                </div>
                <h2 className="text-[18px] font-bold text-ink">Live Darshan</h2>
              </div>
              <button
                onClick={() => setLiveDarshanModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[13px] text-muted-ink">
                Paste your YouTube Live link to show on the public page.
              </p>

              {/* URL Input */}
              <div>
                <label className="text-[12.5px] font-semibold text-ink uppercase tracking-wider block mb-1.5">
                  YouTube Live URL
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none">
                      <rect width="24" height="24" rx="4" fill="#FF0000" />
                      <path d="M10 8.5v7l6-3.5-6-3.5z" fill="white" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={liveDarshanUrl}
                    onChange={(e) => {
                      setLiveDarshanUrl(e.target.value);
                      setLiveDarshanError(null);
                    }}
                    placeholder="https://www.youtube.com/live/..."
                    className="w-full pl-10 pr-4 py-3 bg-cream border border-hair rounded-xl text-[14px] text-ink placeholder:text-muted-ink/50 focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft/30 transition-colors"
                  />
                </div>
                {liveDarshanError && (
                  <p className="text-[12px] text-maroon mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {liveDarshanError}
                  </p>
                )}
              </div>

              {/* Instruction */}
              <div className="flex items-start gap-2 bg-[#FFFBF0] border border-gold-soft/15 rounded-xl p-3">
                <span className="text-[14px] mt-[1px]">💡</span>
                <p className="text-[12px] text-muted-ink leading-relaxed">
                  Go to YouTube → Click <strong>Share</strong> → Copy the link and paste it here.
                </p>
              </div>

              {/* Status */}
              <div className="text-[12px] text-muted-ink space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink">Current Status:</span>
                  {liveDarshanConfig?.youtubeUrl ? (
                    <span className="text-sage font-semibold">Configured</span>
                  ) : (
                    <span className="text-muted-ink">Not configured</span>
                  )}
                </div>
                {liveDarshanConfig?.updatedAt && liveDarshanConfig?.updatedBy && (
                  <p className="text-[11px] text-muted-ink/70">
                    Last updated: {liveDarshanConfig.updatedAt} by {liveDarshanConfig.updatedBy}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setLiveDarshanModalOpen(false)}
                  className="flex-1 py-3 text-[14px] font-bold text-ink bg-cream border border-hair rounded-xl hover:bg-hair/30 transition-colors"
                  disabled={liveDarshanSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveLiveDarshanUrl}
                  disabled={liveDarshanSaving}
                  className="flex-1 py-3 text-[14px] font-bold text-white bg-gradient-to-r from-gold-soft to-ember rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {liveDarshanSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
