import React from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { UI_TRANSLATIONS } from '@/lib/i18n/translations';
import { Sparkles } from 'lucide-react';

interface PromptChipsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const PromptChips: React.FC<PromptChipsProps> = ({ onSelectPrompt }) => {
  const { language } = useAppStore();
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const prompts = [
    t.todaySales,
    t.scheduleMeeting,
    t.createInvoice,
    "Generate monthly payroll report for HR",
    "Analyze low stock inventory and alert manager",
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 custom-scrollbar">
      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
        <Sparkles className="w-3 h-3" /> Quick Prompts:
      </span>
      {prompts.map((prompt, idx) => (
        <button
          key={idx}
          onClick={() => onSelectPrompt(prompt)}
          className="shrink-0 px-3 py-1 rounded-full text-xs bg-slate-900/80 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white transition-all duration-200"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};
