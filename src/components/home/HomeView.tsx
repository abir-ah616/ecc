import React, { useState } from 'react';
import {
  Trophy,
  Play,
  CheckCircle2,
  Plus,
  Sliders,
  Crown,
  History,
  X,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateTournamentStandings } from '../../lib/scoring';

export const HomeView: React.FC = () => {
  const {
    tournaments,
    switchActiveTournament,
    setCurrentTab,
    endTournamentById,
    defaultPointSystem,
    updateDefaultPointSystem,
  } = useTournamentStore();

  const [isPointModalOpen, setIsPointModalOpen] = useState(false);

  const liveTournaments = tournaments.filter((t) => !t.isEnded);

  const applyOfficialPreset = () => {
    updateDefaultPointSystem({
      killPoints: 1,
      placementPoints: [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0],
    });
  };

  const applyClassicPreset = () => {
    updateDefaultPointSystem({
      killPoints: 1,
      placementPoints: [20, 17, 15, 13, 12, 10, 6, 4, 3, 2, 1, 0, 0, 0, 0],
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] py-8 px-4 sm:px-6 lg:px-8 space-y-10 select-none max-w-7xl mx-auto">
      {/* Telemetry Stream Ticker */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0F111A]/80 px-4 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-neutral-400 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-white">COMMAND DECK: READY</span>
          <span className="text-neutral-600">|</span>
          <span className="text-amber-400">FREE FIRE ENGINE V3.2</span>
        </div>

        <div className="flex items-center gap-4 text-neutral-400">
          <span className="hidden sm:inline">
            SCORING: <strong className="text-white">#{defaultPointSystem.placementPoints[0]} BOOYAH</strong> / <strong className="text-white">{defaultPointSystem.killPoints} PT KILL</strong>
          </span>
          <span className="text-neutral-600 hidden sm:inline">|</span>
          <span>
            ACTIVE BATTLES: <strong className="text-emerald-400">{liveTournaments.length}</strong>
          </span>
        </div>
      </div>

      {/* Futuristic Hero Command Header */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#151926] via-[#0E111B] to-[#0A0C13] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>OFFICIAL ESPORTS BROADCAST SUITE</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              TOURNAMENT COMMAND DECK
            </h1>

            <p className="text-sm sm:text-base font-semibold text-neutral-300 leading-relaxed">
              Real-time match scoring, instant Champion Rush target tracking, and broadcast-ready 4K graphic poster generation across 7 esports themes.
            </p>
          </div>

          {/* Large Hero Action Launcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="group relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-pos-0 hover:bg-pos-100 px-7 py-4 text-sm sm:text-base font-black uppercase tracking-wider text-black shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_45px_rgba(245,158,11,0.8)] transition-all active:scale-95"
            >
              <Plus className="h-5 w-5 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
              <span>NEW TOURNAMENT</span>
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 PRIMARY ACTION COMMAND HUBS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hub 1: CREATE TOURNAMENT */}
        <div
          onClick={() => setCurrentTab('create')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-500/30 bg-[#121522] p-6 shadow-xl hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-neutral-900 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:scale-110 group-hover:border-amber-400 transition-all">
                <Trophy className="h-7 w-7" />
              </div>
              <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-amber-300">
                PROTOCOL
              </span>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white group-hover:text-amber-300 transition-colors">
                DEPLOY TOURNAMENT
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-400 leading-normal">
                Choose Classic Scrims or Champion Rush mode, configure custom squads, and launch instant scoring.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300 uppercase">
                Classic Scrims
              </span>
              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300 uppercase">
                Champion Rush
              </span>
              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300 uppercase">
                12-18 Squads
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-black uppercase tracking-wider text-amber-400 group-hover:text-amber-300">
            <span>INITIALIZE TOURNAMENT</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
          </div>
        </div>

        {/* Hub 2: TOURNAMENT ARCHIVES */}
        <div
          onClick={() => setCurrentTab('history')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#121522] p-6 shadow-xl hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-neutral-900 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:scale-110 group-hover:border-cyan-400 transition-all">
                <History className="h-7 w-7" />
              </div>
              <span className="rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-cyan-300">
                {tournaments.length} ARCHIVED
              </span>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                BATTLE ARCHIVES
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-400 leading-normal">
                Search and explore past tournaments, inspect match scorecards, export graphics, or restore concluded scrims.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300 uppercase">
                Search Logs
              </span>
              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300 uppercase">
                Scorecards
              </span>
              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300 uppercase">
                4K Posters
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-black uppercase tracking-wider text-cyan-400 group-hover:text-cyan-300">
            <span>OPEN VAULT</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
          </div>
        </div>

        {/* Hub 3: SCORING RULES */}
        <div
          onClick={() => setIsPointModalOpen(true)}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-purple-500/30 bg-[#121522] p-6 shadow-xl hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-neutral-900 border border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-110 group-hover:border-purple-400 transition-all">
                <Sliders className="h-7 w-7" />
              </div>
              <span className="rounded-lg bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-purple-300">
                ACTIVE MATRIX
              </span>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white group-hover:text-purple-300 transition-colors">
                SCORING MATRIX
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-400 leading-normal">
                Inspect and tune Placement Points distribution and Kill Points with official tournament presets.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-white">
                #1 BOOYAH: <span className="text-amber-400">{defaultPointSystem.placementPoints[0]} PTS</span>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-white">
                EACH KILL: <span className="text-emerald-400">{defaultPointSystem.killPoints} PT</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-black uppercase tracking-wider text-purple-400 group-hover:text-purple-300">
            <span>CONFIGURE RULES</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </div>

      {/* ACTIVE IN-PROGRESS TOURNAMENTS RADAR SECTION */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
              LIVE BATTLE RADAR
            </h2>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {liveTournaments.length} IN PROGRESS
          </span>
        </div>

        {liveTournaments.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {liveTournaments.map((t) => {
              const standings = calculateTournamentStandings(t.teams, t.matches, t.settings);
              const leader = standings.standings[0];
              const completedMatches = t.matches.filter((m) => m.isCompleted);
              const pendingMatch = t.matches.find((m) => !m.isCompleted);
              const currentMatch = pendingMatch || t.matches[t.matches.length - 1];

              return (
                <div
                  key={t.id}
                  className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-[#121522] via-[#0F121C] to-[#0D0F17] p-6 shadow-2xl transition-all hover:border-amber-400/60 hover:shadow-[0_0_35px_rgba(245,158,11,0.2)]"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left: Tournament Details & Current Match */}
                    <div className="space-y-3 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border ${
                            t.settings.mode === 'CHAMPION_RUSH'
                              ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                              : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                          }`}
                        >
                          {t.settings.mode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
                        </span>

                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                          {completedMatches.length}/{t.matches.length} MATCHES RECORDED
                        </span>

                        <span className="text-xs font-semibold text-neutral-500">
                          {t.teams.length} Squads Enrolled
                        </span>
                      </div>

                      <h3 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wider text-white truncate">
                        {t.settings.name}
                      </h3>

                      {/* Leader Preview */}
                      {leader && (
                        <div className="inline-flex items-center gap-3 rounded-xl bg-black/40 border border-amber-500/30 px-4 py-2">
                          <Crown className="h-5 w-5 text-amber-400" />
                          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider">
                            <span className="text-neutral-400">LEADER #1:</span>
                            <span className="text-white font-extrabold">{leader.teamName}</span>
                            <span className="text-amber-400 font-numbers text-base font-black">
                              {leader.totalPoints} PTS
                            </span>
                            <span className="text-neutral-500 text-xs font-numbers">
                              ({leader.kills} KILLS • {leader.booyahCount} BOOYAH)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Quick Action Controls */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {currentMatch && (
                        <button
                          type="button"
                          onClick={() => {
                            switchActiveTournament(t.id);
                            setCurrentTab(currentMatch.id);
                          }}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-lg hover:brightness-110 active:scale-95 transition-all"
                        >
                          <Play className="h-4 w-4 fill-black" />
                          <span>SCORE MATCH {currentMatch.matchNumber}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id);
                          setCurrentTab('results');
                        }}
                        className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-amber-400/50 px-4 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-all active:scale-95"
                      >
                        <Trophy className="h-4 w-4 text-amber-400" />
                        <span>STANDINGS GRAPHIC</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => endTournamentById(t.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-red-400 transition-all active:scale-95"
                        title="Conclude Tournament"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>CONCLUDE</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0D0F17]/60 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Trophy className="h-8 w-8" />
            </div>
            <h3 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
              NO ACTIVE TOURNAMENT IN PROGRESS
            </h3>
            <p className="mt-1.5 text-sm font-semibold text-neutral-400 max-w-md">
              Deploy a new Classic Scrim or Champion Rush tournament to begin recording scores and generating live 4K broadcast graphics.
            </p>
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3 text-sm font-black uppercase tracking-wider text-black shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>DEPLOY NEW TOURNAMENT</span>
            </button>
          </div>
        )}
      </div>

      {/* SCORING RULES CONFIGURATION MODAL */}
      {isPointModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-white/20 bg-[#121522] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Sliders className="h-5 w-5 text-purple-400" />
                <h3 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
                  SCORING MATRIX CONFIGURATION
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPointModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 pt-5">
              {/* Presets */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  OFFICIAL PRESETS
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={applyOfficialPreset}
                    className="flex flex-col items-start rounded-xl border border-white/15 bg-white/5 p-3.5 hover:border-amber-400/60 hover:bg-white/10 transition-all text-left"
                  >
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      OFFICIAL 12-POINT
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-400 mt-1">
                      12, 9, 8, 7, 6, 5, 4, 3, 2, 1 (FFWS Standard)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={applyClassicPreset}
                    className="flex flex-col items-start rounded-xl border border-white/15 bg-white/5 p-3.5 hover:border-cyan-400/60 hover:bg-white/10 transition-all text-left"
                  >
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                      CLASSIC 20-POINT
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-400 mt-1">
                      20, 17, 15, 13, 12, 10, 6, 4, 3, 2, 1
                    </span>
                  </button>
                </div>
              </div>

              {/* Kill Points */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  POINTS PER KILL
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={defaultPointSystem.killPoints}
                  onChange={(e) =>
                    updateDefaultPointSystem({
                      killPoints: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Placement Points Grid */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  PLACEMENT POINTS DISTRIBUTION (#1 - #12)
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {defaultPointSystem.placementPoints.slice(0, 12).map((pts, idx) => (
                    <div
                      key={idx}
                      className="flex items-center rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5"
                    >
                      <span className="w-9 text-xs font-bold text-neutral-400">#{idx + 1}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pts}
                        onChange={(e) => {
                          const newPts = [...defaultPointSystem.placementPoints];
                          newPts[idx] = Math.max(0, parseInt(e.target.value, 10) || 0);
                          updateDefaultPointSystem({ placementPoints: newPts });
                        }}
                        className="w-full bg-transparent text-right text-xs font-bold text-amber-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsPointModalOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-lg hover:brightness-110"
                >
                  SAVE &amp; APPLY RULES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
