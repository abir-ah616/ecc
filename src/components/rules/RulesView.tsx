import React, { useState } from 'react';
import {
  CheckCircle2,
  Minus,
  Plus,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { DEFAULT_PLACEMENT_POINTS } from '../../lib/scoring';

export const RulesView: React.FC = () => {
  const { defaultPointSystem, updateDefaultPointSystem, setCurrentTab } =
    useTournamentStore();
  const [showExtendedRanks, setShowExtendedRanks] = useState(false);

  const isOfficialPreset =
    defaultPointSystem.killPoints === 1 &&
    defaultPointSystem.placementPoints.slice(0, 12).join(',') ===
      '12,9,8,7,6,5,4,3,2,1,0,0';

  const isClassicPreset =
    defaultPointSystem.killPoints === 1 &&
    defaultPointSystem.placementPoints.slice(0, 12).join(',') ===
      '20,17,15,13,12,10,6,4,3,2,1,0';

  const applyOfficialPreset = () => {
    updateDefaultPointSystem({
      killPoints: 1,
      placementPoints: [...DEFAULT_PLACEMENT_POINTS],
    });
  };

  const applyClassicPreset = () => {
    updateDefaultPointSystem({
      killPoints: 1,
      placementPoints: [
        20, 17, 15, 13, 12, 10, 6, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
    });
  };

  const handlePlacementChange = (index: number, raw: string) => {
    const parsed = parseInt(raw, 10);
    const val = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(200, parsed));
    const next = [...defaultPointSystem.placementPoints];
    while (next.length <= index) next.push(0);
    next[index] = val;
    updateDefaultPointSystem({ placementPoints: next });
  };

  const adjustKillPoints = (delta: number) => {
    updateDefaultPointSystem({
      killPoints: Math.max(0, Math.min(50, defaultPointSystem.killPoints + delta)),
    });
  };

  const visibleRankCount = showExtendedRanks ? 20 : 12;

  return (
    <div className="space-y-5 select-none">
      {/* Concise Borderless Section Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="text-sm text-slate-300/90">
            Configure kill multipliers and finish rank placement points for newly created tournaments.
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 border border-emerald-400/25 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Auto-saved
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCurrentTab('home')}
          className="glass-pill self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Overview</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Presets, Kill Points, Tie-break Summary */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Presets */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Scoring Presets
              </h2>
              <button
                type="button"
                onClick={applyOfficialPreset}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Official</span>
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={applyOfficialPreset}
                className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                  isOfficialPreset
                    ? 'glass-accent'
                    : 'glass-tile hover:border-white/[0.16]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Official 12-Point (FFWS Standard)
                  </span>
                  {isOfficialPreset && (
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  1st = 12, 2nd = 9, 3rd = 8 ... 10th = 1 · 1 pt per kill
                </p>
              </button>

              <button
                type="button"
                onClick={applyClassicPreset}
                className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                  isClassicPreset
                    ? 'glass-accent'
                    : 'glass-tile hover:border-white/[0.16]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Classic 20-Point
                  </span>
                  {isClassicPreset && (
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  1st = 20, 2nd = 17, 3rd = 15 ... 11th = 1 · 1 pt per kill
                </p>
              </button>
            </div>
          </div>

          {/* Kill Points Control */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">
              Elimination Points
            </h2>
            <p className="text-xs text-slate-400">
              Points awarded to a squad for each elimination in a match.
            </p>

            <div className="glass-tile flex items-center justify-between rounded-xl p-3">
              <span className="text-xs font-medium text-slate-200">
                Points per Kill
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustKillPoints(-1)}
                  aria-label="Decrease kill points"
                  className="glass-pill flex h-9 w-9 items-center justify-center rounded-lg text-slate-200 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  value={defaultPointSystem.killPoints}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    updateDefaultPointSystem({
                      killPoints: Math.max(
                        0,
                        Math.min(50, parseInt(e.target.value, 10) || 0)
                      ),
                    })
                  }
                  className="glass-input h-9 w-16 rounded-lg text-center text-sm font-bold text-white tabular-nums focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustKillPoints(1)}
                  aria-label="Increase kill points"
                  className="glass-pill flex h-9 w-9 items-center justify-center rounded-lg text-slate-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tie-breaker Explanation */}
          <div className="glass-panel rounded-2xl p-5 space-y-2.5">
            <h2 className="text-sm font-semibold text-white">
              Tie-Breaker Order
            </h2>
            <ol className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white/[0.08] text-[10px] font-bold text-slate-200">
                  1
                </span>
                <span>Highest Cumulative Total Points</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white/[0.08] text-[10px] font-bold text-slate-200">
                  2
                </span>
                <span>Most Booyahs (1st place finishes)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white/[0.08] text-[10px] font-bold text-slate-200">
                  3
                </span>
                <span>Highest Placement Points</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white/[0.08] text-[10px] font-bold text-slate-200">
                  4
                </span>
                <span>Highest Total Kills</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white/[0.08] text-[10px] font-bold text-slate-200">
                  5
                </span>
                <span>Best Last-Match Placement</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Right Column: Placement Points Matrix */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Placement Points by Finish Rank
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tap any rank value below to customize the points earned.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExtendedRanks((v) => !v)}
                className="glass-pill inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
              >
                <span>{showExtendedRanks ? 'Show Top 12' : 'Show Ranks 1-20'}</span>
                {showExtendedRanks ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: visibleRankCount }, (_, idx) => {
                const pts = defaultPointSystem.placementPoints[idx] ?? 0;
                const isFirst = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors ${
                      isFirst ? 'glass-accent' : 'glass-tile'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-semibold ${
                          isFirst ? 'text-amber-300' : 'text-slate-200'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      {isFirst && (
                        <span className="text-[10px] font-medium text-amber-300/80">
                          Booyah
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={200}
                        value={pts}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handlePlacementChange(idx, e.target.value)}
                        aria-label={`Rank ${idx + 1} placement points`}
                        className="glass-input w-14 rounded-lg px-2 py-1.5 text-right text-sm font-bold text-white tabular-nums focus:border-amber-400 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400">pt</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
