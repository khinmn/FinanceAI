import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] hover:scale-[1.02]';

  const variants: Record<string, string> = {
    primary:
      'bg-[#2563EB] text-white hover:bg-[#1e40af] focus:ring-[#2563EB] shadow-sm',
    secondary:
      'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 focus:ring-slate-200',
    ghost:
      'text-slate-700 hover:text-slate-900 hover:bg-slate-50 focus:ring-slate-200',
    danger:
      'bg-[#fee2e2] text-rose-600 hover:bg-[#fecaca] border border-rose-200 focus:ring-rose-200',
    success:
      'bg-[#ecfdf5] text-[#16A34A] hover:bg-[#dcfce7] border border-green-100 focus:ring-green-100',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      // eslint-disable-next-line react/button-has-type
      type={type}
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        (disabled || loading) && '!scale-100 pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
