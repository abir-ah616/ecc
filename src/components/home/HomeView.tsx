import React, { useState } from 'react';
import {
  Trophy,
  Play,
  CheckCircle2,
  Plus,
  Sliders,
  Calendar,
  Settings,
  Crown,
  History,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTournamentStore, generateInitials } from '../../store/tournamentStore';
import { calculateTournamentStandings } from '../../lib/scoring';
import type { ThemePreset } from '../../types/tournament';

// Theme preview cards without sparkles
const THEME_SHOWCASE: Array<{
  id: ThemePreset;
  name: string;
  badge: string;
  color: string;
  bgGradient: string;
  accentBorder: string;
}> = [
  {
    id: 'v2',
    name: 'Yellow Vector',
    badge: 'DEFAULT',
    color: '#FACC15',
    bgGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    accentBorder: 'border-yellow-500/50',
  },
  {
    id: 'blue',
    name: 'Arctic Cyan',
    badge: 'POPULAR',
    color: '#06B6D4',
    bgGradient: 'from-cyan-500/20 via-sky-500/10 to-transparent',
    accentBorder: 'border-cyan-500/50',
  },
  {
    id: 'gold',
    name: 'Cyber Rose',
    badge: 'NEON',
    color: '#F43F5E',
    bgGradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    accentBorder: 'border-rose-500/50',
  },
  {
    id: 'eclipse',
    name: 'Solar Flare',
    badge: 'NEW',
    color: '#FB923C',
    bgGradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    accentBorder: 'border-orange-500/50',
  },
  {
    id: 'crimson',
    name: 'Crimson Red',
    badge: 'CLASSIC',
    color: '#EF4444',
    bgGradient: 'from-red-500/20 via-rose-500/10 to-transparent',
    accentBorder: 'border-red-500/50',
  },
  {
    id: 'emerald',
    name: 'Toxic Green',
    badge: 'ACID',
    color: '#10B981',
    bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    accentBorder: 'border-emerald-500/50',
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    badge: 'PRISM',
    color: '#A855F7',
    bgGradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
    accentBorder: 'border-purple-500/50',
  },
];

export const HomeView: React.FC = () => {
  const {
    tournaments,
    switchActiveTournament,
    setCurrentTab,
    endTournamentById,
    defaultPointSystem,
    updateDefaultPointSystem,
  } = useTournamentStore();

  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  // Live active vs ended
  const liveTournaments = tournaments.filter((t) => !t.isEnded);
  const endedTournaments = tournaments.filter((t) => t.isEnded);

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
      {/* 1. TOP HERO SECTION */}
      <section className="relative overflow-hidden rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-[#161118] via-[#0E0B10] to-[#09080B] p-6 sm:p-10 shadow-2xl">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-full max-w-3xl opacity-20 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, rgba(245, 158, 11, 0.3) 50%, transparent 80%)',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-neutral-900/90 px-3 py-1 text-xs font-semibold text-neutral-300 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Official Free Fire Esports Broadcast Engine</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-wider text-white drop-shadow-md">
              Tournament Standings &amp; 4K Graphics
            </h1>

            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
              Fast, automated point calculation and instant broadcast-ready standing posters for scrims,
              community cups, and grand finals. Ready for 16:9 YouTube &amp; 4:5 Instagram/Facebook.
            </p>
          </div>

          {/* Quick Primary Action */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-7 py-4 text-sm font-display font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/60 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Create Tournament</span>
            </button>

            {tournaments.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrentTab('history')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-5 py-3 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all"
              >
                <History className="h-4 w-4 text-amber-400" />
                <span>View Tournament History ({tournaments.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* 3-Step Guided Workflow Pills */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-neutral-800/60 bg-neutral-950/40 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-950/60 border border-red-800/50 text-red-400 font-display font-black text-sm">
              1
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wide">Choose Mode &amp; Squads</p>
              <p className="text-[11px] text-neutral-400">Select Classic Scrim or Champion Rush with 12 or 16 teams</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-neutral-800/60 bg-neutral-950/40 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-400 font-display font-black text-sm">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wide">Enter Match Scores</p>
              <p className="text-[11px] text-neutral-400">Record finish rank &amp; kills; click Next Match anytime</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-neutral-800/60 bg-neutral-950/40 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 font-display font-black text-sm">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wide">Export 4K Graphics</p>
              <p className="text-[11px] text-neutral-400">Download high-res graphic in any of the 7 themes</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE ACTIVE TOURNAMENTS SECTION OR EMPTY STATE */}
      {liveTournaments.length > 0 ? (
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-display text-2xl font-black uppercase tracking-wider text-white">
                Live Tournaments in Progress ({liveTournaments.length})
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Tournament</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {liveTournaments.map((t) => {
              const standings = calculateTournamentStandings(t.teams, t.matches, t.settings);
              const leader = standings.standings[0];
              const completedMatches = t.matches.filter((m) => m.isCompleted);
              const pendingMatch = t.matches.find((m) => !m.isCompleted);
              const currentMatch = pendingMatch || t.matches[t.matches.length - 1];

              return (
                <div
                  key={t.id}
                  className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#120D12] p-6 sm:p-8 shadow-xl transition-all hover:border-neutral-700"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left: Tournament Meta Info */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/90 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-800/60 shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>LIVE ACTIVE</span>
                        </span>

                        <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-neutral-300">
                          {t.settings.mode === 'CHAMPION_RUSH' ? 'CHAMPION RUSH' : 'SCRIM'}
                        </span>

                        <span className="flex items-center gap-1 text-xs text-neutral-400 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                          <span>{t.createdAt}</span>
                        </span>
                      </div>

                      <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white">
                        {t.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-neutral-300">
                        {t.settings.roundOrDay} • Hosted by{' '}
                        <strong className="text-white font-bold">
                          {t.settings.hostName || 'BD Esports Arena'}
                        </strong>{' '}
                        • {completedMatches.length} of {t.matches.length} Matches Concluded
                      </p>

                      {/* Interactive Match Progress Pills */}
                      <div className="pt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mr-1">
                          Matches:
                        </span>
                        {t.matches.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => switchActiveTournament(t.id, m.id)}
                            title={`Match ${m.matchNumber} (${m.isCompleted ? 'Completed' : 'Pending'})`}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                              m.isCompleted
                                ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                                : currentMatch?.id === m.id
                                ? 'bg-amber-950/80 border border-amber-600/80 text-amber-300 shadow-sm animate-pulse'
                                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            <span>M{m.matchNumber}</span>
                            {m.isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right: Current #1 Squad Spotlight */}
                    {leader && (
                      <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-950/90 p-4 shrink-0 sm:min-w-[290px] shadow-inner">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-black border border-amber-500/50 text-amber-400 font-display text-2xl font-black overflow-hidden shadow-md">
                          {leader.logoUrl ? (
                            <img
                              src={leader.logoUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            generateInitials(leader.teamName)
                          )}
                        </div>
                        <div>
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400">
                            <Crown className="h-3 w-3" />
                            <span>Current #1 Leader</span>
                          </span>
                          <div className="font-display text-xl font-black text-white uppercase truncate max-w-[170px]">
                            {leader.teamName}
                          </div>
                          <div className="text-xs text-neutral-400 font-numbers mt-0.5">
                            <strong className="text-white font-bold">{leader.totalPoints}</strong> PTS •{' '}
                            {leader.kills} KILLS
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, currentMatch ? currentMatch.id : 'results');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-display font-black uppercase tracking-wider text-white hover:bg-red-500 shadow-md transition-all active:scale-95"
                      >
                        <Play className="h-4 w-4" />
                        <span>
                          {pendingMatch
                            ? `Score Match ${pendingMatch.matchNumber}`
                            : 'Open Scoring Table'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, 'results');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/90 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-800 transition-colors"
                      >
                        <Trophy className="h-4 w-4 text-amber-400" />
                        <span>View / Export 4K Graphic</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, 'edit');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:bg-neutral-800 transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Edit Squads</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to conclude "${t.name}"? It will be archived in History.`
                          )
                        ) {
                          endTournamentById(t.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-950/80 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/50 hover:text-red-200 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Conclude &amp; Archive</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* Clean Zero-State: When no tournaments exist */
        <section className="rounded-2xl border border-neutral-800 bg-[#120D12] p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-red-500">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl tracking-wider text-white uppercase font-black">
            No Tournaments Created Yet
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Your workspace is clean. Click below to choose between Classic Scrim or Champion Rush and start calculating points with 4K broadcast posters.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 text-sm font-display font-black uppercase tracking-wider text-white hover:bg-red-500 shadow-xl shadow-red-950/60 active:scale-95 transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Tournament</span>
            </button>
          </div>
        </section>
      )}

      {/* 3. THEME SHOWCASE GALLERY */}
      <section className="rounded-2xl border border-neutral-800/80 bg-[#120D12] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
                7 Official Broadcast Themes Included
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Select any style anytime. High-resolution exports optimized for mobile feeds and stream overlays.
            </p>
          </div>

          <span className="self-start sm:self-auto rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-[11px] font-bold text-neutral-400">
            Vector &amp; Illustrator Grade
          </span>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {THEME_SHOWCASE.map((theme) => (
            <div
              key={theme.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-xl border bg-gradient-to-b ${theme.bgGradient} p-3.5 shadow-sm transition-all hover:scale-[1.02] ${theme.accentBorder}`}
            >
              <div>
                <span
                  className="inline-block text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${theme.color}25`, color: theme.color }}
                >
                  {theme.badge}
                </span>
                <div
                  className="font-display text-base font-black uppercase tracking-wide mt-2"
                  style={{ color: theme.color }}
                >
                  {theme.name}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-400">
                <span>16:9 • 4:5</span>
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: theme.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DEFAULT SCORING RULES CONFIGURATION */}
      <section className="rounded-2xl border border-neutral-800/80 bg-[#120D12] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-red-500" />
              <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
                Default Point System Rules
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Current Preset: <strong>1 Point per Kill</strong> • 1st: {defaultPointSystem.placementPoints[0]} pts, 2nd: {defaultPointSystem.placementPoints[1]} pts, 3rd: {defaultPointSystem.placementPoints[2]} pts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyOfficialPreset}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              Official 12-Pt
            </button>
            <button
              type="button"
              onClick={applyClassicPreset}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              Classic 20-Pt
            </button>
            <button
              type="button"
              onClick={() => setIsRulesExpanded(!isRulesExpanded)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              <span>{isRulesExpanded ? 'Hide Details' : 'Customize Points'}</span>
              {isRulesExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-neutral-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsed Detailed Form */}
        {isRulesExpanded && (
          <div className="pt-4 border-t border-neutral-800/80 space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Kill Points */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Kill Points (Per Kill)
                </label>
                <input
                  type="number"
                  min={0}
                  value={defaultPointSystem.killPoints}
                  onChange={(e) =>
                    updateDefaultPointSystem({
                      killPoints: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-bold text-white focus:border-red-500 focus:outline-none"
                />
                <p className="text-[11px] text-neutral-500">Official standard is 1 point per kill.</p>
              </div>

              {/* Placement Points Grid */}
              <div className="md:col-span-3 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Placement Scale (1st – 15th Position)
                </label>
                <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                  {Array.from({ length: 15 }, (_, i) => {
                    const pts = defaultPointSystem.placementPoints[i] ?? 0;
                    return (
                      <div key={i} className="rounded-lg bg-neutral-900 border border-neutral-800 p-1.5">
                        <div className="text-[10px] text-neutral-500 font-bold mb-0.5">
                          #{i + 1}
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={pts}
                          onChange={(e) => {
                            const updated = [...defaultPointSystem.placementPoints];
                            updated[i] = Math.max(0, parseInt(e.target.value) || 0);
                            updateDefaultPointSystem({ placementPoints: updated });
                          }}
                          className="w-full bg-transparent text-center font-black text-sm text-white focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-neutral-900/50 p-3 text-xs text-neutral-400 border border-neutral-800/80 flex items-center justify-between">
              <span>
                <strong className="text-neutral-200">Official Tie-Break Order:</strong> Total Points → Booyah Count → Placement Points → Total Kills → Last Match Finish Rank.
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 5. RECENT CONCLUDED TOURNAMENTS ARCHIVE */}
      {endedTournaments.length > 0 && (
        <section className="rounded-2xl border border-neutral-800/80 bg-[#120D12] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-amber-400" />
              <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
                Recently Concluded Tournaments ({endedTournaments.length})
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('history')}
              className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider flex items-center gap-1"
            >
              <span>View Full History Archive</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {endedTournaments.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3 flex flex-col justify-between hover:border-neutral-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-neutral-500" />
                      <span>{t.createdAt}</span>
                    </span>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 font-bold text-amber-400 border border-amber-500/20 text-[10px]">
                      CONCLUDED
                    </span>
                  </div>

                  <h3 className="font-display text-lg text-white font-black uppercase truncate mt-2">
                    {t.name}
                  </h3>

                  {t.championTeamName && (
                    <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5 mt-1.5">
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                      <span className="truncate">Champion: {t.championTeamName}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    switchActiveTournament(t.id);
                    setCurrentTab('results');
                  }}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 py-2 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  <span>Standing Graphic</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
