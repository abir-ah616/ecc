import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';

export const ThemeImperialGold: React.FC<GraphicThemeProps> = ({
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

  const stageTitle = settings.roundOrDay || 'GRAND FINALS';

  const winnerPalette = {
    outerBorder: 'linear-gradient(135deg, #FFFFFF 0%, #FFB800 48%, #FF2A4B 100%)',
    cornerWedge: '#FFFFFF',
    headerBg: 'linear-gradient(90deg, #FF2A4B 0%, #FF6B00 50%, #FFB800 100%)',
    headerText: '#0A0A0A',
    chamberBg: 'linear-gradient(180deg, #1A0812 0%, #09040A 100%)',
    crownColor: '#FFB800',
    initialsColor: '#FFB800',
    bladeBg: 'linear-gradient(90deg, #FFFFFF 0%, #FEF08A 48%, #FFB800 100%)',
    bladeText: '#0A0A0A',
    statTextColor: '#FDE047',
    subStatBg: 'rgba(14, 6, 12, 0.94)',
    subStatBorder: 'rgba(255, 184, 0, 0.55)',
    subStatLabel: '#FEF08A',
    glowColor: 'rgba(255, 107, 0, 0.6)',
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#0B050D] text-white select-none">
      {/* 1. PURE ILLUSTRATOR VECTOR POSTER ARTWORK CANVAS (Multi-Layered Sunburst Slabs, Halftone Dots & Razor Wings) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Base Dramatic Diagonal Poster Gradient */}
          <linearGradient id="sf-bg-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2A0818" />
            <stop offset="38%" stopColor="#120617" />
            <stop offset="75%" stopColor="#09040D" />
            <stop offset="100%" stopColor="#1F0A07" />
          </linearGradient>

          {/* Top Center Arena Spotlight Burst */}
          <radialGradient id="sf-center-flare" cx="50%" cy="12%" r="60%">
            <stop offset="0%" stopColor="rgba(255, 184, 0, 0.42)" />
            <stop offset="35%" stopColor="rgba(255, 56, 76, 0.24)" />
            <stop offset="70%" stopColor="rgba(26, 8, 24, 0)" />
          </radialGradient>

          {/* Solar Gold to Sunset Vermilion Vector Gradient */}
          <linearGradient id="sf-solar-blade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFB800" />
            <stop offset="55%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#FF2A4B" />
          </linearGradient>

          <linearGradient id="sf-vermilion-blade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF2A4B" />
            <stop offset="100%" stopColor="#990F2B" />
          </linearGradient>

          {/* Crisp Halftone Print Dot Pattern */}
          <pattern
            id="sf-halftone"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.8" fill="rgba(255, 184, 0, 0.18)" />
          </pattern>

          {/* Diagonal Speed-Stripe Pattern */}
          <pattern
            id="sf-speed-stripes"
            width="20"
            height="20"
            patternTransform="rotate(-35 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="20"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="8"
            />
          </pattern>
        </defs>

        {/* Base Poster Fill & Center Solar Flare */}
        <rect width="100%" height="100%" fill="url(#sf-bg-grad)" />
        <rect width="100%" height="100%" fill="url(#sf-center-flare)" />

        {/* Diagonal Speed Stripes Across Upper Canvas */}
        <polygon
          points={
            isPortrait
              ? '0,0 1080,0 1080,340 0,460'
              : '0,0 1920,0 1920,280 0,420'
          }
          fill="url(#sf-speed-stripes)"
        />

        {/* Top-Left & Top-Right Halftone Dot Matrices */}
        <rect
          x="0"
          y="0"
          width={isPortrait ? '420' : '640'}
          height="260"
          fill="url(#sf-halftone)"
        />
        <rect
          x={isPortrait ? '660' : '1280'}
          y="0"
          width={isPortrait ? '420' : '640'}
          height="260"
          fill="url(#sf-halftone)"
        />

        {/* Giant Symmetrical V-Wing Arena Backdrop Behind Header */}
        <polygon
          points={
            isPortrait
              ? '0,0 1080,0 1080,145 540,236 0,145'
              : '0,0 1920,0 1920,130 960,218 0,130'
          }
          fill="rgba(10, 4, 14, 0.78)"
        />
        <polyline
          points={
            isPortrait
              ? '0,145 540,236 1080,145'
              : '0,130 960,218 1920,130'
          }
          fill="none"
          stroke="url(#sf-solar-blade)"
          strokeWidth="3.5"
        />

        {/* Top-Left 3-Layer Illustrator Razor Wings (Solar Gold + Stark White + Vermilion) */}
        <polygon
          points={
            isPortrait
              ? '0,0 380,0 0,130'
              : '0,0 560,0 0,145'
          }
          fill="url(#sf-solar-blade)"
        />
        <polygon
          points={
            isPortrait
              ? '0,0 260,0 0,88'
              : '0,0 390,0 0,100'
          }
          fill="#FFFFFF"
        />
        <polygon
          points={
            isPortrait
              ? '0,0 155,0 0,52'
              : '0,0 230,0 0,60'
          }
          fill="#0B050D"
        />

        {/* Top-Right Mirror 3-Layer Illustrator Razor Wings */}
        <polygon
          points={
            isPortrait
              ? '1080,0 700,0 1080,130'
              : '1920,0 1360,0 1920,145'
          }
          fill="url(#sf-vermilion-blade)"
        />
        <polygon
          points={
            isPortrait
              ? '1080,0 820,0 1080,88'
              : '1920,0 1530,0 1920,100'
          }
          fill="#FFB800"
        />
        <polygon
          points={
            isPortrait
              ? '1080,0 925,0 1080,52'
              : '1920,0 1690,0 1920,60'
          }
          fill="#0B050D"
        />

        {/* Bottom-Left & Bottom-Right Graphic Corner Slashes */}
        <polygon
          points={
            isPortrait
              ? '0,1270 360,1350 0,1350'
              : '0,990 520,1080 0,1080'
          }
          fill="url(#sf-vermilion-blade)"
        />
        <polygon
          points={
            isPortrait
              ? '0,1300 230,1350 0,1350'
              : '0,1022 340,1080 0,1080'
          }
          fill="#FFB800"
        />
        <polygon
          points={
            isPortrait
              ? '1080,1270 720,1350 1080,1350'
              : '1920,990 1400,1080 1920,1080'
          }
          fill="url(#sf-solar-blade)"
        />
        <polygon
          points={
            isPortrait
              ? '1080,1300 850,1350 1080,1350'
              : '1920,1022 1580,1080 1920,1080'
          }
          fill="#FFFFFF"
        />
      </svg>

      {/* Giant Outlined Kinetic Echo Typography Behind Header */}
      <div
        className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 whitespace-nowrap font-headline text-[150px] font-black italic uppercase leading-none tracking-tighter opacity-[0.06]"
        style={{
          WebkitTextStroke: '2.5px #FFB800',
          color: 'transparent',
        }}
      >
        CHAMPIONSHIP STANDINGS
      </div>

      {/* 2. MAIN POSTER STAGE */}
      <div
        className={`relative z-20 flex flex-1 flex-col justify-between ${
          isPortrait ? 'px-8 pt-6 pb-4' : 'px-12 pt-5 pb-4'
        }`}
      >
        {/* TOP SYMMETRICAL WINGED ESPORTS ARENA CREST & RIBBON LOCKUP (100% Graphic Edit, Zero Web Navbar!) */}
        <header className="relative flex w-full flex-col items-center">
          {/* Upper Row: Left Swept Wing Ribbon + Center Hexagonal Shield Crest + Right Swept Wing Ribbon */}
          <div className="flex w-full items-center justify-center">
            {/* LEFT SWEPT VECTOR WING RIBBON (ORGANIZER) */}
            <div className="flex flex-1 items-center justify-end">
              {/* Outer Decorative Vector Feather */}
              <div
                className="mr-1.5 hidden h-8 w-5 bg-[#FF2A4B] sm:block"
                style={{
                  clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 45% 0)',
                }}
              />
              <div
                className="mr-1.5 h-9 w-4 bg-[#FFB800]"
                style={{
                  clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 40% 0)',
                }}
              />
              <div
                className={`flex items-center justify-end bg-white py-1.5 pl-6 pr-7 text-[#0A0A0A] shadow-[0_10px_25px_rgba(0,0,0,0.85)] ${
                  isPortrait ? 'min-w-[260px]' : 'min-w-[380px]'
                }`}
                style={{
                  clipPath:
                    'polygon(16px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
                }}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-headline text-xs font-black uppercase tracking-[0.22em] text-[#FF2A4B]">
                    HOSTED BY //
                  </span>
                  <span className="truncate font-headline text-base font-black uppercase tracking-[0.14em] text-[#0A0A0A]">
                    {settings.hostName || 'OFFICIAL ARENA'}
                  </span>
                </div>
              </div>
            </div>

            {/* CENTERPIECE 3D CUT-CORNER SHIELD CREST WITH WHITE CORNER WEDGES */}
            <div
              className={`relative z-30 -mx-3 flex shrink-0 items-center justify-center p-[2.5px] shadow-[0_16px_40px_rgba(0,0,0,0.95)] ${
                isPortrait ? 'h-[82px] w-[88px]' : 'h-[92px] w-[100px]'
              }`}
              style={{
                background:
                  'linear-gradient(135deg, #FFFFFF 0%, #FFB800 50%, #FF2A4B 100%)',
                clipPath:
                  'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)',
              }}
            >
              <div
                className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#240B16] to-[#0B040A] p-2"
                style={{
                  clipPath:
                    'polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)',
                }}
              >
                {/* Stark White Corner Wedges */}
                <div
                  className="pointer-events-none absolute top-0 left-0 h-5 w-5 bg-white"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                />
                <div
                  className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 bg-white"
                  style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
                />

                {tournamentLogo ? (
                  <img
                    src={tournamentLogo}
                    alt={settings.name}
                    className="relative z-10 h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(255,184,0,0.5)]"
                  />
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <BroadcastCrownSvg
                      className={isPortrait ? 'h-7 w-7' : 'h-8 w-8'}
                      color="#FFB800"
                    />
                    <span className="font-headline text-lg font-black uppercase tracking-widest text-white">
                      {generateInitials(settings.name)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SWEPT VECTOR WING RIBBON (SPONSOR / STAGE) */}
            <div className="flex flex-1 items-center justify-start">
              <div
                className={`flex items-center justify-start bg-gradient-to-r from-[#FFB800] via-[#FF8A00] to-[#FF2A4B] py-1.5 pl-7 pr-6 text-[#0A0A0A] shadow-[0_10px_25px_rgba(0,0,0,0.85)] ${
                  isPortrait ? 'min-w-[260px]' : 'min-w-[380px]'
                }`}
                style={{
                  clipPath:
                    'polygon(14px 0, calc(100% - 16px) 0, 100% 100%, 0 100%)',
                }}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-headline text-xs font-black uppercase tracking-[0.22em] text-[#0A0A0A]/80">
                    {settings.sponsorName ? 'SPONSOR //' : 'STAGE //'}
                  </span>
                  <span className="truncate font-headline text-base font-black uppercase tracking-[0.14em] text-[#0A0A0A]">
                    {settings.sponsorName ? settings.sponsorName : stageTitle}
                  </span>
                </div>
              </div>
              <div
                className="ml-1.5 h-9 w-4 bg-white"
                style={{
                  clipPath: 'polygon(0 0, 60% 0, 100% 100%, 0 100%)',
                }}
              />
              <div
                className="ml-1.5 hidden h-8 w-5 bg-[#FFB800] sm:block"
                style={{
                  clipPath: 'polygon(0 0, 55% 0, 100% 100%, 0 100%)',
                }}
              />
            </div>
          </div>

          {/* Lower Center Lockup: Giant 3D-Shadowed Poster Title + Interlocking Trapezoid Stamp */}
          <div className="mt-1 flex flex-col items-center text-center">
            <h1
              className={`max-w-full truncate whitespace-nowrap font-headline font-black italic uppercase leading-[0.88] tracking-tight text-white drop-shadow-[0_6px_0_#0A0A0A] ${
                isPortrait ? 'text-[56px]' : 'text-[70px]'
              }`}
            >
              {settings.name}
            </h1>

            {/* Overlapping Interlocking Graphic Stamp Ribbons Under Title */}
            <div className="mt-1.5 flex flex-nowrap items-center justify-center whitespace-nowrap">
              {/* Left Vermilion Stage Tag */}
              <div
                className="relative z-20 shrink-0 bg-[#FF2A4B] pl-5 pr-6 py-1 text-white shadow-lg"
                style={{
                  clipPath:
                    'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                }}
              >
                <span className="block font-headline text-sm font-black uppercase tracking-[0.2em]">
                  {stageTitle}
                </span>
              </div>

              {/* Center Stark White Trapezoid "MATCH STANDING" Stamp */}
              <div
                className="relative z-30 -mx-2 shrink-0 bg-white px-7 py-1 text-[#0A0A0A] shadow-[0_8px_24px_rgba(0,0,0,0.9)]"
                style={{
                  clipPath:
                    'polygon(10px 0, calc(100% - 10px) 0, 100% 100%, 0 100%)',
                }}
              >
                <span className="block font-headline text-lg font-black uppercase tracking-[0.16em] text-[#0A0A0A]">
                  {isRush ? 'CHAMPION RUSH STANDINGS' : 'MATCH STANDING'}
                </span>
              </div>

              {/* Right Solar Gold Subtitle Tag */}
              <div
                className="relative z-20 shrink-0 bg-[#FFB800] pl-6 pr-5 py-1 text-[#0A0A0A] shadow-lg"
                style={{
                  clipPath:
                    'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                }}
              >
                <span className="block font-headline text-sm font-black uppercase tracking-[0.18em]">
                  {matchHeaderSubtitle}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. MIDDLE CONTENT STAGE: 4-Piece Interlocking Polygon Standings Blades + Optional Winner Monolith */}
        <div
          className={`my-auto flex w-full ${
            showWinnerHero
              ? isPortrait
                ? 'flex-col items-center gap-3.5 py-1'
                : 'flex-row items-center gap-9 py-1'
              : 'flex-col py-1'
          }`}
        >
          {/* WINNER MONOLITH SHOWCASE (When Concluded) */}
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
                palette={winnerPalette}
                compact={isPortrait}
              />
            </div>
          )}

          {/* 12 INTERLOCKING 4-BLADE POLYGON STANDINGS ROWS */}
          <div className="flex min-w-0 flex-1 flex-col w-full">
            {/* Interlocking Polygon Column Header Strip */}
            <div className="mb-1.5 flex h-9 w-full items-stretch">
              {/* Piece 1 Header: RANK */}
              <div
                className="flex w-[124px] shrink-0 items-center justify-center bg-[#0E0712] border-t-2 border-l-2 border-[#FFB800] pr-3 font-headline text-xs font-black uppercase tracking-[0.22em] text-[#FFB800]"
                style={{
                  clipPath:
                    'polygon(10px 0, 100% 0, calc(100% - 16px) 100%, 0 100%, 0 10px)',
                }}
              >
                # // SQUAD
              </div>

              {/* Piece 2 Header: TEAM NAME */}
              <div
                className="flex flex-1 items-center justify-between bg-gradient-to-r from-[#FF2A4B] via-[#FF6B00] to-[#FFB800] pl-7 pr-6 font-headline text-xs font-black uppercase tracking-[0.2em] text-white"
                style={{
                  marginLeft: '-10px',
                  clipPath:
                    'polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)',
                }}
              >
                <span className="font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {isRush
                    ? `${rushTarget} POINTS ACTIVATES CHAMPION RUSH`
                    : `OFFICIAL STANDINGS // ${settings.name}`}
                </span>
                <span className="font-black text-[#0A0A0A]">///</span>
              </div>

              {/* Piece 3 Header: BOOYAH / ELIMS / PLACE */}
              <div
                className={`grid shrink-0 items-center bg-[#0E0712] border-t-2 border-[#FF2A4B] px-3 text-center font-headline text-xs font-black uppercase tracking-[0.14em] text-white ${
                  showWinnerHero && !isPortrait
                    ? 'w-[285px] grid-cols-3'
                    : isPortrait
                      ? 'w-[285px] grid-cols-3'
                      : 'w-[360px] grid-cols-3'
                }`}
                style={{
                  marginLeft: '-10px',
                  clipPath:
                    'polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)',
                }}
              >
                <span className="text-[#FFB800]">BOOYAH</span>
                <span>ELIMS</span>
                <span>PLACE</span>
              </div>

              {/* Piece 4 Header: TOTAL */}
              <div
                className={`flex shrink-0 items-center justify-center bg-white pl-3 font-headline text-xs font-black uppercase tracking-[0.18em] text-[#0A0A0A] ${
                  isPortrait ? 'w-[116px]' : 'w-[136px]'
                }`}
                style={{
                  marginLeft: '-10px',
                  clipPath:
                    'polygon(16px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
                }}
              >
                TOTAL
              </div>
            </div>

            {/* 12 Sculpted 4-Piece Interlocking Polygon Team Rows */}
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
                const isRank1 = team.rank === 1;
                const isRank2 = team.rank === 2;
                const isRank3 = team.rank === 3;
                const isTop3 = team.rank <= 3;

                const rowHeight = isPortrait
                  ? showWinnerHero
                    ? 'h-[41px]'
                    : 'h-[56px]'
                  : showWinnerHero
                    ? 'h-[47px]'
                    : 'h-[50px]';

                // Rank Tag Colors (Podium Gold #1, Silver #2, Coral-Bronze #3, Stark White #4-#12)
                const rankBadgeBg = isRank1
                  ? 'linear-gradient(135deg, #FEF08A 0%, #FFB800 55%, #FF6B00 100%)'
                  : isRank2
                    ? 'linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 65%, #94A3B8 100%)'
                    : isRank3
                      ? 'linear-gradient(135deg, #FED7AA 0%, #FF6B00 60%, #FF2A4B 100%)'
                      : '#FFFFFF';

                // Team Name Blade Background (High-Contrast Cream/Gold with Stark Black Text)
                const teamBladeBg = isRank1
                  ? 'linear-gradient(90deg, #FDE047 0%, #FEF08A 55%, #FFFBEB 100%)'
                  : isRank2
                    ? 'linear-gradient(90deg, #E2E8F0 0%, #F8FAFC 100%)'
                    : isRank3
                      ? 'linear-gradient(90deg, #FFEDD5 0%, #FFF7ED 100%)'
                      : 'linear-gradient(90deg, #FFF7E6 0%, #FFFFFF 100%)';

                // 3-Stat Wing Background (Saturated Solar-Gold & Sunset-Orange with Pitch-Black Text)
                const statWingBg = isRank1
                  ? 'linear-gradient(90deg, #FFB800 0%, #FF5500 100%)'
                  : isTop3
                    ? 'linear-gradient(90deg, #FDE047 0%, #FF8A00 100%)'
                    : 'linear-gradient(90deg, #FDE68A 0%, #FFB800 100%)';

                return (
                  <div
                    key={team.teamId}
                    className={`flex w-full items-stretch drop-shadow-[0_6px_14px_rgba(0,0,0,0.8)] ${rowHeight}`}
                  >
                    {/* PIECE 1: Left Rank Tag + Dark Obsidian Logo Spearhead */}
                    <div
                      className="relative flex w-[124px] shrink-0 items-stretch overflow-hidden bg-[#120816] pr-3"
                      style={{
                        clipPath:
                          'polygon(10px 0, 100% 0, calc(100% - 16px) 100%, 0 100%, 0 10px)',
                      }}
                    >
                      {/* Left Accent Stripe */}
                      <div
                        className="h-full w-1.5 shrink-0"
                        style={{
                          background: isRank1
                            ? '#FFB800'
                            : isRank2
                              ? '#FFFFFF'
                              : isRank3
                                ? '#FF6B00'
                                : '#FF2A4B',
                        }}
                      />

                      {/* Skewed Stark White / Podium Rank Number Block */}
                      <div
                        className="my-1 ml-1.5 flex w-[50px] shrink-0 items-center justify-center shadow-md"
                        style={{
                          background: rankBadgeBg,
                          clipPath:
                            'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                        }}
                      >
                        <span
                          className={`font-headline font-black leading-none text-[#0A0A0A] ${
                            isPortrait && showWinnerHero
                              ? 'text-xl'
                              : 'text-2xl'
                          }`}
                        >
                          #{team.rank}
                        </span>
                      </div>

                      {/* Team Logo / Initials Socket */}
                      {settings.showLogos !== false && (
                        <div className="flex flex-1 items-center justify-center pl-1">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt={team.teamName}
                              className="h-7 w-7 object-contain"
                            />
                          ) : (
                            <span className="font-headline text-xs font-black uppercase tracking-wider text-[#FFB800]">
                              {team.shortCode ||
                                generateInitials(team.teamName)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* PIECE 2: Center High-Contrast Ivory/Gold Team Name Slash Blade */}
                    <div
                      className="relative flex flex-1 items-center justify-between pl-7 pr-6 min-w-0"
                      style={{
                        marginLeft: '-10px',
                        background: teamBladeBg,
                        clipPath:
                          'polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)',
                      }}
                    >
                      {/* Bottom Graphic Ink Accent Bar */}
                      <div
                        className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-full"
                        style={{
                          background: isRank1
                            ? '#FF2A4B'
                            : isTop3
                              ? '#FF6B00'
                              : 'rgba(10,10,10,0.2)',
                        }}
                      />

                      {/* Decorative Diagonal Vector Speed Slashes Inside Plate */}
                      <div
                        className="pointer-events-none absolute top-0 right-16 h-full w-8 bg-black/[0.045]"
                        style={{ transform: 'skewX(-20deg)' }}
                      />
                      <div
                        className="pointer-events-none absolute top-0 right-8 h-full w-4 bg-black/[0.045]"
                        style={{ transform: 'skewX(-20deg)' }}
                      />

                      <div className="flex min-w-0 items-center gap-3">
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

                      {isRush && (
                        <div className="ml-2 shrink-0">
                          <BroadcastRushCrownCircle
                            status={team.rushStatus.status}
                            activeBg="#0A0A0A"
                            activeBorder="#0A0A0A"
                            activeIcon="#FFB800"
                            champBg="#FF2A4B"
                            champBorder="#0A0A0A"
                            champIcon="#FFFFFF"
                            size={isPortrait && showWinnerHero ? 'sm' : 'md'}
                          />
                        </div>
                      )}
                    </div>

                    {/* PIECE 3: Saturated Solar-Gold 3-Stat Telemetry Wing (BOOYAH, ELIMS, PLACE) */}
                    <div
                      className={`grid shrink-0 items-center px-3 text-center font-headline font-black text-[#0A0A0A] ${
                        showWinnerHero && !isPortrait
                          ? 'w-[285px] grid-cols-3'
                          : isPortrait
                            ? 'w-[285px] grid-cols-3'
                            : 'w-[360px] grid-cols-3'
                      }`}
                      style={{
                        marginLeft: '-10px',
                        background: statWingBg,
                        clipPath:
                          'polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)',
                      }}
                    >
                      {/* BOOYAH */}
                      <div className="relative flex h-full items-center justify-center">
                        <span
                          className={
                            isPortrait && showWinnerHero
                              ? 'text-xl'
                              : 'text-2xl'
                          }
                        >
                          X{team.booyahCount}
                        </span>
                        <span
                          className="absolute right-0 top-1/4 h-1/2 w-[2px] bg-[#0A0A0A]/35"
                          style={{ transform: 'skewX(-16deg)' }}
                        />
                      </div>

                      {/* ELIMS */}
                      <div className="relative flex h-full items-center justify-center">
                        <span
                          className={
                            isPortrait && showWinnerHero
                              ? 'text-xl'
                              : 'text-2xl'
                          }
                        >
                          {team.killPoints}
                        </span>
                        <span
                          className="absolute right-0 top-1/4 h-1/2 w-[2px] bg-[#0A0A0A]/35"
                          style={{ transform: 'skewX(-16deg)' }}
                        />
                      </div>

                      {/* PLACEMENT POINTS */}
                      <div className="flex h-full items-center justify-center">
                        <span
                          className={
                            isPortrait && showWinnerHero
                              ? 'text-xl'
                              : 'text-2xl'
                          }
                        >
                          {team.placementPoints}
                        </span>
                      </div>
                    </div>

                    {/* PIECE 4: Right Beveled Total Points Spearhead Cap */}
                    <div
                      className={`relative flex shrink-0 items-center justify-center pl-3 font-headline font-black ${
                        isPortrait ? 'w-[116px]' : 'w-[136px]'
                      }`}
                      style={{
                        marginLeft: '-10px',
                        background: isRank1
                          ? 'linear-gradient(135deg, #FF2A4B 0%, #C8102E 100%)'
                          : 'linear-gradient(135deg, #160A1C 0%, #09040C 100%)',
                        clipPath:
                          'polygon(16px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)',
                      }}
                    >
                      {/* Top-Right Corner White/Gold Wedge Accent */}
                      <div
                        className="pointer-events-none absolute top-0 right-0 h-3.5 w-3.5"
                        style={{
                          background: isRank1 ? '#FFFFFF' : '#FFB800',
                          clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                        }}
                      />

                      <span
                        className={`font-black leading-none ${
                          isPortrait && showWinnerHero
                            ? 'text-2xl'
                            : 'text-3xl'
                        } ${isRank1 ? 'text-white' : 'text-[#FFB800]'}`}
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

        {/* 4. BOTTOM FRAMELESS GRAPHIC FOOTER */}
        <footer className="mt-1.5 flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <div
              className="bg-white px-4 py-1 text-[#0A0A0A] shadow-md"
              style={{
                clipPath:
                  'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
              }}
            >
              <span className="block font-headline text-xs font-black uppercase tracking-[0.22em]">
                ESP CALC BROADCAST • MADE BY MR. OPPY
              </span>
            </div>

            {isRush && (
              <div className="flex items-center gap-4 pl-2">
                <div className="flex items-center gap-2">
                  <BroadcastRushCrownCircle
                    status="CHAMPION"
                    champBg="#FF2A4B"
                    champBorder="#FFFFFF"
                    champIcon="#FFFFFF"
                    size="sm"
                  />
                  <span className="font-headline text-xs font-black uppercase tracking-[0.16em] text-[#FEF08A]">
                    WON BY CHAMPION RUSH
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BroadcastRushCrownCircle
                    status="ACTIVE"
                    activeBg="#0A0A0A"
                    activeBorder="#FFB800"
                    activeIcon="#FFB800"
                    size="sm"
                  />
                  <span className="font-headline text-xs font-black uppercase tracking-[0.16em] text-white/90">
                    SATISFIED CONDITION ({rushTarget} PTS)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div
            className="bg-[#FFB800] px-4 py-1 text-[#0A0A0A] shadow-md"
            style={{
              clipPath:
                'polygon(8px 0, 100% 0, 100% 100%, 0 100%)',
            }}
          >
            <span className="block font-headline text-xs font-black uppercase tracking-[0.2em]">
              {settings.name} // {stageTitle}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
