'use client';

import Image from 'next/image';

import { useEffect, useState } from 'react';
import {
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  RefreshCw,
} from 'lucide-react';

interface PublicDashboardData {
  committeeName: string;
  year: string;
  totalCollection: number;
  totalExpense: number;
  balance: number;
}

import sealLogo from '@/public/seal.png';

export default function PublicDashboard() {
  const [dashData, setDashData] = useState<PublicDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/public');
      const json = await res.json();
      if (json.success && json.data) {
        setDashData(json.data);
      } else {
        setError(json.message || 'Could not load dashboard');
      }
    } catch {
      setError('Network error — please check your connection');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src={sealLogo}
              alt="GPMS Seal"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-bold text-slate-900 tracking-tight">
              GPMS
            </span>
          </div>
          <a
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Committee Login →
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          /* Skeleton */
          <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
              <div className="h-7 w-56 bg-slate-200 rounded-lg" />
              <div className="h-4 w-40 bg-slate-100 rounded" />
            </div>
            <div className="h-28 bg-slate-200 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-slate-200 rounded-2xl" />
              <div className="h-24 bg-slate-200 rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          /* Error */
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium mb-3">{error}</p>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : dashData ? (
          <>
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {dashData.committeeName}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Ganesh Puja {dashData.year} — Financial Transparency
              </p>
            </div>

            {/* Balance Hero */}
            <div className="bg-blue-600 rounded-2xl p-6 text-center shadow-lg shadow-blue-600/20">
              <p className="text-blue-100 text-sm font-medium mb-1">
                Current Balance
              </p>
              <p className="text-3xl font-extrabold text-white tracking-tighter">
                ₹{fmt(dashData.balance)}
              </p>
            </div>

            {/* Collection & Expense Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Total Collection
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  ₹{fmt(dashData.totalCollection)}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Total Expenses
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  ₹{fmt(dashData.totalExpense)}
                </p>
              </div>
            </div>

            {/* Transparency Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
              <Wallet className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 leading-relaxed">
                All funds are managed by the organizing committee.
                <br />
                Donations and expenses are tracked digitally for full
                transparency.
              </p>
            </div>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400">
        Powered by GPMS — Ganesh Puja Management System
      </footer>
    </div>
  );
}
