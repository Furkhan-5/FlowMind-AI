import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Mic, Bell, Search, Command, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const Topbar: React.FC = () => {
  const {
    activeModule,
    alerts,
    isVoiceActive,
    setVoiceActive,
    user,
    approveActionCard,
    organization,
  } = useAppStore();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const activeAlerts = alerts.filter((a) => a.recommendedAction.status === 'PENDING');

  const moduleTitles: Record<string, string> = {
    dashboard: 'Executive Business Overview',
    chat: 'Layman Conversational AI Assistant (MVP)',
    agents: '15-Specialized AI Agent Control Mesh',
    workflows: 'Natural Language AI Workflow Automation Engine',
    'data-analyst': 'Interactive AI Data Studio & CSV/PDF Cleaner',
    knowledge: 'RAG Knowledge Hub & Citation Engine',
    proactive: 'Proactive Operational Monitor & Anomaly Alerts',
    crm: 'CRM & Lead Pipeline Management',
    finance: 'Finance, Invoicing & Payroll Suite',
    hr: 'Human Resources & Employee Directory',
    inventory: 'Inventory & Stock Monitor',
    support: 'Customer Support Helpdesk',
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-6 flex items-center justify-between z-10">
      {/* Title & Module Breadcrumb */}
      <div>
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <span>{moduleTitles[activeModule] || 'FlowMind AI Workspace'}</span>
          <Badge variant="cyan" className="text-[10px]">
            {organization.plan}
          </Badge>
        </h2>
        <p className="text-[11px] text-slate-400">
          Organization: <span className="text-slate-300 font-medium">{organization.name}</span> ({organization.domain})
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Voice Assistant Trigger */}
        <Button
          variant={isVoiceActive ? 'danger' : 'primary'}
          size="sm"
          icon={<Mic className={`w-4 h-4 ${isVoiceActive ? 'animate-pulse' : ''}`} />}
          onClick={() => setVoiceActive(!isVoiceActive)}
          className={isVoiceActive ? 'ring-2 ring-red-500/50' : ''}
        >
          {isVoiceActive ? 'Listening...' : 'Voice Assistant'}
        </Button>

        {/* Proactive Notification Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Alert Popover */}
          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 space-y-2 z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Proactive AI Alerts ({activeAlerts.length})
                </h4>
                <button
                  onClick={() => setShowAlertsDropdown(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>

              {activeAlerts.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No pending proactive alerts.</p>
              ) : (
                activeAlerts.map((alert) => (
                  <div key={alert.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-semibold text-slate-200">{alert.title}</p>
                      <Badge variant="warning">{alert.severity}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{alert.description}</p>
                    {alert.recommendedAction.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full text-xs py-1"
                        onClick={() => approveActionCard(alert.recommendedAction.id)}
                      >
                        {alert.recommendedAction.confirmLabel || '1-Click Approve'}
                      </Button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3 h-3" /> Approved & Executed
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Role Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
          <Badge variant={user.role === 'ADMIN' ? 'purple' : 'default'}>
            {user.role} ACCESS
          </Badge>
        </div>
      </div>
    </header>
  );
};
