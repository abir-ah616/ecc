import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';

export const ThemeRoyalGoldPodium: React.FC<GraphicThemeProps> = ({
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
    outerBorder: 'linear-gradient(135deg, #FEF08A 0%, #D4AF37 50%, #78350F 100%)',
    cornerWedge: '#FEF08A',
    headerBg: 'linear-gradient(90deg, #92400E 0%, #D4AF37 50%, #92400E 100%)',
    headerText: '#090704',
    chamberBg: 'linear-gradient(180deg, #17120A 0%, #090704 100%)',
    crownColor: '#FDE047',
    initialsColor: '#FDE047',
    bladeBg: 'linear-gradient(90deg, #FEF08A 0%, #D4AF37 50%, #B45309 100%)',
    bladeText: '#090704',
    statTextColor: '#FDE047',
    subStatBg: 'rgba(23, 18, 10, 0.95)',
    subStatBorder: 'rgba(212, 175, 55, 0.55)',
    subStatLabel: '#FDE68A',
    glowColor: 'rgba(212, 175, 55, 0.55)',
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#080604] text-white select-none">
      {/* 1. BACKGROUND: Luxury Obsidian Marble + Art-Deco Gold Rays & Double Filigree Frame */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="gold-radial" cx="50%" cy="18%" r="65%">
            <stop offset="0%" stopColor="rgba(212, 175, 55, 0.28)" />
            <stop offset="50%" stopColor="rgba(120, 53, 15, 0.1)" />
            <stop offset="100%" stopColor="rgba(8, 6, 4, 0)" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#gold-radial)" />

        {/* Art-Deco Outer Gold Filigree Border */}
        <rect
          x="22"
          y="22"
          width={isPortrait ? '1036' : '1876'}
          height={isPortrait ? '1306' : '1036'}
          fill="none"
          stroke="rgba(212, 175, 55, 0.32)"
          strokeWidth="2"
        />
        <rect
          x="30"
          y="30"
          width={isPortrait ? '1020' : '1860'}
          height={isPortrait ? '1290' : '1020'}
          fill="none"
          stroke="rgba(212, 175, 55, 0.14)"
          strokeWidth="1"
        />
      </svg>

      {/* 2. MAIN CONTENT CONTAINER */}
      <div
        className={`relative z-20 flex flex-1 flex-col justify-between ${
          isPortrait ? 'px-10 pt-8 pb-6' : 'px-14 pt-8 pb-6'
        }`}
      >
        {/* TOP SYMMETRICAL ART-DECO WINGED HEADER */}
        <header className="flex w-full flex-col items-center text-center">
          {/* Top Organizer & Sponsor Prestige Bar */}
          <div className="mb-2 flex flex-nowrap items-center gap-4 whitespace-nowrap">
            <div className="h-[1px] w-20 shrink-0 bg-gradient-to-r from-transparent to-[#D4AF37]" />
            <div className="flex flex-nowrap items-center gap-3 font-headline text-xs font-black uppercase tracking-[0.28em] text-[#FDE68A]">
              <span>{settings.roundOrDay || 'CHAMPIONSHIP SERIES'}</span>
              {settings.hostName && (
                <>
                  <span className="text-[#D4AF37]">&bull;</span>
                  <span>PRESENTED BY {settings.hostName}</span>
                </>
              )}
              {settings.sponsorName && (
                <>
                  <span className="text-[#D4AF37]">&bull;</span>
                  <span>PARTNER: {settings.sponsorName}</span>
                </>
              )}
            </div>
            <div className="h-[1px] w-20 shrink-0 bg-gradient-to-l from-transparent to-[#D4AF37]" />
          </div>

          {/* Center Winged Emblem + Giant Gold Headline */}
          <div className="flex flex-nowrap items-center justify-center gap-5 whitespace-nowrap">
            {tournamentLogo ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm border border-[#D4AF37] bg-[#140F08] p-1.5 shadow-[0_0_25px_rgba(212,175,55,0.35)]">
                <img
                  src={tournamentLogo}
                  alt={settings.name}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#D4AF37] bg-[#140F08]">
                <BroadcastCrownSvg className="h-9 w-9" color="#FDE047" />
              </div>
            )}

            <div className="flex flex-col items-start text-left">
              <h1
                className={`whitespace-nowrap font-headline font-black uppercase leading-[0.9] tracking-wider text-[#FDE047] drop-shadow-[0_4px_18px_rgba(212,175,55,0.35)] ${
                  isPortrait ? 'text-5xl' : 'text-6xl'
                }`}
              >
                {settings.name}
              </h1>
              <div className="mt-1.5 flex flex-nowrap items-center gap-2 whitespace-nowrap">
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#B45309] px-3 py-0.5 font-headline text-xs font-black uppercase tracking-[0.22em] text-[#080604]">
                  {matchHeaderSubtitle}
                </span>
                {isRush && (
                  <span className="border border-[#D4AF37]/50 bg-[#140F08] px-3 py-0.5 font-headline text-xs font-bold uppercase tracking-[0.18em] text-[#FDE68A]">
                    CHAMPION RUSH TARGET: {rushTarget} PTS
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* MIDDLE STAGE: Standard 12-Row Royal Gold Standings Table + Optional Winner Monolith */}
        <div
          className={`my-auto flex w-full ${
            showWinnerHero
              ? isPortrait
                ? 'flex-col items-center gap-4 py-2'
                : 'flex-row items-center gap-10 py-2'
              : 'flex-col py-2'
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
                palette={winnerPalette}
                compact={isPortrait}
              />
            </div>
          )}

          {/* 12-ROW ROYAL GOLD STANDINGS TABLE */}
          <div className="flex min-w-0 flex-1 flex-col w-full">
            <div className="mb-2 flex items-center border-b-2 border-[#D4AF37]/50 pb-1.5 font-headline text-sm font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              <div className="w-18 text-center">RANK</div>
              <div className="flex-1 pl-4">CONTENDER SQUAD</div>
              <div
                className={`grid shrink-0 text-center ${
                  isPortrait
                    ? 'w-[380px] grid-cols-4'
                    : showWinnerHero
                      ? 'w-[440px] grid-cols-4'
                      : 'w-[520px] grid-cols-4'
                }`}
              >
                <span>BOOYAH</span>
                <span>ELIMS</span>
                <span>PLACE</span>
                <span className="text-[#FDE047]">TOTAL PTS</span>
              </div>
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
                const isTop2 = team.rank === 2;
                const isTop3 = team.rank === 3;
                const rowHeight = isPortrait
                  ? showWinnerHero
                    ? 'h-[42px]'
                    : 'h-[58px]'
                  : showWinnerHero
                    ? 'h-[48px]'
                    : 'h-[54px]';

                const rankCellStyle = isTop1
                  ? 'bg-gradient-to-r from-[#FEF08A] via-[#D4AF37] to-[#B45309] text-[#080604]'
                  : isTop2
                    ? 'bg-gradient-to-r from-[#F8FAFC] to-[#94A3B8] text-[#080604]'
                    : isTop3
                      ? 'bg-gradient-to-r from-[#FBBF24] to-[#92400E] text-[#080604]'
                      : 'bg-[#1C150B] text-[#FDE68A]';

                return (
                  <div
                    key={team.teamId}
                    className={`flex w-full items-center border ${rowHeight} ${
                      isTop1
                        ? 'border-[#FDE047] bg-gradient-to-r from-[#3B2A10] via-[#221809] to-[#140E05] shadow-[0_6px_22px_rgba(212,175,55,0.28)]'
                        : isTop2 || isTop3
                          ? 'border-[#D4AF37]/60 bg-gradient-to-r from-[#241A0B] to-[#120E08]'
                          : 'border-[#D4AF37]/30 bg-[#120E08]/95'
                    }`}
                  >
                    {/* Left Royal Rank Chamber */}
                    <div
                      className={`flex h-full w-18 shrink-0 items-center justify-center border-r border-[#D4AF37]/30 font-headline font-black ${
                        isPortrait && showWinnerHero ? 'text-xl' : 'text-2xl'
                      } ${rankCellStyle}`}
                    >
                      #{team.rank}
                    </div>

                    {/* Team Logo + Team Name + Rush Crown */}
                    <div className="flex min-w-0 flex-1 items-center justify-between px-4">
                      <div className="flex min-w-0 items-center gap-3.5">
                        {settings.showLogos !== false && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#D4AF37]/40 bg-[#080604] p-1">
                            {team.logoUrl ? (
                              <img
                                src={team.logoUrl}
                                alt={team.teamName}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span className="font-headline text-xs font-black text-[#FDE047]">
                                {team.shortCode ||
                                  generateInitials(team.teamName)}
                              </span>
                            )}
                          </div>
                        )}
                        <span
                          className={`truncate font-headline font-black uppercase tracking-wider ${
                            isTop1 ? 'text-[#FEF08A]' : 'text-white'
                          } ${
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
                          activeBg="#17120A"
                          activeBorder="#FDE047"
                          activeIcon="#FDE047"
                          champBg="#FDE047"
                          champBorder="#080604"
                          champIcon="#080604"
                          size="sm"
                        />
                      )}
                    </div>

                    {/* Right 4 Stat Columns (BOOYAH, ELIMS, PLACE, TOTAL) */}
                    <div
                      className={`grid h-full shrink-0 items-center text-center font-headline font-black text-white ${
                        isPortrait
                          ? 'w-[380px] grid-cols-4'
                          : showWinnerHero
                            ? 'w-[440px] grid-cols-4'
                            : 'w-[520px] grid-cols-4'
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
                      <div
                        className={`flex h-full items-center justify-center border-l border-[#D4AF37]/30 ${
                          isTop1
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-[#080604]'
                            : 'bg-[#1C150B]/90 text-[#FDE047]'
                        }`}
                      >
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

        {/* BOTTOM ROYAL GOLD FOOTER */}
        <footer className="flex items-center justify-between gap-4 border-t border-[#D4AF37]/35 pt-2 font-headline text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
          <span className="truncate whitespace-nowrap">
            {settings.name} // OFFICIAL CHAMPIONSHIP STANDINGS
          </span>
          <span className="shrink-0 whitespace-nowrap text-[#FDE047]">
            ESP CALC BROADCAST • MADE BY MR. OPPY
          </span>
        </footer>
      </div>
    </div>
  );
};
