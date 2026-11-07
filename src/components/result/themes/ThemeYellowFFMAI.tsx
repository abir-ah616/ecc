import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';

export const ThemeYellowFFMAI: React.FC<GraphicThemeProps> = ({
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
    outerBorder: 'linear-gradient(135deg, #FBBF24 0%, #EA580C 55%, #78350F 100%)',
    cornerWedge: '#FFFFFF',
    headerBg: 'linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #D97706 100%)',
    headerText: '#FFFFFF',
    chamberBg: 'linear-gradient(180deg, #1E1306 0%, #0D0803 100%)',
    crownColor: '#F59E0B',
    initialsColor: '#F59E0B',
    bladeBg: 'linear-gradient(90deg, #FDE047 0%, #F59E0B 55%, #EA580C 100%)',
    bladeText: '#0A0A0A',
    statTextColor: '#FBBF24',
    subStatBg: 'rgba(15, 10, 4, 0.92)',
    subStatBorder: 'rgba(245, 158, 11, 0.45)',
    subStatLabel: '#FDE68A',
    glowColor: 'rgba(245, 158, 11, 0.55)',
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#120C05] text-white select-none">
      {/* 1. BACKGROUND LAYER: Golden-Amber Top Arena Wash + Halftone Grid + Diagonal Beams */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #FFB800 0%, #F59E0B 14%, #D97706 24%, #271707 40%, #120B04 100%)',
        }}
      />

      {/* Custom SVG Sunburst & Architectural Speed Geometry */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="ffmai-dots"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.5" fill="rgba(0,0,0,0.16)" />
          </pattern>
          <linearGradient id="ffmai-slash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Top Halftone Texture */}
        <rect width="100%" height="36%" fill="url(#ffmai-dots)" />

        {/* Diagonal Broadcast Light Blades */}
        <polygon
          points={
            isPortrait
              ? '680,0 1080,0 1080,550 420,550'
              : '1150,0 1920,0 1920,620 820,620'
          }
          fill="url(#ffmai-slash)"
        />
        <polygon
          points={
            isPortrait
              ? '0,420 1080,260 1080,1350 0,1350'
              : '0,310 1920,190 1920,1080 0,1080'
          }
          fill="rgba(14, 9, 3, 0.92)"
        />
        {/* Crisp Amber Diagonal Horizon Line */}
        <line
          x1="0"
          y1={isPortrait ? '420' : '310'}
          x2={isPortrait ? '1080' : '1920'}
          y2={isPortrait ? '260' : '190'}
          stroke="#F59E0B"
          strokeWidth="4"
        />
      </svg>

      {/* 2. LEFT VERTICAL BROADCAST SPINE TICKER (Directly from FFMAI 2026 Summer Reference) */}
      <div className="relative z-30 flex h-full w-[42px] shrink-0 flex-col items-center justify-between border-r-2 border-black bg-[#F8FAFC] py-6 text-[#0A0A0A] shadow-[6px_0_24px_rgba(0,0,0,0.65)]">
        {/* Top Square Register Mark */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-3 w-3 bg-[#0A0A0A]" />
          <div className="h-1.5 w-3 bg-[#EA580C]" />
        </div>

        {/* Vertical Rotated Tournament & Organizer Spine Text */}
        <div className="flex flex-1 items-center justify-center overflow-hidden py-4">
          <div
            className="whitespace-nowrap font-headline text-[15px] font-black uppercase tracking-[0.28em] text-[#0A0A0A]"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
            }}
          >
            {settings.name}
            {settings.hostName ? ` // ORG: ${settings.hostName}` : ''}
            {' // '}
            {matchHeaderSubtitle}
          </div>
        </div>

        {/* Bottom-Left Black Diagonal Slash Ribbon */}
        <div className="relative flex w-full flex-col items-center pt-4">
          <div
            className="h-12 w-full bg-[#0A0A0A]"
            style={{ clipPath: 'polygon(0 28%, 100% 0, 100% 100%, 0 100%)' }}
          />
        </div>
      </div>

      {/* 3. MAIN STAGE CANVAS */}
      <div
        className={`relative z-20 flex min-w-0 flex-1 flex-col justify-between overflow-hidden ${
          isPortrait ? 'px-7 pt-7 pb-6' : 'px-12 pt-7 pb-6'
        }`}
      >
        {/* TOP BROADCAST HEADER LOCKUP */}
        <header className="relative flex w-full items-start justify-between gap-6">
          {/* Left: Giant Pitch-Black Italic Headline + Skewed Black Sub-Banner */}
          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* Top Organizer & Stage Kicker Plate (Strictly Single-Line No-Wrap for PNG Export) */}
            <div className="mb-2 flex w-full flex-nowrap items-center gap-2.5 whitespace-nowrap">
              <div
                className="shrink-0 bg-[#0A0A0A] px-3.5 py-0.5 text-white shadow-md"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className="block whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.22em] text-[#FBBF24]"
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {settings.name}
                </span>
              </div>

              {settings.hostName && (
                <div
                  className="shrink-0 border border-black/80 bg-white/95 px-3 py-0.5 text-[#0A0A0A] shadow-sm"
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
                  className="shrink-0 border border-black/80 bg-[#EA580C] px-3 py-0.5 text-white shadow-sm"
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

            {/* Massive Pitch-Black Italic Display Headline */}
            <h1
              className={`whitespace-nowrap font-headline font-black italic uppercase leading-[0.92] tracking-tight text-[#0A0A0A] drop-shadow-[0_2px_0_rgba(255,255,255,0.35)] ${
                isPortrait ? 'text-[64px]' : 'text-[80px]'
              }`}
            >
              {mainHeadline}
            </h1>

            {/* Solid Pitch-Black Skewed Parallelogram Banner ("CHAMPION RUSH") */}
            <div className="mt-2 flex flex-nowrap items-center gap-3 whitespace-nowrap">
              <div
                className="shrink-0 bg-[#0A0A0A] px-7 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.55)]"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className={`block whitespace-nowrap font-headline font-black italic uppercase tracking-[0.08em] text-white ${
                    isPortrait ? 'text-2xl' : 'text-3xl'
                  }`}
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {subBannerText}
                </span>
              </div>

              <div
                className="shrink-0 border-2 border-[#0A0A0A] bg-[#FFF5D6] px-4 py-1.5 shadow-md"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className="block whitespace-nowrap font-headline text-sm font-black uppercase tracking-[0.18em] text-[#0A0A0A]"
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {matchHeaderSubtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Frameless Floating Tournament Emblem + Broadcast Meta Tag */}
          <div className="flex items-center gap-4">
            {tournamentLogo ? (
              <div
                className={`relative flex items-center justify-center ${
                  isPortrait ? 'h-24 w-24' : 'h-28 w-28'
                }`}
              >
                <img
                  src={tournamentLogo}
                  alt={settings.name}
                  className="h-full w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"
                />
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center border-2 border-[#0A0A0A] bg-[#0A0A0A] text-[#FBBF24] shadow-[0_12px_28px_rgba(0,0,0,0.65)] ${
                  isPortrait ? 'h-20 w-24' : 'h-24 w-28'
                }`}
                style={{ transform: 'skewX(-12deg)' }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex flex-col items-center"
                >
                  <BroadcastCrownSvg className="h-8 w-8" color="#FBBF24" />
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

          {/* SKEWED FFMAI PARALLELOGRAM TABLE */}
          <div className="flex min-w-0 flex-1 flex-col w-full">
            {/* Table Column Header Strip */}
            <div className="mb-2 flex w-full items-center pl-11 pr-2">
              <div
                className="flex h-10 w-full items-stretch overflow-hidden border-2 border-[#0A0A0A] shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
                style={{ transform: 'skewX(-12deg)' }}
              >
                {/* Left Coral-Orange Banner */}
                <div className="flex flex-1 items-center overflow-hidden bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FB923C] px-5 min-w-0">
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

                {/* Right Pitch-Black Stat Column Headers */}
                <div
                  className={`grid shrink-0 items-center bg-[#0A0A0A] text-center font-headline text-xs font-black uppercase tracking-[0.12em] text-white ${
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
                    className="text-[#FBBF24]"
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
                    className={`flex w-full items-center pr-2 ${rowHeight}`}
                  >
                    {/* Left Floating Rank Number */}
                    <div className="flex w-11 shrink-0 items-center justify-center pr-2">
                      <span
                        className={`font-headline font-black italic leading-none ${
                          isPortrait && showWinnerHero
                            ? 'text-2xl'
                            : 'text-3xl'
                        } ${
                          isTop1
                            ? 'text-[#FBBF24] drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                            : isTop3
                              ? 'text-[#FDE68A]'
                              : 'text-white/90'
                        }`}
                      >
                        {team.rank}
                      </span>
                    </div>

                    {/* Skewed Parallelogram Bar */}
                    <div
                      className={`flex h-full flex-1 items-stretch overflow-hidden border-2 ${
                        isTop1
                          ? 'border-[#FBBF24] shadow-[0_6px_20px_rgba(251,191,36,0.3)]'
                          : 'border-[#0A0A0A] shadow-[0_5px_14px_rgba(0,0,0,0.65)]'
                      }`}
                      style={{ transform: 'skewX(-12deg)' }}
                    >
                      {/* 1. Solid Pitch-Black Logo Chamber */}
                      {settings.showLogos !== false && (
                        <div className="flex w-14 shrink-0 items-center justify-center border-r-2 border-[#0A0A0A] bg-[#111111]">
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
                              <span className="font-headline text-sm font-black uppercase tracking-wider text-[#FBBF24]">
                                {team.shortCode ||
                                  generateInitials(team.teamName)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 2. Solid Warm Cream-Gold Team Name Plate with STARK BLACK TEXT */}
                      <div
                        className="flex flex-1 items-center justify-between px-5"
                        style={{
                          background: isTop1
                            ? 'linear-gradient(90deg, #FDE047 0%, #FEF08A 100%)'
                            : isTop3
                              ? 'linear-gradient(90deg, #FEF3C7 0%, #FFFBEB 100%)'
                              : 'linear-gradient(90deg, #FFF5D6 0%, #FFFBEB 100%)',
                        }}
                      >
                        <div
                          style={{ transform: 'skewX(12deg)' }}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <span
                            className={`truncate font-headline font-black uppercase tracking-wide text-[#0A0A0A] ${
                              isPortrait && showWinnerHero
                                ? 'text-xl'
                                : 'text-2xl'
                            }`}
                          >
                            {team.teamName}
                          </span>
                        </div>

                        {/* Circular Rush Status Badge on Right Edge of Cream Plate */}
                        {isRush && (
                          <div
                            style={{ transform: 'skewX(12deg)' }}
                            className="ml-2 shrink-0"
                          >
                            <BroadcastRushCrownCircle
                              status={team.rushStatus.status}
                              activeBg="#0A0A0A"
                              activeBorder="#0A0A0A"
                              activeIcon="#FFFFFF"
                              champBg="#F59E0B"
                              champBorder="#0A0A0A"
                              champIcon="#0A0A0A"
                              size={
                                isPortrait && showWinnerHero ? 'sm' : 'md'
                              }
                            />
                          </div>
                        )}
                      </div>

                      {/* 3. Seamless Vibrant Orange-Coral Stats Block with Vertical Divider Ticks */}
                      <div
                        className={`grid shrink-0 items-center border-l-2 border-[#0A0A0A] text-center font-headline font-black text-[#0A0A0A] ${
                          showWinnerHero && !isPortrait
                            ? 'w-[420px] grid-cols-4'
                            : isPortrait
                              ? 'w-[410px] grid-cols-4'
                              : 'w-[540px] grid-cols-4'
                        }`}
                        style={{
                          background: isTop1
                            ? 'linear-gradient(90deg, #F59E0B 0%, #EA580C 100%)'
                            : 'linear-gradient(90deg, #FB923C 0%, #F97316 100%)',
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
                          <span className="absolute right-0 top-1/4 h-1/2 w-[2px] bg-[#0A0A0A]/45" />
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
                          <span className="absolute right-0 top-1/4 h-1/2 w-[2px] bg-[#0A0A0A]/45" />
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
                          <span className="absolute right-0 top-1/4 h-1/2 w-[2px] bg-[#0A0A0A]/45" />
                        </div>

                        {/* TOTAL POINTS */}
                        <div className="flex h-full items-center justify-center bg-black/10">
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
                className="flex items-center gap-2.5 border border-[#F59E0B] bg-[#1C1206] px-4 py-1.5 shadow-md"
                style={{ transform: 'skewX(-12deg)' }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex items-center gap-2.5"
                >
                  <BroadcastRushCrownCircle status="CHAMPION" size="sm" />
                  <span className="font-headline text-xs font-black uppercase tracking-[0.16em] text-[#FDE68A]">
                    WON BY CHAMPION RUSH
                  </span>
                </div>
              </div>

              {/* Pill 2: Satisfied Champion Rush Condition */}
              <div
                className="flex items-center gap-2.5 border border-white/30 bg-[#1C1206] px-4 py-1.5 shadow-md"
                style={{ transform: 'skewX(-12deg)' }}
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
              <div className="h-2 w-2 shrink-0 bg-[#F59E0B]" />
              <span className="truncate whitespace-nowrap font-headline text-xs font-bold uppercase tracking-[0.22em] text-[#FDE68A]/80">
                {settings.name}
                {settings.hostName ? ` • HOSTED BY ${settings.hostName}` : ''}
                {settings.sponsorName
                  ? ` • POWERED BY ${settings.sponsorName}`
                  : ''}
              </span>
            </div>
          )}

          <div
            className="shrink-0 border border-[#F59E0B]/40 bg-[#0A0A0A] px-4 py-1"
            style={{ transform: 'skewX(-12deg)' }}
          >
            <span
              className="block whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.22em] text-[#FBBF24]"
              style={{ transform: 'skewX(12deg)' }}
            >
              ESP CALC BROADCAST • MADE BY MR. OPPY
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
