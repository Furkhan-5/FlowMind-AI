import React from 'react';
import { AgentType } from '@/types';
import {
  Crown,
  TrendingUp,
  Megaphone,
  Landmark,
  UserCheck,
  Headphones,
  BarChart3,
  Database,
  GitFork,
  Calendar,
  FileText,
  Mail,
  Brain,
  FileBarChart,
  ShieldCheck,
  Bot,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AgentLogoProps {
  agentId: AgentType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  glow?: boolean;
}

export const AGENT_CONFIGS: Record<
  string,
  {
    icon: React.ElementType;
    gradient: string;
    shadow: string;
    border: string;
    accentColor: string;
    label: string;
  }
> = {
  CEO: {
    icon: Crown,
    gradient: 'from-amber-500 via-amber-600 to-yellow-500',
    shadow: 'shadow-amber-500/30',
    border: 'border-amber-300/40',
    accentColor: 'text-amber-400',
    label: 'CEO Agent',
  },
  Sales: {
    icon: TrendingUp,
    gradient: 'from-emerald-500 via-teal-600 to-emerald-400',
    shadow: 'shadow-emerald-500/30',
    border: 'border-emerald-300/40',
    accentColor: 'text-emerald-400',
    label: 'Sales Agent',
  },
  Marketing: {
    icon: Megaphone,
    gradient: 'from-purple-600 via-fuchsia-600 to-pink-500',
    shadow: 'shadow-purple-500/30',
    border: 'border-purple-300/40',
    accentColor: 'text-purple-400',
    label: 'Marketing Agent',
  },
  Finance: {
    icon: Landmark,
    gradient: 'from-yellow-600 via-amber-600 to-orange-500',
    shadow: 'shadow-amber-500/30',
    border: 'border-yellow-300/40',
    accentColor: 'text-yellow-400',
    label: 'Finance Agent',
  },
  HR: {
    icon: UserCheck,
    gradient: 'from-pink-500 via-rose-600 to-rose-400',
    shadow: 'shadow-pink-500/30',
    border: 'border-pink-300/40',
    accentColor: 'text-pink-400',
    label: 'HR Agent',
  },
  Support: {
    icon: Headphones,
    gradient: 'from-cyan-500 via-blue-600 to-sky-400',
    shadow: 'shadow-cyan-500/30',
    border: 'border-cyan-300/40',
    accentColor: 'text-cyan-400',
    label: 'Support Agent',
  },
  Analytics: {
    icon: BarChart3,
    gradient: 'from-indigo-600 via-blue-600 to-purple-500',
    shadow: 'shadow-indigo-500/30',
    border: 'border-indigo-300/40',
    accentColor: 'text-indigo-400',
    label: 'Analytics Agent',
  },
  Database: {
    icon: Database,
    gradient: 'from-violet-600 via-purple-700 to-indigo-600',
    shadow: 'shadow-violet-500/30',
    border: 'border-violet-300/40',
    accentColor: 'text-violet-400',
    label: 'Database Agent',
  },
  Workflow: {
    icon: GitFork,
    gradient: 'from-sky-500 via-blue-600 to-indigo-500',
    shadow: 'shadow-sky-500/30',
    border: 'border-sky-300/40',
    accentColor: 'text-sky-400',
    label: 'Workflow Planner',
  },
  Scheduler: {
    icon: Calendar,
    gradient: 'from-teal-500 via-emerald-600 to-cyan-500',
    shadow: 'shadow-teal-500/30',
    border: 'border-teal-300/40',
    accentColor: 'text-teal-400',
    label: 'Scheduler Agent',
  },
  Document: {
    icon: FileText,
    gradient: 'from-orange-500 via-amber-600 to-yellow-500',
    shadow: 'shadow-orange-500/30',
    border: 'border-orange-300/40',
    accentColor: 'text-orange-400',
    label: 'Document Agent',
  },
  Email: {
    icon: Mail,
    gradient: 'from-rose-500 via-red-600 to-pink-500',
    shadow: 'shadow-rose-500/30',
    border: 'border-rose-300/40',
    accentColor: 'text-rose-400',
    label: 'Email Agent',
  },
  Knowledge: {
    icon: Brain,
    gradient: 'from-lime-500 via-emerald-600 to-teal-500',
    shadow: 'shadow-lime-500/30',
    border: 'border-lime-300/40',
    accentColor: 'text-lime-400',
    label: 'Knowledge Agent',
  },
  Reporting: {
    icon: FileBarChart,
    gradient: 'from-fuchsia-600 via-purple-600 to-pink-500',
    shadow: 'shadow-fuchsia-500/30',
    border: 'border-fuchsia-300/40',
    accentColor: 'text-fuchsia-400',
    label: 'Reporting Agent',
  },
  Security: {
    icon: ShieldCheck,
    gradient: 'from-red-600 via-rose-700 to-red-500',
    shadow: 'shadow-red-500/30',
    border: 'border-red-300/40',
    accentColor: 'text-red-400',
    label: 'Security Agent',
  },
};

export const AgentLogo: React.FC<AgentLogoProps> = ({
  agentId,
  size = 'md',
  showLabel = false,
  className = '',
  glow = false,
}) => {
  const config = AGENT_CONFIGS[agentId] || {
    icon: Bot,
    gradient: 'from-purple-600 to-indigo-600',
    shadow: 'shadow-purple-500/30',
    border: 'border-purple-300/40',
    accentColor: 'text-purple-400',
    label: `${agentId} Agent`,
  };

  const Icon = config.icon;

  const sizeClasses = {
    xs: 'w-5 h-5 rounded-lg border text-[10px]',
    sm: 'w-7 h-7 rounded-xl border text-xs',
    md: 'w-9 h-9 rounded-xl border text-sm',
    lg: 'w-12 h-12 rounded-2xl border-2 text-base',
    xl: 'w-16 h-16 rounded-3xl border-2 text-xl',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  return (
    <div className={clsx('inline-flex items-center gap-2.5', className)}>
      <div
        className={clsx(
          'relative flex items-center justify-center font-bold text-white shadow-lg transition-transform hover:scale-105',
          `bg-gradient-to-br ${config.gradient}`,
          config.border,
          sizeClasses[size],
          glow && `shadow-lg ${config.shadow}`
        )}
      >
        <Icon className={clsx('relative z-10 text-white drop-shadow', iconSizes[size])} />
        <div className="absolute inset-0 rounded-[inherit] bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
      </div>

      {showLabel && (
        <span className="font-semibold text-slate-800 text-xs tracking-tight">
          {config.label}
        </span>
      )}
    </div>
  );
};
