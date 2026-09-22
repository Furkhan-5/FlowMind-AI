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
    white: 'bg-white text-bloom-textDark border border-slate-200/80 shadow-bloom',
    dark: 'bg-bloom-dark text-white border border-bloom-darkCard shadow-bloom-lg',
    lavender: 'bg-gradient-to-br from-purple-100/70 via-purple-50 to-indigo-100/60 text-bloom-textDark border border-purple-200/60 shadow-bloom',
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
