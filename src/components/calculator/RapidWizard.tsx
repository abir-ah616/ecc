import React, { useEffect, useRef } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  ListOrdered,
  Minus,
  Plus,
  Redo2,
  RotateCcw,
  Undo2,
} from 'lucide-react';
import { generateInitials } from '../../store/tournamentStore';
import { getKillPoints, getPlacementPoints } from '../../lib/scoring';
import {
  ordinalRankLabel,
  rapidPromptHeadline,
  type PlacedScorecardRow,
  type RapidWizardState,
} from '../../lib/scorecardHelpers';
import type { Match, PointSystemConfig, Team } from '../../types/tournament';

interface RapidWizardProps {
  teams: Team[];
  match: Match;
  pointSystem: PointSystemConfig;
  wizard: RapidWizardState;
  unplacedTeams: Team[];
  placedRows: PlacedScorecardRow[];
  rankedCount: number;
  completionNotice: boolean;
  onPickTeam: (teamId: string) => void;
  onDraftKillsChange: (nextKills: number) => void;
  onConfirmKills: () => void;
  onReverse: () => void;
  onRedo: () => void;
  onResetRanks: () => void;
  onSwitchToList: () => void;
}

const PC_QUICK_KILLS = [0, 2, 4, 6, 8, 10, 12, 15];

export const RapidWizard: React.FC<RapidWizardProps> = ({
  teams,
  match,
  pointSystem,
  wizard,
  unplacedTeams,
  placedRows,
  rankedCount,
  onPickTeam,
  onDraftKillsChange,
  onConfirmKills,
  onReverse,
  onRedo,
  onResetRanks,
  onSwitchToList,
}) => {
  const killsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wizard.phase !== 'enter_kills' || match.isCompleted) return;
    // Focus PC numeric input automatically without scrolling page away on touch devices
    const isCoarse =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches;
    if (isCoarse) return;

    const timer = window.setTimeout(() => {
      killsInputRef.current?.focus();
      killsInputRef.current?.select();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [wizard.phase, wizard.rank, wizard.selectedTeamId, match.isCompleted]);

  const activeTeam = wizard.selectedTeamId
    ? teams.find((t) => t.id === wizard.selectedTeamId) ?? null
    : null;

  const placementPts = getPlacementPoints(wizard.rank, pointSystem);
  const draftKillPts = getKillPoints(wizard.draftKills, pointSystem);
  const nextRankAfter =
    wizard.rank < teams.length ? wizard.rank + 1 : null;
  const isFinalStep =
    wizard.phase === 'enter_kills' &&
    teams.filter((t) => {
      if (t.id === wizard.selectedTeamId) return false;
      const p = match.entries[t.id]?.placement;
      return !(p != null && p >= 1 && p <= teams.length);
    }).length === 0;

  const appendDigit = (digit: number) => {
    const next = wizard.draftKills === 0 ? digit : wizard.draftKills * 10 + digit;
    onDraftKillsChange(Math.min(99, next));
  };

  const backspaceDigit = () => {
    onDraftKillsChange(Math.floor(wizard.draftKills / 10));
  };

  if (match.isCompleted) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Match Saved</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white">
          Unlock match above to use Rapid Mode
        </h3>
        <button
          type="button"
          onClick={onSwitchToList}
          className="glass-pill inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer"
        >
          <ListOrdered className="h-4 w-4 text-amber-400" />
          <span>View Team List</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Shared Rapid Navigation Header: Step Progress + Reverse / Redo */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-2.5 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-extrabold tabular-nums ${
              wizard.phase === 'done'
                ? 'border border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                : wizard.rank === 1
                  ? 'bg-amber-500 text-zinc-950'
                  : 'glass-accent text-amber-300'
            }`}
          >
            {wizard.rank === 1 && wizard.phase !== 'done' && (
              <Crown className="h-3.5 w-3.5" />
            )}
            <span>
              {wizard.phase === 'done'
                ? `${teams.length}/${teams.length} Done`
                : wizard.rank === 1
                  ? '#1 BOOYAH'
                  : `${ordinalRankLabel(wizard.rank).toUpperCase()} PLACE`}
            </span>
          </span>

          {wizard.phase !== 'done' && (
            <span className="text-xs font-medium text-slate-400 tabular-nums">
              +{placementPts} placement pts · {rankedCount}/{teams.length} ranked
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReverse}
            disabled={wizard.reverseStack.length === 0}
            className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white disabled:opacity-35 transition-colors cursor-pointer"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Reverse</span>
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={wizard.redoStack.length === 0}
            className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white disabled:opacity-35 transition-colors cursor-pointer"
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span>Redo</span>
          </button>

          {rankedCount > 0 && (
            <button
              type="button"
              onClick={onResetRanks}
              title="Reset rapid entry"
              className="glass-pill inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* PHASE 1: WHICH TEAM TOOK BOOYAH / 2ND / 3RD... */}
      {wizard.phase === 'pick_team' && (
        <div
          key={`pick-${wizard.rank}`}
          className="glass-panel rounded-2xl p-4 sm:p-6 space-y-5 animate-spot-rise"
        >
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {rapidPromptHeadline(wizard.rank)}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Tap the squad below to lock {ordinalRankLabel(wizard.rank)} place and enter kills.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {unplacedTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => onPickTeam(team.id)}
                className="group relative flex min-h-[72px] sm:min-h-[82px] items-center gap-3 rounded-2xl border border-white/[0.1] bg-[#121622]/90 px-3.5 py-3 text-left hover:border-amber-400/70 hover:bg-amber-500/[0.08] active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.1] bg-[#0B0E14] text-xs font-extrabold text-amber-300">
                  {team.logoUrl ? (
                    <img
                      src={team.logoUrl}
                      alt=""
                      className="h-full w-full object-contain p-0.5"
                    />
                  ) : (
                    generateInitials(team.name)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm sm:text-[15px] font-bold text-white leading-snug group-hover:text-amber-200 transition-colors">
                    {team.name}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-slate-500 group-hover:text-amber-400/90 transition-colors">
                    Select {wizard.rank === 1 ? 'Booyah' : ordinalRankLabel(wizard.rank)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 2: SELECTED TEAM RISES UP + BOTTOM "TOTAL KILLS?" POPUP */}
      {wizard.phase === 'enter_kills' && activeTeam && (
        <div className="space-y-3">
          {/* Top Rising Spotlight Card */}
          <div
            key={`spot-${wizard.rank}-${activeTeam.id}`}
            className="animate-spot-rise rounded-2xl border border-amber-400/45 bg-gradient-to-r from-amber-500/[0.16] via-[#171923] to-[#12151E] px-4 py-3.5 sm:px-5 sm:py-4 shadow-[0_12px_28px_rgba(245,158,11,0.12)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-400/40 bg-[#0B0E14] text-sm font-extrabold text-amber-300">
                  {activeTeam.logoUrl ? (
                    <img
                      src={activeTeam.logoUrl}
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    generateInitials(activeTeam.name)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                    {wizard.rank === 1 && <Crown className="h-3 w-3" />}
                    <span>
                      {wizard.rank === 1
                        ? '#1 Booyah Squad'
                        : `${ordinalRankLabel(wizard.rank)} Place Squad`}
                    </span>
                  </div>
                  <h3 className="truncate text-lg sm:text-xl font-extrabold text-white">
                    {activeTeam.name}
                  </h3>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-lg sm:text-xl font-black text-amber-300 tabular-nums">
                  {placementPts + draftKillPts} pts
                </div>
                <div className="text-[11px] font-medium text-slate-400 tabular-nums">
                  {placementPts}p + {draftKillPts}k
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Slide-Up "Total Kills?" Prompt */}
          <div
            key={`kills-${wizard.rank}-${activeTeam.id}`}
            className="animate-popup-bottom glass-panel rounded-2xl border-white/[0.12] p-5 sm:p-6 space-y-5"
          >
            <div className="text-center space-y-1">
              <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Total Kills?
              </h4>
              <p className="text-xs sm:text-sm text-slate-400">
                Enter eliminations for <strong className="text-slate-200">{activeTeam.name}</strong>
              </p>
            </div>

            {/* PC Numeric Readout + Stepper (visible everywhere, autofocus on PC) */}
            <div className="mx-auto flex max-w-xs items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onDraftKillsChange(Math.max(0, wizard.draftKills - 1))}
                disabled={wizard.draftKills <= 0}
                aria-label="Decrease kills"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.04] text-slate-200 hover:bg-white/[0.1] disabled:opacity-35 transition-colors cursor-pointer"
              >
                <Minus className="h-5 w-5" />
              </button>

              <input
                ref={killsInputRef}
                type="number"
                min={0}
                max={99}
                inputMode="numeric"
                value={wizard.draftKills}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const raw = parseInt(e.target.value || '0', 10);
                  onDraftKillsChange(
                    Number.isFinite(raw) ? Math.max(0, Math.min(99, raw)) : 0
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirmKills();
                  }
                }}
                aria-label="Total Kills"
                className="h-14 w-28 rounded-2xl border border-amber-400/50 bg-[#0B0E14] text-center text-3xl sm:text-4xl font-black text-amber-300 tabular-nums focus:border-amber-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => onDraftKillsChange(Math.min(99, wizard.draftKills + 1))}
                aria-label="Increase kills"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.04] text-slate-200 hover:bg-white/[0.1] transition-colors cursor-pointer"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* PC Quick Select Chips (hidden on narrow mobile in favor of keypad) */}
            <div className="hidden sm:flex flex-wrap items-center justify-center gap-2">
              {PC_QUICK_KILLS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onDraftKillsChange(val)}
                  className={`min-w-[44px] rounded-xl border px-3 py-1.5 text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                    wizard.draftKills === val
                      ? 'border-amber-400 bg-amber-500 text-zinc-950'
                      : 'border-white/[0.1] bg-white/[0.04] text-slate-300 hover:border-white/[0.22] hover:text-white'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            {/* Mobile Big Styled 3x4 Thumb Keypad */}
            <div className="grid grid-cols-3 gap-2 sm:hidden">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => appendDigit(digit)}
                  className="h-12 rounded-xl border border-white/[0.1] bg-[#141824] text-lg font-bold text-white active:bg-amber-500/20 active:border-amber-400/60 transition-colors cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onDraftKillsChange(0)}
                className="h-12 rounded-xl border border-white/[0.1] bg-white/[0.04] text-xs font-bold uppercase tracking-wider text-slate-300 active:bg-white/[0.1] cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => appendDigit(0)}
                className="h-12 rounded-xl border border-white/[0.1] bg-[#141824] text-lg font-bold text-white active:bg-amber-500/20 active:border-amber-400/60 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={backspaceDigit}
                className="h-12 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-bold text-slate-300 active:bg-white/[0.1] cursor-pointer"
              >
                Del
              </button>
            </div>

            {/* Primary Step Confirm CTA */}
            <button
              type="button"
              onClick={onConfirmKills}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 py-3.5 text-sm sm:text-base font-extrabold text-zinc-950 transition-colors cursor-pointer"
            >
              <span>
                {isFinalStep
                  ? 'Finish & Review Team List'
                  : nextRankAfter
                    ? `Next · ${ordinalRankLabel(nextRankAfter)} Place`
                    : 'Next'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 3: ALL PLACEMENTS ENTERED */}
      {wizard.phase === 'done' && (
        <div className="glass-panel rounded-2xl p-6 text-center space-y-4 animate-spot-rise">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/35 bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              All {teams.length} Placements Entered
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Switch to Team List to adjust any rank or kills, or use Reverse above to edit your last step.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onSwitchToList}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-zinc-950 transition-colors cursor-pointer"
            >
              <ListOrdered className="h-4 w-4" />
              <span>Edit in Team List</span>
            </button>
            <button
              type="button"
              onClick={onResetRanks}
              className="glass-pill inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Re-enter All</span>
            </button>
          </div>
        </div>
      )}

      {/* Compact Placed Progress Pills */}
      {placedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-0.5">
          {placedRows.map(({ rank, team, entry }) => (
            <span
              key={team.id}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold tabular-nums ${
                rank === 1
                  ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-300'
              }`}
            >
              <strong className={rank === 1 ? 'text-amber-400' : 'text-slate-400'}>
                #{rank}
              </strong>
              <span className="max-w-[110px] truncate">{team.name}</span>
              <span className="text-slate-500">{entry.kills}K</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
