import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';

export const ThemeVioletPrism: React.FC<GraphicThemeProps> = ({
  settings,
  standings,
  isPortrait,
  isFinalResult,
  championTeam,
  matchHeaderSubtitle,
}) => {
  const isRush = settings.mode === 'CHAMPION_RUSH';
  const tournamentLogo = settings.customLogoUrl;
  const showWinnerHero = isFinalResult && !!championTeam;

  const winnerPalette = {
    outerBorder: 'linear-gradient(135deg, #F0ABFC 0%, #D946EF 50%, #6D28D9 100%)',
    cornerWedge: '#F0ABFC',
    headerBg: 'linear-gradient(90deg, #7E22CE 0%, #D946EF 50%, #7E22CE 100%)',
    headerText: '#FFFFFF',
    chamberBg: 'linear-gradient(180deg, #160926 0%, #090312 100%)',
    crownColor: '#E879F9',
    initialsColor: '#E879F9',
    bladeBg: 'linear-gradient(90deg, #E879F9 0%, #A855F7 100%)',
    bladeText: '#090312',
    statTextColor: '#F0ABFC',
    subStatBg: 'rgba(22, 9, 38, 0.92)',
    subStatBorder: 'rgba(217, 70, 239, 0.5)',
    subStatLabel: '#F0ABFC',
    glowColor: 'rgba(217, 70, 239, 0.6)',
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#080311] text-white select-none">
      {/* 1. BACKGROUND: Crystalline Prism Vectors + Magenta/Violet Radial Beams */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="violet-prism-glow" cx="50%" cy="20%" r="65%">
            <stop offset="0%" stopColor="rgba(217, 70, 239, 0.25)" />
            <stop offset="45%" stopColor="rgba(109, 40, 217, 0.14)" />
            <stop offset="100%" stopColor="rgba(8, 3, 17, 0)" />
          </radialGradient>
          <linearGradient id="prism-shard" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(232, 121, 249, 0.2)" />
            <stop offset="100%" stopColor="rgba(109, 40, 217, 0)" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#violet-prism-glow)" />

        {/* Crystalline Prism Shards */}
        <polygon
          points={
            isPortrait
              ? '0,0 380,0 160,420 0,280'
              : '0,0 520,0 240,480 0,320'
          }
          fill="url(#prism-shard)"
        />
        <polygon
          points={
            isPortrait
              ? '1080,0 700,0 920,420 1080,280'
              : '1920,0 1400,0 1680,480 1920,320'
          }
          fill="url(#prism-shard)"
        />
      </svg>

      {/* 2. MAIN CONTENT STAGE */}
      <div
        className={`relative z-20 flex flex-1 flex-col justify-between ${
          isPortrait ? 'px-9 pt-8 pb-6' : 'px-12 pt-8 pb-6'
        }`}
      >
        {/* TOP SPLIT-WING DIAMOND PRISM HEADER */}
        <header className="flex items-center justify-between gap-6 border-b border-[#D946EF]/35 pb-4">
          {/* Left Wing: Diamond Crystal Emblem + Tournament Headline */}
          <div className="flex min-w-0 flex-1 items-center gap-5">
            {/* Rotated 45-Degree Diamond Crystal Frame */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <div className="absolute inset-2 rotate-45 border-2 border-[#E879F9] bg-[#18082B] shadow-[0_0_25px_rgba(217,70,239,0.45)]" />
              <div className="relative z-10 flex h-12 w-12 items-center justify-center">
                {tournamentLogo ? (
                  <img
                    src={tournamentLogo}
                    alt={settings.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <BroadcastCrownSvg className="h-8 w-8" color="#E879F9" />
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              {/* Top Kicker Row: Stage + (In 4:5 Portrait: Organizer & Sponsor Prism Pills so they never overflow!) */}
              <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                <span
                  className="shrink-0 bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] px-3.5 py-0.5 font-headline text-xs font-black uppercase tracking-[0.22em] text-white"
                  style={{
                    clipPath:
                      'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
                  }}
                >
                  {settings.roundOrDay || 'PRISM STAGE'}
                </span>

                {isPortrait ? (
                  <>
                    {settings.hostName && (
                      <span
                        className="shrink-0 border border-[#D946EF]/60 bg-[#18082B] px-3.5 py-0.5 font-headline text-xs font-black uppercase tracking-[0.16em] text-white"
                        style={{
                          clipPath:
                            'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                        }}
                      >
                        <span className="text-[#E879F9]">ORG:</span>{' '}
                        {settings.hostName}
                      </span>
                    )}
                    {settings.sponsorName && (
                      <span
                        className="shrink-0 border border-[#8B5CF6]/60 bg-[#18082B] px-3.5 py-0.5 font-headline text-xs font-black uppercase tracking-[0.16em] text-[#F0ABFC]"
                        style={{
                          clipPath:
                            'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                        }}
                      >
                        <span className="text-[#C4B5FD]">SPONSOR:</span>{' '}
                        {settings.sponsorName}
                      </span>
                    )}
                    <span className="shrink-0 font-headline text-xs font-bold uppercase tracking-[0.2em] text-[#F0ABFC]">
                      // {matchHeaderSubtitle}
                    </span>
                  </>
                ) : (
                  <span className="shrink-0 font-headline text-xs font-bold uppercase tracking-[0.24em] text-[#F0ABFC]">
                    {matchHeaderSubtitle}
                  </span>
                )}
              </div>

              <h1
                className={`mt-1 truncate whitespace-nowrap font-headline font-black uppercase leading-none tracking-wider text-white drop-shadow-[0_4px_20px_rgba(217,70,239,0.45)] ${
                  isPortrait ? 'text-5xl' : 'text-6xl'
                }`}
              >
                {settings.name}
              </h1>
            </div>
          </div>

          {/* Right Wing (16:9 Desktop): Chevron Prism Plaques for Organizer & Sponsor */}
          {!isPortrait && (
            <div className="flex shrink-0 items-center gap-3">
              {settings.hostName && (
                <div
                  className="border border-[#D946EF]/50 bg-[#18082B]/90 px-6 py-2.5 text-right"
                  style={{
                    clipPath:
                      'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
                  }}
                >
                  <div className="font-headline text-[10px] font-bold uppercase tracking-[0.24em] text-[#E879F9]">
                    ORGANIZER
                  </div>
                  <div className="truncate font-headline text-xl font-black uppercase tracking-wider text-white">
                    {settings.hostName}
                  </div>
                </div>
              )}

              {settings.sponsorName && (
                <div
                  className="border border-[#8B5CF6]/50 bg-[#18082B]/90 px-6 py-2.5 text-right"
                  style={{
                    clipPath:
                      'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
                  }}
                >
                  <div className="font-headline text-[10px] font-bold uppercase tracking-[0.24em] text-[#C4B5FD]">
                    SPONSOR
                  </div>
                  <div className="truncate font-headline text-xl font-black uppercase tracking-wider text-[#F0ABFC]">
                    {settings.sponsorName}
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        {/* MIDDLE CONTENT AREA: Double-Chevron Pointed Blades + Optional Winner Monolith */}
        <div
          className={`my-auto flex w-full ${
            showWinnerHero
              ? isPortrait
                ? 'flex-col items-center gap-5 py-2'
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

          {/* 12 DOUBLE-CHEVRON POINTED BLADE ROWS */}
          <div className="flex flex-1 flex-col w-full">
            {/* Column Header */}
            <div className="mb-2 flex items-center px-4 font-headline text-sm font-black uppercase tracking-[0.2em] text-[#E879F9]">
              <div className="w-20 text-center">RANK</div>
              <div className="flex-1 pl-4">TEAM NAME</div>
              <div
                className={`grid shrink-0 text-center ${
                  isPortrait
                    ? 'w-[310px] grid-cols-3'
                    : 'w-[360px] grid-cols-3'
                }`}
              >
                <span>BOOYAH</span>
                <span>ELIMS</span>
                <span>PLACE</span>
              </div>
              <div className="w-32 text-center text-white">TOTAL PTS</div>
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
                    className={`relative flex w-full items-stretch overflow-hidden ${rowHeight} ${
                      isTop1
                        ? 'shadow-[0_0_25px_rgba(217,70,239,0.45)]'
                        : 'shadow-[0_6px_16px_rgba(0,0,0,0.65)]'
                    }`}
                    style={{
                      clipPath:
                        'polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%)',
                      background: isTop1
                        ? 'linear-gradient(90deg, #D946EF 0%, #3B0764 20%, #2E1065 80%, #D946EF 100%)'
                        : isTop3
                          ? 'linear-gradient(90deg, #7E22CE 0%, #1E0B36 20%, #1E0B36 80%, #7E22CE 100%)'
                          : 'linear-gradient(90deg, #3B0764 0%, #140724 18%, #140724 82%, #3B0764 100%)',
                    }}
                  >
                    {/* Left Spearhead Rank Tip */}
                    <div
                      className="flex w-24 shrink-0 items-center justify-center pr-2 font-headline font-black"
                      style={{
                        background: isTop1
                          ? 'linear-gradient(90deg, #F0ABFC 0%, #D946EF 100%)'
                          : 'linear-gradient(90deg, #6D28D9 0%, #4C1D95 100%)',
                        clipPath:
                          'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)',
                      }}
                    >
                      <span
                        className={`${
                          isPortrait && showWinnerHero
                            ? 'text-2xl'
                            : 'text-3xl'
                        } ${isTop1 ? 'text-[#090312]' : 'text-white'}`}
                      >
                        #{team.rank}
                      </span>
                    </div>

                    {/* Center Prism Team Chamber */}
                    <div className="flex flex-1 items-center justify-between px-4 min-w-0">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {settings.showLogos !== false && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E879F9]/40 bg-[#090312] p-1">
                            {team.logoUrl ? (
                              <img
                                src={team.logoUrl}
                                alt={team.teamName}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span className="font-headline text-xs font-black text-[#E879F9]">
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
                          activeBg="#140724"
                          activeBorder="#E879F9"
                          activeIcon="#E879F9"
                          champBg="#E879F9"
                          champBorder="#FFFFFF"
                          champIcon="#090312"
                          size="sm"
                        />
                      )}
                    </div>

                    {/* Stat Columns (BOOYAH, ELIMS, PLACE) */}
                    <div
                      className={`grid shrink-0 items-center text-center font-headline font-black text-white ${
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

                    {/* Right Spearhead Total Points Tip */}
                    <div
                      className="flex w-32 shrink-0 items-center justify-center pl-2 font-headline font-black"
                      style={{
                        background: isTop1
                          ? 'linear-gradient(90deg, #D946EF 0%, #F0ABFC 100%)'
                          : 'linear-gradient(90deg, #7E22CE 0%, #A855F7 100%)',
                        clipPath:
                          'polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 50%)',
                      }}
                    >
                      <span
                        className={`${
                          isPortrait && showWinnerHero
                            ? 'text-2xl'
                            : 'text-3xl'
                        } ${isTop1 ? 'text-[#090312]' : 'text-white'}`}
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

        {/* BOTTOM PRISM FOOTER */}
        <footer className="flex items-center justify-between gap-4 border-t border-[#D946EF]/30 pt-2 font-headline text-xs font-bold uppercase tracking-[0.24em] text-[#F0ABFC]">
          <span className="truncate whitespace-nowrap">
            {settings.name}
            {settings.hostName ? ` • HOSTED BY ${settings.hostName}` : ''}
            {settings.sponsorName && !isPortrait
              ? ` • SPONSORED BY ${settings.sponsorName}`
              : ''}
          </span>
          <span className="shrink-0 whitespace-nowrap text-[#E879F9]">
            ESP CALC BROADCAST • MADE BY MR. OPPY
          </span>
        </footer>
      </div>
    </div>
  );
};
