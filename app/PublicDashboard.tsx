'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import sealLogo from '@/public/seal.png';

interface PublicDashboardData {
  committeeName: string;
  year: string;
  totalCollection: number;
  totalExpense: number;
  balance: number;
}

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
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Topbar */}
      <header className="flex items-center justify-between p-[18px_20px] bg-cream border-b border-hair sticky top-0 z-10">
        <div className="flex items-center gap-[9px]">
          <div className="relative w-[26px] h-[26px]">
            <Image
              src={sealLogo}
              alt="GPMS Seal"
              fill
              className="rounded-full border-[1.5px] border-gold object-cover"
            />
          </div>
          <span className="font-playfair font-bold text-[18px] tracking-[0.02em] text-transparent bg-clip-text bg-gradient-to-br from-gold-soft to-ember">
            GPMS
          </span>
        </div>
        <a
          href="/login"
          className="text-[13px] font-semibold text-ember flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          Committee login <span>→</span>
        </a>
      </header>

      {/* Main Scroll Area */}
      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="p-5 space-y-6 animate-pulse">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-hair/50 rounded-lg" />
              <div className="h-4 w-64 bg-hair/30 rounded" />
            </div>
            <div className="h-32 bg-hair/40 rounded-[20px]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-28 bg-hair/20 rounded-2xl" />
              <div className="h-28 bg-hair/20 rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          <div className="m-5 bg-maroon-soft/10 border border-maroon-soft/20 rounded-2xl p-6 text-center">
            <p className="text-maroon font-medium mb-3">{error}</p>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 text-sm font-semibold text-maroon bg-white border border-maroon/20 hover:bg-maroon/5 px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : dashData ? (
          <>
            <div className="pt-[22px] px-5">
              <h1 className="font-playfair font-bold text-[26px] text-ink">
                Our committee
              </h1>
              <p className="text-[12px] tracking-[0.06em] text-muted-ink mt-1 uppercase">
                {dashData.committeeName} {dashData.year} — FINANCIAL TRANSPARENCY
              </p>
            </div>

            {/* Hero Balance */}
            <div 
              className="m-[16px_20px_0] rounded-[20px] p-[26px_20px_22px] text-center relative overflow-hidden bg-ink"
              style={{
                background: `radial-gradient(circle at 22% 18%, var(--color-ink-glow), transparent 55%), radial-gradient(circle at 80% 85%, #201533, transparent 50%), var(--color-ink)`
              }}
            >
              <div className="absolute inset-0 opacity-[0.15]"
                   style={{
                     backgroundImage: 'radial-gradient(rgba(240,184,77,.35) 1px, transparent 1px)',
                     backgroundSize: '16px 16px'
                   }} />
              
              <div className="text-[11px] tracking-[0.16em] uppercase text-gold-soft font-semibold relative z-10">
                Current balance
              </div>
              <div className="text-[38px] font-bold mt-1 relative z-10 font-playfair text-transparent bg-clip-text bg-gradient-to-br from-gold-soft to-ember">
                <span className="font-sans font-medium text-gold-soft inline-block mr-1">₹</span>
                {fmt(dashData.balance)}
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 gap-3 pt-4 px-5">
              <div className="bg-white border border-hair rounded-2xl p-[14px_14px_16px] relative overflow-hidden shadow-sm">
                <div className="flex items-center gap-[6px] text-[12.5px] font-semibold text-sage mb-[10px]">
                  ↗ Total collection
                </div>
                <div className="font-playfair font-bold text-[23px] text-ink">
                  ₹{fmt(dashData.totalCollection)}
                </div>
                <div className="absolute left-0 right-0 bottom-0 h-[3px] bg-gradient-to-br from-gold-soft to-ember" />
              </div>

              <div className="bg-white border border-hair rounded-2xl p-[14px_14px_16px] relative overflow-hidden shadow-sm">
                <div className="flex items-center gap-[6px] text-[12.5px] font-semibold text-maroon mb-[10px]">
                  ↘ Total expenses
                </div>
                <div className="font-playfair font-bold text-[23px] text-ink">
                  ₹{fmt(dashData.totalExpense)}
                </div>
                <div className="absolute left-0 right-0 bottom-0 h-[3px] bg-gradient-to-br from-gold-soft to-ember" />
              </div>
            </div>

            {/* Note Box */}
            <div className="m-[16px_20px_0] bg-cream-2 border border-hair rounded-2xl p-[18px] text-center shadow-sm">
              <svg className="w-[22px] h-[22px] mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="#C9832E" strokeWidth="1.5">
                <rect x="3" y="7" width="18" height="12" rx="2"/><path d="M3 10h18M16 14h2"/>
              </svg>
              <p className="font-playfair italic text-[13.5px] text-[#4a4256] leading-[1.6]">
                All funds are managed by the organizing committee. Donations and expenses are tracked digitally for full transparency.
              </p>
            </div>
          </>
        ) : null}

        {/* Footer */}
        <div className="text-center p-[26px_20px_30px] mt-4">
          <div className="flex items-center gap-1.5 my-[18px]">
            <span className="flex-1 h-px bg-gradient-to-r from-transparent to-gold" />
            <i className="w-[5px] h-[5px] rotate-45 bg-ember shrink-0" />
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            <i className="w-[5px] h-[5px] rotate-45 bg-gold shrink-0" />
            <span className="flex-1 h-px bg-gradient-to-l from-transparent to-gold" />
          </div>
          <p className="text-[11px] text-muted-ink mt-[10px]">
            Powered by GPMS — Ganesh Puja Management System
          </p>
        </div>
      </main>
    </div>
  );
}
