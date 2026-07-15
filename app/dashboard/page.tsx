'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useFeedback } from '@/components/ui/Feedback';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Button } from '@/components/ui/button';

interface DashboardSummary {
  donations: { total: number; today: number; cash: number; upi: number };
  expenses: { total: number; today: number };
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
  const [data, setData] = useState<DashboardData | null>(null);
  const feedback = useFeedback();

  useEffect(() => {
    let isMounted = true;
    
    async function loadDashboard() {
      const res = await fetchApi<DashboardData>('/dashboard/summary', {
        method: 'POST',
        showLoading: true,
        loadingMessage: 'Loading dashboard...',
      }, feedback);

      if (isMounted && res.success && res.data) {
        setData(res.data);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [feedback]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">GPMS Dashboard</h1>
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
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Balance Card */}
        <Card className="bg-blue-600 border-transparent shadow-md text-white">
          <CardContent className="pt-6 text-center">
            <p className="text-blue-100 font-medium mb-1">Current Balance</p>
            <CurrencyDisplay 
              amount={data?.summary.balance ?? 0} 
              size="xl" 
              className="justify-center text-white font-extrabold tracking-tighter" 
            />
          </CardContent>
        </Card>

        {/* Collections & Expenses Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium flex items-center">
                <ArrowUpRight className="w-4 h-4 mr-1 text-green-500" />
                Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CurrencyDisplay amount={data?.summary.donations.total ?? 0} size="md" />
              <div className="mt-3 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Cash</span>
                  <span className="font-medium">₹{new Intl.NumberFormat('en-IN').format(data?.summary.donations.cash ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI</span>
                  <span className="font-medium">₹{new Intl.NumberFormat('en-IN').format(data?.summary.donations.upi ?? 0)}</span>
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
              <CurrencyDisplay amount={data?.summary.expenses.total ?? 0} size="md" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Recent Activity</h2>
          
          {!data ? (
            // Skeleton loader or empty space while fetching
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
                      <div className={`p-2 rounded-full mr-3 shrink-0 ${activity.type === 'Donation' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {activity.type === 'Donation' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate pr-2" title={activity.title}>
                          {activity.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-semibold ${activity.type === 'Donation' ? 'text-green-600' : 'text-slate-900'}`}>
                        {activity.type === 'Donation' ? '+' : '-'}₹{new Intl.NumberFormat('en-IN').format(activity.amount)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
