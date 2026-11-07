import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';

export const ThemeCrimsonBlade: React.FC<GraphicThemeProps> = ({
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

  const winnerPalette = {
    outerBorder: 'linear-gradient(135deg, #FFFFFF 0%, #EF4444 50%, #7F1D1D 100%)',
    cornerWedge: '#FFFFFF',
    headerBg: 'linear-gradient(90deg, #991B1B 0%, #DC2626 50%, #991B1B 100%)',
    headerText: '#FFFFFF',
    chamberBg: 'linear-gradient(180deg, #1F0608 0%, #0D0203 100%)',
    crownColor: '#FFFFFF',
    initialsColor: '#EF4444',
    bladeBg: '#FFFFFF',
    bladeText: '#7F1D1D',
    statTextColor: '#FCA5A5',
    subStatBg: 'rgba(31, 6, 8, 0.92)',
    subStatBorder: 'rgba(239, 68, 68, 0.5)',
    subStatLabel: '#FCA5A5',
    glowColor: 'rgba(220, 38, 38, 0.6)',
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#0E0708] text-white select-none">
      {/* 1. ARCHITECTURAL BACKGROUND: Dark Charcoal + Diagonal Spotlight + Top-Left Silver/Crimson Blades */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="crimson-spotlight" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="45%" stopColor="rgba(220,38,38,0.12)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <linearGradient id="silver-blade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="crimson-blade-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>
        </defs>

        {/* Diagonal Volumetric Spotlight Beam */}
        <polygon
          points={
            isPortrait
              ? '0,0 520,0 920,1350 0,1350'
              : '0,0 640,0 1050,1080 0,1080'
          }
          fill="url(#crimson-spotlight)"
        />

        {/* Top-Left 3D Metallic Silver & Crimson Razor Blades (Reference 3) */}
        <polygon points="0,0 440,0 0,290" fill="#1E293B" />
        <polygon points="0,0 390,0 0,245" fill="url(#silver-blade)" />
        <polygon points="0,0 260,0 0,165" fill="url(#crimson-blade-grad)" />
        <polygon points="0,0 140,0 0,90" fill="#090405" />
        <line
          x1="0"
          y1="265"
          x2="415"
          y2="0"
          stroke="#EF4444"
          strokeWidth="5"
        />

        {/* Subtle Right Background Diagonal Geometry */}
        <polygon
          points={
            isPortrait
              ? '1080,0 820,0 1080,320'
              : '1920,0 1520,0 1920,360'
          }
          fill="rgba(153, 27, 27, 0.18)"
        />
      </svg>

      {/* 2. MAIN CONTENT STAGE */}
      <div
        className={`relative z-20 flex flex-1 ${
          isPortrait
            ? 'flex-col justify-between px-9 pt-8 pb-5'
            : 'flex-row items-center justify-between gap-10 px-12 pt-8 pb-6'
        }`}
      >
        {/* LEFT ARCHITECTURAL COLUMN (16:9 Sidebar OR 4:5 Top Poster Lockup) */}
        <div
          className={
            isPortrait
              ? 'flex w-full flex-col gap-4'
              : 'flex h-full w-[470px] shrink-0 flex-col items-center justify-center'
          }
        >
          {/* Poster Header Lockup (Always visible in 4:5, or in 16:9 when not replaced by full winner monolith) */}
          {(!showWinnerHero || isPortrait) && (
            <div
              className={`flex w-full ${
                isPortrait
                  ? 'flex-row items-center justify-between gap-6'
                  : 'flex-col items-center'
              }`}
            >
              {/* 3D Dark-Crimson Emblem Pedestal Box (Directly from Reference 3) */}
              <div
                className={`relative flex flex-col items-center justify-center border-2 border-[#DC2626] bg-gradient-to-b from-[#2A070A] to-[#0D0203] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.9)] ${
                  isPortrait
                    ? 'h-[165px] w-[200px] shrink-0'
                    : 'h-[280px] w-[320px]'
                }`}
              >
                {/* Corner Metallic Accents */}
                <div className="absolute top-0 left-0 h-4 w-4 border-t-4 border-l-4 border-white" />
                <div className="absolute top-0 right-0 h-4 w-4 border-t-4 border-r-4 border-white" />
                <div className="absolute bottom-0 left-0 h-4 w-4 border-b-4 border-l-4 border-white" />
                <div className="absolute bottom-0 right-0 h-4 w-4 border-b-4 border-r-4 border-white" />

                {tournamentLogo ? (
                  <img
                    src={tournamentLogo}
                    alt={settings.name}
                    className={`object-contain drop-shadow-[0_12px_25px_rgba(220,38,38,0.55)] ${
                      isPortrait ? 'h-24 w-24' : 'h-40 w-40'
                    }`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <BroadcastCrownSvg
                      className={isPortrait ? 'h-10 w-10' : 'h-16 w-16'}
                      color="#EF4444"
                    />
                    <span
                      className={`mt-1 font-headline font-black uppercase tracking-widest text-white ${
                        isPortrait ? 'text-2xl' : 'text-4xl'
                      }`}
                    >
                      {generateInitials(settings.name)}
                    </span>
                  </div>
                )}

                <div className="mt-2 w-full border-t border-red-500/30 pt-1.5 text-center">
                  <span className="block truncate font-headline text-xs font-black uppercase tracking-[0.22em] text-red-200">
                    {settings.name}
                  </span>
                </div>
              </div>

              {/* Stark White "MATCH STANDING" Block + Organizer/Sponsor Plaque */}
              <div
                className={`flex flex-col ${
                  isPortrait ? 'flex-1' : 'mt-5 w-[320px]'
                }`}
              >
                {/* Stark Solid White Title Block (Reference 3 Signature) */}
                <div className="border-l-8 border-[#DC2626] bg-white px-5 py-3 text-[#0A0A0A] shadow-[0_16px_40px_rgba(0,0,0,0.85)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate whitespace-nowrap font-headline text-sm font-black uppercase tracking-[0.2em] text-[#7F1D1D]">
                      {settings.roundOrDay || 'OFFICIAL'}
                    </span>
                    <span className="shrink-0 whitespace-nowrap bg-[#991B1B] px-2 py-0.5 font-headline text-[10px] font-black uppercase tracking-[0.14em] text-white">
                      {matchHeaderSubtitle}
                    </span>
                  </div>
                  <h1
                    className={`mt-0.5 font-headline font-black uppercase leading-[0.86] tracking-tight text-[#0A0A0A] ${
                      isPortrait ? 'text-6xl' : 'text-[64px]'
                    }`}
                  >
                    STANDING
                  </h1>
                </div>

                {/* Solid Crimson & Obsidian Organizer / Sponsor Telemetry Block */}
                <div className="mt-2.5 flex flex-col gap-1 border border-red-500/40 bg-[#1A0507] px-5 py-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-red-300/80">
                      TOURNAMENT
                    </span>
                    <span className="truncate font-headline text-sm font-black uppercase tracking-[0.14em] text-white">
                      {settings.name}
                    </span>
                  </div>
                  {settings.hostName && (
                    <div className="flex items-center justify-between border-t border-white/10 pt-1">
                      <span className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-red-300/80">
                        ORGANIZER
                      </span>
                      <span className="truncate font-headline text-sm font-black uppercase tracking-[0.14em] text-[#FCA5A5]">
                        {settings.hostName}
                      </span>
                    </div>
                  )}
                  {settings.sponsorName && (
                    <div className="flex items-center justify-between border-t border-white/10 pt-1">
                      <span className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-red-300/80">
                        SPONSOR
                      </span>
                      <span className="truncate font-headline text-sm font-black uppercase tracking-[0.14em] text-white">
                        {settings.sponsorName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* WINNER MONOLITH IN LEFT SIDEBAR (16:9 Concluded) OR BELOW HEADER (4:5 Concluded) */}
          {showWinnerHero && championTeam && (
            <div className="flex w-full flex-col items-center justify-center">
              {!isPortrait && (
                <div className="mb-4 flex w-[360px] flex-col">
                  {/* Stark Solid White Title Block (Reference 3 Signature) */}
                  <div className="border-l-8 border-[#DC2626] bg-white px-5 py-2.5 text-[#0A0A0A] shadow-[0_14px_30px_rgba(0,0,0,0.85)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.18em] text-[#7F1D1D]">
                        {settings.roundOrDay || 'OFFICIAL'}
                      </span>
                      <span className="shrink-0 whitespace-nowrap bg-[#991B1B] px-2 py-0.5 font-headline text-[10px] font-black uppercase tracking-[0.14em] text-white">
                        {matchHeaderSubtitle}
                      </span>
                    </div>
                    <h1 className="mt-0.5 font-headline text-5xl font-black uppercase leading-[0.86] tracking-tight text-[#0A0A0A]">
                      STANDING
                    </h1>
                  </div>

                  {/* Compact Crimson & Obsidian Organizer / Sponsor Telemetry Block */}
                  <div className="mt-1.5 flex flex-col gap-0.5 border border-red-500/40 bg-[#1A0507] px-4 py-2 shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-headline text-[11px] font-bold uppercase tracking-[0.2em] text-red-300/80">
                        TOURNAMENT
                      </span>
                      <span className="truncate font-headline text-xs font-black uppercase tracking-[0.12em] text-white">
                        {settings.name}
                      </span>
                    </div>
                    {settings.hostName && (
                      <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-0.5">
                        <span className="font-headline text-[11px] font-bold uppercase tracking-[0.2em] text-red-300/80">
                          ORGANIZER
                        </span>
                        <span className="truncate font-headline text-xs font-black uppercase tracking-[0.12em] text-[#FCA5A5]">
                          {settings.hostName}
                        </span>
                      </div>
                    )}
                    {settings.sponsorName && (
                      <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-0.5">
                        <span className="font-headline text-[11px] font-bold uppercase tracking-[0.2em] text-red-300/80">
                          SPONSOR
                        </span>
                        <span className="truncate font-headline text-xs font-black uppercase tracking-[0.12em] text-white">
                          {settings.sponsorName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <BroadcastWinnerMonolith
                championTeam={championTeam}
                settings={settings}
                palette={winnerPalette}
                compact={true}
              />
            </div>
          )}
        </div>

        {/* RIGHT SOLID CRIMSON STANDINGS TABLE (Directly from Reference 3) */}
        <div className="flex flex-1 flex-col justify-center w-full">
          {/* Floating White Uppercase Column Headers */}
          <div className="mb-2 flex w-full items-center px-1 font-headline text-base font-black uppercase tracking-[0.16em] text-white">
            <div className="w-[74px] text-center">#</div>
            <div className="flex-1 pl-4">TEAM NAME</div>
            <div
              className={`grid shrink-0 text-center ${
                isPortrait ? 'w-[380px] grid-cols-4' : 'w-[460px] grid-cols-4'
              }`}
            >
              <span>BOOYAH</span>
              <span>KILLS</span>
              <span>POS.</span>
              <span className="text-[#FCA5A5]">TOTAL</span>
            </div>
          </div>

          {/* 12 Solid Deep-Crimson Rows with Diagonal-Slash Dark Maroon Rank Blocks */}
          <div
            className={`flex flex-col ${
              isPortrait
                ? showWinnerHero
                  ? 'gap-1'
                  : 'gap-2'
                : 'gap-2'
            }`}
          >
            {standings.map((team) => {
              const isTop1 = team.rank === 1;
              const isTop3 = team.rank <= 3;
              const rowHeight = isPortrait
                ? showWinnerHero
                  ? 'h-[42px]'
                  : 'h-[58px]'
                : 'h-[56px]';

              return (
                <div
                  key={team.teamId}
                  className={`relative flex w-full items-stretch overflow-hidden ${rowHeight} ${
                    isTop1
                      ? 'ring-2 ring-white shadow-[0_8px_25px_rgba(220,38,38,0.5)]'
                      : ' border-b border-red-950/80 shadow-[0_6px_16px_rgba(0,0,0,0.65)]'
                  }`}
                  style={{
                    background: isTop1
                      ? 'linear-gradient(90deg, #B91C1C 0%, #DC2626 55%, #991B1B 100%)'
                      : isTop3
                        ? 'linear-gradient(90deg, #991B1B 0%, #7F1D1D 100%)'
                        : 'linear-gradient(90deg, #7F1D1D 0%, #5C0F14 100%)',
                  }}
                >
                  {/* Left Dark-Maroon Diagonal-Slash Rank Block */}
                  <div
                    className="relative flex w-[84px] shrink-0 items-center justify-center bg-[#3B060A] pr-3"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 76% 100%, 0 100%)',
                    }}
                  >
                    <span
                      className={`font-headline font-black leading-none ${
                        isPortrait && showWinnerHero ? 'text-2xl' : 'text-3xl'
                      } ${isTop1 ? 'text-white' : 'text-red-100'}`}
                    >
                      {team.rank}
                    </span>
                  </div>

                  {/* Diagonal White Accent Slash Line */}
                  <div
                    className="pointer-events-none absolute top-0 left-[62px] h-full w-[3px] bg-white/30"
                    style={{ transform: 'skewX(-18deg)' }}
                  />

                  {/* Team Logo + Stark White Team Name */}
                  <div className="flex flex-1 items-center justify-between pl-3 pr-4 min-w-0">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {settings.showLogos !== false && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-black/35 border border-white/15 p-1">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt={team.teamName}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="font-headline text-xs font-black uppercase text-white">
                              {team.shortCode ||
                                generateInitials(team.teamName)}
                            </span>
                          )}
                        </div>
                      )}

                      <span
                        className={`truncate font-headline font-black uppercase tracking-wider text-white ${
                          isPortrait && showWinnerHero
                            ? 'text-xl'
                            : 'text-2xl'
                        }`}
                      >
                        {team.teamName}
                      </span>
                    </div>

                    {isRush && (
                      <BroadcastRushCrownCircle
                        status={team.rushStatus.status}
                        activeBg="#3B060A"
                        activeBorder="#FFFFFF"
                        activeIcon="#FFFFFF"
                        champBg="#FFFFFF"
                        champBorder="#3B060A"
                        champIcon="#991B1B"
                        size={isPortrait && showWinnerHero ? 'sm' : 'md'}
                      />
                    )}
                  </div>

                  {/* Right Stat Columns (BOOYAH, KILLS, POS., TOTAL) */}
                  <div
                    className={`grid shrink-0 items-center text-center font-headline font-black text-white ${
                      isPortrait
                        ? 'w-[380px] grid-cols-4'
                        : 'w-[460px] grid-cols-4'
                    }`}
                  >
                    <span
                      className={
                        isPortrait && showWinnerHero ? 'text-xl' : 'text-2xl'
                      }
                    >
                      {team.booyahCount}
                    </span>
                    <span
                      className={
                        isPortrait && showWinnerHero ? 'text-xl' : 'text-2xl'
                      }
                    >
                      {team.killPoints}
                    </span>
                    <span
                      className={
                        isPortrait && showWinnerHero ? 'text-xl' : 'text-2xl'
                      }
                    >
                      {team.placementPoints}
                    </span>
                    <div className="flex h-full items-center justify-center bg-black/25 border-l border-white/15">
                      <span
                        className={
                          isPortrait && showWinnerHero
                            ? 'text-2xl'
                            : 'text-3xl'
                        }
                      >
                        {team.totalPoints}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM FULL-WIDTH CRIMSON ANCHOR BAR (Directly from Reference 3) */}
      <footer className="relative z-20 flex h-11 w-full items-center justify-between gap-4 bg-gradient-to-r from-[#8E1118] via-[#B91C1C] to-[#7F1D1D] px-10 border-t-2 border-white/25">
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.2em] text-white">
          <span className="truncate">{settings.name}</span>
          {settings.hostName && (
            <span className="shrink-0">// HOSTED BY {settings.hostName}</span>
          )}
          {settings.sponsorName && !isPortrait && (
            <span className="shrink-0">
              // SPONSORED BY {settings.sponsorName}
            </span>
          )}
          {isRush && (
            <span className="shrink-0 bg-black/40 px-3 py-0.5 text-red-200">
              RUSH TARGET: {rushTarget} PTS
            </span>
          )}
        </div>
        <div className="shrink-0 whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.24em] text-white">
          ESP CALC BROADCAST • MADE BY MR. OPPY
        </div>
      </footer>
    </div>
  );
};
