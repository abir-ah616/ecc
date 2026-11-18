import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastWinnerMonolith,
  BroadcastCrosshairIcon,
  BroadcastLayersIcon,
  BroadcastRushCrownCircle,
  type WinnerMonolithPalette,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';
import {
  buildHeadlineParts,
  fitHeadlinePx,
  getTableDensity,
  resolveTeamTag,
  splitEventNameAccent,
} from './themeHelpers';

const WHITEOUT_WINNER_PALETTE: WinnerMonolithPalette = {
  outerBorder:
    'linear-gradient(135deg, #111318 0%, #DC142C 55%, #111318 100%)',
  cornerWedge: '#DC142C',
  headerBg: 'linear-gradient(90deg, #991B1B 0%, #DC142C 50%, #991B1B 100%)',
  headerText: '#FFFFFF',
  chamberBg: 'linear-gradient(180deg, #FFFFFF 0%, #E5E8EE 100%)',
  crownColor: '#DC142C',
  initialsColor: '#111318',
  bladeBg: 'linear-gradient(90deg, #111318 0%, #1F2430 100%)',
  bladeText: '#FFFFFF',
  statTextColor: '#111318',
  subStatBg: '#14161B',
  subStatBorder: 'rgba(220, 20, 44, 0.55)',
  subStatLabel: '#E2E8F0',
  glowColor: 'rgba(220, 20, 44, 0.25)',
};

export const ThemeWhiteoutPro: React.FC<GraphicThemeProps> = ({
  settings,
  standings,
  isPortrait,
  isFinalResult,
  championTeam,
  matchHeaderSubtitle,
}) => {
  const isRush = settings.mode === 'CHAMPION_RUSH';
  const showLogos = settings.showLogos !== false;
  const tournamentLogo = settings.customLogoUrl;
  const showWinnerHero = isFinalResult && Boolean(championTeam);
  const headline = buildHeadlineParts(settings);
  const eventAccent = splitEventNameAccent(settings.name);
  const density = getTableDensity(
    standings.length,
    isPortrait,
    isPortrait && showWinnerHero
  );
  const hostText = settings.hostName?.trim().toUpperCase();
  const sponsorText = settings.sponsorName?.trim().toUpperCase();

  const stackTopPx = fitHeadlinePx(
    headline.whiteoutTop,
    isPortrait ? 68 : 66,
    12,
    36
  );
  const stackBottomPx = fitHeadlinePx(
    headline.whiteoutBottom,
    isPortrait ? 68 : 66,
    12,
    36
  );

  const statsBlockWidth =
    !isPortrait && showWinnerHero
      ? 'w-[270px]'
      : isPortrait
        ? 'w-[292px]'
        : 'w-[360px]';
  const totalBlockWidth =
    !isPortrait && showWinnerHero
      ? 'w-[108px]'
      : isPortrait
        ? 'w-[120px]'
        : 'w-[140px]';

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#F1F3F6] text-[#111318] select-none">
      {/* 1. CRISP LIGHT STUDIO GEOMETRIC BACKDROP */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="whiteout-base" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F8F9FB" />
            <stop offset="60%" stopColor="#ECEEF3" />
            <stop offset="100%" stopColor="#E1E4EB" />
          </linearGradient>
          <linearGradient id="whiteout-red-slice" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E11D38" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#whiteout-base)" />

        <polygon
          points={
            isPortrait
              ? '340,0 740,0 440,340 40,340'
              : '520,0 1080,0 740,560 180,560'
          }
          fill="rgba(255, 255, 255, 0.55)"
        />
        <polygon
          points={
            isPortrait
              ? '720,0 1080,0 1080,450 540,450'
              : '1320,0 1920,0 1920,560 1040,560'
          }
          fill="rgba(226, 232, 240, 0.45)"
        />

        <polygon
          points={
            isPortrait
              ? '610,0 755,0 645,140 500,140'
              : '1120,0 1280,0 1160,150 1000,150'
          }
          fill="none"
          stroke="rgba(148, 163, 184, 0.35)"
          strokeWidth="2"
        />
        <polygon
          points={
            isPortrait
              ? '875,0 955,0 910,55 830,55'
              : '1580,0 1680,0 1630,60 1530,60'
          }
          fill="url(#whiteout-red-slice)"
        />

        <line
          x1={isPortrait ? '995' : '1835'}
          y1="26"
          x2={isPortrait ? '1058' : '1896'}
          y2="26"
          stroke="#111318"
          strokeWidth="2"
        />
        <line
          x1={isPortrait ? '1058' : '1896'}
          y1="26"
          x2={isPortrait ? '1058' : '1896'}
          y2="92"
          stroke="#111318"
          strokeWidth="2"
        />

        <polygon
          points={
            isPortrait
              ? '1020,1220 1056,1220 1056,1184'
              : '1860,960 1896,960 1896,924'
          }
          fill="#DC142C"
        />
      </svg>

      {/* 2. LEFT TECHNICAL REGISTRATION SPINE RAIL */}
      <aside className="relative z-20 flex h-full w-[34px] shrink-0 flex-col items-center justify-between py-6">
        <div className="flex flex-col items-center gap-1.5 text-[9px] font-bold leading-none text-slate-400">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i}>×</span>
          ))}
          <div className="mt-1 h-2 w-2 bg-[#111318]" />
        </div>

        <div className="flex max-h-full flex-1 items-center justify-center overflow-hidden py-4">
          <div
            className="max-h-full truncate whitespace-nowrap font-headline text-[12px] font-black italic uppercase tracking-[0.22em] text-[#111318]"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
            }}
          >
            {settings.name}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="h-1.5 w-1.5 bg-slate-400" />
          <div className="h-14 w-[5px] bg-[#DC142C]" />
          <div className="h-1.5 w-1.5 bg-slate-400" />
        </div>
      </aside>

      {/* 3. MAIN EDITORIAL STAGE (Always Top Header -> Middle Stage -> Carbon Footer) */}
      <div
        className={`relative z-20 flex min-w-0 flex-1 flex-col justify-between overflow-hidden ${
          isPortrait ? 'pr-7 pl-2 pt-5 pb-4' : 'pr-9 pl-3 pt-4 pb-4'
        }`}
      >
        {/* TOP FULL-WIDTH EDITORIAL HEADER LOCKUP */}
        <header className="relative w-full">
          {/* Metadata Row */}
          <div className="mb-1.5 flex w-full max-w-full flex-nowrap items-center gap-2.5 overflow-hidden whitespace-nowrap pr-24">
            <svg
              viewBox="0 0 12 12"
              className="h-2.5 w-2.5 shrink-0 fill-[#DC142C]"
            >
              <polygon points="1,1 11,6 1,11" />
            </svg>
            <span className="max-w-[340px] shrink truncate font-headline text-[13.5px] font-black italic uppercase tracking-[0.1em] text-[#111318]">
              {eventAccent.base}
              {eventAccent.accent && (
                <span className="text-[#DC142C]"> {eventAccent.accent}</span>
              )}
            </span>
            {hostText && (
              <>
                <span className="shrink-0 text-slate-400">|</span>
                <span className="max-w-[270px] shrink truncate font-headline text-[13.5px] font-bold italic uppercase tracking-[0.1em] text-slate-700">
                  ORGANIZER: {hostText}
                </span>
              </>
            )}
            {sponsorText && (
              <>
                <span className="shrink-0 text-slate-400">|</span>
                <span className="max-w-[250px] shrink truncate font-headline text-[13.5px] font-bold italic uppercase tracking-[0.1em] text-slate-700">
                  SPONSOR: {sponsorText}
                </span>
              </>
            )}
          </div>

          {/* Main Header Flex: Stacked Headline + Mode Module + Top-Right Emblem */}
          <div className="flex w-full items-end justify-between gap-6">
            {/* Left Headline Block */}
            <div className="min-w-0 flex-1">
              <div className="relative flex items-center gap-3">
                <div className="relative z-10 flex min-w-0 flex-col">
                  <h1
                    className="max-w-full truncate font-headline font-black italic uppercase leading-[0.84] tracking-tight text-[#111318]"
                    style={{ fontSize: `${stackTopPx}px` }}
                  >
                    {headline.whiteoutTop}
                  </h1>
                  <h2
                    className="max-w-full truncate font-headline font-black italic uppercase leading-[0.84] tracking-tight text-[#111318]"
                    style={{ fontSize: `${stackBottomPx}px` }}
                  >
                    {headline.whiteoutBottom}
                  </h2>
                </div>

                {/* Hollow Vector Watermark (Cleanly Constrained) */}
                <svg
                  aria-hidden="true"
                  className="pointer-events-none h-[116px] w-[190px] shrink-0 overflow-visible"
                  viewBox="0 0 190 116"
                >
                  <text
                    x="4"
                    y="100"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.42)"
                    strokeWidth="2.5"
                    fontFamily="'Barlow Condensed', 'Oswald', sans-serif"
                    fontWeight="900"
                    fontStyle="italic"
                    fontSize="120"
                    letterSpacing="-3"
                  >
                    {headline.watermark.slice(0, 4)}
                  </text>
                </svg>
              </div>

              {/* Crimson STANDINGS Ribbon + //// Slashes + Connected Mode Bar */}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex shrink-0 items-center gap-2">
                  <div
                    className="inline-flex items-center bg-[#DC142C] px-7 py-1 shadow-sm"
                    style={{ transform: 'skewX(-16deg)' }}
                  >
                    <span
                      className="font-headline text-[23px] font-black italic uppercase leading-none tracking-[0.26em] text-white"
                      style={{ transform: 'skewX(16deg)' }}
                    >
                      STANDINGS
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((bar) => (
                      <span
                        key={bar}
                        className="block h-[27px] w-[8px] bg-[#DC142C]"
                        style={{ transform: 'skewX(-16deg)' }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex max-w-full flex-nowrap items-stretch">
                  <div
                    className="shrink-0 bg-[#111318] px-5 py-1 shadow-sm"
                    style={{ transform: 'skewX(-16deg)' }}
                  >
                    <span
                      className="block font-headline text-[15px] font-black italic uppercase tracking-[0.1em] text-white"
                      style={{ transform: 'skewX(16deg)' }}
                    >
                      {isRush ? 'CHAMPION RUSH' : 'CLASSIC SCRIM'}
                    </span>
                  </div>
                  <div
                    className="-ml-[1px] max-w-[360px] shrink overflow-hidden border border-[#111318]/30 bg-white/85 px-5 py-1"
                    style={{ transform: 'skewX(-16deg)' }}
                  >
                    <span
                      className="block truncate font-headline text-[15px] font-bold italic uppercase tracking-[0.1em] text-[#111318]"
                      style={{ transform: 'skewX(16deg)' }}
                    >
                      {matchHeaderSubtitle}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Header Column: Dark Carbon Stage Module + Top-Right Emblem */}
            <div className="flex shrink-0 flex-col items-end justify-between gap-3">
              {/* Top-Right Crown / Custom Logo */}
              <div className="flex flex-col items-center justify-center pr-2">
                {tournamentLogo ? (
                  <img
                    src={tournamentLogo}
                    alt={settings.name}
                    className="h-14 w-14 object-contain drop-shadow-[0_4px_10px_rgba(15,23,42,0.18)]"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <BroadcastCrownSvg
                      className="h-7 w-8"
                      color="#DC142C"
                      strokeWidth={2.5}
                    />
                    <span className="mt-0.5 font-headline text-[21px] font-black italic uppercase leading-none tracking-wider text-[#111318]">
                      {generateInitials(settings.name)}
                    </span>
                  </div>
                )}
              </div>

              {/* Dark Carbon Architectural Module (Stage/Format Readout — No Target Score Box) */}
              {(!isPortrait || !showWinnerHero) && (
                <div
                  className="relative w-[360px] shrink-0 overflow-hidden bg-[#14161B] px-6 py-3.5 text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]"
                  style={{
                    clipPath:
                      'polygon(16px 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%, 0 16px)',
                  }}
                >
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
                    viewBox="0 0 360 90"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 70 L85 70 L115 40 L220 40 L250 14 L360 14 M135 84 L195 84 L228 52 L360 52"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="1.2"
                    />
                  </svg>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-0 h-full w-2.5 bg-[#DC142C]"
                    style={{
                      clipPath: 'polygon(0 58%, 100% 28%, 100% 100%, 0 100%)',
                    }}
                  />

                  <div className="relative z-10 flex items-center justify-between gap-4 pl-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-[3px] shrink-0 bg-[#DC142C]" />
                        <span className="truncate font-headline text-[20px] font-black italic uppercase tracking-[0.06em] text-white">
                          {isRush ? 'CHAMPION RUSH' : 'OFFICIAL STANDINGS'}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate font-headline text-[13px] font-bold italic uppercase tracking-[0.08em] text-slate-400">
                        {isRush
                          ? matchHeaderSubtitle
                          : `${settings.totalMatchesPlanned} SCHEDULED MATCHES`}
                      </div>
                    </div>

                    <div className="shrink-0 font-headline text-2xl font-black italic tracking-tighter text-slate-500">
                      &gt;&gt;&gt;
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MIDDLE CONTENT STAGE: Full-Width Table (Live) OR Winner Monolith + Table (Ended) */}
        <div
          className={`my-auto flex w-full ${
            showWinnerHero
              ? isPortrait
                ? 'flex-col items-center gap-4 pt-2'
                : 'flex-row items-center gap-8 pt-2'
              : 'flex-col pt-3'
          }`}
        >
          {showWinnerHero && championTeam && (
            <div
              className={
                isPortrait
                  ? 'flex w-full justify-center'
                  : 'flex w-[430px] shrink-0 justify-center'
              }
            >
              <BroadcastWinnerMonolith
                championTeam={championTeam}
                settings={settings}
                palette={WHITEOUT_WINNER_PALETTE}
                compact={isPortrait}
              />
            </div>
          )}

          {/* CONTAINED FROST-WHITE SCOREBOARD CHASSIS */}
          <div className="relative flex w-full min-w-0 flex-1 flex-col justify-center">
            <div className="relative flex flex-col rounded-[18px] border-2 border-white bg-[#EAECEF]/95 p-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
              {/* Table Header Bar */}
              <div className="mb-2 flex items-center px-1.5">
                <div className="flex min-w-0 flex-1 items-center">
                  <span className="w-[62px] shrink-0 text-center font-headline text-[16px] font-black italic uppercase text-[#111318]">
                    #
                  </span>
                  <span className="pl-2 font-headline text-[16px] font-black italic uppercase tracking-wide text-[#111318]">
                    TEAM
                  </span>
                </div>

                {/* Dark Carbon Column Header Icons Block */}
                <div
                  className={`grid ${statsBlockWidth} shrink-0 grid-cols-3 items-center bg-[#14161B] py-1.5 text-center text-white`}
                  style={{ transform: 'skewX(-14deg)' }}
                >
                  <div
                    className="flex items-center justify-center gap-1"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    <BroadcastCrownSvg
                      className="h-3.5 w-3.5"
                      color="#F59E0B"
                      strokeWidth={2.5}
                    />
                    <span className="font-headline text-[12px] font-black italic uppercase tracking-wider">
                      BOOYAH!
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-center gap-1"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    <BroadcastCrosshairIcon
                      className="h-3.5 w-3.5"
                      color="#E2E8F0"
                    />
                    <span className="font-headline text-[12px] font-black italic uppercase tracking-wider">
                      ELIMS
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-center gap-1"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    <BroadcastLayersIcon
                      className="h-3.5 w-3.5"
                      color="#E2E8F0"
                    />
                    <span className="font-headline text-[12px] font-black italic uppercase tracking-wider">
                      PLACEMENT
                    </span>
                  </div>
                </div>

                {/* Far-Right Crimson Total Pts Header */}
                <div
                  className={`flex ${totalBlockWidth} shrink-0 items-center justify-center bg-[#DC142C] py-1.5 text-white`}
                  style={{ transform: 'skewX(-14deg)' }}
                >
                  <span
                    className="font-headline text-[13px] font-black italic uppercase tracking-wider"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    TOTAL PTS
                  </span>
                </div>
              </div>

              {/* Podium + Field Rows */}
              <div className={`flex flex-col ${density.rowGapClass} px-1.5`}>
                {standings.map((team, idx) => {
                  const isTop3 = team.rank <= 3;
                  const tag = resolveTeamTag(team, idx);

                  return (
                    <div
                      key={team.teamId}
                      className={`relative flex w-full items-stretch bg-white shadow-[0_2px_7px_rgba(15,23,42,0.06)] ${density.rowHeightClass}`}
                      style={{
                        borderBottom: '1px solid rgba(203, 213, 225, 0.8)',
                      }}
                    >
                      {/* 1. Skewed Rank Pill */}
                      <div
                        className="flex w-[62px] shrink-0 items-center justify-center"
                        style={{
                          transform: 'skewX(-14deg)',
                          background: isTop3
                            ? 'linear-gradient(180deg, #E11D38 0%, #B91C1C 100%)'
                            : 'linear-gradient(180deg, #1E2028 0%, #0D0E12 100%)',
                        }}
                      >
                        <span
                          className={`font-headline font-black italic leading-none text-white ${density.rankTextClass}`}
                          style={{ transform: 'skewX(14deg)' }}
                        >
                          {team.rank}
                        </span>
                      </div>

                      {/* 2. White Team Plate (/ T1 TEAM 1) */}
                      <div className="flex min-w-0 flex-1 items-center justify-between overflow-hidden px-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
                          <span className="shrink-0 font-headline text-lg font-bold italic text-slate-300">
                            /
                          </span>
                          {showLogos && (
                            <>
                              {team.logoUrl ? (
                                <img
                                  src={team.logoUrl}
                                  alt={team.teamName}
                                  className={`shrink-0 rounded-sm object-contain ${density.logoSizeClass}`}
                                />
                              ) : (
                                <span
                                  className={`shrink-0 font-headline font-bold italic uppercase text-slate-500 ${density.tagTextClass}`}
                                >
                                  {tag}
                                </span>
                              )}
                            </>
                          )}
                          <span
                            className={`truncate font-headline font-black italic uppercase tracking-[0.02em] text-[#111318] ${density.nameTextClass}`}
                          >
                            {team.teamName}
                          </span>
                        </div>

                        {/* Champion Rush Status Badge (Winner Crown / Activated Greyed Crown / Unactivated Empty Box) */}
                        {isRush && (
                          <div className="ml-2 shrink-0">
                            <BroadcastRushCrownCircle
                              status={team.rushStatus.status}
                              size={
                                isPortrait && showWinnerHero ? 'sm' : 'md'
                              }
                              shape="box"
                              champBg="#DC142C"
                              champBorder="#111318"
                              champIcon="#FFFFFF"
                              activeBg="#52525B"
                              activeBorder="#3F3F46"
                              activeIcon="#E4E4E7"
                              inactiveBg="#F1F5F9"
                              inactiveBorder="#94A3B8"
                            />
                          </div>
                        )}
                      </div>

                      {/* 3. Dark Charcoal Stats Trapezoid */}
                      <div
                        className={`grid ${statsBlockWidth} shrink-0 grid-cols-3 items-center bg-[#14161B] font-headline font-black italic text-white`}
                        style={{ transform: 'skewX(-14deg)' }}
                      >
                        <div className="relative flex items-center justify-center">
                          <span
                            className={density.statTextClass}
                            style={{ transform: 'skewX(14deg)' }}
                          >
                            {team.booyahCount}
                          </span>
                          <span
                            className="absolute right-0 text-base font-normal text-slate-500"
                            style={{ transform: 'skewX(14deg)' }}
                          >
                            /
                          </span>
                        </div>
                        <div className="relative flex items-center justify-center">
                          <span
                            className={density.statTextClass}
                            style={{ transform: 'skewX(14deg)' }}
                          >
                            {team.killPoints}
                          </span>
                          <span
                            className="absolute right-0 text-base font-normal text-slate-500"
                            style={{ transform: 'skewX(14deg)' }}
                          >
                            /
                          </span>
                        </div>
                        <div className="flex items-center justify-center">
                          <span
                            className={density.statTextClass}
                            style={{ transform: 'skewX(14deg)' }}
                          >
                            {team.placementPoints}
                          </span>
                        </div>
                      </div>

                      {/* 4. Right Total Points Block (Top 3 Crimson | 4+ Platinum Silver) */}
                      <div
                        className={`flex ${totalBlockWidth} shrink-0 items-center justify-center`}
                        style={{
                          transform: 'skewX(-14deg)',
                          background: isTop3
                            ? 'linear-gradient(180deg, #E11D38 0%, #B91C1C 100%)'
                            : 'linear-gradient(180deg, #D9DDE4 0%, #C5CAD4 100%)',
                        }}
                      >
                        <span
                          className={`font-headline font-black italic leading-none ${density.totalTextClass} ${
                            isTop3 ? 'text-white' : 'text-[#374151]'
                          }`}
                          style={{ transform: 'skewX(14deg)' }}
                        >
                          {team.totalPoints}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM DARK CARBON ANCHOR FOOTER */}
        <footer
          className="mt-2.5 flex items-center justify-between gap-4 bg-[#111318] px-5 py-2 text-white shadow-[0_8px_22px_rgba(15,23,42,0.18)]"
          style={{
            clipPath:
              'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
          }}
        >
          {isRush ? (
            <div className="flex min-w-0 flex-nowrap items-center gap-5 overflow-hidden whitespace-nowrap">
              <div className="flex shrink-0 items-center gap-2 border-l-2 border-[#DC142C] pl-3">
                <BroadcastRushCrownCircle
                  status="CHAMPION"
                  size="sm"
                  shape="box"
                  champBg="#DC142C"
                  champBorder="#FFFFFF"
                  champIcon="#FFFFFF"
                />
                <span className="font-headline text-[12px] font-black italic uppercase tracking-[0.09em] text-slate-100">
                  WON BY CHAMPION RUSH
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2 border-l border-white/15 pl-4">
                <BroadcastRushCrownCircle
                  status="ACTIVE"
                  size="sm"
                  shape="box"
                  activeBg="#52525B"
                  activeBorder="#A1A1AA"
                  activeIcon="#E4E4E7"
                />
                <span className="font-headline text-[12px] font-black italic uppercase tracking-[0.09em] text-slate-100">
                  SATISFIED CHAMPION RUSH CONDITION
                </span>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
              <span className="h-2.5 w-1 shrink-0 bg-[#DC142C]" />
              <span className="truncate whitespace-nowrap font-headline text-xs font-bold italic uppercase tracking-[0.18em] text-slate-300">
                {settings.name}
                {hostText ? ` • HOSTED BY ${hostText}` : ''}
                {sponsorText ? ` • POWERED BY ${sponsorText}` : ''}
              </span>
            </div>
          )}

          <div
            className="shrink-0 bg-[#DC142C] px-5 py-1 shadow-md"
            style={{ transform: 'skewX(-14deg)' }}
          >
            <div
              className="whitespace-nowrap font-headline text-[12.5px] font-black italic uppercase tracking-[0.12em] text-white"
              style={{ transform: 'skewX(14deg)' }}
            >
              ESPCALC BROADCAST &bull; MADE BY MR. OPPY
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
