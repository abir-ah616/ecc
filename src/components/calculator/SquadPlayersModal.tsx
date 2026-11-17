import React, { useState } from 'react';
import { X, Users, Plus, Check, ScanLine } from 'lucide-react';
import type { Team } from '../../types/tournament';
import {
  buildSquadPlayerFields,
  resolveSquadPlayers,
} from '../../lib/rosterHelpers';

interface SquadPlayersModalProps {
  isOpen: boolean;
  teams: Team[];
  autoResultFromScreenshot: boolean;
  onClose: () => void;
  onSave: (updatedTeams: Team[], autoResultEnabled: boolean) => void;
}

export const SquadPlayersModal: React.FC<SquadPlayersModalProps> = ({
  isOpen,
  teams,
  autoResultFromScreenshot,
  onClose,
  onSave,
}) => {
  const [autoEnabled, setAutoEnabled] = useState(autoResultFromScreenshot);
  const [draftByTeamId, setDraftByTeamId] = useState<Record<string, string[]>>(
    () => {
      const map: Record<string, string[]> = {};
      for (const t of teams) {
        const existing = resolveSquadPlayers(t);
        map[t.id] = existing.length > 0 ? existing : [''];
      }
      return map;
    }
  );

  if (!isOpen) return null;

  const handleMemberChange = (teamId: string, idx: number, val: string) => {
    setDraftByTeamId((prev) => {
      const current = [...(prev[teamId] || [''])];
      current[idx] = val;
      return { ...prev, [teamId]: current };
    });
  };

  const handleAddMember = (teamId: string) => {
    setDraftByTeamId((prev) => {
      const current = [...(prev[teamId] || [''])];
      if (current.length >= 5) return prev;
      return { ...prev, [teamId]: [...current, ''] };
    });
  };

  const handleRemoveMember = (teamId: string, idx: number) => {
    setDraftByTeamId((prev) => {
      const current = [...(prev[teamId] || [''])];
      if (current.length <= 1) {
        return { ...prev, [teamId]: [''] };
      }
      return {
        ...prev,
        [teamId]: current.filter((_, i) => i !== idx),
      };
    });
  };

  const handleSave = () => {
    const anyPlayerAdded = Object.values(draftByTeamId).some((list) =>
      list.some((p) => p.trim().length > 0)
    );
    const nextTeams: Team[] = teams.map((t) => {
      const rawList = draftByTeamId[t.id] || [];
      return {
        ...t,
        ...buildSquadPlayerFields(rawList),
      };
    });
    onSave(nextTeams, autoEnabled || anyPlayerAdded);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 sm:p-5 select-none">
      <div className="glass-modal flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="glass-accent flex h-10 w-10 items-center justify-center rounded-xl text-amber-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Squad Team Members &amp; Auto-Scan
                </h3>
                <span className="rounded-md border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Beta
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Add or edit team member IGNs anytime. Plain readable words match stylish symbols automatically.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close squad players editor"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Enable / Disable Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={autoEnabled}
            onClick={() => setAutoEnabled((v) => !v)}
            className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
              autoEnabled
                ? 'border-amber-400/45 bg-amber-500/[0.08]'
                : 'border-white/[0.1] bg-white/[0.03] hover:border-white/[0.18]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  autoEnabled
                    ? 'bg-amber-500 text-zinc-950'
                    : 'glass-input text-slate-300'
                }`}
              >
                <ScanLine className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">
                    Auto Result from Screenshot
                  </span>
                  <span className="rounded border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-amber-300">
                    Beta
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {autoEnabled
                    ? 'Enabled — OCR screenshots automatically match squads using the member names below.'
                    : 'Currently off — turn on to match squads automatically from post-match screenshots.'}
                </p>
              </div>
            </div>

            <div
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                autoEnabled ? 'bg-amber-500' : 'bg-white/[0.14]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  autoEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* Squads Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map((team, idx) => {
              const members = draftByTeamId[team.id] || [''];
              return (
                <div
                  key={team.id}
                  className="glass-tile rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 tabular-nums shrink-0">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="truncate text-xs font-bold text-white">
                        {team.name}
                      </span>
                    </div>

                    {members.length < 5 && (
                      <button
                        type="button"
                        onClick={() => handleAddMember(team.id)}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors shrink-0"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Member</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {members.map((val, mIdx) => (
                      <div key={mIdx} className="relative flex items-center">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            handleMemberChange(team.id, mIdx, e.target.value)
                          }
                          placeholder={`Member ${mIdx + 1} IGN (e.g. OPPY)`}
                          className="glass-input w-full rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                        />
                        {(members.length > 1 || val.length > 0) && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(team.id, mIdx)}
                            aria-label={`Remove member ${mIdx + 1}`}
                            className="absolute right-2 text-slate-500 hover:text-rose-400"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="glass-pill rounded-xl px-4 py-2 text-xs font-semibold text-slate-300"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-zinc-950 transition-colors"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>Save Team Members</span>
          </button>
        </div>
      </div>
    </div>
  );
};
