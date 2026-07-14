import React from 'react';
import { cn } from '@/lib/utils'; // standard tailwind-merge util

const cx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CurrencyDisplay({ amount, className, size = 'lg' }: CurrencyDisplayProps) {
  
  // Format the number to Indian numbering system (e.g. 1,00,000)
  const formattedAmount = new Intl.NumberFormat('en-IN').format(amount);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl md:text-6xl', // Extra large for main dashboard balance
  };

  return (
    <div className={cx('font-bold text-slate-900 tracking-tight flex items-baseline', sizeClasses[size], className)}>
      <span className="text-slate-500 mr-1 opacity-80" style={{ fontSize: '0.85em' }}>₹</span>
      <span>{formattedAmount}</span>
    </div>
  );
}
