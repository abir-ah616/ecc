import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';

export const ThemeArcticCyan: React.FC<GraphicThemeProps> = ({
  settings,
  standings,
  isPortrait,
  isFinalResult,
  championTeam,
  matchHeaderSubtitle,
}) => {
  const isRush = settings.mode === 'CHAMPION_RUSH';
  const rushTarget = settings.championRush?.targetPoints ?? 80;
  const tournamentLogo = settings.customLogoUrl;
  const showWinnerHero = isFinalResult && !!championTeam;

  const mainHeadline = settings.roundOrDay
    ? `${settings.roundOrDay} STANDINGS`
    : 'GRAND FINALS STANDINGS';

  const subBannerText = isRush ? 'CHAMPION RUSH' : 'BATTLE ROYALE STANDINGS';

  const winnerPalette = {
    outerBorder: 'linear-gradient(135deg, #00F0FF 0%, #0284C7 55%, #0F172A 100%)',
    cornerWedge: '#FFFFFF',
    headerBg: 'linear-gradient(90deg, #0369A1 0%, #06B6D4 50%, #0369A1 100%)',
    headerText: '#FFFFFF',
    chamberBg: 'linear-gradient(180deg, #061826 0%, #030911 100%)',
    crownColor: '#00F0FF',
    initialsColor: '#00F0FF',
    bladeBg: 'linear-gradient(90deg, #67E8F9 0%, #00F0FF 55%, #06B6D4 100%)',
    bladeText: '#040A14',
    statTextColor: '#67E8F9',
    subStatBg: 'rgba(4, 12, 22, 0.94)',
    subStatBorder: 'rgba(6, 182, 212, 0.5)',
    subStatLabel: '#A5F3FC',
    glowColor: 'rgba(0, 240, 255, 0.55)',
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#040A14] text-white select-none">
      {/* 1. BACKGROUND LAYER: Electric Arctic Cyan Top Wash + Halftone Matrix + Diagonal Horizon Cut */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #00F0FF 0%, #06B6D4 14%, #0284C7 24%, #07192B 38%, #040A14 100%)',
        }}
      />

      {/* Custom SVG Glacial Vector Shards, Halftone Grid & Horizon Line */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="arctic-halftone"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.5" fill="rgba(4, 10, 20, 0.18)" />
          </pattern>
          <linearGradient id="arctic-beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
          <linearGradient id="arctic-cobalt-wing" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(2, 132, 199, 0.35)" />
            <stop offset="100%" stopColor="rgba(0, 240, 255, 0.08)" />
          </linearGradient>
        </defs>

        {/* Top Halftone Texture */}
        <rect width="100%" height="32%" fill="url(#arctic-halftone)" />

        {/* Diagonal Ice-Light Speed Blades */}
        <polygon
          points={
            isPortrait
              ? '620,0 1080,0 1080,480 360,480'
              : '1080,0 1920,0 1920,520 760,520'
          }
          fill="url(#arctic-beam)"
        />
        <polygon
          points={
            isPortrait
              ? '0,0 340,0 120,320 0,320'
              : '0,0 520,0 240,280 0,280'
          }
          fill="url(#arctic-cobalt-wing)"
        />

        {/* Deep Abyssal Navy Lower Stage Cut */}
        <polygon
          points={
            isPortrait
              ? '0,360 1080,235 1080,1350 0,1350'
              : '0,255 1920,175 1920,1080 0,1080'
          }
          fill="rgba(4, 10, 20, 0.95)"
        />

        {/* Secondary Razor Accent Line */}
        <line
          x1="0"
          y1={isPortrait ? '352' : '247'}
          x2={isPortrait ? '1080' : '1920'}
          y2={isPortrait ? '227' : '167'}
          stroke="rgba(4, 10, 20, 0.5)"
          strokeWidth="2"
        />

        {/* Crisp Electric Cyan Horizon Line */}
        <line
          x1="0"
          y1={isPortrait ? '360' : '255'}
          x2={isPortrait ? '1080' : '1920'}
          y2={isPortrait ? '235' : '175'}
          stroke="#00F0FF"
          strokeWidth="4"
        />
      </svg>

      {/* 2. MAIN STAGE CANVAS */}
      <div
        className={`relative z-20 flex min-w-0 flex-1 flex-col justify-between overflow-hidden ${
          isPortrait ? 'px-7 pt-7 pb-6' : 'px-12 pt-7 pb-6'
        }`}
      >
        {/* TOP BROADCAST HEADER LOCKUP */}
        <header className="relative flex w-full items-start justify-between gap-6">
          {/* Left: Skewed Kicker Badges + Giant Pitch-Navy Italic Headline + Sub-Banners */}
          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* Top Organizer & Stage Kicker Plate (Strictly Single-Line No-Wrap for PNG Export) */}
            <div className="mb-2 flex w-full flex-nowrap items-center gap-2.5 whitespace-nowrap">
              <div
                className="shrink-0 border border-[#040A14] bg-[#040A14] px-3.5 py-0.5 text-white shadow-md"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className="block whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.22em] text-[#00F0FF]"
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {settings.name}
                </span>
              </div>

              {settings.hostName && (
                <div
                  className="shrink-0 border border-[#040A14] bg-white px-3 py-0.5 text-[#040A14] shadow-sm"
                  style={{ transform: 'skewX(-14deg)' }}
                >
                  <span
                    className="block whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.18em]"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    ORGANIZER: {settings.hostName}
                  </span>
                </div>
              )}

              {settings.sponsorName && (
                <div
                  className="shrink-0 border border-[#040A14] bg-[#0369A1] px-3 py-0.5 text-white shadow-sm"
                  style={{ transform: 'skewX(-14deg)' }}
                >
                  <span
                    className="block whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.18em]"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    SPONSOR: {settings.sponsorName}
                  </span>
                </div>
              )}
            </div>

            {/* Massive Pitch-Navy Italic Display Headline */}
            <h1
              className={`whitespace-nowrap font-headline font-black italic uppercase leading-[0.92] tracking-tight text-[#040A14] drop-shadow-[0_2px_0_rgba(255,255,255,0.45)] ${
                isPortrait ? 'text-[64px]' : 'text-[80px]'
              }`}
            >
              {mainHeadline}
            </h1>

            {/* Solid Pitch-Navy Skewed Parallelogram Banner + Ice-White Subtitle Plate */}
            <div className="mt-2 flex flex-nowrap items-center gap-3 whitespace-nowrap">
              <div
                className="shrink-0 border-l-4 border-[#FFFFFF] bg-[#040A14] px-7 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.55)]"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className={`block whitespace-nowrap font-headline font-black italic uppercase tracking-[0.08em] text-[#00F0FF] ${
                    isPortrait ? 'text-2xl' : 'text-3xl'
                  }`}
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {subBannerText}
                </span>
              </div>

              <div
                className="shrink-0 border-2 border-[#040A14] bg-[#FFFFFF] px-4 py-1.5 shadow-[4px_4px_0_#040A14]"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className="block whitespace-nowrap font-headline text-sm font-black uppercase tracking-[0.18em] text-[#040A14]"
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {matchHeaderSubtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Hard-Shadow Glacial Emblem Stamp */}
          <div className="flex items-center gap-4">
            {tournamentLogo ? (
              <div
                className={`relative flex items-center justify-center border-2 border-[#040A14] bg-[#040A14] p-2 shadow-[6px_6px_0_#FFFFFF] ${
                  isPortrait ? 'h-20 w-24' : 'h-24 w-28'
                }`}
                style={{ transform: 'skewX(-12deg)' }}
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
                className={`flex flex-col items-center justify-center border-2 border-white bg-[#040A14] text-[#00F0FF] shadow-[6px_6px_0_#040A14] ${
                  isPortrait ? 'h-20 w-24' : 'h-24 w-28'
                }`}
                style={{ transform: 'skewX(-12deg)' }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex flex-col items-center"
                >
                  <BroadcastCrownSvg className="h-8 w-8" color="#00F0FF" />
                  <span className="mt-0.5 font-headline text-lg font-black uppercase tracking-widest text-white">
                    {generateInitials(settings.name)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* MIDDLE CONTENT AREA: Standings Table + Optional Winner Monolith */}
        <div
          className={`my-auto flex w-full ${
            showWinnerHero
              ? isPortrait
                ? 'flex-col items-center gap-5 pt-2'
                : 'flex-row items-center gap-10 pt-2'
              : 'flex-col pt-3'
          }`}
        >
          {/* WINNER MONOLITH SHOWCASE (When Concluded) */}
          {showWinnerHero && championTeam && (
            <div
              className={
                isPortrait
                  ? 'w-full flex justify-center'
                  : 'w-[440px] shrink-0 flex justify-center'
              }
            >
              <BroadcastWinnerMonolith
                championTeam={championTeam}
                settings={settings}
                palette={winnerPalette}
                compact={isPortrait}
              />
            </div>
          )}

          {/* SKEWED ARCTIC PARALLELOGRAM TABLE */}
          <div className="flex min-w-0 flex-1 flex-col w-full">
            {/* Table Column Header Strip */}
            <div className="mb-2 flex w-full items-center pr-2">
              {/* Rank Column Header */}
              <div className="w-14 shrink-0 pr-2 text-center font-headline text-xs font-black uppercase tracking-[0.18em] text-[#00F0FF]">
                RANK
              </div>

              <div
                className="flex h-10 flex-1 items-stretch overflow-hidden border-2 border-[#040A14] shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
                style={{ transform: 'skewX(-12deg)' }}
              >
                {/* Left Cobalt-to-Cyan Banner */}
                <div className="flex flex-1 items-center overflow-hidden bg-gradient-to-r from-[#0369A1] via-[#0284C7] to-[#06B6D4] px-5 min-w-0">
                  <span
                    className="truncate whitespace-nowrap font-headline text-base font-black uppercase tracking-[0.14em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    style={{ transform: 'skewX(12deg)' }}
                  >
                    {isRush
                      ? `${rushTarget} POINTS ACTIVATES CHAMPION RUSH`
                      : isPortrait
                        ? 'OFFICIAL TOURNAMENT STANDINGS'
                        : `OFFICIAL STANDINGS // ${settings.name}`}
                  </span>
                </div>

                {/* Right Pitch-Navy Stat Column Headers */}
                <div
                  className={`grid shrink-0 items-center bg-[#040A14] text-center font-headline text-xs font-black uppercase tracking-[0.12em] text-white ${
                    showWinnerHero && !isPortrait
                      ? 'w-[420px] grid-cols-4'
                      : isPortrait
                        ? 'w-[410px] grid-cols-4'
                        : 'w-[540px] grid-cols-4'
                  }`}
                >
                  <span style={{ transform: 'skewX(12deg)' }}>BOOYAH!</span>
                  <span style={{ transform: 'skewX(12deg)' }}>ELIMS</span>
                  <span style={{ transform: 'skewX(12deg)' }}>
                    PLACEMENT PTS
                  </span>
                  <span
                    style={{ transform: 'skewX(12deg)' }}
                    className="text-[#00F0FF]"
                  >
                    TOTAL POINTS
                  </span>
                </div>
              </div>
            </div>

            {/* 12 Skewed Parallelogram Team Rows */}
            <div
              className={`flex flex-col ${
                isPortrait
                  ? showWinnerHero
                    ? 'gap-1'
                    : 'gap-2'
                  : 'gap-1.5'
              }`}
            >
              {standings.map((team) => {
                const isTop1 = team.rank === 1;
                const isTop3 = team.rank <= 3;
                const rowHeight = isPortrait
                  ? showWinnerHero
                    ? 'h-[42px]'
                    : 'h-[58px]'
                  : showWinnerHero
                    ? 'h-[48px]'
                    : 'h-[52px]';

                return (
                  <div
                    key={team.teamId}
                    className={`flex w-full items-stretch gap-2 pr-2 ${rowHeight}`}
                  >
                    {/* Detached Skewed Rank Badge */}
                    <div
                      className={`flex w-12 shrink-0 items-center justify-center border-2 ${
                        isTop1
                          ? 'border-white bg-[#00F0FF] text-[#040A14] shadow-[0_0_16px_rgba(0,240,255,0.5)]'
                          : isTop3
                            ? 'border-[#00F0FF]/80 bg-[#072238] text-[#67E8F9]'
                            : 'border-[#0E2942] bg-[#061220] text-white'
                      }`}
                      style={{ transform: 'skewX(-12deg)' }}
                    >
                      <span
                        style={{ transform: 'skewX(12deg)' }}
                        className={`font-headline font-black italic leading-none ${
                          isPortrait && showWinnerHero
                            ? 'text-xl'
                            : 'text-2xl'
                        }`}
                      >
                        #{team.rank}
                      </span>
                    </div>

                    {/* Skewed Parallelogram Bar */}
                    <div
                      className={`flex h-full flex-1 items-stretch overflow-hidden border-2 ${
                        isTop1
                          ? 'border-[#00F0FF] shadow-[0_6px_20px_rgba(0,240,255,0.32)]'
                          : 'border-[#040A14] shadow-[0_5px_14px_rgba(0,0,0,0.65)]'
                      }`}
                      style={{ transform: 'skewX(-12deg)' }}
                    >
                      {/* 1. Solid Pitch-Navy Logo Chamber */}
                      {settings.showLogos !== false && (
                        <div className="flex w-14 shrink-0 items-center justify-center border-r-2 border-[#040A14] bg-[#07111E]">
                          <div
                            style={{ transform: 'skewX(12deg)' }}
                            className="flex h-8 w-8 items-center justify-center"
                          >
                            {team.logoUrl ? (
                              <img
                                src={team.logoUrl}
                                alt={team.teamName}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span className="font-headline text-sm font-black uppercase tracking-wider text-[#00F0FF]">
                                {team.shortCode ||
                                  generateInitials(team.teamName)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 2. Solid Glacial Ice-White Team Name Plate with STARK PITCH-NAVY TEXT */}
                      <div
                        className="flex flex-1 items-center justify-between px-5"
                        style={{
                          background: isTop1
                            ? 'linear-gradient(90deg, #67E8F9 0%, #CFFAFE 100%)'
                            : isTop3
                              ? 'linear-gradient(90deg, #E0F2FE 0%, #F0F9FF 100%)'
                              : 'linear-gradient(90deg, #ECFEFF 0%, #FFFFFF 100%)',
                        }}
                      >
                        <div
                          style={{ transform: 'skewX(12deg)' }}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <span
                            className={`truncate font-headline font-black uppercase tracking-wide text-[#040A14] ${
                              isPortrait && showWinnerHero
                                ? 'text-xl'
                                : 'text-2xl'
                            }`}
                          >
                            {team.teamName}
                          </span>
                        </div>

                        {/* Circular Rush Status Badge on Right Edge of Ice Plate */}
                        {isRush && (
                          <div
                            style={{ transform: 'skewX(12deg)' }}
                            className="ml-2 shrink-0"
                          >
                            <BroadcastRushCrownCircle
                              status={team.rushStatus.status}
                              activeBg="#040A14"
                              activeBorder="#040A14"
                              activeIcon="#00F0FF"
                              champBg="#00F0FF"
                              champBorder="#040A14"
                              champIcon="#040A14"
                              size={
                                isPortrait && showWinnerHero ? 'sm' : 'md'
                              }
                            />
                          </div>
                        )}
                      </div>

                      {/* 3. Seamless Vibrant Electric Cyan-to-Sky Stats Block + Dark Total Points Cap */}
                      <div
                        className={`grid shrink-0 items-center border-l-2 border-[#040A14] text-center font-headline font-black text-[#040A14] ${
                          showWinnerHero && !isPortrait
                            ? 'w-[420px] grid-cols-4'
                            : isPortrait
                              ? 'w-[410px] grid-cols-4'
                              : 'w-[540px] grid-cols-4'
                        }`}
                        style={{
                          background: isTop1
                            ? 'linear-gradient(90deg, #00F0FF 0%, #06B6D4 100%)'
                            : 'linear-gradient(90deg, #38BDF8 0%, #0EA5E9 100%)',
                        }}
                      >
                        {/* BOOYAH */}
                        <div className="relative flex h-full items-center justify-center">
                          <span
                            style={{ transform: 'skewX(12deg)' }}
                            className={
                              isPortrait && showWinnerHero
                                ? 'text-xl'
                                : 'text-2xl'
                            }
                          >
                            {team.booyahCount}
                          </span>
                          <span className="absolute right-0 top-1/4 h-1/2 w-[2px] bg-[#040A14]/45" />
                        </div>

                        {/* ELIMS */}
                        <div className="relative flex h-full items-center justify-center">
                          <span
                            style={{ transform: 'skewX(12deg)' }}
                            className={
                              isPortrait && showWinnerHero
                                ? 'text-xl'
                                : 'text-2xl'
                            }
                          >
                            {team.killPoints}
                          </span>
                          <span className="absolute right-0 top-1/4 h-1/2 w-[2px] bg-[#040A14]/45" />
                        </div>

                        {/* PLACEMENT POINTS */}
                        <div className="relative flex h-full items-center justify-center">
                          <span
                            style={{ transform: 'skewX(12deg)' }}
                            className={
                              isPortrait && showWinnerHero
                                ? 'text-xl'
                                : 'text-2xl'
                            }
                          >
                            {team.placementPoints}
                          </span>
                        </div>

                        {/* PITCH-NAVY TOTAL POINTS END-CAP */}
                        <div
                          className={`flex h-full items-center justify-center border-l-2 border-[#040A14] ${
                            isTop1
                              ? 'bg-[#040A14] text-[#00F0FF]'
                              : 'bg-[#061322] text-white'
                          }`}
                        >
                          <span
                            style={{ transform: 'skewX(12deg)' }}
                            className={`font-black ${
                              isPortrait && showWinnerHero
                                ? 'text-2xl'
                                : 'text-3xl'
                            }`}
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

        {/* BOTTOM BROADCAST LEGEND & FOOTER */}
        <footer className="mt-3 flex items-center justify-between gap-4 pt-1">
          {isRush ? (
            <div className="flex items-center gap-4">
              {/* Pill 1: Won by Champion Rush */}
              <div
                className="flex items-center gap-2.5 border border-[#00F0FF] bg-[#071526] px-4 py-1.5 shadow-md"
                style={{ transform: 'skewX(-12deg)' }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex items-center gap-2.5"
                >
                  <BroadcastRushCrownCircle
                    status="CHAMPION"
                    champBg="#00F0FF"
                    champBorder="#040A14"
                    champIcon="#040A14"
                    size="sm"
                  />
                  <span className="font-headline text-xs font-black uppercase tracking-[0.16em] text-[#A5F3FC]">
                    WON BY CHAMPION RUSH
                  </span>
                </div>
              </div>

              {/* Pill 2: Satisfied Champion Rush Condition */}
              <div
                className="flex items-center gap-2.5 border border-white/30 bg-[#071526] px-4 py-1.5 shadow-md"
                style={{ transform: 'skewX(-12deg)' }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex items-center gap-2.5"
                >
                  <BroadcastRushCrownCircle
                    status="ACTIVE"
                    activeBg="#040A14"
                    activeBorder="#00F0FF"
                    activeIcon="#00F0FF"
                    size="sm"
                  />
                  <span className="font-headline text-xs font-black uppercase tracking-[0.16em] text-white/90">
                    SATISFIED CHAMPION RUSH CONDITION
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
              <div className="h-2 w-2 shrink-0 bg-[#00F0FF]" />
              <span className="truncate whitespace-nowrap font-headline text-xs font-bold uppercase tracking-[0.22em] text-[#A5F3FC]/85">
                {settings.name}
                {settings.hostName ? ` • HOSTED BY ${settings.hostName}` : ''}
                {settings.sponsorName
                  ? ` • POWERED BY ${settings.sponsorName}`
                  : ''}
              </span>
            </div>
          )}

          <div
            className="shrink-0 border border-[#00F0FF]/40 bg-[#040A14] px-4 py-1"
            style={{ transform: 'skewX(-12deg)' }}
          >
            <span
              className="block whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.22em] text-[#00F0FF]"
              style={{ transform: 'skewX(12deg)' }}
            >
              ESP CALC BROADCAST • MADE BY MR. OPPY
            </span>
          </div>
        </footer>
      </div>

      {/* 3. RIGHT VERTICAL BROADCAST SPINE TICKER (Glacial White & Abyssal Navy) */}
      <div className="relative z-30 flex h-full w-[42px] shrink-0 flex-col items-center justify-between border-l-2 border-[#040A14] bg-[#F0F9FF] py-6 text-[#040A14] shadow-[-6px_0_24px_rgba(0,0,0,0.65)]">
        {/* Top Square Register Mark */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-3 w-3 bg-[#040A14]" />
          <div className="h-1.5 w-3 bg-[#0284C7]" />
        </div>

        {/* Vertical Rotated Tournament & Organizer Spine Text */}
        <div className="flex flex-1 items-center justify-center overflow-hidden py-4">
          <div
            className="whitespace-nowrap font-headline text-[15px] font-black uppercase tracking-[0.28em] text-[#040A14]"
            style={{
              writingMode: 'vertical-rl',
            }}
          >
            {settings.name}
            {settings.hostName ? ` // ORG: ${settings.hostName}` : ''}
            {' // '}
            {matchHeaderSubtitle}
          </div>
        </div>

        {/* Bottom-Right Diagonal Slash Ribbon */}
        <div className="relative flex w-full flex-col items-center pt-4">
          <div
            className="h-12 w-full bg-[#040A14]"
            style={{ clipPath: 'polygon(0 0, 100% 28%, 100% 100%, 0 100%)' }}
          />
        </div>
      </div>
    </div>
  );
};
