import React from 'react';
import type { TeamCumulativeStanding, TournamentSettings } from '../../../types/tournament';
import { generateInitials } from '../../../store/tournamentStore';

export const BroadcastCrownSvg: React.FC<{
  className?: string;
  color?: string;
  strokeWidth?: number;
}> = ({ className = 'w-12 h-12', color = '#F59E0B', strokeWidth = 2.6 }) => (
  <svg
    viewBox="0 0 64 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8 38L4 12L21 24L32 8L43 24L60 12L56 38H8Z"
      stroke={color}
      strokeWidth={strokeWidth * 2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <path
      d="M12 48H52"
      stroke={color}
      strokeWidth={strokeWidth * 2.2}
      strokeLinecap="round"
    />
  </svg>
);

export const BroadcastRushCrownCircle: React.FC<{
  status: 'NOT_ACTIVE' | 'ACTIVE' | 'CHAMPION';
  activeBg?: string;
  activeBorder?: string;
  activeIcon?: string;
  champBg?: string;
  champBorder?: string;
  champIcon?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({
  status,
  activeBg = '#0A0A0A',
  activeBorder = '#FFFFFF',
  activeIcon = '#FFFFFF',
  champBg = '#F59E0B',
  champBorder = '#0A0A0A',
  champIcon = '#0A0A0A',
  size = 'md',
}) => {
  const dim =
    size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-8 w-8' : 'h-7 w-7';
  const svgDim =
    size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-4.5 w-4.5' : 'h-4 w-4';

  if (status === 'CHAMPION') {
    return (
      <div
        className={`flex ${dim} shrink-0 items-center justify-center rounded-full border-2 shadow-md`}
        style={{
          background: champBg,
          borderColor: champBorder,
        }}
        title="Won by Champion Rush"
      >
        <svg viewBox="0 0 24 24" fill={champIcon} className={svgDim}>
          <path d="M3 17L2 7L8.5 12L12 5L15.5 12L22 7L21 17H3ZM4 19H20V21H4V19Z" />
        </svg>
      </div>
    );
  }

  if (status === 'ACTIVE') {
    return (
      <div
        className={`flex ${dim} shrink-0 items-center justify-center rounded-full border-2 shadow-md`}
        style={{
          background: activeBg,
          borderColor: activeBorder,
        }}
        title="Satisfied Champion Rush Condition"
      >
        <svg viewBox="0 0 24 24" fill={activeIcon} className={svgDim}>
          <path d="M3 17L2 7L8.5 12L12 5L15.5 12L22 7L21 17H3ZM4 19H20V21H4V19Z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
    </div>
  );
};

export interface WinnerMonolithPalette {
  outerBorder: string;
  cornerWedge: string;
  headerBg: string;
  headerText: string;
  chamberBg: string;
  crownColor: string;
  initialsColor: string;
  bladeBg: string;
  bladeText: string;
  bladeBorder?: string;
  statTextColor: string;
  subStatBg: string;
  subStatBorder: string;
  subStatLabel: string;
  glowColor: string;
}

export const BroadcastWinnerMonolith: React.FC<{
  championTeam: TeamCumulativeStanding;
  settings: TournamentSettings;
  palette: WinnerMonolithPalette;
  compact?: boolean;
}> = ({ championTeam, settings, palette, compact = false }) => {
  const isRushChamp = championTeam.rushStatus.status === 'CHAMPION';
  const initials =
    championTeam.shortCode || generateInitials(championTeam.teamName);

  const boxWidth = compact ? 'w-[340px]' : 'w-[420px]';
  const boxHeight = compact ? 'h-[260px]' : 'h-[360px]';
  const cutSize = compact ? '22px' : '30px';

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full">
      {/* Ambient Radial Spotlight Behind Monolith */}
      <div
        className="absolute inset-0 pointer-events-none blur-3xl opacity-60"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${palette.glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* 1. MAIN CHAMFERED MONOLITH BOX (Reference Image 1 Architecture) */}
      <div
        className={`relative ${boxWidth} ${boxHeight} p-[3px] shadow-[0_24px_60px_rgba(0,0,0,0.85)]`}
        style={{
          background: palette.outerBorder,
          clipPath: `polygon(${cutSize} 0, 100% 0, 100% calc(100% - ${cutSize}), calc(100% - ${cutSize}) 100%, 0 100%, 0 ${cutSize})`,
        }}
      >
        {/* Top-Left Stark White/Metallic Corner Wedge */}
        <div
          className="absolute top-0 left-0 z-20 pointer-events-none"
          style={{
            width: compact ? '48px' : '64px',
            height: compact ? '26px' : '34px',
            background: palette.cornerWedge,
            clipPath: 'polygon(0 0, 100% 0, 55% 100%, 0 100%)',
          }}
        />

        {/* Bottom-Right Stark White/Metallic Corner Wedge */}
        <div
          className="absolute bottom-0 right-0 z-20 pointer-events-none"
          style={{
            width: compact ? '48px' : '64px',
            height: compact ? '48px' : '64px',
            background: palette.cornerWedge,
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 45% 0)',
          }}
        />

        {/* Inner Monolith Chamber */}
        <div
          className="relative flex h-full w-full flex-col justify-between overflow-hidden"
          style={{
            background: palette.chamberBg,
            clipPath: `polygon(${cutSize} 0, 100% 0, 100% calc(100% - ${cutSize}), calc(100% - ${cutSize}) 100%, 0 100%, 0 ${cutSize})`,
          }}
        >
          {/* Top Solid Header Strip ("GRAND CHAMPION") */}
          <div className="pt-3 sm:pt-4">
            <div
              className="w-full py-1.5 text-center shadow-md"
              style={{ background: palette.headerBg }}
            >
              <span
                className={`font-headline font-black uppercase tracking-[0.22em] ${
                  compact ? 'text-sm' : 'text-lg'
                }`}
                style={{ color: palette.headerText }}
              >
                {isRushChamp ? 'CHAMPION RUSH WINNER' : 'GRAND CHAMPION'}
              </span>
            </div>
          </div>

          {/* Center Emblem & Crown Showcase */}
          <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-2">
            {/* Subtle Inner Spotlight */}
            <div
              className="absolute inset-0 pointer-events-none opacity-35"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${palette.glowColor} 0%, transparent 65%)`,
              }}
            />

            {/* Geometric Crown */}
            <BroadcastCrownSvg
              className={compact ? 'w-14 h-12 mb-1' : 'w-20 h-17 mb-2'}
              color={palette.crownColor}
            />

            {/* Team Logo or Bold Condensed Initials */}
            {championTeam.logoUrl && settings.showLogos !== false ? (
              <div
                className={`relative flex items-center justify-center ${
                  compact ? 'h-24 w-24' : 'h-36 w-36'
                }`}
              >
                <img
                  src={championTeam.logoUrl}
                  alt={championTeam.teamName}
                  className="h-full w-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.85)]"
                />
              </div>
            ) : (
              <div
                className={`font-headline font-black uppercase leading-none tracking-wider ${
                  compact ? 'text-6xl' : 'text-8xl'
                }`}
                style={{
                  color: palette.initialsColor,
                  textShadow: `0 6px 24px ${palette.glowColor}`,
                }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Bottom Subtle Rule inside Monolith */}
          <div
            className="h-1.5 w-full opacity-80"
            style={{ background: palette.headerBg }}
          />
        </div>
      </div>

      {/* 2. DETACHED SKEWED WINNER TEAM NAME BLADE (Reference Image 1) */}
      <div
        className={`relative z-20 ${
          compact ? 'mt-3 w-[360px] py-2' : 'mt-4 w-[440px] py-3'
        } px-6 shadow-[0_14px_35px_rgba(0,0,0,0.8)]`}
        style={{
          background: palette.bladeBg,
          border: palette.bladeBorder || 'none',
          transform: 'skewX(-10deg)',
        }}
      >
        <div
          className="text-center"
          style={{ transform: 'skewX(10deg)' }}
        >
          <div
            className={`font-headline font-black uppercase tracking-wider truncate leading-none ${
              compact ? 'text-3xl' : 'text-4xl'
            }`}
            style={{ color: palette.bladeText }}
          >
            {championTeam.teamName}
          </div>
        </div>
      </div>

      {/* 3. VICTORY SUMMARY TELEMETRY LINE (Reference Image 1) */}
      <div
        className={`mt-2.5 whitespace-nowrap font-headline font-black uppercase tracking-[0.12em] text-center ${
          compact ? 'text-sm' : 'text-base'
        }`}
        style={{
          color: palette.statTextColor,
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
        }}
      >
        1ST PLACE &bull; {championTeam.totalPoints} PTS &bull; X
        {championTeam.booyahCount} BOOYAH &bull; {championTeam.kills} ELIMS
      </div>

      {/* 4. COMPACT BROADCAST BREAKDOWN STRIP */}
      {!compact && (
        <div
          className="mt-3 flex items-center justify-center gap-5 px-5 py-1.5 font-headline text-xs font-bold uppercase tracking-[0.2em]"
          style={{
            background: palette.subStatBg,
            border: `1px solid ${palette.subStatBorder}`,
            transform: 'skewX(-10deg)',
          }}
        >
          <div style={{ transform: 'skewX(10deg)' }} className="flex items-center gap-4">
            <span style={{ color: palette.subStatLabel }}>
              PLACEMENT PTS: <strong className="text-white">{championTeam.placementPoints}</strong>
            </span>
            <span className="opacity-30 text-white">|</span>
            <span style={{ color: palette.subStatLabel }}>
              ELIM PTS: <strong className="text-white">{championTeam.killPoints}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
