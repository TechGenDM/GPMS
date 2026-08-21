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
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { useLanguage } from '@/components/i18n/LanguageProvider';
import { RecordDetailModal } from '@/components/records/RecordDetailModal';

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
const YOUTUBE_URL_PATTERN =
  /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|live\/|@[\w.-]+\/live)|youtu\.be\/)/i;

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

// ─── Announcement Config ───────────────────────────────────
interface AnnouncementConfig {
  announcement: { text: string; date: string } | null;
  updatedAt: string;
  updatedBy: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const feedback = useFeedback();

  const userRole = session?.user?.role;
  const canManageUsers = userRole === 'Admin' || userRole === 'SuperAdmin';
  const isAdmin = canManageUsers;
  const canManageLiveDarshan =
    userRole === 'SuperAdmin' ||
    userRole === 'Admin' ||
    userRole === 'Volunteer';

  // Record Detail Modal state
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'donation' | 'expense'>('donation');
  const [isFetchingRecord, setIsFetchingRecord] = useState(false);

  // Live Darshan state
  const [liveDarshanModalOpen, setLiveDarshanModalOpen] = useState(false);
  const [liveDarshanConfig, setLiveDarshanConfig] =
    useState<LiveDarshanConfig | null>(null);
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

  // Announcement state
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementConfig, setAnnouncementConfig] =
    useState<AnnouncementConfig | null>(null);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementDate, setAnnouncementDate] = useState('');
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(
    null
  );

  // Fetch Announcement config
  const loadAnnouncementConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/announcement');
      const json = await res.json();
      if (json.success && json.data) {
        setAnnouncementConfig(json.data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (canManageLiveDarshan) {
      loadLiveDarshanConfig();
      loadAnnouncementConfig();
    }
  }, [canManageLiveDarshan, loadLiveDarshanConfig, loadAnnouncementConfig]);

  const openLiveDarshanModal = () => {
    setLiveDarshanUrl(liveDarshanConfig?.youtubeUrl || '');
    setLiveDarshanError(null);
    setLiveDarshanModalOpen(true);
  };

  const saveLiveDarshanUrl = async () => {
    const trimmedUrl = liveDarshanUrl.trim();

    // Frontend validation
    if (trimmedUrl && !isValidYoutubeUrl(trimmedUrl)) {
      setLiveDarshanError(t('dashboard.liveDarshanInvalidUrl'));
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
        feedback.showSuccess(t('dashboard.liveDarshanUpdateSuccess'));
        setLiveDarshanModalOpen(false);
        loadLiveDarshanConfig();
      } else {
        setLiveDarshanError(
          json.message || t('dashboard.liveDarshanUpdateFailed')
        );
      }
    } catch {
      setLiveDarshanError(t('dashboard.liveDarshanUpdateFailed'));
    } finally {
      setLiveDarshanSaving(false);
    }
  };

  const openAnnouncementModal = () => {
    setAnnouncementText(announcementConfig?.announcement?.text || '');
    setAnnouncementDate(announcementConfig?.announcement?.date || '');
    setAnnouncementError(null);
    setAnnouncementModalOpen(true);
  };

  const saveAnnouncementConfig = async () => {
    const trimmedText = announcementText.trim();
    const trimmedDate = announcementDate.trim();

    if (trimmedText && trimmedText.length > 300) {
      setAnnouncementError(t('dashboard.announcementTooLong'));
      return;
    }

    setAnnouncementSaving(true);
    setAnnouncementError(null);

    let payloadValue = '';
    if (trimmedText) {
      payloadValue = JSON.stringify({ text: trimmedText, date: trimmedDate });
    }

    try {
      const res = await fetch('/api/settings/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: payloadValue }),
      });
      const json = await res.json();

      if (json.success) {
        feedback.showSuccess(t('dashboard.announcementUpdateSuccess'));
        setAnnouncementModalOpen(false);
        loadAnnouncementConfig();
      } else {
        setAnnouncementError(
          json.message || t('dashboard.announcementUpdateFailed')
        );
      }
    } catch {
      setAnnouncementError(t('dashboard.announcementUpdateFailed'));
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        setError(null);

        const res = await fetchApi<DashboardData>('/dashboard/summary', {
          method: 'POST',
          showLoading: !isRefresh,
        });

        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || t('dashboard.fetchFailed'));
        }
      } catch (err) {
        setError(t('dashboard.serverError'));
      } finally {
        if (isRefresh) setRefreshing(false);
      }
    },
    [feedback]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleActivityClick = async (activity: Activity) => {
    setIsFetchingRecord(true);
    try {
      const endpoint =
        activity.type === 'Donation'
          ? '/records/donations'
          : '/records/expenses';

      const res = await fetchApi<{ data: Record<string, unknown>[] }>(endpoint, {
        method: 'POST',
        body: {
          searchQuery: '',
          page: 1,
          limit: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });

      let recordsArray: any[] = [];
      if (res.success && res.data) {
        if (Array.isArray((res.data as any).data)) {
          recordsArray = (res.data as any).data;
        } else if (Array.isArray(res.data)) {
          recordsArray = res.data as any[];
        }
      }

      if (recordsArray.length > 0) {
        let exactRecord = recordsArray.find(
          (r) => String(r.id) === String(activity.id) || String(r.receiptId) === String(activity.id)
        );

        if (!exactRecord) {
          exactRecord = recordsArray.find((r) => {
            const matchTitle = r.donorName === activity.title || r.vendor === activity.title || r.category === activity.title;
            const matchAmount = Number(r.amount) === Number(activity.amount);
            return matchTitle && matchAmount;
          });
        }

        if (!exactRecord && recordsArray.length === 1) {
          exactRecord = recordsArray[0];
        }

        if (exactRecord) {
          setModalType(activity.type === 'Donation' ? 'donation' : 'expense');
          setSelectedRecord(exactRecord);
        } else {
          feedback.showError(t('dashboard.recordNotFound'));
        }
      } else {
        feedback.showError(t('dashboard.recordNotFound'));
      }
    } catch {
      feedback.showError(t('dashboard.fetchFailed'));
    } finally {
      setIsFetchingRecord(false);
    }
  };

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
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="#B4823A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="#B4823A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="#B4823A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-playfair font-bold text-[18px] text-transparent bg-clip-text bg-gradient-to-br from-gold-soft to-ember tracking-[0.02em]">
              GPMS
            </span>
          </div>
          <div className="flex items-center gap-1">
            {canManageUsers && (
              <>
                <button
                  onClick={() => router.push('/audit')}
                  className="p-[6px] rounded-lg text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors flex items-center gap-1"
                  title={t('dashboard.auditLogs')}
                  aria-label={t('dashboard.auditLogs')}
                >
                  <Activity className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline text-[13px] font-semibold">
                    {t('dashboard.auditLogs')}
                  </span>
                </button>
                <button
                  onClick={() => router.push('/users')}
                  className="p-[6px] rounded-lg text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors flex items-center gap-1"
                  title={t('dashboard.users')}
                  aria-label={t('dashboard.users')}
                >
                  <Users className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline text-[13px] font-semibold">
                    {t('dashboard.users')}
                  </span>
                </button>
              </>
            )}
            <button
              onClick={() => router.push('/records')}
              className="p-[6px] rounded-lg text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors flex items-center gap-1"
              title={t('dashboard.records')}
              aria-label={t('dashboard.records')}
            >
              <FileText className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline text-[13px] font-semibold">
                {t('dashboard.records')}
              </span>
            </button>
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="p-[6px] rounded-lg text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors disabled:opacity-50"
              title={t('dashboard.refresh')}
              aria-label={t('dashboard.refresh')}
            >
              <RefreshCw
                className={`w-[18px] h-[18px] ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-[6px] rounded-lg text-muted-ink hover:text-maroon hover:bg-maroon/5 transition-colors"
              title={t('dashboard.logout')}
              aria-label={t('dashboard.logout')}
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
            <div className="ml-1 pl-2 border-l border-hair">
              <LanguageSelector variant="light" />
            </div>
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
                {t('dashboard.couldNotLoad')}
              </p>
              <p className="text-maroon/80 text-[13px] font-bold mb-4">
                {error}
              </p>
              <button
                onClick={() => loadDashboard()}
                className="inline-flex items-center gap-2 text-[14px] font-bold text-maroon bg-white border border-maroon/20 hover:bg-maroon/5 px-4 py-2 rounded-[12px] transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                {t('dashboard.retry')}
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
              <p className="text-cream/80 text-[12.5px] font-semibold uppercase tracking-wider mb-2">
                {t('dashboard.currentBalance')}
              </p>
              <div className="flex justify-center text-white font-playfair font-bold text-[36px] tracking-[-0.03em] leading-none">
                <span className="font-sans mr-[2px]">₹</span>
                {fmt(data.summary.balance)}
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
                  {t('dashboard.collections')}
                </div>
                <div className="font-playfair font-bold text-[32px] text-ink tracking-[-0.03em] leading-none mb-3">
                  <span className="font-sans mr-[2px]">₹</span>
                  {fmt(data.summary.donations.total)}
                </div>
                <div className="text-[13px] text-muted-ink space-y-1">
                  <div className="flex justify-between">
                    <span>{t('dashboard.cash')}</span>
                    <span className="font-semibold text-ink">
                      ₹{fmt(data.summary.donations.cash)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('dashboard.upi')}</span>
                    <span className="font-semibold text-ink">
                      ₹{fmt(data.summary.donations.upi)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold-soft to-ember" />
            </Card>

            <Card className="relative flex flex-col">
              <CardContent className="p-5 flex-1">
                <div className="flex items-center text-[12.5px] font-semibold text-muted-ink uppercase tracking-wider mb-2">
                  <ArrowDownRight className="w-4 h-4 mr-1 text-maroon" />
                  {t('dashboard.expenses')}
                </div>
                <div className="font-playfair font-bold text-[32px] text-ink tracking-[-0.03em] leading-none mb-3">
                  <span className="font-sans mr-[2px]">₹</span>
                  {fmt(data.summary.expenses.total)}
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
                  <span>{t('dashboard.todayCol')}</span>
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
                  <span>{t('dashboard.todayExp')}</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={openLiveDarshanModal} className="w-full text-left">
              <Card className="relative overflow-hidden border-gold-soft/30 hover:border-gold-soft/60 transition-colors h-full">
                <CardContent className="p-4 flex items-center gap-3 h-full">
                  {/* Broadcast icon */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9832E]/15 to-[#E66255]/15 flex items-center justify-center shrink-0">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C9832E"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
                      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
                      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
                      <circle cx="12" cy="12" r="2" fill="#C9832E" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-ink">
                        {t('dashboard.liveDarshan')}
                      </span>
                      {liveDarshanConfig?.youtubeUrl ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-sage/15 text-sage px-2 py-0.5 rounded-full">
                          {t('dashboard.configured')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-muted-ink/10 text-muted-ink px-2 py-0.5 rounded-full">
                          {t('dashboard.notConfigured')}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-ink mt-0.5 truncate">
                      {liveDarshanConfig?.youtubeUrl
                        ? t('dashboard.isConfiguredDesc')
                        : t('dashboard.tapToConfigureDesc')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-ink shrink-0" />
                </CardContent>
              </Card>
            </button>

            <button
              onClick={openAnnouncementModal}
              className="w-full text-left"
            >
              <Card className="relative overflow-hidden border-gold-soft/30 hover:border-gold-soft/60 transition-colors h-full">
                <CardContent className="p-4 flex items-center gap-3 h-full">
                  {/* Announcement icon */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#798C7B]/15 to-[#170F26]/15 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-[#798C7B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-ink">
                        {t('dashboard.announcement')}
                      </span>
                      {announcementConfig?.announcement ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-sage/15 text-sage px-2 py-0.5 rounded-full">
                          {t('dashboard.active')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-muted-ink/10 text-muted-ink px-2 py-0.5 rounded-full">
                          {t('dashboard.none')}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-ink mt-0.5 truncate">
                      {announcementConfig?.announcement
                        ? announcementConfig.announcement.text
                        : t('dashboard.tapToSetAnnouncement')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-ink shrink-0" />
                </CardContent>
              </Card>
            </button>
          </div>
        )}

        {/* Expense by Category */}
        {data && categoryEntries.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="font-playfair font-bold text-[22px] text-ink tracking-[0.02em]">
              {t('dashboard.expensesByCategory')}
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
            {t('dashboard.recentActivity')}
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
                <p>{t('dashboard.noRecentActivity')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((activity, idx) => (
                <button
                  key={`${activity.id}-${idx}`}
                  onClick={() => handleActivityClick(activity)}
                  disabled={isFetchingRecord}
                  className="w-full text-left group transition-transform active:scale-[0.99] disabled:opacity-70 disabled:active:scale-100"
                >
                  <Card className="hover:border-gold-soft/40 transition-colors">
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
                            className="font-bold text-[14px] text-ink truncate pr-2 group-hover:text-gold-soft transition-colors"
                            title={activity.title}
                          >
                            {activity.title || t('dashboard.untitled')}
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
                </button>
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
          {t('dashboard.donation')}
        </button>
        <button
          onClick={() => router.push('/expenses/new')}
          className="flex-1 h-[56px] bg-white border border-hair text-ink rounded-[14px] font-bold text-[16px] shadow-sm flex items-center justify-center gap-2 transition-all hover:bg-hair/30 active:scale-[0.98]"
        >
          <Minus className="w-5 h-5" />
          {t('dashboard.expense')}
        </button>
      </div>

      {/* Record Detail Modal */}
      <RecordDetailModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        type={modalType}
        canCancel={isAdmin}
        onCancelSuccess={() => {
          setSelectedRecord(null);
          loadDashboard(true);
        }}
        feedback={feedback}
      />

      {/* Live Darshan Modal */}
      {liveDarshanModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-md shadow-xl max-h-[85vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9832E]/15 to-[#E66255]/15 flex items-center justify-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9832E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
                    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
                    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
                    <circle cx="12" cy="12" r="2" fill="#C9832E" />
                  </svg>
                </div>
                <h2 className="text-[18px] font-bold text-ink">
                  {t('dashboard.liveDarshan')}
                </h2>
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
                {t('dashboard.liveDarshanModalDesc')}
              </p>

              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-ink">
                  {t('dashboard.youtubeLiveUrl')}
                </label>
                <input
                  type="url"
                  value={liveDarshanUrl}
                  onChange={(e) => {
                    setLiveDarshanUrl(e.target.value);
                    setLiveDarshanError(null);
                  }}
                  placeholder={t('dashboard.youtubeUrlPlaceholder')}
                  className="w-full h-11 px-3 bg-cream border border-hair rounded-[12px] text-[14px] text-ink placeholder:text-muted-ink focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft transition-all"
                />
                {liveDarshanError && (
                  <p className="text-[12px] text-maroon mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {liveDarshanError}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="text-[12px] text-muted-ink space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink">
                    {t('dashboard.currentStatus')}
                  </span>
                  {liveDarshanConfig?.youtubeUrl ? (
                    <span className="text-sage font-semibold">
                      {t('dashboard.configured')}
                    </span>
                  ) : (
                    <span className="text-muted-ink">
                      {t('dashboard.notConfigured')}
                    </span>
                  )}
                </div>
                {liveDarshanConfig?.updatedAt &&
                  liveDarshanConfig?.updatedBy && (
                    <p className="text-[11px] text-muted-ink/70">
                      {t('dashboard.lastUpdated')} {liveDarshanConfig.updatedAt}{' '}
                      {t('dashboard.by')} {liveDarshanConfig.updatedBy}
                    </p>
                  )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 pt-4 border-t border-hair flex gap-3">
              <button
                onClick={() => setLiveDarshanModalOpen(false)}
                className="flex-1 h-11 bg-cream border border-hair text-ink rounded-[12px] font-bold text-[14px] hover:bg-hair/50 transition-colors"
                disabled={liveDarshanSaving}
              >
                {t('dashboard.cancel')}
              </button>
              <button
                onClick={saveLiveDarshanUrl}
                disabled={liveDarshanSaving}
                className="flex-1 h-11 bg-ink text-white rounded-[12px] font-bold text-[14px] hover:bg-ink-2 transition-colors disabled:opacity-50"
              >
                {liveDarshanSaving
                  ? t('dashboard.saving')
                  : t('dashboard.saveUrl')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() =>
              !announcementSaving && setAnnouncementModalOpen(false)
            }
          />
          <div className="relative w-full max-w-md bg-cream rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-hair">
              <h3 className="text-[16px] font-bold text-ink font-playfair">
                {t('dashboard.announcement')}
              </h3>
              <button
                onClick={() => setAnnouncementModalOpen(false)}
                className="p-1.5 text-muted-ink hover:text-ink hover:bg-hair/50 rounded-lg transition-colors"
                disabled={announcementSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <p className="text-[13px] text-muted-ink">
                {t('dashboard.announcementModalDesc')}
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-ink">
                    {t('dashboard.announcementTextLabel')}
                  </label>
                  <textarea
                    value={announcementText}
                    onChange={(e) => {
                      setAnnouncementText(e.target.value);
                      setAnnouncementError(null);
                    }}
                    placeholder={t('dashboard.announcementTextPlaceholder')}
                    className="w-full p-3 bg-cream border border-hair rounded-[12px] text-[14px] text-ink placeholder:text-muted-ink focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft transition-all min-h-[100px] resize-y"
                    maxLength={300}
                  />
                  <div className="text-right text-[11px] text-muted-ink">
                    {announcementText.length}/300
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-ink">
                    {t('dashboard.dateSubtitleLabel')}
                  </label>
                  <input
                    type="text"
                    value={announcementDate}
                    onChange={(e) => {
                      setAnnouncementDate(e.target.value);
                      setAnnouncementError(null);
                    }}
                    placeholder={t('dashboard.datePlaceholder')}
                    className="w-full h-11 px-3 bg-cream border border-hair rounded-[12px] text-[14px] text-ink placeholder:text-muted-ink focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft transition-all"
                  />
                </div>
              </div>

              {announcementError && (
                <p className="text-[12px] text-maroon mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {announcementError}
                </p>
              )}

              {/* Status */}
              <div className="text-[12px] text-muted-ink space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink">
                    {t('dashboard.currentStatus')}
                  </span>
                  {announcementConfig?.announcement ? (
                    <span className="text-sage font-semibold">
                      {t('dashboard.active')}
                    </span>
                  ) : (
                    <span className="text-muted-ink">
                      {t('dashboard.none')}
                    </span>
                  )}
                </div>
                {announcementConfig?.updatedAt &&
                  announcementConfig?.updatedBy && (
                    <p className="text-[11px] text-muted-ink/70">
                      {t('dashboard.lastUpdated')}{' '}
                      {announcementConfig.updatedAt} {t('dashboard.by')}{' '}
                      {announcementConfig.updatedBy}
                    </p>
                  )}
              </div>
              {/* Footer */}
              <div className="p-5 pt-4 border-t border-hair flex gap-3">
                <button
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="flex-1 h-11 bg-cream border border-hair text-ink rounded-[12px] font-bold text-[14px] hover:bg-hair/50 transition-colors"
                  disabled={announcementSaving}
                >
                  {t('dashboard.cancel')}
                </button>
                <button
                  onClick={saveAnnouncementConfig}
                  disabled={announcementSaving}
                  className="flex-1 h-11 bg-ink text-white rounded-[12px] font-bold text-[14px] hover:bg-ink-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {announcementSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t('dashboard.saving')}
                    </>
                  ) : (
                    t('dashboard.saveAnnouncement')
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
