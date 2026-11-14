import React, { useState } from 'react';
import {
  Upload,
  X,
  ClipboardList,
  Plus,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import type { TournamentMode } from '../../types/tournament';

export interface RosterDraftItem {
  id?: string;
  name: string;
  shortCode?: string;
  logoUrl?: string;
}

const RUSH_MATCH_CEILINGS = [5, 6, 7, 8, 10] as const;

interface TournamentDetailsSectionProps {
  name: string;
  onNameChange: (val: string) => void;
  roundOrDay: string;
  onRoundOrDayChange: (val: string) => void;
  hostName: string;
  onHostNameChange: (val: string) => void;
  sponsorName: string;
  onSponsorNameChange: (val: string) => void;
  customLogoUrl?: string;
  onLogoUpload: (file: File) => void;
  onClearLogo: () => void;
}

export const TournamentDetailsSection: React.FC<TournamentDetailsSectionProps> = ({
  name,
  onNameChange,
  roundOrDay,
  onRoundOrDayChange,
  hostName,
  onHostNameChange,
  sponsorName,
  onSponsorNameChange,
  customLogoUrl,
  onLogoUpload,
  onClearLogo,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Event Information</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Displayed on scorecards and broadcast standing graphics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Tournament Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Free Fire Champions Cup"
            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Stage / Day Subtitle
          </label>
          <input
            type="text"
            value={roundOrDay}
            onChange={(e) => onRoundOrDayChange(e.target.value)}
            placeholder="e.g. Grand Finals - Day 1"
            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Organizer / Host
          </label>
          <input
            type="text"
            value={hostName}
            onChange={(e) => onHostNameChange(e.target.value)}
            placeholder="Optional"
            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Sponsor
          </label>
          <input
            type="text"
            value={sponsorName}
            onChange={(e) => onSponsorNameChange(e.target.value)}
            placeholder="Optional"
            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Tournament Logo Picker */}
      <div className="pt-1">
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Tournament Emblem (Optional)
        </label>
        <div className="glass-tile flex items-center gap-3 rounded-xl p-3">
          <label className="glass-input relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/20 hover:border-amber-400 transition-colors">
            {customLogoUrl ? (
              <img
                src={customLogoUrl}
                alt="Tournament logo"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <Upload className="h-4 w-4 text-slate-400" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onLogoUpload(file);
              }}
            />
          </label>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200">
              {customLogoUrl ? 'Custom logo uploaded' : 'Upload badge image'}
            </div>
            <div className="text-[11px] text-slate-400">
              Shown in the header of exported PNG graphics
            </div>
          </div>

          {customLogoUrl && (
            <button
              type="button"
              onClick={onClearLogo}
              className="glass-pill inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface FormatRulesSectionProps {
  mode: TournamentMode;
  onModeChange?: (mode: TournamentMode) => void;
  totalMatchesPlanned: number;
  onTotalMatchesPlannedChange: (val: number) => void;
  targetPoints: number;
  onTargetPointsChange: (val: number) => void;
  maxMatches: number;
  onMaxMatchesChange: (val: number) => void;
  pointSystemSummary?: string;
  onOpenRules?: () => void;
}

export const FormatRulesSection: React.FC<FormatRulesSectionProps> = ({
  mode,
  onModeChange,
  totalMatchesPlanned,
  onTotalMatchesPlannedChange,
  targetPoints,
  onTargetPointsChange,
  maxMatches,
  onMaxMatchesChange,
  pointSystemSummary,
  onOpenRules,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">Format & Limits</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {mode === 'CHAMPION_RUSH'
              ? 'Teams unlock Match Point at Target Points; next Booyah wins.'
              : 'All squads play a set number of matches and total points decide.'}
          </p>
        </div>

        {onModeChange && (
          <div className="glass-input inline-flex rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onModeChange('SCRIM')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === 'SCRIM'
                  ? 'bg-white/[0.12] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scrim
            </button>
            <button
              type="button"
              onClick={() => onModeChange('CHAMPION_RUSH')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === 'CHAMPION_RUSH'
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rush
            </button>
          </div>
        )}
      </div>

      {mode === 'CHAMPION_RUSH' ? (
        <div className="space-y-4">
          {/* Open Numeric Field Only for Target Points */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Target Points Threshold *
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                required
                value={targetPoints || ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onTargetPointsChange(Number.isNaN(val) ? 0 : Math.max(1, val));
                }}
                placeholder="80"
                className="glass-input w-full rounded-xl px-3.5 py-2.5 pr-12 text-sm font-semibold text-white tabular-nums focus:border-amber-400 focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                pts
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Enter any custom point target needed before a Booyah crowns the champion.
            </p>
          </div>

          {/* Exact Button Group 5, 6, 7, 8, 10 for Max Matches Ceiling */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Max Matches Ceiling
            </label>
            <div className="grid grid-cols-5 gap-2">
              {RUSH_MATCH_CEILINGS.map((count) => {
                const isSelected = maxMatches === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onMaxMatchesChange(count)}
                    className={`rounded-xl border py-2.5 text-center text-sm font-semibold tabular-nums transition-colors ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500 text-zinc-950'
                        : 'glass-tile text-slate-300 hover:border-white/[0.2] hover:text-white'
                    }`}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              If nobody activates and claims a Booyah earlier, standings finalize after {maxMatches} matches.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Total Planned Matches *
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              required
              value={totalMatchesPlanned || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onTotalMatchesPlannedChange(
                  Number.isNaN(val) ? 1 : Math.max(1, Math.min(50, val))
                );
              }}
              placeholder="6"
              className="glass-input w-full rounded-xl px-3.5 py-2.5 pr-16 text-sm font-semibold text-white tabular-nums focus:border-amber-400 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
              matches
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Matches can also be added incrementally while the tournament is live.
          </p>
        </div>
      )}

      {pointSystemSummary && (
        <div className="glass-tile flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5">
          <div className="text-xs text-slate-400">
            Rules:{' '}
            <span className="text-slate-100 font-medium">
              {pointSystemSummary}
            </span>
          </div>
          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 shrink-0"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Edit</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface SquadRosterSectionProps {
  teams: RosterDraftItem[];
  onSetCount: (count: number) => void;
  onAddTeam: () => void;
  onRemoveTeam: (index: number) => void;
  onNameChange: (index: number, val: string) => void;
  onLogoUpload: (index: number, file: File) => void;
  onBulkImport: (lines: string[]) => void;
  getInitials: (name: string) => string;
}

export const SquadRosterSection: React.FC<SquadRosterSectionProps> = ({
  teams,
  onSetCount,
  onAddTeam,
  onRemoveTeam,
  onNameChange,
  onLogoUpload,
  onBulkImport,
  getInitials,
}) => {
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const handleApplyPaste = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 0) {
      onBulkImport(lines);
      setBulkText('');
      setShowBulkPaste(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Participating Squads ({teams.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rename teams, upload square logos, or paste a roster list.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[6, 8, 12, 16].map((cnt) => (
            <button
              key={cnt}
              type="button"
              onClick={() => onSetCount(cnt)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium tabular-nums transition-colors ${
                teams.length === cnt
                  ? 'glass-accent text-amber-300'
                  : 'glass-tile text-slate-400 hover:text-white'
              }`}
            >
              {cnt}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowBulkPaste((v) => !v)}
            className="glass-pill inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors"
          >
            <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
            <span>Paste List</span>
          </button>

          {teams.length < 24 && (
            <button
              type="button"
              onClick={onAddTeam}
              className="glass-pill inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {showBulkPaste && (
        <div className="glass-tile rounded-xl p-3.5 space-y-2.5">
          <label className="block text-xs font-medium text-slate-300">
            Paste one team name per line
          </label>
          <textarea
            rows={5}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'Team Liquid\nEVOS Divine\nBuriram United\nTotal Gaming'}
            className="glass-input w-full rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBulkPaste(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyPaste}
              className="rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition-colors"
            >
              Apply Roster
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {teams.map((team, index) => (
          <div
            key={team.id || index}
            className="glass-tile flex items-center gap-2.5 rounded-xl p-2"
          >
            <span className="w-6 text-center text-[11px] font-semibold text-slate-400 tabular-nums shrink-0">
              {String(index + 1).padStart(2, '0')}
            </span>

            <label
              title="Upload team logo"
              className="glass-input flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg text-[11px] font-bold text-slate-300 hover:border-amber-400 transition-colors"
            >
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="h-full w-full object-contain p-0.5"
                />
              ) : (
                <span>{getInitials(team.name || `S${index + 1}`)}</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onLogoUpload(index, file);
                }}
              />
            </label>

            <input
              type="text"
              required
              value={team.name}
              onChange={(e) => onNameChange(index, e.target.value)}
              placeholder={`Squad ${index + 1}`}
              className="min-w-0 flex-1 bg-transparent px-1 py-1 text-sm font-medium text-white placeholder-slate-500 focus:outline-none"
            />

            {teams.length > 2 && (
              <button
                type="button"
                onClick={() => onRemoveTeam(index)}
                aria-label={`Remove ${team.name || `Squad ${index + 1}`}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
