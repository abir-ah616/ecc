import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';

export const ThemeCyberRose: React.FC<GraphicThemeProps> = ({
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
    outerBorder: 'linear-gradient(135deg, #FF2A6D 0%, #E11D48 55%, #4C0519 100%)',
    cornerWedge: '#FFFFFF',
    headerBg: 'linear-gradient(90deg, #BE123C 0%, #FF1E56 50%, #BE123C 100%)',
    headerText: '#FFFFFF',
    chamberBg: 'linear-gradient(180deg, #1E050E 0%, #090205 100%)',
    crownColor: '#FF2A6D',
    initialsColor: '#FF2A6D',
    bladeBg: 'linear-gradient(90deg, #FFE4E6 0%, #FDA4AF 45%, #FF2A6D 100%)',
    bladeText: '#0A0408',
    statTextColor: '#FDA4AF',
    subStatBg: 'rgba(18, 4, 10, 0.94)',
    subStatBorder: 'rgba(255, 42, 109, 0.5)',
    subStatLabel: '#FECDD3',
    glowColor: 'rgba(255, 30, 86, 0.58)',
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#0A0408] text-white select-none">
      {/* 1. BACKGROUND LAYER: Electric Sakura Rose-to-Coral Top Wash + Halftone Matrix + Diagonal Horizon Cut */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #FF1E56 0%, #F43F5E 14%, #E11D48 24%, #240712 38%, #0A0408 100%)',
        }}
      />

      {/* Custom SVG Cyber-Rose Vector Shards, Halftone Grid & Horizon Line */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="rose-halftone"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.5" fill="rgba(10, 4, 8, 0.2)" />
          </pattern>
          <linearGradient id="rose-slash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.24)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
          <linearGradient id="rose-dark-wing" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(136, 19, 55, 0.42)" />
            <stop offset="100%" stopColor="rgba(255, 42, 109, 0.08)" />
          </linearGradient>
        </defs>

        {/* Top Halftone Texture */}
        <rect width="100%" height="32%" fill="url(#rose-halftone)" />

        {/* Diagonal Broadcast Light Blades */}
        <polygon
          points={
            isPortrait
              ? '660,0 1080,0 1080,480 400,480'
              : '1120,0 1920,0 1920,520 800,520'
          }
          fill="url(#rose-slash)"
        />
        <polygon
          points={
            isPortrait
              ? '0,0 360,0 140,320 0,320'
              : '0,0 540,0 260,280 0,280'
          }
          fill="url(#rose-dark-wing)"
        />

        {/* Deep Pitch-Obsidian Lower Stage Cut */}
        <polygon
          points={
            isPortrait
              ? '0,360 1080,235 1080,1350 0,1350'
              : '0,255 1920,175 1920,1080 0,1080'
          }
          fill="rgba(10, 4, 8, 0.95)"
        />

        {/* Crisp Electric Rose & White Dual Horizon Lines */}
        <line
          x1="0"
          y1={isPortrait ? '352' : '247'}
          x2={isPortrait ? '1080' : '1920'}
          y2={isPortrait ? '227' : '167'}
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="2"
        />
        <line
          x1="0"
          y1={isPortrait ? '360' : '255'}
          x2={isPortrait ? '1080' : '1920'}
          y2={isPortrait ? '235' : '175'}
          stroke="#FF2A6D"
          strokeWidth="4"
        />
      </svg>

      {/* 2. LEFT VERTICAL BROADCAST SPINE TICKER (Pitch Obsidian & Electric Rose) */}
      <div className="relative z-30 flex h-full w-[42px] shrink-0 flex-col items-center justify-between border-r-2 border-[#FF2A6D] bg-[#0A0408] py-6 text-white shadow-[6px_0_24px_rgba(0,0,0,0.75)]">
        {/* Top Square Register Mark */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-3 w-3 bg-[#FF2A6D]" />
          <div className="h-1.5 w-3 bg-white" />
        </div>

        {/* Vertical Rotated Tournament & Organizer Spine Text */}
        <div className="flex flex-1 items-center justify-center overflow-hidden py-4">
          <div
            className="whitespace-nowrap font-headline text-[15px] font-black uppercase tracking-[0.28em] text-[#FFE4E6]"
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

        {/* Bottom-Left Rose Diagonal Slash Ribbon */}
        <div className="relative flex w-full flex-col items-center pt-4">
          <div
            className="h-12 w-full bg-[#FF1E56]"
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
          {/* Left: Skewed Kicker Badges + Giant Stark White Italic Headline + Skewed Sub-Banner */}
          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* Top Organizer & Stage Kicker Plate (Strictly Single-Line No-Wrap for PNG Export) */}
            <div className="mb-2 flex w-full flex-nowrap items-center gap-2.5 whitespace-nowrap">
              <div
                className="shrink-0 border border-[#0A0408] bg-[#0A0408] px-3.5 py-0.5 text-white shadow-md"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className="block whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.22em] text-[#FDA4AF]"
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {settings.name}
                </span>
              </div>

              {settings.hostName && (
                <div
                  className="shrink-0 border border-[#0A0408] bg-white px-3 py-0.5 text-[#0A0408] shadow-sm"
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
                  className="shrink-0 border border-white/80 bg-[#881337] px-3 py-0.5 text-white shadow-sm"
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

            {/* Massive Stark White Italic Display Headline with Hard Obsidian Shadow */}
            <h1
              className={`whitespace-nowrap font-headline font-black italic uppercase leading-[0.92] tracking-tight text-white drop-shadow-[0_4px_0_#0A0408] ${
                isPortrait ? 'text-[64px]' : 'text-[80px]'
              }`}
            >
              {mainHeadline}
            </h1>

            {/* Solid Pitch-Obsidian Skewed Parallelogram Banner + Blush-White Subtitle Plate */}
            <div className="mt-2 flex flex-nowrap items-center gap-3 whitespace-nowrap">
              <div
                className="shrink-0 border-l-4 border-white bg-[#0A0408] px-7 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.55)]"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className={`block whitespace-nowrap font-headline font-black italic uppercase tracking-[0.08em] text-[#FFE4E6] ${
                    isPortrait ? 'text-2xl' : 'text-3xl'
                  }`}
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {subBannerText}
                </span>
              </div>

              <div
                className="shrink-0 border-2 border-[#0A0408] bg-[#FFFFFF] px-4 py-1.5 shadow-[4px_4px_0_#0A0408]"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className="block whitespace-nowrap font-headline text-sm font-black uppercase tracking-[0.18em] text-[#0A0408]"
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {matchHeaderSubtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Hard-Shadow Cyber-Rose Emblem Stamp */}
          <div className="flex items-center gap-4">
            {tournamentLogo ? (
              <div
                className={`relative flex items-center justify-center border-2 border-white bg-[#0A0408] p-2 shadow-[6px_6px_0_#0A0408] ${
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
                className={`flex flex-col items-center justify-center border-2 border-white bg-[#0A0408] text-[#FF2A6D] shadow-[6px_6px_0_#0A0408] ${
                  isPortrait ? 'h-20 w-24' : 'h-24 w-28'
                }`}
                style={{ transform: 'skewX(-12deg)' }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex flex-col items-center"
                >
                  <BroadcastCrownSvg className="h-8 w-8" color="#FF2A6D" />
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

          {/* SKEWED CYBER-ROSE PARALLELOGRAM TABLE */}
          <div className="flex min-w-0 flex-1 flex-col w-full">
            {/* Table Column Header Strip */}
            <div className="mb-2 flex w-full items-center pr-2">
              <div className="w-14 shrink-0 pr-2 text-center font-headline text-xs font-black uppercase tracking-[0.18em] text-[#FDA4AF]">
                RANK
              </div>

              <div
                className="flex h-10 flex-1 items-stretch overflow-hidden border-2 border-[#0A0408] shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
                style={{ transform: 'skewX(-12deg)' }}
              >
                {/* Left Electric Rose-to-Coral Banner */}
                <div className="flex flex-1 items-center overflow-hidden bg-gradient-to-r from-[#BE123C] via-[#E11D48] to-[#FF2A6D] px-5 min-w-0">
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

                {/* Right Pitch-Obsidian Stat Column Headers */}
                <div
                  className={`grid shrink-0 items-center bg-[#0A0408] text-center font-headline text-xs font-black uppercase tracking-[0.12em] text-white ${
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
                    className="text-[#FF2A6D]"
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
                          ? 'border-white bg-[#FF1E56] text-white shadow-[0_0_16px_rgba(255,30,86,0.55)]'
                          : isTop3
                            ? 'border-[#FF2A6D]/80 bg-[#2D0816] text-[#FDA4AF]'
                            : 'border-[#3F0D1F] bg-[#16050B] text-white'
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
                          ? 'border-[#FF2A6D] shadow-[0_6px_20px_rgba(255,42,109,0.34)]'
                          : 'border-[#0A0408] shadow-[0_5px_14px_rgba(0,0,0,0.65)]'
                      }`}
                      style={{ transform: 'skewX(-12deg)' }}
                    >
                      {/* 1. Solid Pitch-Obsidian Logo Chamber */}
                      {settings.showLogos !== false && (
                        <div className="flex w-14 shrink-0 items-center justify-center border-r-2 border-[#0A0408] bg-[#14070E]">
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
                              <span className="font-headline text-sm font-black uppercase tracking-wider text-[#FF2A6D]">
                                {team.shortCode ||
                                  generateInitials(team.teamName)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 2. Solid Platinum-Blush Team Name Plate with STARK PITCH-BLACK TEXT */}
                      <div
                        className="flex flex-1 items-center justify-between px-5"
                        style={{
                          background: isTop1
                            ? 'linear-gradient(90deg, #FDA4AF 0%, #FFE4E6 100%)'
                            : isTop3
                              ? 'linear-gradient(90deg, #FFE4E6 0%, #FFF1F2 100%)'
                              : 'linear-gradient(90deg, #FFF1F2 0%, #FFFFFF 100%)',
                        }}
                      >
                        <div
                          style={{ transform: 'skewX(12deg)' }}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <span
                            className={`truncate font-headline font-black uppercase tracking-wide text-[#0A0408] ${
                              isPortrait && showWinnerHero
                                ? 'text-xl'
                                : 'text-2xl'
                            }`}
                          >
                            {team.teamName}
                          </span>
                        </div>

                        {/* Circular Rush Status Badge on Right Edge of Blush Plate */}
                        {isRush && (
                          <div
                            style={{ transform: 'skewX(12deg)' }}
                            className="ml-2 shrink-0"
                          >
                            <BroadcastRushCrownCircle
                              status={team.rushStatus.status}
                              activeBg="#0A0408"
                              activeBorder="#0A0408"
                              activeIcon="#FF2A6D"
                              champBg="#FF1E56"
                              champBorder="#0A0408"
                              champIcon="#FFFFFF"
                              size={
                                isPortrait && showWinnerHero ? 'sm' : 'md'
                              }
                            />
                          </div>
                        )}
                      </div>

                      {/* 3. Seamless Vibrant Electric Rose-Coral Stats Block + Obsidian Total Points Cap */}
                      <div
                        className={`grid shrink-0 items-center border-l-2 border-[#0A0408] text-center font-headline font-black ${
                          isTop1 ? 'text-white' : 'text-[#0A0408]'
                        } ${
                          showWinnerHero && !isPortrait
                            ? 'w-[420px] grid-cols-4'
                            : isPortrait
                              ? 'w-[410px] grid-cols-4'
                              : 'w-[540px] grid-cols-4'
                        }`}
                        style={{
                          background: isTop1
                            ? 'linear-gradient(90deg, #FF1E56 0%, #BE123C 100%)'
                            : 'linear-gradient(90deg, #FB7185 0%, #F43F5E 100%)',
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
                          <span
                            className={`absolute right-0 top-1/4 h-1/2 w-[2px] ${
                              isTop1 ? 'bg-white/35' : 'bg-[#0A0408]/45'
                            }`}
                          />
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
                          <span
                            className={`absolute right-0 top-1/4 h-1/2 w-[2px] ${
                              isTop1 ? 'bg-white/35' : 'bg-[#0A0408]/45'
                            }`}
                          />
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

                        {/* TOTAL POINTS END-CAP */}
                        <div
                          className={`flex h-full items-center justify-center border-l-2 border-[#0A0408] ${
                            isTop1
                              ? 'bg-[#0A0408] text-[#FF2A6D]'
                              : 'bg-[#18050C] text-white'
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
                className="flex items-center gap-2.5 border border-[#FF2A6D] bg-[#1A050D] px-4 py-1.5 shadow-md"
                style={{ transform: 'skewX(-12deg)' }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex items-center gap-2.5"
                >
                  <BroadcastRushCrownCircle
                    status="CHAMPION"
                    champBg="#FF1E56"
                    champBorder="#FFFFFF"
                    champIcon="#FFFFFF"
                    size="sm"
                  />
                  <span className="font-headline text-xs font-black uppercase tracking-[0.16em] text-[#FECDD3]">
                    WON BY CHAMPION RUSH
                  </span>
                </div>
              </div>

              {/* Pill 2: Satisfied Champion Rush Condition */}
              <div
                className="flex items-center gap-2.5 border border-white/30 bg-[#1A050D] px-4 py-1.5 shadow-md"
                style={{ transform: 'skewX(-12deg)' }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex items-center gap-2.5"
                >
                  <BroadcastRushCrownCircle
                    status="ACTIVE"
                    activeBg="#0A0408"
                    activeBorder="#FF2A6D"
                    activeIcon="#FF2A6D"
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
              <div className="h-2 w-2 shrink-0 bg-[#FF2A6D]" />
              <span className="truncate whitespace-nowrap font-headline text-xs font-bold uppercase tracking-[0.22em] text-[#FECDD3]/85">
                {settings.name}
                {settings.hostName ? ` • HOSTED BY ${settings.hostName}` : ''}
                {settings.sponsorName
                  ? ` • POWERED BY ${settings.sponsorName}`
                  : ''}
              </span>
            </div>
          )}

          <div
            className="shrink-0 border border-[#FF2A6D]/45 bg-[#0A0408] px-4 py-1"
            style={{ transform: 'skewX(-12deg)' }}
          >
            <span
              className="block whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.22em] text-[#FF2A6D]"
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
