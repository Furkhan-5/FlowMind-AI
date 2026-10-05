import React from 'react';
import { clsx } from 'clsx';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'white' | 'dark' | 'lavender';
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'white',
  hoverEffect = true,
  ...props
}) => {
  const variantStyles = {
    white: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 shadow-bloom',
    dark: 'bg-bloom-dark dark:bg-slate-900 text-white border border-bloom-darkCard dark:border-slate-800 shadow-bloom-lg',
    lavender: 'bg-gradient-to-br from-purple-100/70 via-purple-50 to-indigo-100/60 dark:from-purple-950/40 dark:via-slate-900 dark:to-indigo-950/40 text-slate-900 dark:text-slate-100 border border-purple-200/60 dark:border-purple-800/50 shadow-bloom',
  };

  return (
    <div
      className={clsx(
        "relative rounded-3xl p-6 transition-all duration-300",
        variantStyles[variant],
        hoverEffect && "hover:-translate-y-1 hover:shadow-bloom-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
