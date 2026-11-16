import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastRushCrownCircle,
  BroadcastWinnerMonolith,
  type WinnerMonolithPalette,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';
import {
  buildHeadlineParts,
  buildTableRuleBanner,
  fitHeadlinePx,
  getTableDensity,
  resolveTeamTag,
} from './themeHelpers';

const VOLT_WINNER_PALETTE: WinnerMonolithPalette = {
  outerBorder:
    'linear-gradient(135deg, #FFFFFF 0%, #A3FF12 45%, #00EA87 78%, #064E3B 100%)',
  cornerWedge: '#FFFFFF',
  headerBg: 'linear-gradient(90deg, #059669 0%, #00EA87 50%, #A3FF12 100%)',
  headerText: '#050A07',
  chamberBg: 'linear-gradient(180deg, #091B14 0%, #040907 100%)',
  crownColor: '#00FF88',
  initialsColor: '#A3FF12',
  bladeBg: 'linear-gradient(90deg, #FFFFFF 0%, #D9FFE8 52%, #00EA87 100%)',
  bladeText: '#050A07',
  statTextColor: '#86EFAC',
  subStatBg: 'rgba(6, 15, 11, 0.94)',
  subStatBorder: 'rgba(0, 234, 135, 0.5)',
  subStatLabel: '#A7F3D0',
  glowColor: 'rgba(0, 234, 135, 0.55)',
};

export const ThemeApexVolt: React.FC<GraphicThemeProps> = ({
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
  const density = getTableDensity(
    standings.length,
    isPortrait,
    isPortrait && showWinnerHero
  );
  const hostText = settings.hostName?.trim().toUpperCase();
  const sponsorText = settings.sponsorName?.trim().toUpperCase();

  const fullHeadline = `${headline.line1} ${headline.line2}`.trim();
  const headlinePx = fitHeadlinePx(
    fullHeadline,
    isPortrait ? 60 : 74,
    isPortrait ? 20 : 28,
    30
  );

  const statsGridWidth =
    !isPortrait && showWinnerHero
      ? 'w-[270px]'
      : isPortrait
        ? 'w-[294px]'
        : 'w-[372px]';
  const totalGridWidth =
    !isPortrait && showWinnerHero
      ? 'w-[108px]'
      : isPortrait
        ? 'w-[118px]'
        : 'w-[140px]';

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#050A08] text-white select-none">
      {/* 1. ELECTRIC VOLT-EMERALD HORIZON + HALFTONE TACTICAL MATRIX BACKDROP */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #A3FF12 0%, #00EA87 13%, #059669 22%, #07261C 36%, #050A08 100%)',
        }}
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="volt-halftone"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.5" fill="rgba(5, 10, 7, 0.16)" />
          </pattern>
          <linearGradient id="volt-beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
          <linearGradient id="volt-dark-cut" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(5, 10, 8, 0.96)" />
            <stop offset="100%" stopColor="rgba(4, 14, 10, 0.94)" />
          </linearGradient>
        </defs>

        <rect width="100%" height="32%" fill="url(#volt-halftone)" />

        <polygon
          points={
            isPortrait
              ? '620,0 1080,0 1080,470 350,470'
              : '1080,0 1920,0 1920,510 760,510'
          }
          fill="url(#volt-beam)"
        />
        <polygon
          points={
            isPortrait
              ? '0,0 320,0 120,300 0,300'
              : '0,0 500,0 220,270 0,270'
          }
          fill="rgba(5, 10, 7, 0.14)"
        />

        {/* Forged Obsidian Lower Arena Cut */}
        <polygon
          points={
            isPortrait
              ? '0,355 1080,232 1080,1350 0,1350'
              : '0,252 1920,172 1920,1080 0,1080'
          }
          fill="url(#volt-dark-cut)"
        />

        {/* Crisp Double Volt Horizon Lines */}
        <line
          x1="0"
          y1={isPortrait ? '347' : '244'}
          x2={isPortrait ? '1080' : '1920'}
          y2={isPortrait ? '224' : '164'}
          stroke="rgba(255, 255, 255, 0.42)"
          strokeWidth="2"
        />
        <line
          x1="0"
          y1={isPortrait ? '355' : '252'}
          x2={isPortrait ? '1080' : '1920'}
          y2={isPortrait ? '232' : '172'}
          stroke="#00FF88"
          strokeWidth="4"
        />
      </svg>

      {/* 2. LEFT VERTICAL BROADCAST SPINE TICKER (Matched Left Strip Position) */}
      <aside className="relative z-30 flex h-full w-[42px] shrink-0 flex-col items-center justify-between border-r-2 border-[#050A07] bg-[#F0FDF4] py-6 text-[#050A07] shadow-[6px_0_24px_rgba(0,0,0,0.65)]">
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-3 w-3 bg-[#050A07]" />
          <div className="h-1.5 w-3 bg-[#059669]" />
        </div>

        <div className="flex max-h-full flex-1 items-center justify-center overflow-hidden py-4">
          <div
            className="max-h-full truncate whitespace-nowrap font-headline text-[14px] font-black uppercase tracking-[0.26em] text-[#050A07]"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
            }}
          >
            {settings.name}
            {hostText ? ` // ORG: ${hostText}` : ''}
            {' // '}
            {matchHeaderSubtitle}
          </div>
        </div>

        <div className="relative flex w-full flex-col items-center pt-4">
          <div
            className="h-12 w-full bg-[#050A07]"
            style={{ clipPath: 'polygon(0 28%, 100% 0, 100% 100%, 0 100%)' }}
          />
        </div>
      </aside>

      {/* 3. MAIN BROADCAST STAGE */}
      <div
        className={`relative z-20 flex min-w-0 flex-1 flex-col justify-between overflow-hidden ${
          isPortrait ? 'px-7 pt-6 pb-5' : 'px-11 pt-6 pb-5'
        }`}
      >
        {/* TOP FULL-WIDTH HEADER LOCKUP */}
        <header className="relative flex w-full items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* Kicker Tags */}
            <div className="mb-2 flex w-full max-w-full flex-nowrap items-center gap-2.5 overflow-hidden whitespace-nowrap">
              <div
                className="max-w-[330px] shrink-0 overflow-hidden bg-[#050A07] px-3.5 py-0.5 shadow-md"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className="block truncate whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.22em] text-[#A3FF12]"
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {settings.name}
                </span>
              </div>

              {hostText && (
                <div
                  className="max-w-[270px] shrink-0 overflow-hidden border border-[#050A07] bg-white px-3 py-0.5 text-[#050A07] shadow-sm"
                  style={{ transform: 'skewX(-14deg)' }}
                >
                  <span
                    className="block truncate whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.18em]"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    ORGANIZER: {hostText}
                  </span>
                </div>
              )}

              {sponsorText && (
                <div
                  className="max-w-[250px] shrink-0 overflow-hidden border border-[#050A07] bg-[#064E3B] px-3 py-0.5 text-[#A7F3D0] shadow-sm"
                  style={{ transform: 'skewX(-14deg)' }}
                >
                  <span
                    className="block truncate whitespace-nowrap font-headline text-xs font-black uppercase tracking-[0.18em]"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    SPONSOR: {sponsorText}
                  </span>
                </div>
              )}
            </div>

            {/* Bold Stark Obsidian Display Headline */}
            <h1
              className="max-w-full truncate whitespace-nowrap font-headline font-black italic uppercase leading-[0.9] tracking-tight text-[#050A07] drop-shadow-[0_2px_0_rgba(255,255,255,0.4)]"
              style={{ fontSize: `${headlinePx}px` }}
            >
              {fullHeadline}
            </h1>

            {/* Mode & Stage Subtitle Badges */}
            <div className="mt-2 flex max-w-full flex-nowrap items-center gap-3 whitespace-nowrap">
              <div
                className="shrink-0 border-l-4 border-[#FFFFFF] bg-[#050A07] px-7 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.55)]"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className={`block whitespace-nowrap font-headline font-black italic uppercase tracking-[0.08em] text-[#00FF88] ${
                    isPortrait ? 'text-2xl' : 'text-[26px]'
                  }`}
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {isRush ? 'CHAMPION RUSH' : 'BATTLE ROYALE STANDINGS'}
                </span>
              </div>

              <div
                className="max-w-[400px] shrink overflow-hidden border-2 border-[#050A07] bg-[#FFFFFF] px-4 py-1.5 shadow-[4px_4px_0_#050A07]"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <span
                  className="block truncate whitespace-nowrap font-headline text-sm font-black uppercase tracking-[0.18em] text-[#050A07]"
                  style={{ transform: 'skewX(14deg)' }}
                >
                  {matchHeaderSubtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Top-Right Chamfered Hexagonal Armory Emblem */}
          <div
            className={`flex shrink-0 flex-col items-center justify-center p-[2px] shadow-[0_14px_30px_rgba(0,0,0,0.65)] ${
              isPortrait ? 'h-22 w-24' : 'h-24 w-28'
            }`}
            style={{
              background:
                'linear-gradient(135deg, #FFFFFF 0%, #A3FF12 50%, #059669 100%)',
              clipPath:
                'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
            }}
          >
            <div
              className="flex h-full w-full flex-col items-center justify-center bg-[#060D0A] p-2"
              style={{
                clipPath:
                  'polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)',
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
                  <BroadcastCrownSvg className="h-7 w-7" color="#00FF88" />
                  <span className="mt-0.5 font-headline text-lg font-black uppercase tracking-widest text-white">
                    {generateInitials(settings.name)}
                  </span>
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
                : 'flex-row items-center gap-9 pt-2'
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
                palette={VOLT_WINNER_PALETTE}
                compact={isPortrait}
              />
            </div>
          )}

          {/* CHAMFERED TACTICAL SCOREBOARD */}
          <div className="flex w-full min-w-0 flex-1 flex-col justify-center">
            {/* Table Header Strip */}
            <div className="mb-2 flex w-full items-stretch">
              {/* Left Armor Rule Header */}
              <div
                className="flex min-w-0 flex-1 items-center justify-between px-6 py-2 shadow-md"
                style={{
                  background:
                    'linear-gradient(90deg, #059669 0%, #00EA87 65%, #A3FF12 100%)',
                  clipPath:
                    'polygon(10px 0, 100% 0, calc(100% - 14px) 100%, 0 100%, 0 10px)',
                }}
              >
                <span className="truncate font-headline text-[15px] font-black italic uppercase tracking-[0.12em] text-[#050A07]">
                  {buildTableRuleBanner(settings)}
                </span>
                <span className="ml-3 shrink-0 font-headline text-xs font-black text-[#050A07]/70">
                  ///
                </span>
              </div>

              {/* Stat Labels Wing */}
              <div
                className={`grid ${statsGridWidth} shrink-0 grid-cols-3 items-center border-t-2 border-[#00EA87] bg-[#0B1310] text-center font-headline text-[12px] font-black italic uppercase tracking-[0.12em] text-slate-200`}
                style={{
                  marginLeft: '-8px',
                  clipPath:
                    'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
                }}
              >
                <span>BOOYAH!</span>
                <span>ELIMS</span>
                <span>PLACEMENT PTS</span>
              </div>

              {/* Total Points Header Cap */}
              <div
                className={`flex ${totalGridWidth} shrink-0 items-center justify-center bg-[#FFFFFF] pl-2 font-headline text-[13px] font-black italic uppercase tracking-[0.14em] text-[#050A07]`}
                style={{
                  marginLeft: '-8px',
                  clipPath:
                    'polygon(14px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
                }}
              >
                TOTAL PTS
              </div>
            </div>

            {/* Chamfered Team Rows */}
            <div className={`flex w-full flex-col ${density.rowGapClass}`}>
              {standings.map((team, idx) => {
                const isRank1 = team.rank === 1;
                const isTop3 = team.rank <= 3;
                const tag = resolveTeamTag(team, idx);

                return (
                  <div
                    key={team.teamId}
                    className={`flex w-full items-stretch drop-shadow-[0_6px_14px_rgba(0,0,0,0.75)] ${density.rowHeightClass}`}
                  >
                    {/* Piece 1: Chamfered Rank + Seed/Logo Socket (shrinks cleanly when Squad Logos Off) */}
                    <div
                      className={`relative flex shrink-0 items-stretch overflow-hidden pr-2 ${
                        showLogos ? 'w-[124px]' : 'w-[72px]'
                      }`}
                      style={{
                        background: isRank1
                          ? 'linear-gradient(135deg, #A3FF12 0%, #00EA87 100%)'
                          : isTop3
                            ? '#0D2119'
                            : '#0A100E',
                        clipPath:
                          'polygon(10px 0, 100% 0, calc(100% - 14px) 100%, 0 100%, 0 10px)',
                      }}
                    >
                      <div
                        className="h-full w-1.5 shrink-0"
                        style={{
                          background: isRank1
                            ? '#050A07'
                            : isTop3
                              ? '#00FF88'
                              : '#1F3A2E',
                        }}
                      />
                      <div
                        className={`flex shrink-0 items-center justify-center ${
                          showLogos ? 'w-[48px]' : 'flex-1 pr-1'
                        }`}
                      >
                        <span
                          className={`font-headline font-black italic leading-none ${density.rankTextClass} ${
                            isRank1
                              ? 'text-[#050A07]'
                              : isTop3
                                ? 'text-[#00FF88]'
                                : 'text-white'
                          }`}
                        >
                          {team.rank}
                        </span>
                      </div>
                      {showLogos && (
                        <div className="flex flex-1 items-center justify-center pr-1">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt={team.teamName}
                              className={`shrink-0 object-contain ${density.logoSizeClass}`}
                            />
                          ) : (
                            <span
                              className={`font-headline font-black italic uppercase tracking-wider ${density.tagTextClass} ${
                                isRank1 ? 'text-[#050A07]' : 'text-emerald-300/80'
                              }`}
                            >
                              {tag}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Piece 2: Crisp High-Contrast Team Name Blade */}
                    <div
                      className="relative flex min-w-0 flex-1 items-center justify-between overflow-hidden pl-6 pr-5"
                      style={{
                        marginLeft: '-8px',
                        background: isRank1
                          ? 'linear-gradient(90deg, #ECFDF5 0%, #D1FAE5 100%)'
                          : isTop3
                            ? 'linear-gradient(90deg, #F8FAFC 0%, #ECFFF5 100%)'
                            : 'linear-gradient(90deg, #FFFFFF 0%, #F1F5F9 100%)',
                        clipPath:
                          'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
                      }}
                    >
                      <div
                        className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-full"
                        style={{
                          background: isRank1
                            ? '#00EA87'
                            : isTop3
                              ? '#059669'
                              : 'rgba(15, 23, 42, 0.14)',
                        }}
                      />

                      <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
                        <span
                          className={`truncate font-headline font-black italic uppercase tracking-wide text-[#050A07] ${density.nameTextClass}`}
                        >
                          {team.teamName}
                        </span>
                      </div>

                      {/* Champion Rush Row Indicator (Winner Crown / Greyed Crown / Unactivated Empty Box) */}
                      {isRush && (
                        <div className="ml-2 shrink-0">
                          <BroadcastRushCrownCircle
                            status={team.rushStatus.status}
                            size={
                              isPortrait && showWinnerHero ? 'sm' : 'md'
                            }
                            shape="box"
                            champBg="#00EA87"
                            champBorder="#050A07"
                            champIcon="#050A07"
                            activeBg="#3F3F46"
                            activeBorder="#52525B"
                            activeIcon="#D4D4D8"
                            inactiveBg="#E2E8F0"
                            inactiveBorder="#94A3B8"
                          />
                        </div>
                      )}
                    </div>

                    {/* Piece 3: Dark Obsidian Telemetry Bay */}
                    <div
                      className={`grid ${statsGridWidth} shrink-0 grid-cols-3 items-center font-headline font-black italic text-white`}
                      style={{
                        marginLeft: '-8px',
                        background: isRank1
                          ? 'linear-gradient(180deg, #0D1F17 0%, #07120D 100%)'
                          : 'linear-gradient(180deg, #0E1512 0%, #070C0A 100%)',
                        clipPath:
                          'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
                      }}
                    >
                      <div className="relative flex items-center justify-center">
                        <span className={density.statTextClass}>
                          {team.booyahCount}
                        </span>
                        <span className="absolute right-0 text-base font-normal text-emerald-700">
                          /
                        </span>
                      </div>
                      <div className="relative flex items-center justify-center">
                        <span className={density.statTextClass}>
                          {team.killPoints}
                        </span>
                        <span className="absolute right-0 text-base font-normal text-emerald-700">
                          /
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className={density.statTextClass}>
                          {team.placementPoints}
                        </span>
                      </div>
                    </div>

                    {/* Piece 4: Chamfered Total Points End-Cap */}
                    <div
                      className={`relative flex ${totalGridWidth} shrink-0 items-center justify-center pl-2 font-headline font-black italic`}
                      style={{
                        marginLeft: '-8px',
                        background: isRank1
                          ? 'linear-gradient(135deg, #A3FF12 0%, #00EA87 100%)'
                          : isTop3
                            ? 'linear-gradient(135deg, #065F46 0%, #047857 100%)'
                            : 'linear-gradient(135deg, #111D18 0%, #080E0B 100%)',
                        clipPath:
                          'polygon(14px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
                      }}
                    >
                      <div
                        className="pointer-events-none absolute top-0 right-0 h-3 w-3"
                        style={{
                          background: isRank1 ? '#FFFFFF' : '#00FF88',
                          clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                        }}
                      />
                      <span
                        className={`leading-none ${density.totalTextClass} ${
                          isRank1
                            ? 'text-[#050A07]'
                            : isTop3
                              ? 'text-white'
                              : 'text-[#00EA87]'
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

        {/* 3. BOTTOM BROADCAST LEGEND & FOOTER */}
        <footer className="mt-2.5 flex items-center justify-between gap-4 pt-1">
          {isRush ? (
            <div className="flex min-w-0 flex-nowrap items-center gap-3 overflow-hidden whitespace-nowrap">
              <div
                className="flex shrink-0 items-center gap-2 border border-[#00EA87] bg-[#07150F] px-3.5 py-1.5 shadow-md"
                style={{ transform: 'skewX(-12deg)' }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex items-center gap-2"
                >
                  <BroadcastRushCrownCircle
                    status="CHAMPION"
                    size="sm"
                    shape="box"
                    champBg="#00EA87"
                    champBorder="#FFFFFF"
                    champIcon="#050A07"
                  />
                  <span className="font-headline text-xs font-black italic uppercase tracking-[0.12em] text-[#A7F3D0]">
                    WON BY CHAMPION RUSH
                  </span>
                </div>
              </div>

              <div
                className="flex shrink-0 items-center gap-2 border border-white/30 bg-[#07150F] px-3.5 py-1.5 shadow-md"
                style={{ transform: 'skewX(-12deg)' }}
              >
                <div
                  style={{ transform: 'skewX(12deg)' }}
                  className="flex items-center gap-2"
                >
                  <BroadcastRushCrownCircle
                    status="ACTIVE"
                    size="sm"
                    shape="box"
                    activeBg="#3F3F46"
                    activeBorder="#A1A1AA"
                    activeIcon="#D4D4D8"
                  />
                  <span className="font-headline text-xs font-black italic uppercase tracking-[0.12em] text-white/90">
                    SATISFIED CHAMPION RUSH CONDITION
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
              <div className="h-2 w-2 shrink-0 bg-[#00FF88]" />
              <span className="truncate whitespace-nowrap font-headline text-xs font-bold uppercase tracking-[0.2em] text-emerald-200/80">
                {settings.name}
                {hostText ? ` • HOSTED BY ${hostText}` : ''}
                {sponsorText ? ` • POWERED BY ${sponsorText}` : ''}
              </span>
            </div>
          )}

          <div
            className="shrink-0 border border-[#00EA87]/50 bg-[#050A07] px-4 py-1"
            style={{ transform: 'skewX(-12deg)' }}
          >
            <span
              className="block whitespace-nowrap font-headline text-xs font-black italic uppercase tracking-[0.18em] text-[#00FF88]"
              style={{ transform: 'skewX(12deg)' }}
            >
              ESP CALC BROADCAST &bull; MADE BY MR. OPPY
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
