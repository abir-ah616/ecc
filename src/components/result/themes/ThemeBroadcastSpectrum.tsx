import React, { useId } from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';
import { getTableDensity, resolveTeamTag } from './themeHelpers';

export type SpectrumVariant = 'inferno' | 'obsidian' | 'amethyst';

interface SpectrumPalette {
  canvasBg: string;
  topGradient: string;
  halftoneDot: string;
  beamTop: string;
  wingStart: string;
  wingEnd: string;
  lowerBg: string;
  horizonStroke: string;
  spineBg: string;
  spineText: string;
  spineAccent: string;
  kickerBg: string;
  kickerText: string;
  headlineText: string;
  headlineShadow: string;
  subBannerBorder: string;
  subBannerText: string;
  subtitleBorder: string;
  rankHeaderText: string;
  tableHeaderBg: string;
  tableTotalText: string;
  rowTop1Border: string;
  rowTop1Glow: string;
  rowTop1RankBg: string;
  rowTop1RankText: string;
  rowTop3RankBg: string;
  rowTop3RankText: string;
  rowRestRankBorder: string;
  rowRestRankBg: string;
  logoTagText: string;
  plateTop1Bg: string;
  plateTop3Bg: string;
  plateRestBg: string;
  statsTop1Bg: string;
  statsRestBg: string;
  totalTop1Bg: string;
  totalTop1Text: string;
  totalRestBg: string;
  footerPillBorder: string;
  footerText: string;
  monolith: {
    outerBorder: string;
    cornerWedge: string;
    headerBg: string;
    headerText: string;
    chamberBg: string;
    crownColor: string;
    initialsColor: string;
    bladeBg: string;
    bladeText: string;
    statTextColor: string;
    subStatBg: string;
    subStatBorder: string;
    subStatLabel: string;
    glowColor: string;
  };
}

const SPECTRUM_PALETTES: Record<SpectrumVariant, SpectrumPalette> = {
  inferno: {
    canvasBg: '#090403',
    topGradient:
      'linear-gradient(180deg, #FF5500 0%, #EA580C 14%, #9A3412 24%, #1A0B06 38%, #090403 100%)',
    halftoneDot: 'rgba(18, 6, 2, 0.22)',
    beamTop: 'rgba(255, 199, 102, 0.28)',
    wingStart: 'rgba(234, 88, 12, 0.35)',
    wingEnd: 'rgba(255, 85, 0, 0.08)',
    lowerBg: 'rgba(10, 4, 3, 0.96)',
    horizonStroke: '#FF6B1A',
    spineBg: '#FFF7ED',
    spineText: '#090403',
    spineAccent: '#EA580C',
    kickerBg: '#090403',
    kickerText: '#FF7A29',
    headlineText: '#090403',
    headlineShadow: '0 2px 0 rgba(255, 237, 213, 0.45)',
    subBannerBorder: '#FFB703',
    subBannerText: '#FF7A29',
    subtitleBorder: '#090403',
    rankHeaderText: '#FF8C42',
    tableHeaderBg: 'linear-gradient(90deg, #9A3412 0%, #EA580C 50%, #FF5500 100%)',
    tableTotalText: '#FFB703',
    rowTop1Border: '#FF7A29',
    rowTop1Glow: 'rgba(255, 107, 26, 0.36)',
    rowTop1RankBg: '#FF5500',
    rowTop1RankText: '#090403',
    rowTop3RankBg: '#271008',
    rowTop3RankText: '#FDBA74',
    rowRestRankBorder: '#3B180C',
    rowRestRankBg: '#140805',
    logoTagText: '#FF8C42',
    plateTop1Bg: 'linear-gradient(90deg, #FDBA74 0%, #FFEDD5 100%)',
    plateTop3Bg: 'linear-gradient(90deg, #FFEDD5 0%, #FFF7ED 100%)',
    plateRestBg: 'linear-gradient(90deg, #FFF7ED 0%, #FFFFFF 100%)',
    statsTop1Bg: 'linear-gradient(90deg, #FFB703 0%, #FF7A29 100%)',
    statsRestBg: 'linear-gradient(90deg, #FB923C 0%, #EA580C 100%)',
    totalTop1Bg: '#090403',
    totalTop1Text: '#FFB703',
    totalRestBg: '#1A0A06',
    footerPillBorder: 'rgba(255, 122, 41, 0.48)',
    footerText: '#FF8C42',
    monolith: {
      outerBorder: 'linear-gradient(135deg, #FFB703 0%, #FF5500 55%, #1A0B06 100%)',
      cornerWedge: '#FFFFFF',
      headerBg: 'linear-gradient(90deg, #9A3412 0%, #FF5500 50%, #9A3412 100%)',
      headerText: '#FFFFFF',
      chamberBg: 'linear-gradient(180deg, #1E0B06 0%, #090403 100%)',
      crownColor: '#FFB703',
      initialsColor: '#FF8C42',
      bladeBg: 'linear-gradient(90deg, #FDBA74 0%, #FF7A29 55%, #FF5500 100%)',
      bladeText: '#090403',
      statTextColor: '#FED7AA',
      subStatBg: 'rgba(18, 7, 4, 0.94)',
      subStatBorder: 'rgba(255, 107, 26, 0.5)',
      subStatLabel: '#FED7AA',
      glowColor: 'rgba(255, 107, 26, 0.55)',
    },
  },
  obsidian: {
    canvasBg: '#06070A',
    topGradient:
      'linear-gradient(180deg, #E2E8F0 0%, #94A3B8 14%, #334155 24%, #0F141C 38%, #06070A 100%)',
    halftoneDot: 'rgba(15, 23, 42, 0.18)',
    beamTop: 'rgba(255, 255, 255, 0.34)',
    wingStart: 'rgba(148, 163, 184, 0.35)',
    wingEnd: 'rgba(226, 232, 240, 0.08)',
    lowerBg: 'rgba(6, 7, 10, 0.96)',
    horizonStroke: '#F1F5F9',
    spineBg: '#F8FAFC',
    spineText: '#06070A',
    spineAccent: '#475569',
    kickerBg: '#06070A',
    kickerText: '#F8FAFC',
    headlineText: '#06070A',
    headlineShadow: '0 2px 0 rgba(255, 255, 255, 0.5)',
    subBannerBorder: '#E2E8F0',
    subBannerText: '#F8FAFC',
    subtitleBorder: '#06070A',
    rankHeaderText: '#CBD5E1',
    tableHeaderBg: 'linear-gradient(90deg, #334155 0%, #475569 50%, #64748B 100%)',
    tableTotalText: '#F8FAFC',
    rowTop1Border: '#F8FAFC',
    rowTop1Glow: 'rgba(226, 232, 240, 0.28)',
    rowTop1RankBg: '#F8FAFC',
    rowTop1RankText: '#06070A',
    rowTop3RankBg: '#161B24',
    rowTop3RankText: '#E2E8F0',
    rowRestRankBorder: '#1E2532',
    rowRestRankBg: '#0D1017',
    logoTagText: '#E2E8F0',
    plateTop1Bg: 'linear-gradient(90deg, #E2E8F0 0%, #FFFFFF 100%)',
    plateTop3Bg: 'linear-gradient(90deg, #F1F5F9 0%, #FFFFFF 100%)',
    plateRestBg: 'linear-gradient(90deg, #F8FAFC 0%, #FFFFFF 100%)',
    statsTop1Bg: 'linear-gradient(90deg, #F8FAFC 0%, #CBD5E1 100%)',
    statsRestBg: 'linear-gradient(90deg, #CBD5E1 0%, #94A3B8 100%)',
    totalTop1Bg: '#06070A',
    totalTop1Text: '#FFFFFF',
    totalRestBg: '#11151E',
    footerPillBorder: 'rgba(226, 232, 240, 0.42)',
    footerText: '#E2E8F0',
    monolith: {
      outerBorder: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 55%, #0F172A 100%)',
      cornerWedge: '#FFFFFF',
      headerBg: 'linear-gradient(90deg, #1E293B 0%, #475569 50%, #1E293B 100%)',
      headerText: '#FFFFFF',
      chamberBg: 'linear-gradient(180deg, #12161F 0%, #06070A 100%)',
      crownColor: '#F8FAFC',
      initialsColor: '#E2E8F0',
      bladeBg: 'linear-gradient(90deg, #FFFFFF 0%, #E2E8F0 55%, #CBD5E1 100%)',
      bladeText: '#06070A',
      statTextColor: '#E2E8F0',
      subStatBg: 'rgba(11, 14, 20, 0.94)',
      subStatBorder: 'rgba(226, 232, 240, 0.45)',
      subStatLabel: '#E2E8F0',
      glowColor: 'rgba(248, 250, 252, 0.4)',
    },
  },
  amethyst: {
    canvasBg: '#090512',
    topGradient:
      'linear-gradient(180deg, #C084FC 0%, #9333EA 14%, #6B21A8 24%, #1A0B2E 38%, #090512 100%)',
    halftoneDot: 'rgba(14, 6, 28, 0.22)',
    beamTop: 'rgba(245, 208, 254, 0.28)',
    wingStart: 'rgba(147, 51, 234, 0.38)',
    wingEnd: 'rgba(192, 132, 252, 0.08)',
    lowerBg: 'rgba(9, 5, 18, 0.96)',
    horizonStroke: '#D8B4FE',
    spineBg: '#FAF5FF',
    spineText: '#090512',
    spineAccent: '#7E22CE',
    kickerBg: '#090512',
    kickerText: '#D8B4FE',
    headlineText: '#090512',
    headlineShadow: '0 2px 0 rgba(250, 245, 255, 0.48)',
    subBannerBorder: '#E879F9',
    subBannerText: '#E879F9',
    subtitleBorder: '#090512',
    rankHeaderText: '#D8B4FE',
    tableHeaderBg: 'linear-gradient(90deg, #581C87 0%, #7E22CE 50%, #A855F7 100%)',
    tableTotalText: '#E879F9',
    rowTop1Border: '#D8B4FE',
    rowTop1Glow: 'rgba(168, 85, 247, 0.38)',
    rowTop1RankBg: '#C084FC',
    rowTop1RankText: '#090512',
    rowTop3RankBg: '#1D0E33',
    rowTop3RankText: '#E9D5FF',
    rowRestRankBorder: '#2C154D',
    rowRestRankBg: '#110722',
    logoTagText: '#D8B4FE',
    plateTop1Bg: 'linear-gradient(90deg, #E9D5FF 0%, #FAF5FF 100%)',
    plateTop3Bg: 'linear-gradient(90deg, #F3E8FF 0%, #FAF5FF 100%)',
    plateRestBg: 'linear-gradient(90deg, #FAF5FF 0%, #FFFFFF 100%)',
    statsTop1Bg: 'linear-gradient(90deg, #E879F9 0%, #A855F7 100%)',
    statsRestBg: 'linear-gradient(90deg, #C084FC 0%, #9333EA 100%)',
    totalTop1Bg: '#090512',
    totalTop1Text: '#E879F9',
    totalRestBg: '#130924',
    footerPillBorder: 'rgba(192, 132, 252, 0.48)',
    footerText: '#D8B4FE',
    monolith: {
      outerBorder: 'linear-gradient(135deg, #E879F9 0%, #9333EA 55%, #1A0B2E 100%)',
      cornerWedge: '#FFFFFF',
      headerBg: 'linear-gradient(90deg, #581C87 0%, #9333EA 50%, #581C87 100%)',
      headerText: '#FFFFFF',
      chamberBg: 'linear-gradient(180deg, #1C0B32 0%, #090512 100%)',
      crownColor: '#E879F9',
      initialsColor: '#D8B4FE',
      bladeBg: 'linear-gradient(90deg, #F0ABFC 0%, #C084FC 55%, #A855F7 100%)',
      bladeText: '#090512',
      statTextColor: '#E9D5FF',
      subStatBg: 'rgba(16, 7, 30, 0.94)',
      subStatBorder: 'rgba(192, 132, 252, 0.5)',
      subStatLabel: '#E9D5FF',
      glowColor: 'rgba(192, 132, 252, 0.52)',
    },
  },
};

export const ThemeBroadcastSpectrum: React.FC<
  GraphicThemeProps & { variant: SpectrumVariant }
> = ({
  settings,
  standings,
  isPortrait,
  isFinalResult,
  championTeam,
  matchHeaderSubtitle,
  variant,
}) => {
  const uid = useId().replace(/:/g, '');
  const p = SPECTRUM_PALETTES[variant];
  const isRush = settings.mode === 'CHAMPION_RUSH';
  const tournamentLogo = settings.customLogoUrl;
  const showWinnerHero = isFinalResult && !!championTeam;
  const density = getTableDensity(
    standings.length,
    isPortrait,
    showWinnerHero
  );

  const mainHeadline = settings.roundOrDay
    ? `${settings.roundOrDay} STANDINGS`
    : 'GRAND FINALS STANDINGS';
  const subBannerText = isRush ? 'CHAMPION RUSH' : 'BATTLE ROYALE STANDINGS';

  return (
    <div
      className="relative flex h-full w-full overflow-hidden text-white select-none"
      style={{ backgroundColor: p.canvasBg }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: p.topGradient }}
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={`halftone-${uid}`}
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.5" fill={p.halftoneDot} />
          </pattern>
          <linearGradient id={`beam-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.beamTop} />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
          <linearGradient id={`wing-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={p.wingStart} />
            <stop offset="100%" stopColor={p.wingEnd} />
          </linearGradient>
        </defs>

        <rect width="100%" height="32%" fill={`url(#halftone-${uid})`} />
        <polygon
          points={
            isPortrait
              ? '620,0 1080,0 1080,480 360,480'
              : '1080,0 1920,0 1920,520 760,520'
          }
          fill={`url(#beam-${uid})`}
        />
        <polygon
          points={
            isPortrait
              ? '0,0 340,0 120,320 0,320'
              : '0,0 520,0 240,280 0,280'
          }
          fill={`url(#wing-${uid})`}
        />
        <polygon
          points={
            isPortrait
              ? '0,360 1080,235 1080,1350 0,1350'
              : '0,255 1920,175 1920,1080 0,1080'
          }
          fill={p.lowerBg}
        />
        <line
          x1="0"
          y1={isPortrait ? '360' : '255'}
          x2={isPortrait ? '1080' : '1920'}
          y2={isPortrait ? '235' : '175'}
          stroke={p.horizonStroke}
          strokeWidth="4"
        />
      </svg>

      <aside
        className="relative z-30 flex h-full w-[42px] shrink-0 flex-col items-center justify-between border-r-2 py-6 shadow-[6px_0_24px_rgba(0,0,0,0.65)]"
        style={{
          backgroundColor: p.spineBg,
          color: p.spineText,
          borderColor: p.canvasBg,
        }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-3 w-3" style={{ backgroundColor: p.canvasBg }} />
          <div className="h-1.5 w-3" style={{ backgroundColor: p.spineAccent }} />
        </div>

        <div className="flex max-h-full flex-1 items-center justify-center overflow-hidden py-4">
          <div
            className="max-h-full truncate whitespace-nowrap font-headline text-[15px] font-black uppercase tracking-[0.28em]"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              color: p.spineText,
            }}
          >
            {settings.name}
            {settings.hostName ? ` // ORG: ${settings.hostName}` : ''}
            {' // '}
            {matchHeaderSubtitle}
          </div>
        </div>

        <div className="relative flex w-full flex-col items-center pt-4">
          <div
            className="h-12 w-full"
            style={{
              backgroundColor: p.canvasBg,
              clipPath: 'polygon(0 28%, 100% 0, 100% 100%, 0 100%)',
            }}
          />
        </div>
      </aside>

      <div
        className={`relative z-20 flex min-w-0 flex-1 flex-col justify-between overflow-hidden ${
          isPortrait ? 'px-7 pt-7 pb-6' : 'px-12 pt-7 pb-6'
        }`}
      >
        <header className="relative flex w-full items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <div className="mb-2 flex w-full max-w-full flex-nowrap items-center gap-2.5 overflow-hidden whitespace-nowrap">
              <div
                className="max-w-[340px] shrink-0 overflow-hidden border px-3.5 py-0.5 text-white shadow-md"
                style={{
                  backgroundColor: p.kickerBg,
                  borderColor: p.canvasBg,
                  transform: 'skewX(-14deg)',
                }}
              >
                <span
                  className="block truncate whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.22em]"
                  style={{ color: p.kickerText, transform: 'skewX(14deg)' }}
                >
                  {settings.name}
                </span>
              </div>

              {settings.hostName && (
                <div
                  className="max-w-[290px] shrink-0 overflow-hidden border bg-white px-3 py-0.5 shadow-sm"
                  style={{
                    borderColor: p.canvasBg,
                    color: p.canvasBg,
                    transform: 'skewX(-14deg)',
                  }}
                >
                  <span
                    className="block truncate whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.18em]"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    ORGANIZER: {settings.hostName}
                  </span>
                </div>
              )}

              {settings.sponsorName && (
                <div
                  className="max-w-[260px] shrink-0 overflow-hidden border px-3 py-0.5 text-white shadow-sm"
                  style={{
                    backgroundColor: p.spineAccent,
                    borderColor: p.canvasBg,
                    transform: 'skewX(-14deg)',
                  }}
                >
                  <span
                    className="block truncate whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.18em]"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    SPONSOR: {settings.sponsorName}
                  </span>
                </div>
              )}
            </div>

            <h1
              className={`max-w-full truncate whitespace-nowrap font-headline font-black italic uppercase leading-[0.92] tracking-tight ${
                isPortrait ? 'text-[64px]' : 'text-[80px]'
              }`}
              style={{ color: p.headlineText, textShadow: p.headlineShadow }}
            >
              {mainHeadline}
            </h1>

            <div className="mt-2 flex max-w-full flex-nowrap items-center gap-3 whitespace-nowrap">
              <div
                className="shrink-0 border-l-4 px-7 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.55)]"
                style={{
                  backgroundColor: p.canvasBg,
                  borderLeftColor: p.subBannerBorder,
                  transform: 'skewX(-14deg)',
                }}
              >
                <span
                  className={`block whitespace-nowrap font-headline font-black italic uppercase tracking-[0.08em] ${
                    isPortrait ? 'text-2xl' : 'text-3xl'
                  }`}
                  style={{ color: p.subBannerText, transform: 'skewX(14deg)' }}
                >
                  {subBannerText}
                </span>
              </div>

              <div
                className="max-w-[400px] shrink overflow-hidden border-2 bg-white px-4 py-1.5"
                style={{
                  borderColor: p.subtitleBorder,
                  boxShadow: `4px 4px 0 ${p.subtitleBorder}`,
                  transform: 'skewX(-14deg)',
                }}
              >
                <span
                  className="block truncate whitespace-nowrap font-headline text-sm font-black uppercase tracking-[0.18em]"
                  style={{ color: p.canvasBg, transform: 'skewX(14deg)' }}
                >
                  {matchHeaderSubtitle}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {tournamentLogo ? (
              <div
                className={`relative flex items-center justify-center border-2 p-2 shadow-[6px_6px_0_#FFFFFF] ${
                  isPortrait ? 'h-20 w-24' : 'h-24 w-28'
                }`}
                style={{
                  backgroundColor: p.canvasBg,
                  borderColor: p.canvasBg,
                  transform: 'skewX(-12deg)',
                }}
              >
                <img
                  src={tournamentLogo}
                  alt={settings.name}
                  style={{ transform: 'skewX(12deg)' }}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center border-2 border-white ${
                  isPortrait ? 'h-20 w-24' : 'h-24 w-28'
                }`}
                style={{
                  backgroundColor: p.canvasBg,
                  boxShadow: `6px 6px 0 ${p.canvasBg}`,
                  transform: 'skewX(-12deg)',
                }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex flex-col items-center"
                >
                  <BroadcastCrownSvg className="h-8 w-8" color={p.kickerText} />
                  <span className="mt-0.5 font-headline text-lg font-black uppercase tracking-widest text-white">
                    {generateInitials(settings.name)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        <div
          className={`my-auto flex w-full ${
            showWinnerHero
              ? isPortrait
                ? 'flex-col items-center gap-5 pt-2'
                : 'flex-row items-center gap-10 pt-2'
              : 'flex-col pt-3'
          }`}
        >
          {showWinnerHero && championTeam && (
            <div
              className={
                isPortrait
                  ? 'flex w-full justify-center'
                  : 'flex w-[440px] shrink-0 justify-center'
              }
            >
              <BroadcastWinnerMonolith
                championTeam={championTeam}
                settings={settings}
                palette={p.monolith}
                compact={isPortrait}
              />
            </div>
          )}

          <div className="flex w-full min-w-0 flex-1 flex-col">
            <div className="mb-2 flex w-full items-center pr-2">
              <div
                className="w-14 shrink-0 pr-2 text-center font-headline text-xs font-black uppercase tracking-[0.18em]"
                style={{ color: p.rankHeaderText }}
              >
                RANK
              </div>

              <div
                className="flex h-10 flex-1 items-stretch overflow-hidden border-2 shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
                style={{
                  borderColor: p.canvasBg,
                  transform: 'skewX(-12deg)',
                }}
              >
                <div
                  className="flex min-w-0 flex-1 items-center overflow-hidden px-5"
                  style={{ background: p.tableHeaderBg }}
                >
                  <span
                    className="truncate whitespace-nowrap font-headline text-base font-black uppercase tracking-[0.14em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    style={{ transform: 'skewX(12deg)' }}
                  >
                    {isRush
                      ? isPortrait
                        ? 'CHAMPION RUSH STANDINGS'
                        : `CHAMPION RUSH STANDINGS // ${settings.name}`
                      : isPortrait
                        ? 'OFFICIAL TOURNAMENT STANDINGS'
                        : `OFFICIAL STANDINGS // ${settings.name}`}
                  </span>
                </div>

                <div
                  className={`grid shrink-0 items-center text-center font-headline text-xs font-black uppercase tracking-[0.12em] text-white ${
                    showWinnerHero && !isPortrait
                      ? 'w-[420px] grid-cols-4'
                      : isPortrait
                        ? 'w-[410px] grid-cols-4'
                        : 'w-[540px] grid-cols-4'
                  }`}
                  style={{ backgroundColor: p.canvasBg }}
                >
                  <span style={{ transform: 'skewX(12deg)' }}>BOOYAH!</span>
                  <span style={{ transform: 'skewX(12deg)' }}>ELIMS</span>
                  <span style={{ transform: 'skewX(12deg)' }}>
                    PLACEMENT PTS
                  </span>
                  <span
                    style={{ transform: 'skewX(12deg)', color: p.tableTotalText }}
                  >
                    TOTAL POINTS
                  </span>
                </div>
              </div>
            </div>

            <div className={`flex flex-col ${density.rowGapClass}`}>
              {standings.map((team, idx) => {
                const isTop1 = team.rank === 1;
                const isTop3 = team.rank <= 3;

                return (
                  <div
                    key={team.teamId}
                    className={`flex w-full items-stretch gap-2 pr-2 ${density.rowHeightClass}`}
                  >
                    <div
                      className="flex w-12 shrink-0 items-center justify-center border-2"
                      style={{
                        borderColor: isTop1
                          ? '#FFFFFF'
                          : isTop3
                            ? p.rowTop1Border
                            : p.rowRestRankBorder,
                        backgroundColor: isTop1
                          ? p.rowTop1RankBg
                          : isTop3
                            ? p.rowTop3RankBg
                            : p.rowRestRankBg,
                        color: isTop1
                          ? p.rowTop1RankText
                          : isTop3
                            ? p.rowTop3RankText
                            : '#FFFFFF',
                        boxShadow: isTop1 ? `0 0 16px ${p.rowTop1Glow}` : undefined,
                        transform: 'skewX(-12deg)',
                      }}
                    >
                      <span
                        style={{ transform: 'skewX(12deg)' }}
                        className={`font-headline font-black italic leading-none ${density.rankTextClass}`}
                      >
                        #{team.rank}
                      </span>
                    </div>

                    <div
                      className="flex h-full flex-1 items-stretch overflow-hidden border-2"
                      style={{
                        borderColor: isTop1 ? p.rowTop1Border : p.canvasBg,
                        boxShadow: isTop1
                          ? `0 6px 20px ${p.rowTop1Glow}`
                          : '0 5px 14px rgba(0,0,0,0.65)',
                        transform: 'skewX(-12deg)',
                      }}
                    >
                      {settings.showLogos !== false && (
                        <div
                          className="flex w-14 shrink-0 items-center justify-center border-r-2"
                          style={{
                            borderRightColor: p.canvasBg,
                            backgroundColor: p.totalRestBg,
                          }}
                        >
                          <div
                            style={{ transform: 'skewX(12deg)' }}
                            className={`flex items-center justify-center ${density.logoSizeClass}`}
                          >
                            {team.logoUrl ? (
                              <img
                                src={team.logoUrl}
                                alt={team.teamName}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span
                                className={`font-headline font-black uppercase tracking-wider ${density.tagTextClass}`}
                                style={{ color: p.logoTagText }}
                              >
                                {resolveTeamTag(team, idx)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div
                        className="flex min-w-0 flex-1 items-center justify-between overflow-hidden px-5"
                        style={{
                          background: isTop1
                            ? p.plateTop1Bg
                            : isTop3
                              ? p.plateTop3Bg
                              : p.plateRestBg,
                        }}
                      >
                        <div
                          style={{ transform: 'skewX(12deg)' }}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <span
                            className={`truncate font-headline font-black uppercase tracking-wide ${density.nameTextClass}`}
                            style={{ color: p.canvasBg }}
                          >
                            {team.teamName}
                          </span>
                        </div>

                        {isRush && (
                          <div
                            style={{ transform: 'skewX(12deg)' }}
                            className="ml-2 shrink-0"
                          >
                            <BroadcastRushCrownCircle
                              status={team.rushStatus.status}
                              champBg={p.rowTop1RankBg}
                              champBorder={p.canvasBg}
                              champIcon={p.rowTop1RankText}
                              size={isPortrait && showWinnerHero ? 'sm' : 'md'}
                            />
                          </div>
                        )}
                      </div>

                      <div
                        className={`grid shrink-0 items-center border-l-2 text-center font-headline font-black ${
                          showWinnerHero && !isPortrait
                            ? 'w-[420px] grid-cols-4'
                            : isPortrait
                              ? 'w-[410px] grid-cols-4'
                              : 'w-[540px] grid-cols-4'
                        }`}
                        style={{
                          borderLeftColor: p.canvasBg,
                          color: p.canvasBg,
                          background: isTop1 ? p.statsTop1Bg : p.statsRestBg,
                        }}
                      >
                        <div className="relative flex h-full items-center justify-center">
                          <span
                            style={{ transform: 'skewX(12deg)' }}
                            className={density.statTextClass}
                          >
                            {team.booyahCount}
                          </span>
                          <span
                            className="absolute right-0 top-1/4 h-1/2 w-[2px]"
                            style={{ backgroundColor: 'rgba(0,0,0,0.28)' }}
                          />
                        </div>

                        <div className="relative flex h-full items-center justify-center">
                          <span
                            style={{ transform: 'skewX(12deg)' }}
                            className={density.statTextClass}
                          >
                            {team.killPoints}
                          </span>
                          <span
                            className="absolute right-0 top-1/4 h-1/2 w-[2px]"
                            style={{ backgroundColor: 'rgba(0,0,0,0.28)' }}
                          />
                        </div>

                        <div className="relative flex h-full items-center justify-center">
                          <span
                            style={{ transform: 'skewX(12deg)' }}
                            className={density.statTextClass}
                          >
                            {team.placementPoints}
                          </span>
                        </div>

                        <div
                          className="flex h-full items-center justify-center border-l-2"
                          style={{
                            borderLeftColor: p.canvasBg,
                            backgroundColor: isTop1
                              ? p.totalTop1Bg
                              : p.totalRestBg,
                            color: isTop1 ? p.totalTop1Text : '#FFFFFF',
                          }}
                        >
                          <span
                            style={{ transform: 'skewX(12deg)' }}
                            className={`font-black ${density.totalTextClass}`}
                          >
                            {team.totalPoints}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="mt-3 flex items-center justify-between gap-4 pt-1">
          {isRush ? (
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-2.5 border px-4 py-1.5 shadow-md"
                style={{
                  borderColor: p.rowTop1Border,
                  backgroundColor: p.totalRestBg,
                  transform: 'skewX(-12deg)',
                }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex items-center gap-2.5"
                >
                  <BroadcastRushCrownCircle
                    status="CHAMPION"
                    champBg={p.rowTop1RankBg}
                    champBorder={p.canvasBg}
                    champIcon={p.rowTop1RankText}
                    size="sm"
                  />
                  <span
                    className="font-headline text-xs font-black uppercase tracking-[0.16em]"
                    style={{ color: p.footerText }}
                  >
                    WON BY CHAMPION RUSH
                  </span>
                </div>
              </div>

              <div
                className="flex items-center gap-2.5 border border-white/30 px-4 py-1.5 shadow-md"
                style={{
                  backgroundColor: p.totalRestBg,
                  transform: 'skewX(-12deg)',
                }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex items-center gap-2.5"
                >
                  <BroadcastRushCrownCircle status="ACTIVE" size="sm" />
                  <span className="font-headline text-xs font-black uppercase tracking-[0.16em] text-white/90">
                    SATISFIED CHAMPION RUSH CONDITION
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
              <div
                className="h-2 w-2 shrink-0"
                style={{ backgroundColor: p.rowTop1Border }}
              />
              <span
                className="truncate whitespace-nowrap font-headline text-xs font-bold uppercase tracking-[0.22em]"
                style={{ color: p.footerText }}
              >
                {settings.name}
                {settings.hostName ? ` • HOSTED BY ${settings.hostName}` : ''}
                {settings.sponsorName
                  ? ` • POWERED BY ${settings.sponsorName}`
                  : ''}
              </span>
            </div>
          )}

          <div
            className="shrink-0 border px-4 py-1"
            style={{
              borderColor: p.footerPillBorder,
              backgroundColor: p.canvasBg,
              transform: 'skewX(-12deg)',
            }}
          >
            <span
              className="block whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.22em]"
              style={{ color: p.footerText, transform: 'skewX(12deg)' }}
            >
              ESPCALC BROADCAST • MADE BY MR. OPPY
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
