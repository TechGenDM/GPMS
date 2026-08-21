'use client';

import React from 'react';
import { useLanguage } from './LanguageProvider';

export function LanguageSelector({
  variant = 'light',
  className = '',
}: {
  variant?: 'light' | 'dark';
  className?: string;
}) {
  const { locale, setLanguage } = useLanguage();

  const isDark = variant === 'dark';

  // Style configurations
  const containerClass = isDark
    ? 'bg-white/10 border-white/20'
    : 'bg-hair/30 border-hair';
  const activeClass = isDark
    ? 'bg-[#E5B560] text-[#0C0918]'
    : 'bg-ink text-cream';
  const inactiveClass = isDark
    ? 'text-white/60 hover:text-white'
    : 'text-muted-ink hover:text-ink';

  return (
    <div
      className={`flex items-center p-0.5 rounded-full border shadow-sm ${containerClass} ${className}`}
    >
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors ${
          locale === 'en' ? activeClass : inactiveClass
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('hi')}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors ${
          locale === 'hi' ? activeClass : inactiveClass
        }`}
        aria-label="Switch to Hindi"
      >
        HI
      </button>
    </div>
  );
}
