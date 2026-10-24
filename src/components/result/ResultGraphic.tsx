import React from 'react';
import { Zap, Crown, Flame, Trophy, Crosshair } from 'lucide-react';
import type {
  AspectRatioMode,
  StandingsViewMode,
  TeamCumulativeStanding,
  TournamentSettings,
  ThemePreset,
} from '../../types/tournament';
import { generateInitials } from '../../store/tournamentStore';

export interface ThemeGraphicConfig {
  accent: string;
  highlight: string;
  darkGradient: string;
  shieldBg: string;
  border: string;
  glow: string;
  haloColor: string;
  beamColor: string;
  ribbonGradient: string;
  ribbonText: string;
  teamNameGradient: string;
  conditionBadgeBorder: string;
  conditionBadgeBg: string;
  conditionBadgeText: string;
  statCardBorder: string;
  statCardLabel: string;
  statCardValue: string;
  statIconColor: string;
  brandText: string;
  brandFlameColor: string;
}

export const THEME_CONFIGS: Record<ThemePreset, ThemeGraphicConfig> = {
  v2: {
    accent: '#F59E0B',
    highlight: '#FFE259',
    darkGradient: 'radial-gradient(circle at 50% 20%, #351C08 0%, #170B03 60%, #0A0502 100%)',
    shieldBg: 'radial-gradient(circle, #2D1A06 0%, #150C03 70%, #080502 100%)',
    border: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.45)',
    haloColor: 'rgba(245, 158, 11, 0.3)',
    beamColor: 'rgba(245, 158, 11, 0.2)',
    ribbonGradient: 'linear-gradient(135deg, #FFE259 0%, #F59E0B 50%, #B45309 100%)',
    ribbonText: '#000000',
    teamNameGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FFE259 40%, #F59E0B 80%, #D97706 100%)',
    conditionBadgeBorder: 'rgba(245, 158, 11, 0.6)',
    conditionBadgeBg: 'rgba(35, 18, 4, 0.85)',
    conditionBadgeText: '#FCD34D',
    statCardBorder: 'rgba(245, 158, 11, 0.4)',
    statCardLabel: 'rgba(252, 211, 77, 0.9)',
    statCardValue: '#FFE259',
    statIconColor: '#F59E0B',
    brandText: '#F59E0B',
    brandFlameColor: '#F59E0B',
  },
  crimson: {
    accent: '#E02A36',
    highlight: '#FF6B76',
    darkGradient: 'radial-gradient(circle at 50% 20%, #38080E 0%, #1A0306 60%, #0B0103 100%)',
    shieldBg: 'radial-gradient(circle, #30060B 0%, #170305 70%, #080102 100%)',
    border: '#E02A36',
    glow: 'rgba(224, 42, 54, 0.45)',
    haloColor: 'rgba(224, 42, 54, 0.3)',
    beamColor: 'rgba(224, 42, 54, 0.2)',
    ribbonGradient: 'linear-gradient(135deg, #FF6B76 0%, #E02A36 50%, #860F17 100%)',
    ribbonText: '#FFFFFF',
    teamNameGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FFA4AB 40%, #E02A36 80%, #860F17 100%)',
    conditionBadgeBorder: 'rgba(224, 42, 54, 0.6)',
    conditionBadgeBg: 'rgba(38, 6, 10, 0.85)',
    conditionBadgeText: '#FFA4AB',
    statCardBorder: 'rgba(224, 42, 54, 0.4)',
    statCardLabel: 'rgba(255, 164, 171, 0.9)',
    statCardValue: '#FF6B76',
    statIconColor: '#E02A36',
    brandText: '#FF6B76',
    brandFlameColor: '#E02A36',
  },
  blue: {
    accent: '#388BFD',
    highlight: '#79C0FF',
    darkGradient: 'radial-gradient(circle at 50% 20%, #081F3D 0%, #041021 60%, #02070F 100%)',
    shieldBg: 'radial-gradient(circle, #071933 0%, #030C1A 70%, #01050A 100%)',
    border: '#388BFD',
    glow: 'rgba(56, 139, 253, 0.45)',
    haloColor: 'rgba(56, 139, 253, 0.3)',
    beamColor: 'rgba(56, 139, 253, 0.2)',
    ribbonGradient: 'linear-gradient(135deg, #79C0FF 0%, #388BFD 50%, #0D419D 100%)',
    ribbonText: '#FFFFFF',
    teamNameGradient: 'linear-gradient(180deg, #FFFFFF 0%, #B6DEFF 40%, #388BFD 80%, #0D419D 100%)',
    conditionBadgeBorder: 'rgba(56, 139, 253, 0.6)',
    conditionBadgeBg: 'rgba(8, 28, 56, 0.85)',
    conditionBadgeText: '#B6DEFF',
    statCardBorder: 'rgba(56, 139, 253, 0.4)',
    statCardLabel: 'rgba(182, 222, 255, 0.9)',
    statCardValue: '#79C0FF',
    statIconColor: '#388BFD',
    brandText: '#79C0FF',
    brandFlameColor: '#388BFD',
  },
  gold: {
    accent: '#D9A93B',
    highlight: '#FFDF80',
    darkGradient: 'radial-gradient(circle at 50% 20%, #332208 0%, #181003 60%, #0B0701 100%)',
    shieldBg: 'radial-gradient(circle, #2A1C06 0%, #140D02 70%, #070401 100%)',
    border: '#D9A93B',
    glow: 'rgba(217, 169, 59, 0.45)',
    haloColor: 'rgba(217, 169, 59, 0.3)',
    beamColor: 'rgba(217, 169, 59, 0.2)',
    ribbonGradient: 'linear-gradient(135deg, #FFDF80 0%, #D9A93B 50%, #7A530E 100%)',
    ribbonText: '#000000',
    teamNameGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FFEAB0 40%, #D9A93B 80%, #7A530E 100%)',
    conditionBadgeBorder: 'rgba(217, 169, 59, 0.6)',
    conditionBadgeBg: 'rgba(33, 22, 6, 0.85)',
    conditionBadgeText: '#FFEAB0',
    statCardBorder: 'rgba(217, 169, 59, 0.4)',
    statCardLabel: 'rgba(255, 234, 176, 0.9)',
    statCardValue: '#FFDF80',
    statIconColor: '#D9A93B',
    brandText: '#FFDF80',
    brandFlameColor: '#D9A93B',
  },
  emerald: {
    accent: '#10B981',
    highlight: '#6EE7B7',
    darkGradient: 'radial-gradient(circle at 50% 20%, #062E1F 0%, #03170F 60%, #010B07 100%)',
    shieldBg: 'radial-gradient(circle, #052619 0%, #02130C 70%, #010805 100%)',
    border: '#10B981',
    glow: 'rgba(16, 185, 129, 0.45)',
    haloColor: 'rgba(16, 185, 129, 0.3)',
    beamColor: 'rgba(16, 185, 129, 0.2)',
    ribbonGradient: 'linear-gradient(135deg, #6EE7B7 0%, #10B981 50%, #065F46 100%)',
    ribbonText: '#000000',
    teamNameGradient: 'linear-gradient(180deg, #FFFFFF 0%, #A7F3D0 40%, #10B981 80%, #064E3B 100%)',
    conditionBadgeBorder: 'rgba(16, 185, 129, 0.6)',
    conditionBadgeBg: 'rgba(6, 40, 27, 0.85)',
    conditionBadgeText: '#A7F3D0',
    statCardBorder: 'rgba(16, 185, 129, 0.4)',
    statCardLabel: 'rgba(167, 243, 208, 0.9)',
    statCardValue: '#6EE7B7',
    statIconColor: '#10B981',
    brandText: '#6EE7B7',
    brandFlameColor: '#10B981',
  },
  violet: {
    accent: '#8B5CF6',
    highlight: '#C084FC',
    darkGradient: 'radial-gradient(circle at 50% 20%, #280C42 0%, #140522 60%, #090210 100%)',
    shieldBg: 'radial-gradient(circle, #210A38 0%, #10041C 70%, #06010B 100%)',
    border: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.45)',
    haloColor: 'rgba(139, 92, 246, 0.3)',
    beamColor: 'rgba(139, 92, 246, 0.2)',
    ribbonGradient: 'linear-gradient(135deg, #C084FC 0%, #8B5CF6 50%, #4C1D95 100%)',
    ribbonText: '#FFFFFF',
    teamNameGradient: 'linear-gradient(180deg, #FFFFFF 0%, #E9D5FF 40%, #8B5CF6 80%, #4C1D95 100%)',
    conditionBadgeBorder: 'rgba(139, 92, 246, 0.6)',
    conditionBadgeBg: 'rgba(32, 10, 53, 0.85)',
    conditionBadgeText: '#E9D5FF',
    statCardBorder: 'rgba(139, 92, 246, 0.4)',
    statCardLabel: 'rgba(233, 213, 255, 0.9)',
    statCardValue: '#C084FC',
    statIconColor: '#8B5CF6',
    brandText: '#C084FC',
    brandFlameColor: '#8B5CF6',
  },
};

interface ResultGraphicProps {
  settings: TournamentSettings;
  standings: TeamCumulativeStanding[];
  aspectRatio: AspectRatioMode;
  viewMode: StandingsViewMode;
  selectedMatchNumber?: number;
  totalCompletedMatches: number;
  isTournamentEnded?: boolean;
  graphicRef: React.RefObject<HTMLDivElement | null>;
  isExporting?: boolean;
}

export const ResultGraphic: React.FC<ResultGraphicProps> = ({
  settings,
  standings,
  aspectRatio,
  viewMode,
  selectedMatchNumber,
  totalCompletedMatches,
  isTournamentEnded = false,
  graphicRef,
  isExporting = false,
}) => {
  const isPortrait = aspectRatio === '4:5';
  const width = isPortrait ? 1080 : 1920;
  const height = isPortrait ? 1350 : 1080;

  // Dedicated background per theme
  const themeName = settings.theme || 'v2';
  const activeTheme = THEME_CONFIGS[themeName as ThemePreset] || THEME_CONFIGS.v2;
  const bgUrl = isPortrait
    ? `/assets/bg-${themeName}-portrait.jpg`
    : `/assets/bg-${themeName}.jpg`;

  // Champion determination
  const isFinalResult =
    (isTournamentEnded || settings.isManuallyEnded) && viewMode === 'OVERALL';
  const championTeam = standings[0];

  const matchHeaderSubtitle =
    viewMode === 'SINGLE_MATCH'
      ? `MATCH ${selectedMatchNumber ?? 1} STANDING`
      : isFinalResult
      ? 'OFFICIAL FINAL TOURNAMENT STANDINGS'
      : totalCompletedMatches > 0
      ? `AFTER MATCH ${totalCompletedMatches} OF ${
          settings.mode === 'CHAMPION_RUSH'
            ? settings.championRush.maxMatches
            : settings.totalMatchesPlanned
        }`
      : 'INITIAL STANDINGS';

  // Helper: Render Metallic / High-Contrast Rank Tag
  const renderRankTag = (rank: number) => {
    let rankBadgeStyle = 'bg-white/95 text-black shadow-md';
    if (rank === 1) {
      rankBadgeStyle =
        'bg-gradient-to-r from-[#FFE259] via-[#F59E0B] to-[#D97706] text-black shadow-[0_0_12px_rgba(245,158,11,0.6)]';
    } else if (rank === 2) {
      rankBadgeStyle =
        'bg-gradient-to-r from-[#F8FAFC] via-[#CBD5E1] to-[#94A3B8] text-black shadow-[0_0_10px_rgba(203,213,225,0.4)]';
    } else if (rank === 3) {
      rankBadgeStyle =
        'bg-gradient-to-r from-[#FFEDD5] via-[#FB923C] to-[#C2410C] text-black shadow-[0_0_10px_rgba(251,146,60,0.4)]';
    }

    return (
      <div
        className={`flex h-7 w-11 shrink-0 items-center justify-center font-display text-lg font-black tracking-wider ${rankBadgeStyle}`}
        style={{
          clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
        }}
      >
        <span>#{rank}</span>
      </div>
    );
  };

  // Helper: Render Circular Rush / Status Badge (Matching Image 2 Reference)
  const renderRushCircle = (status: 'NOT_ACTIVE' | 'ACTIVE' | 'CHAMPION') => {
    if (status === 'CHAMPION') {
      return (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 shadow-lg"
          style={{
            borderColor: activeTheme.highlight,
            background: activeTheme.ribbonGradient,
            boxShadow: `0 0 12px ${activeTheme.glow}`,
          }}
          title="Won by Champion Rush"
        >
          <Crown
            className="h-4 w-4 drop-shadow-sm"
            style={{ color: activeTheme.ribbonText }}
          />
        </div>
      );
    }
    if (status === 'ACTIVE') {
      return (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-neutral-950 shadow-md"
          style={{
            borderColor: activeTheme.accent,
            boxShadow: `0 0 10px ${activeTheme.glow}`,
          }}
          title="Satisfied Champion Rush Condition"
        >
          <Crown
            className="h-3.5 w-3.5 drop-shadow-sm"
            style={{ color: activeTheme.highlight }}
          />
        </div>
      );
    }
    // Neutral placeholder ring to maintain perfect alignment
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-800/80 bg-black/40">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-700/60" />
      </div>
    );
  };

  // Helper: Render Segmented Stats Capsule (Yellow Amber or Theme-Colored)
  const renderStatsCapsule = (
    team: TeamCumulativeStanding,
    variant: 'landscape-full' | 'landscape-split' | 'portrait'
  ) => {
    const isYellowTheme = themeName === 'v2';

    // Exact matching widths between table headers and stats capsules
    let wBooyah = 'w-20';
    let wElims = 'w-20';
    let wPlacement = 'w-36';
    let wTotal = 'w-28';
    let hCapsule = 'h-10';
    let textBase = 'text-lg';
    let textTotal = 'text-2xl';

    if (variant === 'landscape-split') {
      wBooyah = 'w-16';
      wElims = 'w-16';
      wPlacement = 'w-16';
      wTotal = 'w-20';
      hCapsule = 'h-9';
      textBase = 'text-base';
      textTotal = 'text-xl';
    } else if (variant === 'portrait') {
      wBooyah = 'w-14';
      wElims = 'w-14';
      wPlacement = 'w-14';
      wTotal = 'w-18';
      hCapsule = 'h-8 sm:h-8.5';
      textBase = 'text-xs sm:text-sm';
      textTotal = 'text-base sm:text-lg';
    }

    if (isYellowTheme) {
      // Free Fire Asia Invitational Style: Warm amber/gold capsule with dark high-contrast numbers
      return (
        <div
          className={`flex items-center overflow-hidden font-display rounded-sm ${hCapsule}`}
          style={{
            background:
              team.rank <= 3
                ? 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)'
                : 'linear-gradient(90deg, #FDE68A 0%, #FCD34D 50%, #F59E0B 100%)',
            boxShadow:
              team.rank === 1
                ? '0 0 16px rgba(245, 158, 11, 0.6)'
                : '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {/* Booyah Segment */}
          <div
            className={`flex h-full items-center justify-center border-r border-black/20 font-black text-black ${wBooyah} ${textBase}`}
          >
            <span>x{team.booyahCount}</span>
          </div>

          {/* Elims Segment */}
          <div
            className={`flex h-full items-center justify-center border-r border-black/20 font-black font-numbers text-black ${wElims} ${textBase}`}
          >
            <span>{team.kills}</span>
          </div>

          {/* Placement Points Segment */}
          <div
            className={`flex h-full items-center justify-center border-r border-black/20 font-black font-numbers text-black ${wPlacement} ${textBase}`}
          >
            <span>{team.placementPoints}</span>
          </div>

          {/* Total Points Segment */}
          <div
            className={`flex h-full items-center justify-center font-black font-numbers text-[#0F0802] ${wTotal} ${textTotal}`}
          >
            <span>{team.totalPoints}</span>
          </div>
        </div>
      );
    }

    // Dynamic Color Variant Themes (Crimson, Blue, Gold, Emerald, Violet)
    return (
      <div
        className={`flex items-center overflow-hidden font-display rounded-sm ${hCapsule}`}
        style={{
          background:
            team.rank <= 3
              ? activeTheme.ribbonGradient
              : 'linear-gradient(90deg, var(--theme-gradient-start) 0%, var(--theme-gradient-mid) 60%, var(--theme-gradient-end) 100%)',
          border: `1px solid ${activeTheme.accent}`,
          boxShadow:
            team.rank === 1
              ? `0 0 14px ${activeTheme.glow}`
              : '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className={`flex h-full items-center justify-center border-r border-white/20 font-bold ${
            team.rank <= 3 && activeTheme.ribbonText === '#000000'
              ? 'text-black'
              : 'text-neutral-100'
          } ${wBooyah} ${textBase}`}
        >
          <span>x{team.booyahCount}</span>
        </div>
        <div
          className={`flex h-full items-center justify-center border-r border-white/20 font-black font-numbers ${
            team.rank <= 3 && activeTheme.ribbonText === '#000000'
              ? 'text-black'
              : 'text-white'
          } ${wElims} ${textBase}`}
        >
          <span>{team.kills}</span>
        </div>
        <div
          className={`flex h-full items-center justify-center border-r border-white/20 font-bold font-numbers ${
            team.rank <= 3 && activeTheme.ribbonText === '#000000'
              ? 'text-black'
              : 'text-neutral-200'
          } ${wPlacement} ${textBase}`}
        >
          <span>{team.placementPoints}</span>
        </div>
        <div
          className={`flex h-full items-center justify-center font-black font-numbers ${
            team.rank <= 3 && activeTheme.ribbonText === '#000000'
              ? 'text-[#0F0802]'
              : 'text-white'
          } ${wTotal} ${textTotal}`}
          style={{ textShadow: `0 2px 10px ${activeTheme.glow}` }}
        >
          <span>{team.totalPoints}</span>
        </div>
      </div>
    );
  };

  // Helper: Render Grand Champion 3D Metallic Card (Adaptive to Theme Colors)
  const renderGrandChampionCard = (compact: boolean = false) => {
    if (!championTeam) return null;

    const isRushChamp = championTeam.rushStatus.status === 'CHAMPION';

    return (
      <div
        className={`relative flex flex-col items-center justify-between overflow-hidden rounded-xl border-2 shadow-2xl ${
          compact ? 'w-full max-w-[500px] py-3.5 px-4' : 'h-full w-full p-6'
        }`}
        style={{
          borderColor: activeTheme.border,
          background: activeTheme.darkGradient,
          boxShadow: `0 0 50px ${activeTheme.glow}, inset 0 0 30px ${activeTheme.glow}`,
        }}
      >
        {/* Corner 3D Theme Metallic Cutouts */}
        <div
          className="absolute top-0 left-0 w-8 h-8"
          style={{
            background: activeTheme.ribbonGradient,
            clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          }}
        />
        <div
          className="absolute top-0 right-0 w-8 h-8"
          style={{
            background: activeTheme.ribbonGradient,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-8 h-8"
          style={{
            background: activeTheme.ribbonGradient,
            clipPath: 'polygon(0 0, 0 100%, 100% 100%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-8 h-8"
          style={{
            background: activeTheme.ribbonGradient,
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
          }}
        />

        {/* Ambient Top Light Beam */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-3xl pointer-events-none"
          style={{ background: activeTheme.beamColor }}
        />

        {/* Top 3D Metallic Ribbon */}
        <div
          className="relative z-10 py-1 px-8 text-center shadow-xl border-y"
          style={{
            background: activeTheme.ribbonGradient,
            borderColor: activeTheme.highlight,
            clipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
          }}
        >
          <div
            className="flex items-center justify-center gap-2 font-display text-sm sm:text-base font-black tracking-[0.25em] uppercase"
            style={{ color: activeTheme.ribbonText }}
          >
            <Trophy className="h-4 w-4 drop-shadow-sm" style={{ color: activeTheme.ribbonText }} />
            <span>OFFICIAL GRAND CHAMPION</span>
            <Trophy className="h-4 w-4 drop-shadow-sm" style={{ color: activeTheme.ribbonText }} />
          </div>
        </div>

        {/* Central Crown & 3D Shield Emblem Tile */}
        <div className={`relative ${compact ? 'my-1.5' : 'my-3'} flex flex-col items-center justify-center`}>
          {/* Glowing Crown with Halo */}
          <div className="relative flex items-center justify-center mb-1">
            <div
              className="absolute -inset-2 rounded-full blur-md animate-pulse"
              style={{ background: activeTheme.haloColor }}
            />
            <Crown
              className={`relative ${
                compact ? 'h-10 w-10 sm:h-12 sm:w-12' : 'h-14 w-14 sm:h-18 sm:w-18'
              }`}
              style={{
                color: activeTheme.highlight,
                filter: `drop-shadow(0 4px 16px ${activeTheme.glow})`,
              }}
            />
          </div>

          {/* 3D Shield Emblem Tile */}
          <div
            className="relative flex items-center justify-center p-3 border-2 shadow-2xl overflow-hidden"
            style={{
              width: compact ? '96px' : '150px',
              height: compact ? '96px' : '150px',
              borderColor: activeTheme.highlight,
              background: activeTheme.shieldBg,
              clipPath:
                'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
              boxShadow: `inset 0 0 20px ${activeTheme.glow}`,
            }}
          >
            {championTeam.logoUrl && settings.showLogos ? (
              <img
                src={championTeam.logoUrl}
                alt={championTeam.teamName}
                className="h-full w-full object-contain"
                style={{ filter: `drop-shadow(0 8px 25px ${activeTheme.glow})` }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <span
                  className="font-display text-4xl sm:text-5xl font-black tracking-wider drop-shadow-md"
                  style={{ color: activeTheme.highlight }}
                >
                  {championTeam.shortCode || generateInitials(championTeam.teamName)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Massive Metallic Team Name */}
        <div className="text-center my-1 z-10 w-full px-4">
          <h2
            className="font-display text-4xl sm:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
            style={{
              backgroundImage: activeTheme.teamNameGradient,
            }}
          >
            {championTeam.teamName}
          </h2>

          {/* Victory Condition Tag */}
          <div
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-4 py-0.5 text-xs font-display font-extrabold uppercase tracking-widest shadow-lg"
            style={{
              borderColor: activeTheme.conditionBadgeBorder,
              background: activeTheme.conditionBadgeBg,
              color: activeTheme.conditionBadgeText,
            }}
          >
            <Zap className="h-3.5 w-3.5" style={{ color: activeTheme.highlight }} />
            <span>
              {isRushChamp
                ? 'VICTORY BY CHAMPION RUSH'
                : 'OVERALL TOURNAMENT CHAMPION'}
            </span>
          </div>
        </div>

        {/* 4-Stat Metric Capsules Grid */}
        <div className="z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mt-2.5">
          {/* Card 1: Placement Rank */}
          <div
            className="flex flex-col items-center justify-center rounded border bg-black/60 p-2 shadow-inner"
            style={{ borderColor: activeTheme.statCardBorder }}
          >
            <span
              className="font-display text-[11px] font-bold uppercase tracking-widest"
              style={{ color: activeTheme.statCardLabel }}
            >
              FINAL RANK
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Trophy className="h-4 w-4" style={{ color: activeTheme.statIconColor }} />
              <span className="font-display text-xl sm:text-2xl font-black text-white">
                #1
              </span>
            </div>
          </div>

          {/* Card 2: Total Points */}
          <div
            className="flex flex-col items-center justify-center rounded border bg-black/60 p-2 shadow-inner"
            style={{ borderColor: activeTheme.statCardBorder }}
          >
            <span
              className="font-display text-[11px] font-bold uppercase tracking-widest"
              style={{ color: activeTheme.statCardLabel }}
            >
              TOTAL PTS
            </span>
            <span
              className="font-numbers text-xl sm:text-2xl font-black"
              style={{ color: activeTheme.statCardValue }}
            >
              {championTeam.totalPoints}
            </span>
          </div>

          {/* Card 3: Booyahs */}
          <div
            className="flex flex-col items-center justify-center rounded border bg-black/60 p-2 shadow-inner"
            style={{ borderColor: activeTheme.statCardBorder }}
          >
            <span
              className="font-display text-[11px] font-bold uppercase tracking-widest"
              style={{ color: activeTheme.statCardLabel }}
            >
              BOOYAH
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Flame className="h-4 w-4" style={{ color: activeTheme.statIconColor }} />
              <span className="font-display text-xl sm:text-2xl font-black text-white">
                x{championTeam.booyahCount}
              </span>
            </div>
          </div>

          {/* Card 4: Total Kills */}
          <div
            className="flex flex-col items-center justify-center rounded border bg-black/60 p-2 shadow-inner"
            style={{ borderColor: activeTheme.statCardBorder }}
          >
            <span
              className="font-display text-[11px] font-bold uppercase tracking-widest"
              style={{ color: activeTheme.statCardLabel }}
            >
              ELIMS
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Crosshair className="h-4 w-4" style={{ color: activeTheme.statIconColor }} />
              <span className="font-numbers text-xl sm:text-2xl font-black text-white">
                {championTeam.kills}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Signature Line */}
        <div className="mt-2.5 text-[10px] font-display font-extrabold uppercase tracking-widest text-neutral-400 text-center">
          HOSTED BY: {settings.hostName || 'BD ESPORTS ARENA'} • {settings.name}
        </div>
      </div>
    );
  };

  return (
    <div
      id="result-graphic"
      ref={graphicRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      className={`relative overflow-hidden bg-[#070506] text-white select-none ${
        isExporting ? 'no-animation' : ''
      }`}
    >
      {/* 1. Dedicated Theme Wallpaper Asset */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: `url('${bgUrl}')`,
        }}
      />

      {/* 2. Dynamic Ambient Theme Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 18% 30%, var(--theme-glow) 0%, transparent 60%),
            radial-gradient(circle at 82% 80%, var(--theme-glow) 0%, transparent 65%)
          `,
          opacity: 0.85,
        }}
      />

      {/* 3. Subtle Glass Shards Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none mix-blend-screen opacity-35"
        style={{
          backgroundImage: `url('/assets/shard-overlay.png')`,
        }}
      />

      {/* =================================================================== */}
      {/* 4. MAIN FOREGROUND CONTENT                                          */}
      {/* =================================================================== */}
      {isPortrait ? (
        /* ==================== PORTRAIT (1080x1350) LAYOUT ==================== */
        <div className="relative z-10 flex h-full w-full flex-col px-6 pt-5 pb-5 justify-between">
          {/* Top Broadcast Header */}
          <div className="flex flex-col items-center justify-center text-center pb-2.5 border-b border-white/10 shrink-0 w-full">
            {/* Host Ribbon & Metadata (Centered, Unboxed, Bold) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 font-display text-sm uppercase tracking-widest mb-1">
              {settings.hostName && (
                <span className="flex items-center gap-1.5 font-black text-white">
                  <span
                    className="w-2 h-2 rotate-45 shrink-0"
                    style={{ backgroundColor: activeTheme.accent }}
                  />
                  <span style={{ color: activeTheme.accent }}>HOST:</span>
                  <span className="text-white tracking-wider font-black">
                    {settings.hostName}
                  </span>
                </span>
              )}
              <span className="text-neutral-500">•</span>
              <span className="rounded bg-black/60 px-2.5 py-0.5 border border-white/10 text-white font-extrabold">
                {settings.roundOrDay}
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-300 font-bold">{matchHeaderSubtitle}</span>
            </div>

            {/* Tournament Title (Large, Bold Italic, Broadcast Style) */}
            <h1 className="font-display italic text-5xl sm:text-6xl font-black uppercase tracking-wide text-white text-center drop-shadow-2xl leading-none my-1">
              {settings.name}
            </h1>

            {/* Mode & Category Badge */}
            <div
              className="mt-1 px-5 py-0.5 font-display font-black text-xs sm:text-sm tracking-[0.2em] uppercase text-white bg-black/80 border border-white/20 shadow-md"
              style={{
                clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
              }}
            >
              {settings.mode === 'CHAMPION_RUSH' ? 'CHAMPION RUSH' : 'SCRIM BATTLE'}
            </div>
          </div>

          {/* Concluded State: Show Upgraded 3D Grand Champion Card */}
          {isFinalResult && championTeam ? (
            <div className="my-1.5 shrink-0 flex justify-center w-full">
              {renderGrandChampionCard(true)}
            </div>
          ) : (
            /* Non-Concluded: Show Tournament Emblem Tile & Target Points Ribbon */
            <div className="my-1.5 shrink-0 flex items-center justify-between gap-3 w-full px-1">
              {/* Target Ribbon */}
              <div
                className="flex-1 py-1.5 px-4 shadow-lg flex items-center gap-2"
                style={{
                  background: activeTheme.ribbonGradient,
                  color: activeTheme.ribbonText,
                  clipPath:
                    'polygon(0 0, calc(100% - 14px) 0, 100% 100%, 0 100%)',
                }}
              >
                <Zap className="h-4 w-4 shrink-0" style={{ color: activeTheme.ribbonText }} />
                <span className="font-display text-sm sm:text-base font-black tracking-widest uppercase">
                  {settings.mode === 'CHAMPION_RUSH'
                    ? `${settings.championRush.targetPoints} POINTS ACTIVATES CHAMPION RUSH`
                    : `STANDINGS LEADERBOARD • ${standings.length} TEAMS`}
                </span>
              </div>

              {/* Tournament Emblem Tile */}
              <div
                className="relative flex items-center justify-center p-2 border-2 shadow-2xl shrink-0 overflow-hidden"
                style={{
                  width: '60px',
                  height: '60px',
                  borderColor: 'rgba(255,255,255,0.3)',
                  background:
                    'radial-gradient(circle, var(--theme-gradient-start) 0%, #120608 70%, #070304 100%)',
                  clipPath:
                    'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
              >
                <img
                  src={settings.customLogoUrl || '/assets/logo-placeholder.png'}
                  alt="Tournament Emblem"
                  className="h-full w-full object-contain drop-shadow"
                />
              </div>
            </div>
          )}

          {/* Standings Table Area (Portrait) */}
          <div className="flex-1 flex flex-col justify-center my-1">
            {/* Table Column Headers */}
            <div className="mb-1.5 flex items-center px-3 font-display tracking-widest uppercase text-xs font-black text-neutral-300">
              <div className="w-20 flex items-center gap-1 pl-1">
                <span className="w-7 text-center">#</span>
              </div>
              <div className="flex-1 pl-2">TEAM NAME</div>
              <span className="w-14 text-center">BOOYAH!</span>
              <span className="w-14 text-center">ELIMS</span>
              <span className="w-14 text-center">PLACE</span>
              <span className="w-18 text-center" style={{ color: activeTheme.highlight }}>TOTAL</span>
            </div>

            {/* Table Rows (Cleanly fitted without clipping) */}
            <div className={isFinalResult ? 'space-y-1' : 'space-y-1.5'}>
              {standings.map((team, idx) => {
                const isChamp = team.rushStatus.status === 'CHAMPION';
                const isRushActive = team.rushStatus.status === 'ACTIVE';

                return (
                  <div
                    key={team.teamId}
                    className={`relative flex items-center ${
                      !isExporting ? 'animate-row-enter' : ''
                    }`}
                    style={{
                      animationDelay: `${Math.min(idx * 25, 300)}ms`,
                    }}
                  >
                    <div
                      className={`relative flex w-full items-center overflow-hidden shadow-md px-2 bg-black/60 border border-white/10 ${
                        isFinalResult ? 'h-9 sm:h-10' : 'h-10 sm:h-11'
                      }`}
                      style={{
                        clipPath:
                          'polygon(0 0, calc(100% - 10px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 10px) 100%, 0 100%)',
                        borderLeftColor:
                          team.rank === 1
                            ? '#FFE259'
                            : team.rank === 2
                            ? '#CBD5E1'
                            : team.rank === 3
                            ? '#FB923C'
                            : 'transparent',
                        borderLeftWidth: team.rank <= 3 ? '4px' : '1px',
                      }}
                    >
                      {/* Rush Status Circle */}
                      <div className="mr-1.5 shrink-0">
                        {renderRushCircle(team.rushStatus.status)}
                      </div>

                      {/* Rank Tag */}
                      <div className="mr-2 shrink-0">
                        {renderRankTag(team.rank)}
                      </div>

                      {/* Team Logo & Name */}
                      <div className="flex flex-1 items-center gap-2 overflow-hidden pr-2">
                        {settings.showLogos && (
                          team.logoUrl ? (
                            <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-black/90 overflow-hidden border border-neutral-700">
                              <img
                                src={team.logoUrl}
                                alt={team.teamName}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 text-[10px] font-black font-display text-neutral-300">
                              {team.shortCode || generateInitials(team.teamName)}
                            </div>
                          )
                        )}

                        <span
                          className={`truncate font-display font-extrabold tracking-wider text-white uppercase drop-shadow-sm ${
                            isFinalResult ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
                          }`}
                        >
                          {team.teamName}
                        </span>

                        {isChamp && (
                          <span
                            className="ml-1 rounded px-1.5 py-0.2 text-[9px] font-black uppercase shadow-sm"
                            style={{
                              background: activeTheme.ribbonGradient,
                              color: activeTheme.ribbonText,
                            }}
                          >
                            CHAMP
                          </span>
                        )}
                        {isRushActive && !isChamp && (
                          <span
                            className="ml-1 rounded px-1.5 py-0.2 text-[9px] font-black uppercase border"
                            style={{
                              background: activeTheme.conditionBadgeBg,
                              borderColor: activeTheme.conditionBadgeBorder,
                              color: activeTheme.conditionBadgeText,
                            }}
                          >
                            RUSH
                          </span>
                        )}
                      </div>

                      {/* Stats Capsule */}
                      <div className="shrink-0">
                        {renderStatsCapsule(team, 'portrait')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Broadcast Footer (Portrait) */}
          <div className="mt-auto flex flex-col gap-1.5 border-t border-white/10 pt-2 shrink-0">
            {/* Legend Indicators */}
            <div className="flex items-center justify-center gap-4 text-[10px] font-display uppercase tracking-widest text-neutral-400">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-4 w-4 rounded-full border flex items-center justify-center shadow-sm"
                  style={{
                    borderColor: activeTheme.highlight,
                    background: activeTheme.ribbonGradient,
                  }}
                >
                  <Crown className="h-2.5 w-2.5" style={{ color: activeTheme.ribbonText }} />
                </div>
                <span>WON BY CHAMPION RUSH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-4 w-4 rounded-full border bg-neutral-950 flex items-center justify-center shadow-sm"
                  style={{ borderColor: activeTheme.accent }}
                >
                  <Crown className="h-2.5 w-2.5" style={{ color: activeTheme.highlight }} />
                </div>
                <span>SATISFIED CONDITION</span>
              </div>
            </div>

            {/* Unboxed Credits */}
            <div className="flex items-center justify-between text-xs font-display uppercase tracking-widest text-white font-black px-1">
              <a
                href="https://mroppy.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:brightness-125 transition-all cursor-pointer"
                style={{ color: activeTheme.brandText }}
                title="Visit MR. OPPY Portfolio"
              >
                <Flame className="h-4 w-4 shrink-0" style={{ color: activeTheme.brandFlameColor }} />
                <span>MADE BY MR. OPPY</span>
              </a>
              <div className="flex items-center gap-1 text-neutral-300 text-[11px]">
                <span className="text-neutral-400 font-bold">SPONSOR:</span>
                <span className="text-white font-black">
                  {settings.sponsorName || 'ARENA SPONSORS'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== LANDSCAPE (1920x1080) LAYOUT ==================== */
        <div className="relative z-10 flex h-full w-full flex-col justify-between px-12 pt-7 pb-16">
          {isFinalResult && championTeam ? (
            /* CONCLUDED TOURNAMENT: DUAL VIEW (Grand Champion Card Left + Standings Right) */
            <div className="flex h-full w-full gap-8 items-center justify-between">
              {/* Left Column (38%): 3D Metallic Grand Champion Card (Directly addresses Image 1) */}
              <div className="h-full w-[38%] shrink-0 flex flex-col justify-center">
                {renderGrandChampionCard(false)}
              </div>

              {/* Right Column (62%): Complete Standings Table */}
              <div className="h-full w-[62%] flex flex-col justify-between py-1">
                {/* Header Bar for Final Standings */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <div className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-neutral-400">
                      <span>HOST: {settings.hostName || 'BD ESPORTS ARENA'}</span>
                      <span>•</span>
                      <span>{settings.roundOrDay}</span>
                    </div>
                    <h1 className="font-display italic text-4xl xl:text-5xl font-black uppercase tracking-wide text-white drop-shadow-xl">
                      {settings.name}
                    </h1>
                  </div>

                  {/* Mode Badge & Logo */}
                  <div className="flex items-center gap-3">
                    <div
                      className="px-4 py-1 font-display font-black text-xs tracking-widest uppercase text-white bg-black/80 border border-white/20"
                      style={{
                        clipPath:
                          'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                      }}
                    >
                      FINAL STANDINGS
                    </div>
                    <div
                      className="relative flex items-center justify-center p-1.5 border border-white/20 shadow-lg shrink-0 overflow-hidden"
                      style={{
                        width: '56px',
                        height: '56px',
                        background:
                          'radial-gradient(circle, #2D1A06 0%, #150C03 70%, #080502 100%)',
                        clipPath:
                          'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                      }}
                    >
                      <img
                        src={settings.customLogoUrl || '/assets/logo-placeholder.png'}
                        alt="Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Table Header Bar */}
                <div className="my-1.5 flex items-center justify-between px-3 font-display tracking-widest uppercase text-sm font-black text-neutral-300">
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-center">#</span>
                    <span className="pl-4">TEAM NAME</span>
                  </div>
                  <div
                    className="flex items-center font-display text-xs font-black tracking-widest text-white px-3 py-1 bg-neutral-900 border border-neutral-700"
                    style={{
                      clipPath:
                        'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                    }}
                  >
                    <span className="w-16 text-center">BOOYAH!</span>
                    <span className="w-16 text-center">ELIMS</span>
                    <span className="w-16 text-center">PLACE</span>
                    <span className="w-20 text-center" style={{ color: activeTheme.highlight }}>TOTAL</span>
                  </div>
                </div>

                {/* Table Rows (12 teams cleanly fitted) */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                  {standings.map((team, idx) => {
                    const isChamp = team.rushStatus.status === 'CHAMPION';
                    const isRushActive = team.rushStatus.status === 'ACTIVE';

                    return (
                      <div
                        key={team.teamId}
                        className={`relative flex items-center ${
                          !isExporting ? 'animate-row-enter' : ''
                        }`}
                        style={{
                          animationDelay: `${Math.min(idx * 25, 300)}ms`,
                        }}
                      >
                        <div
                          className="relative flex h-11 w-full items-center justify-between overflow-hidden shadow-lg px-3 bg-black/60 border border-white/10"
                          style={{
                            clipPath:
                              'polygon(0 0, calc(100% - 12px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 12px) 100%, 0 100%)',
                            borderLeftColor:
                              team.rank === 1
                                ? '#FFE259'
                                : team.rank === 2
                                ? '#CBD5E1'
                                : team.rank === 3
                                ? '#FB923C'
                                : 'transparent',
                            borderLeftWidth: team.rank <= 3 ? '4px' : '1px',
                          }}
                        >
                          {/* Left: Rush Circle + Rank Tag + Logo + Name */}
                          <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                            {renderRushCircle(team.rushStatus.status)}
                            {renderRankTag(team.rank)}

                            {settings.showLogos && (
                              team.logoUrl ? (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/90 overflow-hidden border border-neutral-700 shadow-md">
                                  <img
                                    src={team.logoUrl}
                                    alt={team.teamName}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 text-[10px] font-black font-display text-neutral-300">
                                  {team.shortCode || generateInitials(team.teamName)}
                                </div>
                              )
                            )}

                            <span className="truncate font-display text-xl font-extrabold tracking-wider text-white uppercase drop-shadow-sm">
                              {team.teamName}
                            </span>

                            {isChamp && (
                              <span
                                className="ml-2 rounded px-2 py-0.5 text-xs font-black uppercase tracking-wider shadow-sm"
                                style={{
                                  background: activeTheme.ribbonGradient,
                                  color: activeTheme.ribbonText,
                                }}
                              >
                                CHAMPION
                              </span>
                            )}
                            {isRushActive && !isChamp && (
                              <span
                                className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-black uppercase border"
                                style={{
                                  background: activeTheme.conditionBadgeBg,
                                  borderColor: activeTheme.conditionBadgeBorder,
                                  color: activeTheme.conditionBadgeText,
                                }}
                              >
                                RUSH ACTIVE
                              </span>
                            )}
                          </div>

                          {/* Right: Segmented Stats Capsule */}
                          <div className="shrink-0">
                            {renderStatsCapsule(team, 'landscape-split')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Footer Credits */}
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-xs font-display uppercase tracking-widest text-neutral-400">
                  <a
                    href="https://mroppy.netlify.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-black text-base hover:brightness-125 transition-all cursor-pointer"
                    style={{ color: activeTheme.brandText }}
                    title="Visit MR. OPPY Portfolio"
                  >
                    <Flame className="h-5 w-5" style={{ color: activeTheme.brandFlameColor }} />
                    <span>MADE BY MR. OPPY</span>
                  </a>
                  <div className="flex items-center gap-2 font-black text-white text-sm">
                    <span className="text-neutral-400 font-bold">POWERED BY:</span>
                    <span>{settings.sponsorName || 'ARENA SPONSORS'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* NON-CONCLUDED / REGULAR BROADCAST: FULL-WIDTH LAYOUT (MATCHING IMAGE 2 EXACTLY) */
            <>
              {/* TOP HEADER (Spanning Full Width) */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
                {/* Left Title Lockup */}
                <div>
                  {/* Host & Round Line */}
                  <div className="flex items-center gap-2.5 font-display text-sm uppercase tracking-widest mb-1">
                    {settings.hostName && (
                      <span className="flex items-center gap-1.5 font-black text-white">
                        <span
                          className="w-2.5 h-2.5 rotate-45 shrink-0"
                          style={{ backgroundColor: activeTheme.accent }}
                        />
                        <span style={{ color: activeTheme.accent }}>HOST:</span>
                        <span className="text-white tracking-wider font-black">
                          {settings.hostName}
                        </span>
                      </span>
                    )}
                    <span className="text-neutral-500">•</span>
                    <span className="rounded bg-black/60 px-3 py-0.5 border border-white/10 text-white font-extrabold text-xs">
                      {settings.roundOrDay}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-300 font-bold text-xs">
                      {matchHeaderSubtitle}
                    </span>
                  </div>

                  {/* Giant Italic Display Title */}
                  <h1 className="font-display italic text-6xl xl:text-7xl font-black uppercase tracking-wide text-white drop-shadow-2xl leading-none">
                    {settings.name || 'GRAND FINALS STANDINGS'}
                  </h1>

                  {/* Angled Mode Badge (e.g. CHAMPION RUSH) */}
                  <div
                    className="mt-2 inline-flex items-center px-6 py-1 font-display font-black text-sm tracking-[0.25em] uppercase text-white bg-black/90 border border-white/20 shadow-xl"
                    style={{
                      clipPath:
                        'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                    }}
                  >
                    {settings.mode === 'CHAMPION_RUSH'
                      ? 'CHAMPION RUSH'
                      : 'SCRIM BATTLE'}
                  </div>
                </div>

                {/* Right: Official Tournament Emblem Logo (Image 2 Top-Right Placement) */}
                <div
                  className="relative flex items-center justify-center p-3 border-2 shadow-2xl shrink-0 overflow-hidden"
                  style={{
                    width: '130px',
                    height: '130px',
                    borderColor: 'rgba(255,255,255,0.35)',
                    background:
                      'radial-gradient(circle, var(--theme-gradient-start) 0%, #120608 70%, #070304 100%)',
                    clipPath:
                      'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
                    boxShadow: `0 0 30px ${activeTheme.glow}`,
                  }}
                >
                  <img
                    src={settings.customLogoUrl || '/assets/logo-placeholder.png'}
                    alt="Official Tournament Emblem"
                    className="h-full w-full object-contain"
                    style={{ filter: `drop-shadow(0 8px 20px ${activeTheme.glow})` }}
                  />
                </div>
              </div>

              {/* TABLE AREA (Spanning Full Width with Image 2 Styling) */}
              <div className="flex-1 flex flex-col justify-center my-2 max-w-[1580px] w-full mx-auto">
                {/* Table Header Bar */}
                <div className="mb-2 flex items-center justify-between px-3">
                  {/* Left: Theme Target Points Banner */}
                  <div
                    className="py-1.5 px-6 shadow-xl flex items-center gap-2 font-display font-black text-sm sm:text-base tracking-widest uppercase"
                    style={{
                      background: activeTheme.ribbonGradient,
                      color: activeTheme.ribbonText,
                      clipPath:
                        'polygon(0 0, calc(100% - 16px) 0, 100% 100%, 0 100%)',
                    }}
                  >
                    <Zap className="h-4 w-4 shrink-0" style={{ color: activeTheme.ribbonText }} />
                    <span>
                      {settings.mode === 'CHAMPION_RUSH'
                        ? `${settings.championRush.targetPoints} POINTS ACTIVATES CHAMPION RUSH`
                        : `STANDINGS LEADERBOARD • ${standings.length} TEAMS BATTLE`}
                    </span>
                  </div>

                  {/* Right: Column Headers Angled Capsule */}
                  <div
                    className="flex items-center font-display text-sm font-black tracking-widest uppercase text-white px-4 py-1.5 bg-black/90 border border-neutral-700 shadow-md"
                    style={{
                      clipPath:
                        'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                    }}
                  >
                    <span className="w-20 text-center">BOOYAH!</span>
                    <span className="w-20 text-center">ELIMS</span>
                    <span className="w-36 text-center">PLACEMENT POINTS</span>
                    <span className="w-28 text-center" style={{ color: activeTheme.highlight }}>TOTAL POINTS</span>
                  </div>
                </div>

                {/* Table Rows (12 Rows, Full Width, Clear Spacing) */}
                <div className="space-y-1.5">
                  {standings.map((team, idx) => {
                    const isChamp = team.rushStatus.status === 'CHAMPION';
                    const isRushActive = team.rushStatus.status === 'ACTIVE';

                    return (
                      <div
                        key={team.teamId}
                        className={`relative flex items-center ${
                          !isExporting ? 'animate-row-enter' : ''
                        }`}
                        style={{
                          animationDelay: `${Math.min(idx * 25, 300)}ms`,
                        }}
                      >
                        <div
                          className="relative flex h-12 xl:h-13 w-full items-center justify-between overflow-hidden shadow-lg px-4 bg-black/60 border border-white/10"
                          style={{
                            clipPath:
                              'polygon(0 0, calc(100% - 14px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 14px) 100%, 0 100%)',
                            borderLeftColor:
                              team.rank === 1
                                ? '#FFE259'
                                : team.rank === 2
                                ? '#CBD5E1'
                                : team.rank === 3
                                ? '#FB923C'
                                : 'transparent',
                            borderLeftWidth: team.rank <= 3 ? '4px' : '1px',
                          }}
                        >
                          {/* Left: Rush Status Circle + Rank Tag + Logo + Team Name */}
                          <div className="flex items-center gap-3 overflow-hidden pr-4">
                            {renderRushCircle(team.rushStatus.status)}
                            {renderRankTag(team.rank)}

                            {settings.showLogos && (
                              team.logoUrl ? (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/90 overflow-hidden border border-neutral-700 shadow-md">
                                  <img
                                    src={team.logoUrl}
                                    alt={team.teamName}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 text-xs font-black font-display text-neutral-300">
                                  {team.shortCode || generateInitials(team.teamName)}
                                </div>
                              )
                            )}

                            <span className="truncate font-display text-2xl xl:text-3xl font-extrabold tracking-wider text-white uppercase drop-shadow-sm">
                              {team.teamName}
                            </span>

                            {isChamp && (
                              <span
                                className="ml-2 rounded px-2.5 py-0.5 text-xs font-black uppercase tracking-wider shadow-sm"
                                style={{
                                  background: activeTheme.ribbonGradient,
                                  color: activeTheme.ribbonText,
                                }}
                              >
                                CHAMPION
                              </span>
                            )}
                            {isRushActive && !isChamp && (
                              <span
                                className="ml-2 rounded px-2 py-0.5 text-xs font-black uppercase border"
                                style={{
                                  background: activeTheme.conditionBadgeBg,
                                  borderColor: activeTheme.conditionBadgeBorder,
                                  color: activeTheme.conditionBadgeText,
                                }}
                              >
                                RUSH ACTIVE
                              </span>
                            )}
                          </div>

                          {/* Right: Segmented Stats Capsule */}
                          <div className="shrink-0">
                            {renderStatsCapsule(team, 'landscape-full')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOTTOM FOOTER: LEGEND + UNBOXED MADE BY MR. OPPY & SPONSORS */}
              <div className="flex items-center justify-between border-t border-white/10 pt-3 shrink-0">
                {/* Left: Legend Indicators (Matching Theme Colors) */}
                <div className="flex items-center gap-6 text-xs font-display uppercase tracking-widest text-neutral-300">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-5 rounded-full border flex items-center justify-center shadow-sm"
                      style={{
                        borderColor: activeTheme.highlight,
                        background: activeTheme.ribbonGradient,
                      }}
                    >
                      <Crown className="h-3 w-3" style={{ color: activeTheme.ribbonText }} />
                    </div>
                    <span className="font-extrabold text-white">
                      WON BY CHAMPION RUSH
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-5 rounded-full border bg-neutral-950 flex items-center justify-center shadow-sm"
                      style={{ borderColor: activeTheme.accent }}
                    >
                      <Crown className="h-3 w-3" style={{ color: activeTheme.highlight }} />
                    </div>
                    <span className="font-extrabold text-neutral-300">
                      SATISFIED CHAMPION RUSH CONDITION
                    </span>
                  </div>
                </div>

                {/* Right: Unboxed Credits */}
                <div className="flex items-center gap-8 font-display uppercase tracking-widest">
                  <a
                    href="https://mroppy.netlify.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xl font-black hover:brightness-125 drop-shadow transition-colors cursor-pointer"
                    style={{ color: activeTheme.brandText }}
                    title="Visit MR. OPPY Portfolio"
                  >
                    <Flame className="h-5 w-5 shrink-0" style={{ color: activeTheme.brandFlameColor }} />
                    <span>MADE BY MR. OPPY</span>
                  </a>

                  <div className="flex items-center gap-2 text-lg font-black text-white drop-shadow">
                    <span className="text-neutral-400 font-bold text-sm">
                      POWERED &amp; SPONSORED BY:
                    </span>
                    <span className="text-white tracking-wider">
                      {settings.sponsorName || 'ARENA SPONSORS'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
