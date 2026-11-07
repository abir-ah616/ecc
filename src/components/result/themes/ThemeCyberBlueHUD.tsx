import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';

export const ThemeCyberBlueHUD: React.FC<GraphicThemeProps> = ({
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
    outerBorder: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 55%, #1E3A8A 100%)',
    cornerWedge: '#38BDF8',
    headerBg: 'linear-gradient(90deg, #0369A1 0%, #0EA5E9 50%, #0369A1 100%)',
    headerText: '#FFFFFF',
    chamberBg: 'linear-gradient(180deg, #061326 0%, #020813 100%)',
    crownColor: '#38BDF8',
    initialsColor: '#38BDF8',
    bladeBg: 'linear-gradient(90deg, #38BDF8 0%, #0EA5E9 100%)',
    bladeText: '#020813',
    statTextColor: '#7DD3FC',
    subStatBg: 'rgba(6, 19, 38, 0.92)',
    subStatBorder: 'rgba(56, 189, 248, 0.5)',
    subStatLabel: '#7DD3FC',
    glowColor: 'rgba(14, 165, 233, 0.6)',
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#030914] text-white select-none">
      {/* 1. BACKGROUND LAYER: Tactical Blueprint Grid + Radar Arcs + Hex HUD Vectors */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="cyber-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(56, 189, 248, 0.08)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="cyber-glow" cx="50%" cy="15%" r="65%">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.28)" />
            <stop offset="55%" stopColor="rgba(30, 58, 138, 0.12)" />
            <stop offset="100%" stopColor="rgba(3, 9, 20, 0)" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#cyber-grid)" />
        <rect width="100%" height="100%" fill="url(#cyber-glow)" />

        {/* Tactical Corner Framing Lines */}
        <path
          d="M 24 80 L 24 24 L 120 24"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="3"
        />
        <path
          d={
            isPortrait
              ? 'M 1056 80 L 1056 24 L 960 24'
              : 'M 1896 80 L 1896 24 L 1800 24'
          }
          fill="none"
          stroke="#38BDF8"
          strokeWidth="3"
        />
      </svg>

      {/* 2. MAIN CONTENT CONTAINER */}
      <div
        className={`relative z-20 flex flex-1 flex-col justify-between ${
          isPortrait ? 'px-9 pt-8 pb-6' : 'px-12 pt-8 pb-6'
        }`}
      >
        {/* TOP TACTICAL HUD HEADER BAR */}
        <header className="flex w-full flex-nowrap items-stretch justify-between gap-6 border-b-2 border-[#38BDF8]/40 bg-[#061326]/90 p-4 shadow-[0_14px_35px_rgba(0,0,0,0.75)]">
          {/* Left: Chamfered Octagon Logo + Main HUD Title */}
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center border-2 border-[#38BDF8] bg-[#020813] p-2 shadow-[0_0_25px_rgba(56,189,248,0.3)]"
              style={{
                clipPath:
                  'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)',
              }}
            >
              {tournamentLogo ? (
                <img
                  src={tournamentLogo}
                  alt={settings.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <BroadcastCrownSvg className="h-7 w-7" color="#38BDF8" />
                  <span className="font-headline text-sm font-black uppercase tracking-widest text-[#38BDF8]">
                    {generateInitials(settings.name)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex flex-nowrap items-center gap-2.5 whitespace-nowrap">
                <span className="shrink-0 bg-[#38BDF8] px-2.5 py-0.5 font-headline text-xs font-black uppercase tracking-[0.22em] text-[#020813]">
                  SYS.LIVE // {matchHeaderSubtitle}
                </span>
                <span className="shrink-0 font-headline text-xs font-bold uppercase tracking-[0.24em] text-[#7DD3FC]">
                  {settings.roundOrDay || 'OVERALL TELEMETRY'}
                </span>
              </div>
              <h1
                className={`mt-1 truncate whitespace-nowrap font-headline font-black uppercase leading-none tracking-wider text-white ${
                  isPortrait ? 'text-4xl' : 'text-6xl'
                }`}
              >
                {settings.name}
              </h1>
            </div>
          </div>

          {/* Right: 3-Cell Technical Telemetry Readout Grid (Org / Sponsor / Mode) */}
          <div className="flex shrink-0 flex-nowrap items-stretch gap-2.5 whitespace-nowrap">
            {settings.hostName && (
              <div className="flex min-w-[145px] flex-col justify-between border border-[#38BDF8]/40 bg-[#020813]/90 px-4 py-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-[#38BDF8]">
                  <span>ORGANIZER //</span>
                  <span>+</span>
                </div>
                <div className="truncate font-headline text-lg font-black uppercase tracking-wider text-white">
                  {settings.hostName}
                </div>
              </div>
            )}

            {settings.sponsorName && !isPortrait && (
              <div className="flex min-w-[145px] flex-col justify-between border border-[#38BDF8]/40 bg-[#020813]/90 px-4 py-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-[#38BDF8]">
                  <span>SPONSOR //</span>
                  <span>+</span>
                </div>
                <div className="truncate font-headline text-lg font-black uppercase tracking-wider text-[#7DD3FC]">
                  {settings.sponsorName}
                </div>
              </div>
            )}

            <div className="flex min-w-[145px] flex-col justify-between border-2 border-[#38BDF8] bg-[#0EA5E9]/15 px-4 py-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-[#7DD3FC]">
                <span>PROTOCOL //</span>
                <span>01</span>
              </div>
              <div className="font-headline text-lg font-black uppercase tracking-wider text-white">
                {isRush ? `RUSH ${rushTarget} PTS` : 'STANDARD BR'}
              </div>
            </div>
          </div>
        </header>

        {/* MIDDLE STAGE: Standard 12-Row Stepped Cyber HUD Standings Table + Optional Winner Monolith */}
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

          {/* 12-ROW STEPPED CYBER HUD STANDINGS TABLE */}
          <div className="flex min-w-0 flex-1 flex-col w-full">
            {/* HUD Column Header */}
            <div className="mb-2 flex items-center gap-2.5 border-b border-[#38BDF8]/50 pb-1.5 font-headline text-sm font-black uppercase tracking-[0.2em] text-[#38BDF8]">
              <div className="flex flex-1 items-center">
                <div className="w-16 text-center">RNK</div>
                <div className="flex-1 pl-4">UNIT DESIGNATION</div>
                <div
                  className={`grid shrink-0 text-center ${
                    isPortrait
                      ? 'w-[320px] grid-cols-3'
                      : showWinnerHero
                        ? 'w-[360px] grid-cols-3'
                        : 'w-[440px] grid-cols-3'
                  }`}
                >
                  <span>BOOYAH</span>
                  <span>ELIMS</span>
                  <span>PLACE</span>
                </div>
              </div>
              <div className="w-28 shrink-0 text-center text-white">
                TOTAL PTS
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
                const isTop3 = team.rank <= 3;
                const rankStr = String(team.rank).padStart(2, '0');
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
                    className={`flex w-full items-stretch gap-2.5 ${rowHeight}`}
                  >
                    {/* Main Chamfered HUD Bar */}
                    <div
                      className={`relative flex min-w-0 flex-1 items-center border ${
                        isTop1
                          ? 'border-[#38BDF8] bg-gradient-to-r from-[#0C2D57] via-[#08203E] to-[#061529] shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                          : isTop3
                            ? 'border-[#0284C7]/60 bg-gradient-to-r from-[#08203E] to-[#051224]'
                            : 'border-[#38BDF8]/30 bg-[#061326]/90'
                      }`}
                      style={{
                        clipPath:
                          'polygon(0 0, 100% 0, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                      }}
                    >
                      {/* Left 2-Digit Cyber Rank Cell */}
                      <div className="flex h-full w-16 shrink-0 items-center justify-center border-r border-[#38BDF8]/25 bg-[#020813]/80">
                        <span
                          className={`font-headline font-black ${
                            isPortrait && showWinnerHero
                              ? 'text-xl'
                              : 'text-2xl'
                          } ${
                            isTop1
                              ? 'text-[#38BDF8]'
                              : isTop3
                                ? 'text-[#7DD3FC]'
                                : 'text-white'
                          }`}
                        >
                          {rankStr}
                        </span>
                      </div>

                      {/* Team Logo + Team Name + Rush Circle */}
                      <div className="flex min-w-0 flex-1 items-center justify-between px-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                          {settings.showLogos !== false && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#38BDF8]/35 bg-[#020813] p-1">
                              {team.logoUrl ? (
                                <img
                                  src={team.logoUrl}
                                  alt={team.teamName}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="font-headline text-xs font-black text-[#38BDF8]">
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
                            activeBg="#020813"
                            activeBorder="#38BDF8"
                            activeIcon="#38BDF8"
                            champBg="#38BDF8"
                            champBorder="#FFFFFF"
                            champIcon="#020813"
                            size="sm"
                          />
                        )}
                      </div>

                      {/* Stat Columns (BOOYAH, ELIMS, PLACE) */}
                      <div
                        className={`grid shrink-0 items-center border-l border-[#38BDF8]/20 text-center font-headline font-black text-white ${
                          isPortrait
                            ? 'w-[320px] grid-cols-3'
                            : showWinnerHero
                              ? 'w-[360px] grid-cols-3'
                              : 'w-[440px] grid-cols-3'
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

                    {/* Detached Right Cyan Total Points Core */}
                    <div
                      className={`flex w-28 shrink-0 items-center justify-center border-2 ${
                        isTop1
                          ? 'border-white bg-[#38BDF8] text-[#020813] shadow-[0_0_20px_rgba(56,189,248,0.45)]'
                          : isTop3
                            ? 'border-[#38BDF8] bg-[#0C2D57] text-[#38BDF8]'
                            : 'border-[#38BDF8]/60 bg-[#071E3D] text-[#38BDF8]'
                      }`}
                      style={{
                        clipPath:
                          'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                      }}
                    >
                      <span
                        className={`font-headline font-black ${
                          isPortrait && showWinnerHero
                            ? 'text-2xl'
                            : 'text-3xl'
                        }`}
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

        {/* BOTTOM HUD TELEMETRY BAR */}
        <footer className="flex items-center justify-between gap-4 border-t border-[#38BDF8]/30 pt-2 font-headline text-xs font-bold uppercase tracking-[0.24em] text-[#7DD3FC]">
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden whitespace-nowrap">
            <span className="h-2 w-2 shrink-0 bg-[#38BDF8]" />
            <span className="truncate">
              SYS.STATUS: VERIFIED // {settings.name}
              {settings.hostName ? ` // ORG: ${settings.hostName}` : ''}
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap text-white">
            ESP CALC BROADCAST • MADE BY MR. OPPY
          </span>
        </footer>
      </div>
    </div>
  );
};
