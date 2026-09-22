import React from 'react';
import { ActionCardData } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store/useAppStore';
import { ShieldAlert, CheckCircle2, XCircle, Edit3 } from 'lucide-react';

interface ActionCardProps {
  data: ActionCardData;
}

export const ActionCard: React.FC<ActionCardProps> = ({ data }) => {
  const { approveActionCard } = useAppStore();

  const isApproved = data.status === 'APPROVED';

  return (
    <div className="my-3 p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 shadow-xl space-y-3 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-slate-100">{data.title}</h4>
        </div>
        <Badge variant={isApproved ? 'success' : 'warning'}>
          {isApproved ? 'APPROVED & EXECUTED' : 'REQUIRES APPROVAL'}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed">{data.description}</p>

      {/* Parameter Details */}
      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1 font-mono text-slate-300">
        {Object.entries(data.details).map(([key, val]) => (
          <div key={key} className="flex justify-between">
            <span className="text-slate-400">{key}:</span>
            <span className="font-semibold text-blue-400">{String(val)}</span>
          </div>
        ))}
      </div>

      {/* Control Buttons */}
      {!isApproved ? (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="primary"
            className="flex-1 text-xs"
            onClick={() => approveActionCard(data.id)}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            {data.confirmLabel || 'Approve & Execute'}
          </Button>
          <Button size="sm" variant="outline" icon={<Edit3 className="w-3.5 h-3.5" />}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" icon={<XCircle className="w-3.5 h-3.5" />}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4" /> Action approved and executed by {data.agent} Agent.
        </div>
      )}
    </div>
  );
};
