import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';

export const ThemeEmeraldStreet: React.FC<GraphicThemeProps> = ({
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
  const maxPoints = Math.max(
    1,
    ...standings.map((t) => t.totalPoints),
    isRush ? rushTarget : 1
  );

  const winnerPalette = {
    outerBorder: 'linear-gradient(135deg, #34D399 0%, #10B981 55%, #064E3B 100%)',
    cornerWedge: '#10B981',
    headerBg: '#10B981',
    headerText: '#030906',
    chamberBg: 'linear-gradient(180deg, #061810 0%, #020906 100%)',
    crownColor: '#10B981',
    initialsColor: '#34D399',
    bladeBg: '#10B981',
    bladeText: '#030906',
    statTextColor: '#34D399',
    subStatBg: 'rgba(6, 24, 16, 0.95)',
    subStatBorder: 'rgba(16, 185, 129, 0.55)',
    subStatLabel: '#6EE7B7',
    glowColor: 'rgba(16, 185, 129, 0.6)',
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#040B08] text-white select-none">
      {/* 1. BACKGROUND: Carbon Industrial Grid + Giant Hollow Stencil Watermark + Caution Stripes */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="emerald-hazard"
            width="24"
            height="24"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="24"
              stroke="rgba(16, 185, 129, 0.18)"
              strokeWidth="10"
            />
          </pattern>
        </defs>

        {/* Bottom Hazard Strip */}
        <rect
          x="0"
          y={isPortrait ? '1334' : '1064'}
          width="100%"
          height="16"
          fill="url(#emerald-hazard)"
        />
      </svg>

      {/* Giant Outlined Stencil Background Watermark */}
      <div
        className="pointer-events-none absolute bottom-10 right-8 font-headline text-[190px] font-black uppercase leading-none tracking-tighter opacity-[0.04]"
        style={{
          WebkitTextStroke: '3px #10B981',
          color: 'transparent',
        }}
      >
        STANDINGS
      </div>

      {/* 2. TOP FULL-WIDTH SOLID ACID-EMERALD INDUSTRIAL HEADER SLAB */}
      <header className="relative z-20 flex w-full items-stretch justify-between border-b-4 border-white bg-[#10B981] text-[#030906] shadow-[0_16px_40px_rgba(0,0,0,0.8)]">
        {/* Left: Tournament Emblem + Stark Black Brutalist Title */}
        <div
          className={`flex items-center gap-5 ${
            isPortrait ? 'px-8 py-5' : 'px-12 py-5'
          }`}
        >
          <div className="flex h-20 w-20 shrink-0 items-center justify-center border-2 border-[#030906] bg-[#030906] p-2 text-[#10B981] shadow-lg">
            {tournamentLogo ? (
              <img
                src={tournamentLogo}
                alt={settings.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center">
                <BroadcastCrownSvg className="h-7 w-7" color="#10B981" />
                <span className="font-headline text-sm font-black uppercase tracking-widest text-white">
                  {generateInitials(settings.name)}
                </span>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
              <span className="shrink-0 bg-[#030906] px-3 py-0.5 font-headline text-xs font-black uppercase tracking-[0.24em] text-[#10B981]">
                /// {settings.roundOrDay || 'OFFICIAL FEED'}
              </span>
              <span className="shrink-0 border border-[#030906] bg-white px-2.5 py-0.5 font-headline text-xs font-black uppercase tracking-[0.2em] text-[#030906]">
                {matchHeaderSubtitle}
              </span>
            </div>
            <h1
              className={`mt-1 truncate whitespace-nowrap font-headline font-black uppercase leading-[0.9] tracking-tight text-[#030906] ${
                isPortrait ? 'text-5xl' : 'text-6xl'
              }`}
            >
              {settings.name}
            </h1>
          </div>
        </div>

        {/* Right: Pitch-Black Cut-Out Organizer & Sponsor Telemetry Block */}
        <div
          className={`flex flex-col justify-center bg-[#030906] text-white ${
            isPortrait ? 'px-8 min-w-[290px]' : 'px-12 min-w-[380px]'
          }`}
          style={{
            clipPath: 'polygon(28px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        >
          <div className="pl-4 flex flex-col gap-1">
            {settings.hostName && (
              <div className="flex items-center justify-between gap-4">
                <span className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-[#10B981]">
                  ORGANIZER //
                </span>
                <span className="truncate font-headline text-lg font-black uppercase tracking-wider text-white">
                  {settings.hostName}
                </span>
              </div>
            )}
            {settings.sponsorName && (
              <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-1">
                <span className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-[#10B981]">
                  SPONSOR //
                </span>
                <span className="truncate font-headline text-lg font-black uppercase tracking-wider text-[#6EE7B7]">
                  {settings.sponsorName}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-1">
              <span className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-[#10B981]">
                FORMAT //
              </span>
              <span className="font-headline text-sm font-black uppercase tracking-[0.18em] text-white">
                {isRush
                  ? `CHAMPION RUSH (${rushTarget} PTS)`
                  : 'BATTLE ROYALE STANDINGS'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. MIDDLE CONTENT STAGE */}
      <div
        className={`relative z-20 my-auto flex w-full flex-1 ${
          showWinnerHero
            ? isPortrait
              ? 'flex-col items-center justify-center gap-5 px-9 py-4'
              : 'flex-row items-center justify-between gap-10 px-12 py-4'
            : isPortrait
              ? 'flex-col justify-center px-9 py-5'
              : 'flex-col justify-center px-12 py-5'
        }`}
      >
        {/* WINNER MONOLITH (When Concluded) */}
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
              palette={winnerPalette}
              compact={isPortrait}
            />
          </div>
        )}

        {/* DETACHED STENCIL ROWS WITH EMBEDDED PROPORTIONAL POINTS BAR */}
        <div className="flex flex-1 flex-col justify-center w-full">
          {/* Column Header */}
          <div className="mb-2 flex items-center gap-3 font-headline text-sm font-black uppercase tracking-[0.2em] text-[#10B981]">
            <div className="w-16 text-center">POS</div>
            <div className="flex-1 pl-4">SQUAD // POINT RATIO</div>
            <div
              className={`grid shrink-0 text-center ${
                isPortrait ? 'w-[310px] grid-cols-3' : 'w-[360px] grid-cols-3'
              }`}
            >
              <span>BOOYAH</span>
              <span>ELIMS</span>
              <span>PLACE</span>
            </div>
            <div className="w-28 text-center text-white">TOTAL</div>
          </div>

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
              const pct = Math.min(
                100,
                Math.round((team.totalPoints / maxPoints) * 100)
              );
              const rowHeight = isPortrait
                ? showWinnerHero
                  ? 'h-[42px]'
                  : 'h-[58px]'
                : showWinnerHero
                  ? 'h-[48px]'
                  : 'h-[54px]';

              return (
                <div
                  key={team.teamId}
                  className={`flex w-full items-stretch gap-3 ${rowHeight}`}
                >
                  {/* 1. Detached Left Brutalist Rank Block */}
                  <div
                    className={`flex w-16 shrink-0 items-center justify-center border-2 font-headline font-black ${
                      isPortrait && showWinnerHero ? 'text-2xl' : 'text-3xl'
                    } ${
                      isTop1
                        ? 'border-white bg-[#10B981] text-[#030906]'
                        : isTop3
                          ? 'border-[#10B981] bg-[#062419] text-[#34D399]'
                          : 'border-white/20 bg-[#0A1612] text-white'
                    }`}
                  >
                    #{team.rank}
                  </div>

                  {/* 2. Center Carbon Bar with Live Proportional Points Meter Along Bottom */}
                  <div
                    className={`relative flex flex-1 items-center overflow-hidden border ${
                      isTop1
                        ? 'border-[#10B981] bg-[#0B241A]'
                        : 'border-white/15 bg-[#091410]'
                    }`}
                  >
                    {/* Live Proportional Neon Progress Bar Along Bottom Edge */}
                    <div className="pointer-events-none absolute bottom-0 left-0 h-1.5 w-full bg-black/60">
                      <div
                        className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Team Logo + Name */}
                    <div className="flex flex-1 items-center justify-between px-4 min-w-0">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {settings.showLogos !== false && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#10B981]/40 bg-[#030906] p-1">
                            {team.logoUrl ? (
                              <img
                                src={team.logoUrl}
                                alt={team.teamName}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span className="font-headline text-xs font-black text-[#10B981]">
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
                          activeBg="#030906"
                          activeBorder="#10B981"
                          activeIcon="#10B981"
                          champBg="#10B981"
                          champBorder="#FFFFFF"
                          champIcon="#030906"
                          size="sm"
                        />
                      )}
                    </div>

                    {/* Stat Columns (BOOYAH, ELIMS, PLACE) */}
                    <div
                      className={`grid shrink-0 items-center border-l border-white/10 text-center font-headline font-black text-white ${
                        isPortrait
                          ? 'w-[310px] grid-cols-3'
                          : 'w-[360px] grid-cols-3'
                      }`}
                    >
                      <span
                        className={
                          isPortrait && showWinnerHero
                            ? 'text-xl'
                            : 'text-2xl'
                        }
                      >
                        {team.booyahCount}
                      </span>
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

                  {/* 3. Detached Solid Acid-Emerald Total Points Block */}
                  <div
                    className={`flex w-28 shrink-0 items-center justify-center border-2 font-headline font-black ${
                      isPortrait && showWinnerHero ? 'text-2xl' : 'text-3xl'
                    } ${
                      isTop1
                        ? 'border-white bg-white text-[#030906]'
                        : 'border-[#10B981] bg-[#10B981] text-[#030906]'
                    }`}
                  >
                    {team.totalPoints}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM INDUSTRIAL STENCIL FOOTER */}
      <footer className="relative z-20 flex h-10 w-full items-center justify-between gap-4 border-t border-[#10B981]/40 bg-[#030906] px-10 font-headline text-xs font-black uppercase tracking-[0.24em] text-[#6EE7B7]">
        <span className="truncate whitespace-nowrap">
          /// {settings.name} • VERIFIED TELEMETRY
        </span>
        <span className="shrink-0 whitespace-nowrap text-[#10B981]">
          ESP CALC BROADCAST • MADE BY MR. OPPY
        </span>
      </footer>
    </div>
  );
};
