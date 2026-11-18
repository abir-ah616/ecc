import React from 'react';
import type { GraphicThemeProps } from './types';
import {
  BroadcastCrownSvg,
  BroadcastWinnerMonolith,
  BroadcastRushCrownCircle,
  type WinnerMonolithPalette,
} from './BroadcastVectors';
import { generateInitials } from '../../../store/tournamentStore';
import {
  buildHeadlineParts,
  buildTableRuleBanner,
  fitHeadlinePx,
  getTableDensity,
  resolveTeamTag,
  splitEventNameAccent,
} from './themeHelpers';
import scarletHeroImg from '../../../assets/scarlet-hero.webp';

const SCARLET_WINNER_PALETTE: WinnerMonolithPalette = {
  outerBorder: 'linear-gradient(135deg, #FFFFFF 0%, #EF4444 50%, #7F1D1D 100%)',
  cornerWedge: '#FFFFFF',
  headerBg: 'linear-gradient(90deg, #991B1B 0%, #E11D2E 50%, #991B1B 100%)',
  headerText: '#FFFFFF',
  chamberBg: 'linear-gradient(180deg, #1A0609 0%, #090305 100%)',
  crownColor: '#EF4444',
  initialsColor: '#FFFFFF',
  bladeBg: 'linear-gradient(90deg, #FFFFFF 0%, #E5E7EB 100%)',
  bladeText: '#0A0B0F',
  statTextColor: '#FCA5A5',
  subStatBg: 'rgba(18, 6, 9, 0.94)',
  subStatBorder: 'rgba(225, 29, 46, 0.5)',
  subStatLabel: '#FECACA',
  glowColor: 'rgba(225, 29, 46, 0.55)',
};

const AngularJaggedCrown: React.FC<{ color: string; className?: string }> = ({
  color,
  className = 'w-11 h-9',
}) => (
  <svg viewBox="0 0 64 52" fill="none" className={className}>
    <path
      d="M7 38L4 14L20 26L33 6L44 26L60 12L55 38H7Z"
      stroke={color}
      strokeWidth="4.2"
      strokeLinejoin="miter"
    />
    <path
      d="M10 45L54 45"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="square"
    />
  </svg>
);

export const ThemeScarletStrike: React.FC<GraphicThemeProps> = ({
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
  const eventAccent = splitEventNameAccent(settings.name);
  const density = getTableDensity(
    standings.length,
    isPortrait,
    isPortrait && showWinnerHero
  );
  const hostText = settings.hostName?.trim().toUpperCase();
  const sponsorText = settings.sponsorName?.trim().toUpperCase();

  const line1Px = fitHeadlinePx(
    headline.line1,
    isPortrait ? 72 : 76,
    isPortrait ? 13 : 20,
    34
  );
  const line2Px = fitHeadlinePx(
    headline.line2,
    isPortrait ? 66 : 68,
    isPortrait ? 12 : 20,
    32
  );

  // Align column header & row telemetry grids cleanly across layouts
  const statGridWidth =
    !isPortrait && showWinnerHero
      ? 'w-[252px]'
      : isPortrait
        ? 'w-[282px]'
        : 'w-[348px]';
  const totalGridWidth =
    !isPortrait && showWinnerHero
      ? 'w-[106px]'
      : isPortrait
        ? 'w-[116px]'
        : 'w-[136px]';

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#090A0E] text-white select-none">
      {/* 1. OBSIDIAN & CRIMSON GEOMETRIC BACKDROP */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={isPortrait ? '0 0 1080 1350' : '0 0 1920 1080'}
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient
            id="scarlet-ambient-glow"
            cx={isPortrait ? '78%' : '82%'}
            cy="20%"
            r="56%"
          >
            <stop offset="0%" stopColor="rgba(225, 29, 46, 0.42)" />
            <stop offset="100%" stopColor="rgba(9, 10, 14, 0)" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="#090A0E" />
        <rect
          width="100%"
          height="100%"
          fill="url(#scarlet-ambient-glow)"
          opacity="0.72"
        />

        {/* Crimson Slash Geometry (Continuous Diagonal — No Horizontal Seam) */}
        <polygon
          points={
            isPortrait
              ? '720,0 1080,0 1080,980'
              : '1260,0 1920,0 1920,840'
          }
          fill="rgba(225, 29, 46, 0.14)"
        />
        <polygon
          points={
            isPortrait
              ? '930,0 1080,0 1080,360'
              : '1640,0 1920,0 1920,420'
          }
          fill="rgba(239, 68, 68, 0.24)"
        />
        <polygon
          points={
            isPortrait
              ? '0,1040 160,1220 0,1350'
              : '0,820 220,1080 0,1080'
          }
          fill="rgba(225, 29, 46, 0.34)"
        />
        <polygon
          points={
            isPortrait
              ? '940,1350 1080,1150 1080,1350'
              : '1760,1080 1920,860 1920,1080'
          }
          fill="rgba(185, 28, 28, 0.26)"
        />
      </svg>

      {/* 2. MALE OPERATIVE ARTWORK LAYER (Full Crisp Presence, True Alpha Feathering, Zero Box/Cut Seam) */}
      {isPortrait ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 z-10"
          width="700"
          height="580"
          viewBox="0 0 700 580"
          style={{ opacity: 0.96 }}
        >
          <defs>
            <linearGradient id="scarlet-45-hx" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="black" />
              <stop offset="18%" stopColor="black" />
              <stop offset="52%" stopColor="white" />
              <stop offset="90%" stopColor="white" />
              <stop offset="100%" stopColor="#666666" />
            </linearGradient>
            <linearGradient id="scarlet-45-vy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" />
              <stop offset="48%" stopColor="white" />
              <stop offset="72%" stopColor="#999999" />
              <stop offset="92%" stopColor="black" />
              <stop offset="100%" stopColor="black" />
            </linearGradient>
            <mask id="scarlet-45-mask-x">
              <rect width="700" height="580" fill="url(#scarlet-45-hx)" />
            </mask>
            <mask id="scarlet-45-mask-y">
              <rect width="700" height="580" fill="url(#scarlet-45-vy)" />
            </mask>
          </defs>
          <g mask="url(#scarlet-45-mask-x)">
            <g mask="url(#scarlet-45-mask-y)">
              <image
                href={scarletHeroImg}
                x="-60"
                y="0"
                width="760"
                height="560"
                preserveAspectRatio="xMaxYMin slice"
              />
            </g>
          </g>
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-[88px] top-[-6px] z-10"
          width="740"
          height="460"
          viewBox="0 0 740 460"
          style={{ opacity: 0.94 }}
        >
          <defs>
            <linearGradient id="scarlet-169-hx" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="black" />
              <stop offset="18%" stopColor="#444444" />
              <stop offset="38%" stopColor="white" />
              <stop offset="72%" stopColor="white" />
              <stop offset="95%" stopColor="black" />
              <stop offset="100%" stopColor="black" />
            </linearGradient>
            <linearGradient id="scarlet-169-vy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" />
              <stop offset="46%" stopColor="white" />
              <stop offset="70%" stopColor="#888888" />
              <stop offset="92%" stopColor="black" />
              <stop offset="100%" stopColor="black" />
            </linearGradient>
            <mask id="scarlet-169-mask-x">
              <rect width="740" height="460" fill="url(#scarlet-169-hx)" />
            </mask>
            <mask id="scarlet-169-mask-y">
              <rect width="740" height="460" fill="url(#scarlet-169-vy)" />
            </mask>
          </defs>
          <g mask="url(#scarlet-169-mask-x)">
            <g mask="url(#scarlet-169-mask-y)">
              <image
                href={scarletHeroImg}
                x="0"
                y="0"
                width="740"
                height="460"
                preserveAspectRatio="xMidYMin slice"
              />
            </g>
          </g>
        </svg>
      )}

      {/* 3. LEFT VERTICAL BROADCAST SPINE RAIL */}
      <aside className="relative z-30 flex h-full w-[38px] shrink-0 flex-col items-center justify-between border-r border-white/15 bg-[#0C0D12] py-5">
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-2.5 w-2.5 bg-white" />
          <div className="h-1.5 w-2.5 bg-[#E11D2E]" />
        </div>

        <div className="flex max-h-full flex-1 items-center justify-center overflow-hidden py-4">
          <div
            className="max-h-full truncate whitespace-nowrap font-headline text-[13px] font-bold uppercase tracking-[0.26em] text-white/85"
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

        <div className="relative flex w-full flex-col items-center pt-2">
          <div
            className="h-14 w-full"
            style={{
              background:
                'linear-gradient(90deg, #B91C1C 0%, #EF4444 58%, #991B1B 100%)',
              clipPath: 'polygon(0 38%, 100% 0, 100% 100%, 0 100%)',
            }}
          />
        </div>
      </aside>

      {/* 4. MAIN BROADCAST STAGE (Unified Top Header -> Middle Stage -> Bottom Footer) */}
      <div
        className={`relative z-20 flex min-w-0 flex-1 flex-col justify-between overflow-hidden ${
          isPortrait ? 'px-6 pt-5 pb-4' : 'px-10 pt-5 pb-4'
        }`}
      >
        {/* TOP FULL-WIDTH HEADER LOCKUP */}
        <header className="relative flex w-full items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* Metadata Strip */}
            <div className="mb-1.5 flex w-full max-w-full flex-nowrap items-center gap-2.5 overflow-hidden whitespace-nowrap">
              <span className="max-w-[340px] shrink truncate font-headline text-[14px] font-black italic uppercase tracking-[0.12em] text-white">
                {eventAccent.base}
                {eventAccent.accent && (
                  <span className="text-[#FF3B47]">
                    {' '}
                    {eventAccent.accent}
                  </span>
                )}
              </span>

              {hostText && (
                <>
                  <span className="shrink-0 font-bold text-sm text-slate-500">
                    /
                  </span>
                  <span className="max-w-[270px] shrink truncate font-headline text-[14px] font-bold italic uppercase tracking-[0.12em] text-slate-200">
                    ORGANIZER: {hostText}
                  </span>
                </>
              )}

              {sponsorText && (
                <>
                  <span className="shrink-0 font-bold text-sm text-slate-500">
                    /
                  </span>
                  <div
                    className="max-w-[250px] shrink-0 overflow-hidden px-3.5 py-0.5 shadow-md"
                    style={{
                      transform: 'skewX(-14deg)',
                      background:
                        'linear-gradient(90deg, rgba(153,27,27,0.75) 0%, rgba(225,29,46,0.48) 100%)',
                      borderTop: '1.5px solid #FF3B47',
                      borderBottom: '1.5px solid #FF3B47',
                    }}
                  >
                    <span
                      className="block truncate font-headline text-[13px] font-black italic uppercase tracking-[0.12em] text-white"
                      style={{ transform: 'skewX(14deg)' }}
                    >
                      SPONSOR: {sponsorText}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Kinetic Display Title */}
            <div className="flex max-w-full items-start gap-3">
              <h1
                className="max-w-full truncate font-headline font-black italic uppercase leading-[0.88] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]"
                style={{ fontSize: `${line1Px}px` }}
              >
                {headline.line1}
              </h1>

              <div className="-mt-1.5 shrink-0 rotate-[12deg]">
                <AngularJaggedCrown
                  color="#E11D2E"
                  className={isPortrait ? 'h-10 w-12' : 'h-11 w-13'}
                />
              </div>
            </div>

            {/* Gradient Vector Display Sub-Headline ("STANDINGS") */}
            <div className="w-full max-w-full overflow-hidden">
              <svg
                className="h-[64px] w-full max-w-[780px] overflow-visible"
                viewBox="0 0 780 68"
                preserveAspectRatio="xMinYMid meet"
              >
                <defs>
                  <linearGradient
                    id="scarlet-standings-grad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#FF4854" />
                    <stop offset="52%" stopColor="#E11D2E" />
                    <stop offset="100%" stopColor="#991B1B" />
                  </linearGradient>
                </defs>
                <text
                  x="2"
                  y="56"
                  fill="url(#scarlet-standings-grad)"
                  fontFamily="'Barlow Condensed', 'Oswald', sans-serif"
                  fontWeight="900"
                  fontStyle="italic"
                  fontSize={line2Px}
                  letterSpacing="-1"
                >
                  {headline.line2}
                </text>
              </svg>
            </div>

            {/* Dual Skewed Mode & Stage Badges */}
            <div className="mt-2 flex max-w-full flex-nowrap items-center gap-3 whitespace-nowrap">
              <div
                className="shrink-0 px-6 py-1.5 shadow-[0_10px_22px_rgba(0,0,0,0.65)]"
                style={{
                  transform: 'skewX(-15deg)',
                  background:
                    'linear-gradient(90deg, #B91C1C 0%, #EF4444 58%, #991B1B 100%)',
                }}
              >
                <span
                  className="block font-headline text-[19px] font-black italic uppercase tracking-[0.09em] text-white"
                  style={{ transform: 'skewX(15deg)' }}
                >
                  {isRush ? 'CHAMPION RUSH' : 'CLASSIC SCRIM'}
                </span>
              </div>

              <div
                className="relative max-w-[420px] shrink overflow-hidden border border-white/75 bg-[#0A0C12]/88 px-6 py-1.5 shadow-md"
                style={{ transform: 'skewX(-15deg)' }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-1 -right-1 h-2.5 w-8 border-b border-r border-white/40"
                />
                <span
                  className="block truncate font-headline text-[18px] font-bold italic uppercase tracking-[0.09em] text-white"
                  style={{ transform: 'skewX(15deg)' }}
                >
                  {matchHeaderSubtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Top-Right Framed Tournament Emblem Box */}
          <div
            className="flex shrink-0 flex-col items-center justify-center border border-white/25 bg-[#0C0D13]/92 px-3.5 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
            style={{
              clipPath:
                'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
          >
            {tournamentLogo ? (
              <img
                src={tournamentLogo}
                alt={settings.name}
                className="h-14 w-14 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <div className="flex flex-col items-center">
                <BroadcastCrownSvg
                  className="h-7 w-8"
                  color="#EF4444"
                  strokeWidth={2.3}
                />
                <span className="mt-0.5 font-headline text-[20px] font-black italic uppercase leading-none tracking-wider text-white">
                  {generateInitials(settings.name)}
                </span>
              </div>
            )}
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
                palette={SCARLET_WINNER_PALETTE}
                compact={isPortrait}
              />
            </div>
          )}

          {/* STANDINGS TABLE */}
          <div className="flex w-full min-w-0 flex-1 flex-col justify-center">
            {/* Scoreboard Header Strip */}
            <div className="relative mb-2 px-1.5">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-1 left-[44%] h-[3px] w-[140px]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, #FFFFFF 50%, transparent 100%)',
                  boxShadow: '0 0 18px 4px rgba(239, 68, 68, 0.9)',
                }}
              />

              <div
                className="flex h-[34px] w-full items-stretch border-r border-t"
                style={{
                  transform: 'skewX(-14deg)',
                  borderColor: 'rgba(255,255,255,0.22)',
                }}
              >
                <div
                  className="flex min-w-0 flex-1 items-center px-5 shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
                  style={{
                    background:
                      'linear-gradient(90deg, #B91C1C 0%, #EF4444 58%, #991B1B 100%)',
                  }}
                >
                  <span
                    className="truncate font-headline text-[15px] font-black italic uppercase tracking-[0.08em] text-white"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    {buildTableRuleBanner(settings)}
                  </span>
                </div>

                <div
                  className={`grid ${statGridWidth} shrink-0 grid-cols-3 items-center bg-[#0D1017]/88 text-center font-headline text-[13px] font-bold italic uppercase tracking-[0.06em] text-slate-100`}
                >
                  <span style={{ transform: 'skewX(14deg)' }}>BOOYAH!</span>
                  <span style={{ transform: 'skewX(14deg)' }}>ELIMS</span>
                  <span style={{ transform: 'skewX(14deg)' }}>
                    PLACEMENT PTS
                  </span>
                </div>

                <div
                  className={`flex ${totalGridWidth} shrink-0 items-center justify-center bg-[#0D1017]/88`}
                >
                  <span
                    className="font-headline text-[13px] font-black italic uppercase tracking-[0.06em] text-[#FF3B47]"
                    style={{ transform: 'skewX(14deg)' }}
                  >
                    TOTAL POINTS
                  </span>
                </div>
              </div>
            </div>

            {/* Standings Rows */}
            <div className={`flex w-full flex-col px-1.5 ${density.rowGapClass}`}>
              {standings.map((team, idx) => {
                const isChamp = team.rank === 1;
                const tag = resolveTeamTag(team, idx);

                return (
                  <div
                    key={team.teamId}
                    className={`relative flex w-full items-stretch shadow-[0_5px_14px_rgba(0,0,0,0.55)] ${density.rowHeightClass}`}
                    style={{
                      transform: 'skewX(-14deg)',
                      borderBottom:
                        idx < 4
                          ? '1.5px solid rgba(225, 29, 46, 0.45)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {/* 1. Rank Block */}
                    <div
                      className="flex w-[56px] shrink-0 items-center justify-center"
                      style={{
                        background:
                          'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)',
                      }}
                    >
                      <span
                        className={`font-headline font-black italic leading-none text-white ${density.rankTextClass}`}
                        style={{ transform: 'skewX(14deg)' }}
                      >
                        {team.rank}
                      </span>
                    </div>

                    {/* 2. Squad Logo / Initials Badge Block (hidden when Squad Logos Off) */}
                    {showLogos && (
                      <div className="flex w-[52px] shrink-0 items-center justify-center bg-[#0B0D13]">
                        {team.logoUrl ? (
                          <img
                            src={team.logoUrl}
                            alt={team.teamName}
                            className={`shrink-0 rounded-sm object-contain ${density.logoSizeClass}`}
                            style={{ transform: 'skewX(14deg)' }}
                          />
                        ) : (
                          <span
                            className={`font-headline font-bold italic leading-none text-slate-300 ${density.tagTextClass}`}
                            style={{ transform: 'skewX(14deg)' }}
                          >
                            {tag}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 3. Metallic Silver-White Team Name Plate */}
                    <div
                      className="relative flex min-w-0 flex-1 items-center justify-between overflow-hidden px-4"
                      style={{
                        background:
                          isChamp && isFinalResult
                            ? 'linear-gradient(90deg, #FFFFFF 0%, #F1F5F9 82%, #E2E8F0 100%)'
                            : 'linear-gradient(90deg, #FFFFFF 0%, #EDEFF4 78%, #D5D9E1 100%)',
                      }}
                    >
                      {/* Faint Metallic Wing Watermark */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 180 60"
                        className="pointer-events-none absolute right-2 top-0 h-full w-40 opacity-[0.07]"
                      >
                        <path
                          d="M15 55L95 5L140 5L65 55H15ZM85 55L148 16L175 16L116 55H85Z"
                          fill="#090A0E"
                        />
                      </svg>

                      <div
                        className="relative z-10 flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden"
                        style={{ transform: 'skewX(14deg)' }}
                      >
                        <span
                          className={`truncate font-headline font-black italic uppercase tracking-[0.02em] text-[#090B10] ${density.nameTextClass}`}
                        >
                          {team.teamName}
                        </span>
                      </div>

                      {/* Champion Rush Row Badge (Winner Crown / Activated Greyed Crown / Unactivated Empty Box) */}
                      {isRush && (
                        <div
                          className="relative z-10 ml-2 shrink-0"
                          style={{ transform: 'skewX(14deg)' }}
                        >
                          <BroadcastRushCrownCircle
                            status={team.rushStatus.status}
                            size={
                              isPortrait && showWinnerHero ? 'sm' : 'md'
                            }
                            shape="box"
                            champBg="#E11D2E"
                            champBorder="#090A0E"
                            champIcon="#FFFFFF"
                            activeBg="#3F3F46"
                            activeBorder="#52525B"
                            activeIcon="#CBD5E1"
                            inactiveBg="rgba(15, 23, 42, 0.06)"
                            inactiveBorder="rgba(100, 116, 139, 0.45)"
                          />
                        </div>
                      )}
                    </div>

                    {/* 4. Dark Stats Block */}
                    <div
                      className={`grid ${statGridWidth} shrink-0 grid-cols-3 items-center bg-gradient-to-b from-[#0E1118] to-[#080A0F] font-headline font-black italic text-white`}
                    >
                      <div className="relative flex items-center justify-center">
                        <span
                          className={density.statTextClass}
                          style={{ transform: 'skewX(14deg)' }}
                        >
                          {team.booyahCount}
                        </span>
                        <span className="absolute right-0 text-lg font-normal text-slate-600">
                          /
                        </span>
                      </div>
                      <div className="relative flex items-center justify-center">
                        <span
                          className={density.statTextClass}
                          style={{ transform: 'skewX(14deg)' }}
                        >
                          {team.killPoints}
                        </span>
                        <span className="absolute right-0 text-lg font-normal text-slate-600">
                          /
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span
                          className={density.statTextClass}
                          style={{ transform: 'skewX(14deg)' }}
                        >
                          {team.placementPoints}
                        </span>
                      </div>
                    </div>

                    {/* 5. Total Points Block */}
                    <div
                      className={`flex ${totalGridWidth} shrink-0 items-center justify-center`}
                      style={{
                        background:
                          'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)',
                      }}
                    >
                      <span
                        className={`font-headline font-black italic leading-none text-white ${density.totalTextClass}`}
                        style={{ transform: 'skewX(14deg)' }}
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

        {/* BOTTOM BROADCAST FOOTER BAR */}
        <footer className="mt-2.5 flex items-center justify-between gap-3 px-1.5 pt-1">
          {isRush ? (
            <div className="flex min-w-0 flex-nowrap items-center gap-3 overflow-hidden whitespace-nowrap">
              {/* Pill 1: Won by Champion Rush (Winner Crown) */}
              <div
                className="flex shrink-0 items-center gap-2 border border-white/40 bg-[#0A0C12]/92 px-3.5 py-1.5"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <div
                  className="flex items-center gap-2"
                  style={{ transform: 'skewX(14deg)' }}
                >
                  <BroadcastRushCrownCircle
                    status="CHAMPION"
                    size="sm"
                    shape="box"
                    champBg="#E11D2E"
                    champBorder="#FFFFFF"
                    champIcon="#FFFFFF"
                  />
                  <span className="font-headline text-[12px] font-black italic uppercase tracking-[0.09em] text-white">
                    WON BY CHAMPION RUSH
                  </span>
                </div>
              </div>

              {/* Pill 2: Satisfied Champion Rush Condition (Greyed-out Crown) */}
              <div
                className="flex shrink-0 items-center gap-2 border border-white/40 bg-[#0A0C12]/92 px-3.5 py-1.5"
                style={{ transform: 'skewX(-14deg)' }}
              >
                <div
                  className="flex items-center gap-2"
                  style={{ transform: 'skewX(14deg)' }}
                >
                  <BroadcastRushCrownCircle
                    status="ACTIVE"
                    size="sm"
                    shape="box"
                    activeBg="#3F3F46"
                    activeBorder="#71717A"
                    activeIcon="#CBD5E1"
                  />
                  <span className="font-headline text-[12px] font-black italic uppercase tracking-[0.09em] text-white">
                    SATISFIED CHAMPION RUSH CONDITION
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
              <div className="h-2 w-2 shrink-0 bg-[#E11D2E]" />
              <span className="truncate whitespace-nowrap font-headline text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                {settings.name}
                {hostText ? ` • HOSTED BY ${hostText}` : ''}
                {sponsorText ? ` • POWERED BY ${sponsorText}` : ''}
              </span>
            </div>
          )}

          <div
            className="relative shrink-0 border-t-2 border-red-500/70 bg-[#0A0C12]/92 px-5 py-1.5"
            style={{ transform: 'skewX(-14deg)' }}
          >
            <div
              className="whitespace-nowrap font-headline text-[12px] font-black italic uppercase tracking-[0.14em]"
              style={{ transform: 'skewX(14deg)' }}
            >
              <span className="text-white">ESPCALC BROADCAST &bull; MADE BY </span>
              <span className="text-[#FF3B47]">MR. OPPY</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
