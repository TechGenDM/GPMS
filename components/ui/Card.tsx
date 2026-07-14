import React from 'react';
import { cn } from '@/lib/utils'; // Assuming we have a standard cn utility, I'll create it later. For now just standard class concatenation or standard utility

// Using a basic fallback if cn is not yet defined
const cx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cx(
        'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cx('px-6 py-5 border-b border-slate-100 flex flex-col space-y-1.5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3 className={cx('text-lg font-semibold leading-none tracking-tight text-slate-900', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cx('p-6 pt-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div className={cx('px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center', className)} {...props}>
      {children}
    </div>
  );
}
