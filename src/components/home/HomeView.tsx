import React, { useMemo, useState } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Trophy,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  MoreVertical,
  Flame,
  Swords,
  Database,
  Play,
  Edit3,
  Trash2,
  X,
  Shield,
  LogOut,
  History,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { calculateTournamentStandings } from '../../lib/scoring';
import { TOURNAMENT_TEMPLATES } from '../../lib/templates';
import { resolveThemePreset, THEME_META_MAP } from '../../lib/theme';
import { EspCalcLogoMark, OrganizerAvatar } from '../ui/BrandLogo';
import type { TournamentRecord } from '../../types/tournament';

interface HomeViewProps {
  onOpenJson?: () => void;
}

function splitKineticTitle(raw: string): { lead: string; tail: string } {
  const normalized = raw.trim().toUpperCase() || 'TOURNAMENT';
  const parts = normalized.split(/\s+/);
  if (parts.length <= 1) return { lead: normalized, tail: '' };
  if (parts.length === 2) return { lead: parts[0], tail: parts[1] };
  const splitAt = parts.length > 3 ? parts.length - 2 : parts.length - 1;
  return {
    lead: parts.slice(0, splitAt).join(' '),
    tail: parts.slice(splitAt).join(' '),
  };
}

function formatRelativeTime(record: TournamentRecord): string {
  if (record.createdAtTimestamp > 0) {
    const diffMs = Date.now() - record.createdAtTimestamp;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Updated just now';
    if (mins < 60) return `Updated ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
      return `Updated ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Updated yesterday';
    if (days < 7) return `Updated ${days} days ago`;
  }
  return record.createdAt || `${record.teams.length} Squads`;
}

export const HomeView: React.FC<HomeViewProps> = ({ onOpenJson }) => {
  const {
    tournaments,
    activeTournamentId,
    getActiveTournament,
    switchActiveTournament,
    deleteTournament,
    setCurrentTab,
    openCreateWithTemplate,
    defaultPointSystem,
  } = useTournamentStore();

  const {
    firebaseUser,
    isAdmin,
    setAdminDashboardOpen,
    logout,
  } = useAuthStore();

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteRecord, setConfirmDeleteRecord] =
    useState<TournamentRecord | null>(null);

  const activeTournament = getActiveTournament();
  const liveTournaments = useMemo(
    () => tournaments.filter((t) => !t.isEnded),
    [tournaments]
  );

  // Featured live tournament: active if live, otherwise newest live, otherwise active/latest
  const featuredTournament = useMemo(() => {
    if (activeTournament && !activeTournament.isEnded) return activeTournament;
    if (liveTournaments.length > 0) return liveTournaments[0];
    return activeTournament;
  }, [activeTournament, liveTournaments]);

  const otherLiveTournaments = useMemo(
    () =>
      liveTournaments.filter(
        (t) => featuredTournament && t.id !== featuredTournament.id
      ),
    [liveTournaments, featuredTournament]
  );

  const recentProjects = useMemo(
    () => tournaments.slice(0, 4),
    [tournaments]
  );

  const featuredInfo = useMemo(() => {
    if (!featuredTournament) return null;
    const completedCount = featuredTournament.matches.filter(
      (m) => m.isCompleted
    ).length;
    const plannedCount =
      featuredTournament.settings.mode === 'CHAMPION_RUSH'
        ? featuredTournament.settings.championRush.maxMatches
        : featuredTournament.settings.totalMatchesPlanned;
    const nextMatch =
      featuredTournament.matches.find((m) => !m.isCompleted) ||
      featuredTournament.matches[featuredTournament.matches.length - 1];
    const standingsResult = calculateTournamentStandings(
      featuredTournament.teams,
      featuredTournament.matches,
      featuredTournament.settings
    );
    const leader = standingsResult.standings[0];
    return {
      completedCount,
      plannedCount,
      nextMatch,
      leader,
      titleParts: splitKineticTitle(featuredTournament.settings.name),
    };
  }, [featuredTournament]);

  const handleOpenPosterStudio = () => {
    if (activeTournament) {
      setCurrentTab('results');
      return;
    }
    if (tournaments.length > 0) {
      switchActiveTournament(tournaments[0].id, 'results');
      return;
    }
    openCreateWithTemplate();
  };

  const topRankPts = defaultPointSystem.placementPoints[0] ?? 12;

  return (
    <div
      className="space-y-5 select-none"
      onClick={() => {
        if (openMenuId) setOpenMenuId(null);
      }}
    >
      {/* HERO BROADCAST STAGE */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090B0F] min-h-[210px] sm:min-h-[236px] flex flex-col justify-between p-5 sm:p-7">
        {/* Background Atmospheric Plane (WebP, zero filter blur) */}
        <img
          src="/assets/web-arena-bg.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
        />
        {/* Character Focal Artwork Top-Right */}
        <img
          src="/assets/web-hero-character.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable={false}
          className="pointer-events-none absolute right-0 top-0 h-full w-[78%] sm:w-[58%] lg:w-[46%] object-cover object-top opacity-90"
        />
        {/* Crisp Obsidian Readability Scrims */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#090B0F] via-[#090B0F]/92 sm:via-[#090B0F]/75 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090B0F] via-transparent to-[#090B0F]/55"
        />

        {/* Top Identity Bar inside Hero */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <EspCalcLogoMark size={40} className="shrink-0" />
            <div>
              <div className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-none">
                ESP CALC
              </div>
              <div className="mt-1 text-[9.5px] font-semibold tracking-[0.28em] text-slate-300">
                BROADCAST STUDIO
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSettingsOpen(true);
            }}
            aria-label="Open studio settings and account"
            className="flex items-center gap-2.5 rounded-full border border-white/[0.1] bg-[#12151E]/90 pl-2.5 pr-1 py-1 hover:border-amber-400/45 transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline text-[11px] font-semibold text-slate-200 max-w-[140px] truncate">
              {firebaseUser?.displayName || 'Organizer'}
            </span>
            <OrganizerAvatar
              name={firebaseUser?.displayName}
              email={firebaseUser?.email}
              photoUrl={firebaseUser?.photoURL}
              size={34}
              showCrown={false}
            />
          </button>
        </div>

        {/* Hero Editorial Copy */}
        <div className="relative z-10 mt-6 sm:mt-8 max-w-md space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
              Tournament Graphics
            </span>
            <span className="h-[2px] w-6 rounded-full bg-amber-500" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.12]">
            Create Professional
            <span className="block italic text-amber-400">
              Esports Graphics
            </span>
          </h1>

          <p className="text-xs sm:text-[13px] text-slate-300/90 leading-relaxed max-w-sm">
            Standings, Match Results, and More — All in One Place.
          </p>
        </div>
      </section>

      {/* PRIMARY CTA BANNER: CREATE TOURNAMENT */}
      <section className="studio-hero-banner relative overflow-hidden rounded-2xl transition-colors">
        {/* Bottom-right ember radial corner highlight matching mobile banner */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -right-4 h-24 w-48 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(245,158,11,0.34) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={() => openCreateWithTemplate()}
            className="flex flex-1 items-center gap-3.5 text-left cursor-pointer group"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 text-[#090B0F] shadow-[0_4px_14px_rgba(245,158,11,0.35)]">
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-amber-200 transition-colors">
                Create Tournament
              </div>
              <div className="text-xs text-slate-300">
                Start a new Classic Scrim or Champion Rush event
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-amber-300 sm:hidden" />
          </button>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {onOpenJson && (
              <button
                type="button"
                onClick={onOpenJson}
                className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <Database className="h-3.5 w-3.5 text-amber-400" />
                <span>Import JSON</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => openCreateWithTemplate()}
              aria-label="Open tournament creator"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </section>

      {/* STUDIO DECK: 2x2 FEATURE TILES + LIVE CRYSTAL TROPHY BANNER */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: 2x2 Studio Action Tiles */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleOpenPosterStudio}
            className="studio-feature-tile relative overflow-hidden rounded-2xl p-3 sm:p-4 text-left transition-colors cursor-pointer flex items-center gap-2.5 sm:gap-3"
          >
            <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-[#231A10] text-amber-400">
              <ImageIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white truncate">
                Poster Studio
              </div>
              <div className="mt-0.5 text-[10.5px] sm:text-[11px] text-slate-400 leading-tight">
                Standings &amp; match graphics
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('rules')}
            className="studio-feature-tile relative overflow-hidden rounded-2xl p-3 sm:p-4 text-left transition-colors cursor-pointer flex items-center gap-2.5 sm:gap-3"
          >
            <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-[#231A10] text-amber-400">
              <Trophy className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white truncate">
                Score System
              </div>
              <div className="mt-0.5 text-[10.5px] sm:text-[11px] text-slate-400 leading-tight">
                #1 = {topRankPts} pts · {defaultPointSystem.killPoints} pt/kill
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTemplatesOpen(true)}
            className="studio-feature-tile relative overflow-hidden rounded-2xl p-3 sm:p-4 text-left transition-colors cursor-pointer flex items-center gap-2.5 sm:gap-3"
          >
            <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-[#231A10] text-amber-400">
              <Layers className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white truncate">
                Templates
              </div>
              <div className="mt-0.5 text-[10.5px] sm:text-[11px] text-slate-400 leading-tight">
                Tournament format presets
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="studio-feature-tile relative overflow-hidden rounded-2xl p-3 sm:p-4 text-left transition-colors cursor-pointer flex items-center gap-2.5 sm:gap-3"
          >
            <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-[#231A10] text-amber-400">
              <SlidersHorizontal className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white truncate">
                Settings
              </div>
              <div className="mt-0.5 text-[10.5px] sm:text-[11px] text-slate-400 leading-tight">
                Preferences &amp; JSON backup
              </div>
            </div>
          </button>
        </div>

        {/* Right: Featured Live / Standby Tournament Crystal Trophy Card */}
        <div className="lg:col-span-6 flex flex-col gap-2.5">
          {featuredTournament && featuredInfo ? (
            <div className="studio-live-banner relative flex-1 overflow-hidden rounded-2xl min-h-[152px] flex items-center justify-between p-4 sm:p-5">
              {/* Crystal Trophy Artwork Smoothly Masked Right */}
              <img
                src="/assets/web-crystal-trophy.webp"
                alt=""
                aria-hidden="true"
                decoding="async"
                draggable={false}
                className="pointer-events-none absolute right-0 top-0 h-full w-44 sm:w-52 object-cover opacity-90"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#11131A] via-[#11131A]/92 to-transparent"
              />

              <div className="relative z-10 min-w-0 flex-1 pr-6 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      featuredTournament.isEnded
                        ? 'border-amber-500/50 bg-[#282012] text-amber-300'
                        : 'border-red-500/70 bg-[#4C1418] text-white'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        featuredTournament.isEnded
                          ? 'bg-amber-400'
                          : 'bg-red-500'
                      }`}
                    />
                    {featuredTournament.isEnded ? 'FINAL' : 'LIVE'}
                  </span>
                  <span className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                    {featuredTournament.settings.roundOrDay || 'GRAND FINALS'}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black italic tracking-tight truncate">
                  <span className="text-white">{featuredInfo.titleParts.lead}</span>
                  {featuredInfo.titleParts.tail && (
                    <span className="text-amber-400">
                      {' '}
                      {featuredInfo.titleParts.tail}
                    </span>
                  )}
                </h2>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300">
                  <span>
                    {featuredTournament.settings.mode === 'CHAMPION_RUSH'
                      ? 'Champion Rush'
                      : 'Scrim Series'}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>{featuredTournament.teams.length} Squads</span>
                  <span className="text-slate-600">·</span>
                  <span className="tabular-nums">
                    {featuredInfo.completedCount}/{featuredInfo.plannedCount}{' '}
                    Matches
                  </span>
                  {featuredInfo.leader && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-300 font-semibold truncate max-w-[160px]">
                        #1 {featuredInfo.leader.teamName} (
                        {featuredInfo.leader.totalPoints} pts)
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      switchActiveTournament(
                        featuredTournament.id,
                        featuredInfo.nextMatch?.id || 'results'
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>
                      {featuredInfo.nextMatch
                        ? `Open Match ${featuredInfo.nextMatch.matchNumber}`
                        : 'Open Lobby'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchActiveTournament(featuredTournament.id, 'results');
                    }}
                    className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                    <span>Poster</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                aria-label="Open featured tournament"
                onClick={() => {
                  switchActiveTournament(
                    featuredTournament.id,
                    featuredInfo.nextMatch?.id || 'results'
                  );
                }}
                className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-[#0B0D14]/80 text-slate-200 hover:border-amber-400/50 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openCreateWithTemplate()}
              className="studio-live-banner relative flex-1 overflow-hidden rounded-2xl min-h-[152px] flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer group"
            >
              <img
                src="/assets/web-crystal-trophy.webp"
                alt=""
                aria-hidden="true"
                decoding="async"
                draggable={false}
                className="pointer-events-none absolute right-0 top-0 h-full w-44 sm:w-52 object-cover opacity-85"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#11131A] via-[#11131A]/90 to-transparent"
              />

              <div className="relative z-10 min-w-0 flex-1 pr-6 space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/45 bg-[#282012] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    STANDBY
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    NO ACTIVE LOBBY
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black italic text-white tracking-tight group-hover:text-amber-300 transition-colors">
                  Ready for Match Day
                </h2>

                <p className="text-xs text-slate-300/90 max-w-sm">
                  Create a tournament to start live scoring and export broadcast standing graphics.
                </p>
              </div>

              <ChevronRight className="relative z-10 h-5 w-5 shrink-0 text-slate-300 group-hover:text-amber-300" />
            </button>
          )}

          {/* Additional live lobbies switcher strip if organizer runs parallel lobbies */}
          {otherLiveTournaments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Also Live:
              </span>
              {otherLiveTournaments.map((t) => {
                const next =
                  t.matches.find((m) => !m.isCompleted) ||
                  t.matches[t.matches.length - 1];
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      switchActiveTournament(t.id, next?.id || 'results')
                    }
                    className="glass-pill inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-amber-400/50 cursor-pointer"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="truncate max-w-[160px]">
                      {t.settings.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* RECENT PROJECTS SHELF */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            Recent Projects
          </h2>
          <button
            type="button"
            onClick={() => setCurrentTab('history')}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-[#161B26] text-slate-400">
                <History className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-bold text-white">
                  No recent tournaments yet
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Your saved tournaments and generated graphics will appear here.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openCreateWithTemplate()}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Start First Lobby</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentProjects.map((record, index) => {
              const resolvedTheme = resolveThemePreset(record.settings.theme);
              const palette =
                THEME_META_MAP[resolvedTheme] ?? THEME_META_MAP.v2;
              const isSelected = record.id === activeTournamentId;
              const nextMatch =
                record.matches.find((m) => !m.isCompleted) ||
                record.matches[record.matches.length - 1];
              const isMenuOpen = openMenuId === record.id;

              return (
                <div
                  key={record.id}
                  className={`relative rounded-2xl p-3 flex items-center gap-3.5 border transition-colors bg-[#11141C] ${
                    isSelected
                      ? 'border-amber-500/45'
                      : 'border-[#202634] hover:border-[#30394E]'
                  }`}
                >
                  {/* Stylized Theme Poster Thumbnail */}
                  <button
                    type="button"
                    onClick={() =>
                      switchActiveTournament(record.id, 'results')
                    }
                    style={{
                      background: palette.isLightThumb
                        ? `linear-gradient(135deg, ${palette.thumbFrom} 0%, #E2E8F0 68%, #DC142C 100%)`
                        : `linear-gradient(135deg, ${palette.thumbFrom} 0%, #121318 55%, ${palette.thumbTo} 100%)`,
                      borderColor: palette.thumbBorder,
                    }}
                    className="relative h-14 w-24 sm:w-28 shrink-0 overflow-hidden rounded-xl border flex items-center justify-center p-1.5 cursor-pointer group"
                    title="Open Poster Studio"
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -right-3 -top-3 h-20 w-9 -rotate-12 ${
                        palette.isLightThumb ? 'bg-red-600/20' : 'bg-white/[0.08]'
                      }`}
                    />
                    <span
                      className={`relative z-10 text-center font-black italic text-[10.5px] leading-[1.08] tracking-wide uppercase ${
                        palette.isLightThumb ? 'text-[#111318]' : 'text-white'
                      }`}
                    >
                      {index % 2 === 0 ? 'OVERALL\nSTANDINGS' : 'MATCH\nRESULTS'}
                    </span>
                  </button>

                  {/* Project Info */}
                  <button
                    type="button"
                    onClick={() =>
                      switchActiveTournament(
                        record.id,
                        nextMatch?.id || 'results'
                      )
                    }
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-white">
                        {record.name}
                      </span>
                      {record.isEnded && (
                        <span className="shrink-0 rounded bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                          Ended
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-400">
                      {formatRelativeTime(record)} · {record.teams.length}{' '}
                      Squads
                    </div>
                  </button>

                  {/* Quick Actions */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        switchActiveTournament(
                          record.id,
                          nextMatch?.id || 'results'
                        )
                      }
                      title="Open tournament lobby"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2B3242] bg-[#1A1E29] text-slate-300 hover:border-amber-400/50 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`More actions for ${record.name}`}
                        onClick={() =>
                          setOpenMenuId(isMenuOpen ? null : record.id)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="glass-modal absolute right-0 bottom-11 z-40 w-44 rounded-xl p-1.5 space-y-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              switchActiveTournament(
                                record.id,
                                nextMatch?.id || 'results'
                              );
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-200 hover:bg-white/[0.07] cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5 text-amber-400" />
                            <span>Open Lobby</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              switchActiveTournament(record.id, 'results');
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-200 hover:bg-white/[0.07] cursor-pointer"
                          >
                            <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                            <span>Poster Studio</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              switchActiveTournament(record.id, 'edit');
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-200 hover:bg-white/[0.07] cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                            <span>Edit Squads</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setConfirmDeleteRecord(record);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TEMPLATES MODAL */}
      {templatesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setTemplatesOpen(false)}
        >
          <div
            className="glass-modal w-full max-w-lg rounded-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  Tournament Templates
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Start immediately with pre-configured formats and match caps
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplatesOpen(false)}
                aria-label="Close templates modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.07] hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {TOURNAMENT_TEMPLATES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setTemplatesOpen(false);
                    openCreateWithTemplate(preset);
                  }}
                  className="studio-feature-tile w-full rounded-xl p-3.5 flex items-center gap-3.5 text-left transition-colors cursor-pointer"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-[#231A10] text-amber-400">
                    {preset.mode === 'CHAMPION_RUSH' ? (
                      <Flame className="h-5 w-5" />
                    ) : (
                      <Swords className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {preset.title}
                      </span>
                      <span className="rounded bg-amber-500/15 border border-amber-400/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        {preset.badge}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      {preset.subtitle}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS & EXPORT MODAL */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="glass-modal w-full max-w-md rounded-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <OrganizerAvatar
                  name={firebaseUser?.displayName}
                  email={firebaseUser?.email}
                  photoUrl={firebaseUser?.photoURL}
                  size={40}
                  showCrown={isAdmin || Boolean(firebaseUser)}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">
                    {firebaseUser?.displayName || 'Studio Organizer'}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {firebaseUser?.email || 'Workspace Session'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.07] hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setCurrentTab('rules');
                }}
                className="studio-feature-tile w-full rounded-xl p-3 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <SlidersHorizontal className="h-4 w-4 text-amber-400" />
                  <span>
                    <span className="block text-xs font-bold text-white">
                      Default Score System
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      #1 = {topRankPts} pts · {defaultPointSystem.killPoints}{' '}
                      pt per kill
                    </span>
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              {onOpenJson && (
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    onOpenJson();
                  }}
                  className="studio-feature-tile w-full rounded-xl p-3 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-amber-400" />
                    <span>
                      <span className="block text-xs font-bold text-white">
                        Backup &amp; JSON Export
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        Export or restore tournament archives
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    setAdminDashboardOpen(true);
                  }}
                  className="studio-feature-tile w-full rounded-xl p-3 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-amber-400" />
                    <span>
                      <span className="block text-xs font-bold text-white">
                        Team Access Allowlist
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        Manage authorized organizers &amp; admins
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              )}

              {firebaseUser && (
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    logout();
                  }}
                  className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-3 flex items-center justify-center gap-2 text-xs font-bold text-rose-300 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {confirmDeleteRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setConfirmDeleteRecord(null)}
        >
          <div
            className="glass-modal w-full max-w-sm rounded-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-white">
                Delete Project?
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Remove &quot;{confirmDeleteRecord.name}&quot; from saved tournaments? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteRecord(null)}
                className="glass-pill rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTournament(confirmDeleteRecord.id);
                  setConfirmDeleteRecord(null);
                }}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
