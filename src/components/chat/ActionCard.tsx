'use client';

import React, { useState } from 'react';
import { ActionCardData } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store/useAppStore';
import { ShieldAlert, CheckCircle2, XCircle, Edit3, Save, X } from 'lucide-react';
import { AgentLogo } from '@/components/ui/AgentLogo';

interface ActionCardProps {
  data: ActionCardData;
}

export const ActionCard: React.FC<ActionCardProps> = ({ data }) => {
  const { approveActionCard, editActionCard, cancelActionCard } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({ ...data.details });

  const isApproved = data.status === 'APPROVED';
  const isCancelled = data.status === 'CANCELLED';
  const isEdited = data.status === 'EDITED';

  const handleSaveEdit = () => {
    editActionCard(data.id, editForm);
    setIsEditing(false);
  };

  return (
    <div className="my-3 p-4 rounded-2xl bg-slate-900/90 border border-purple-500/40 shadow-2xl space-y-3 relative overflow-hidden text-white">
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <AgentLogo agentId={data.agent} size="xs" glow />
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-white">{data.title}</h4>
        </div>
        <Badge
          variant={
            isApproved
              ? 'success'
              : isCancelled
              ? 'default'
              : isEdited
              ? 'purple'
              : 'warning'
          }
        >
          {isApproved
            ? 'APPROVED & EXECUTED'
            : isCancelled
            ? 'CANCELLED'
            : isEdited
            ? 'MODIFIED (AWAITING APPROVAL)'
            : 'REQUIRES APPROVAL'}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed">{data.description}</p>

      {/* Parameter Details (Read View / Edit Form) */}
      {!isEditing ? (
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-1.5 font-mono text-slate-300">
          <div className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider mb-1">
            Action Parameters & Target Entity:
          </div>
          {Object.entries(data.details).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-slate-400">{key}:</span>
              <span className="font-semibold text-purple-300">{String(val)}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Edit Parameters Form */
        <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/50 space-y-2 text-xs">
          <div className="flex items-center justify-between text-purple-300 font-bold mb-1">
            <span>Edit Proposed Action Parameters:</span>
            <span className="text-[10px] text-slate-400">(Modifies parameters without executing)</span>
          </div>
          {Object.entries(editForm).map(([key, val]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase">{key}:</label>
              <input
                type="text"
                value={String(val)}
                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
              />
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="dark"
              className="bg-purple-600 hover:bg-purple-500 text-xs"
              onClick={handleSaveEdit}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Parameters
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setIsEditing(false)}
              icon={<X className="w-3.5 h-3.5" />}
            >
              Cancel Edit
            </Button>
          </div>
        </div>
      )}

      {/* Control Buttons (Approve & Execute, Edit, Cancel) */}
      {!isApproved && !isCancelled && !isEditing && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="dark"
            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-400/30 text-white font-bold"
            onClick={() => approveActionCard(data.id)}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            {data.confirmLabel || 'Approve & Execute'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs text-purple-300 border-purple-500/40 hover:bg-purple-900/40"
            onClick={() => setIsEditing(true)}
            icon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-slate-400 hover:text-red-300 hover:bg-red-950/40"
            onClick={() => cancelActionCard(data.id)}
            icon={<XCircle className="w-3.5 h-3.5" />}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Execution Result State Banners */}
      {isApproved && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Action approved and executed by {data.agent} Agent. Audit log entry recorded.
        </div>
      )}

      {isCancelled && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center justify-center gap-1.5 font-medium">
          <XCircle className="w-4 h-4 shrink-0" /> Action cancelled by user. No operational changes executed.
        </div>
      )}
    </div>
  );
};
