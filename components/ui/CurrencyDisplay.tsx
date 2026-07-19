import React from 'react';
import { cn } from '@/lib/utils'; // standard tailwind-merge util

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CurrencyDisplay({
  amount,
  className,
  size = 'lg',
}: CurrencyDisplayProps) {
  // Format the number to Indian numbering system (e.g. 1,00,000)
  const formattedAmount = new Intl.NumberFormat('en-IN').format(amount);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl md:text-6xl', // Extra large for main dashboard balance
  };

  return (
    <div
      className={cn(
        'font-bold text-ink tracking-tight flex items-baseline',
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          'text-muted-ink mr-1 opacity-80',
          className?.includes('text-white') && 'text-cream'
        )}
        style={{ fontSize: '0.85em' }}
      >
        ₹
      </span>
      <span>{formattedAmount}</span>
    </div>
  );
}
