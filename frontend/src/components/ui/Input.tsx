import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-dark-800 dark:text-dark-300 text-sm font-semibold">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-dark-900/60 border text-dark-900 dark:text-white text-sm',
            'placeholder:text-dark-400 dark:placeholder:text-dark-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all duration-200',
            error
              ? 'border-rose-500/50 focus:ring-rose-500/30'
              : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600',
            className
          )}
          {...props}
        />
        {error && <p className="text-rose-500 text-xs">{error}</p>}
        {hint && !error && <p className="text-dark-500 dark:text-dark-400 text-xs">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-dark-800 dark:text-dark-300 text-sm font-semibold">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-dark-900/60 border text-dark-900 dark:text-white text-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all duration-200',
          'appearance-none cursor-pointer',
          error
            ? 'border-rose-500/50'
            : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-rose-400 text-xs">{error}</p>}
    </div>
  );
}
