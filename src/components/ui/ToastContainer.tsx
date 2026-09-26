'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: any; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4500);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  };

  const borderStyles = {
    success: 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200',
    error: 'border-red-500/30 bg-red-950/80 text-red-200',
    warning: 'border-amber-500/30 bg-amber-950/80 text-amber-200',
    info: 'border-blue-500/30 bg-slate-900/90 text-slate-200',
  };

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start justify-between gap-3 animate-fadeIn transition-all duration-300 ${borderStyles[toast.type as keyof typeof borderStyles]}`}
    >
      <div className="flex items-start gap-2.5">
        {icons[toast.type as keyof typeof icons]}
        <div className="space-y-0.5">
          <h5 className="text-xs font-bold text-white leading-tight">{toast.title}</h5>
          <p className="text-[11px] text-slate-300 leading-normal">{toast.message}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
