import React, { useEffect, useRef } from 'react';
import {
  ArrowRight,
  Check,
  Crown,
  Redo2,
  RotateCcw,
  Undo2,
  X,
} from 'lucide-react';
import { generateInitials } from '../../store/tournamentStore';
import {
  ordinalRankLabel,
  rapidPromptHeadline,
  type RapidWizardState,
} from '../../lib/scorecardHelpers';
import type { Match, Team } from '../../types/tournament';

interface RapidWizardProps {
  teams: Team[];
  match: Match;
  wizard: RapidWizardState;
  unplacedTeams: Team[];
  onPickTeam: (teamId: string) => void;
  onDraftKillsChange: (nextKills: number) => void;
  onConfirmKills: () => void;
  onReverse: () => void;
  onRedo: () => void;
  onResetRanks: () => void;
  onClose: () => void;
}

export const RapidWizard: React.FC<RapidWizardProps> = ({
  teams,
  match,
  wizard,
  unplacedTeams,
  onPickTeam,
  onDraftKillsChange,
  onConfirmKills,
  onReverse,
  onRedo,
  onResetRanks,
  onClose,
}) => {
  const killsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (wizard.phase !== 'enter_kills' || match.isCompleted) return;
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

  const isFinalStep =
    wizard.phase === 'enter_kills' &&
    teams.filter((t) => {
      if (t.id === wizard.selectedTeamId) return false;
      const p = match.entries[t.id]?.placement;
      return !(p != null && p >= 1 && p <= teams.length);
    }).length === 0;

  const appendDigit = (digit: number) => {
    const next =
      wizard.draftKills === 0 ? digit : wizard.draftKills * 10 + digit;
    onDraftKillsChange(Math.min(99, next));
  };

  const backspaceDigit = () => {
    onDraftKillsChange(Math.floor(wizard.draftKills / 10));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rapid Entry"
      className="fixed inset-0 z-50 flex flex-col bg-[#06080D]/80 backdrop-blur-2xl"
    >
      {/* Minimal Top Bar: Close left, Reverse & Redo right */}
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close rapid entry"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] bg-[#121622]/90 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReverse}
            disabled={wizard.reverseStack.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#121622]/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white disabled:opacity-35 transition-colors cursor-pointer"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Reverse</span>
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={wizard.redoStack.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#121622]/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white disabled:opacity-35 transition-colors cursor-pointer"
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span>Redo</span>
          </button>
        </div>
      </div>

      {/* Centered Clean Flow */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center overflow-y-auto px-4 pb-8 sm:px-6">
        {wizard.phase === 'pick_team' && (
          <div
            key={`pick-${wizard.rank}`}
            className="animate-spot-rise space-y-6"
          >
            <div className="text-center space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-zinc-950">
                {wizard.rank === 1 && <Crown className="h-3.5 w-3.5" />}
                <span>#{wizard.rank} Team</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {rapidPromptHeadline(wizard.rank)}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {unplacedTeams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => onPickTeam(team.id)}
                  className="group flex min-h-[74px] items-center gap-3 rounded-2xl border border-white/[0.12] bg-[#121622]/90 px-3.5 py-3 text-left hover:border-amber-400/75 hover:bg-amber-500/[0.08] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.1] bg-[#0B0E14] text-xs font-extrabold text-amber-300">
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
                  <span className="line-clamp-2 text-sm sm:text-[15px] font-bold text-white leading-snug group-hover:text-amber-200 transition-colors">
                    {team.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {wizard.phase === 'enter_kills' && activeTeam && (
          <div className="space-y-4">
            {/* Chosen Squad Rises Up */}
            <div
              key={`spot-${wizard.rank}-${activeTeam.id}`}
              className="animate-spot-rise mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl border border-amber-400/45 bg-[#151824]/95 px-5 py-3.5"
            >
              <span className="inline-flex h-8 min-w-[36px] items-center justify-center rounded-lg bg-amber-500 px-2 text-xs font-black text-zinc-950">
                #{wizard.rank}
              </span>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.1] bg-[#0B0E14] text-xs font-extrabold text-amber-300">
                {activeTeam.logoUrl ? (
                  <img
                    src={activeTeam.logoUrl}
                    alt=""
                    className="h-full w-full object-contain p-0.5"
                  />
                ) : (
                  generateInitials(activeTeam.name)
                )}
              </div>
              <span className="truncate text-lg sm:text-xl font-extrabold text-white">
                {activeTeam.name}
              </span>
            </div>

            {/* Bottom Simple Total Kills? Card */}
            <div
              key={`kills-${wizard.rank}-${activeTeam.id}`}
              className="animate-popup-bottom mx-auto max-w-md rounded-3xl border border-white/[0.12] bg-[#111520]/95 p-6 space-y-5"
            >
              <h3 className="text-center text-2xl font-extrabold tracking-tight text-white">
                Total Kills?
              </h3>

              {/* Desktop / Large Input */}
              <div className="hidden sm:flex justify-center">
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
                  className="h-20 w-36 rounded-2xl border border-amber-400/55 bg-[#090B11] text-center text-5xl font-black text-amber-300 tabular-nums focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Mobile Readout + Clean 3x4 Keypad */}
              <div className="space-y-4 sm:hidden">
                <div className="mx-auto flex h-16 w-32 items-center justify-center rounded-2xl border border-amber-400/50 bg-[#090B11] text-4xl font-black text-amber-300 tabular-nums">
                  {wizard.draftKills}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => appendDigit(digit)}
                      className="h-12 rounded-xl border border-white/[0.1] bg-[#161B29] text-lg font-bold text-white active:bg-amber-500/20 cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => onDraftKillsChange(0)}
                    className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs font-bold uppercase text-slate-300 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => appendDigit(0)}
                    className="h-12 rounded-xl border border-white/[0.1] bg-[#161B29] text-lg font-bold text-white active:bg-amber-500/20 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={backspaceDigit}
                    className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-bold text-slate-300 cursor-pointer"
                  >
                    Del
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onConfirmKills}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 py-3.5 text-base font-extrabold text-zinc-950 transition-colors cursor-pointer"
              >
                <span>
                  {isFinalStep
                    ? 'Done'
                    : `Next · ${ordinalRankLabel(wizard.rank + 1)}`}
                </span>
                {isFinalStep ? (
                  <Check className="h-4.5 w-4.5" />
                ) : (
                  <ArrowRight className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {wizard.phase === 'done' && (
          <div className="animate-spot-rise mx-auto max-w-sm rounded-3xl border border-white/[0.12] bg-[#111520]/95 p-7 text-center space-y-5">
            <h3 className="text-2xl font-extrabold text-white">
              All {teams.length} Teams Entered
            </h3>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 py-3.5 text-sm font-extrabold text-zinc-950 transition-colors cursor-pointer"
              >
                View Standings
              </button>
              <button
                type="button"
                onClick={onResetRanks}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] py-3 text-sm font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Re-enter Ranks</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
