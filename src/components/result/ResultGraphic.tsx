import React from 'react';
import type {
  AspectRatioMode,
  StandingsViewMode,
  TeamCumulativeStanding,
  TournamentSettings,
  ThemePreset,
} from '../../types/tournament';
import { resolveThemePreset } from '../../lib/theme';
import { ThemeYellowFFMAI } from './themes/ThemeYellowFFMAI';
import { ThemeScarletStrike } from './themes/ThemeScarletStrike';
import { ThemeApexVolt } from './themes/ThemeApexVolt';
import { ThemeWhiteoutPro } from './themes/ThemeWhiteoutPro';
import { ThemeArcticCyan } from './themes/ThemeArcticCyan';
import { ThemeCyberRose } from './themes/ThemeCyberRose';
import { ThemeImperialGold } from './themes/ThemeImperialGold';

interface ResultGraphicProps {
  settings: TournamentSettings;
  standings: TeamCumulativeStanding[];
  aspectRatio: AspectRatioMode;
  viewMode: StandingsViewMode;
  selectedMatchNumber?: number;
  totalCompletedMatches: number;
  isTournamentEnded?: boolean;
  graphicRef: React.RefObject<HTMLDivElement | null>;
  isExporting?: boolean;
}

export const ResultGraphic: React.FC<ResultGraphicProps> = ({
  settings,
  standings,
  aspectRatio,
  viewMode,
  selectedMatchNumber,
  totalCompletedMatches,
  isTournamentEnded = false,
  graphicRef,
  isExporting = false,
}) => {
  const isPortrait = aspectRatio === '4:5';
  const width = isPortrait ? 1080 : 1920;
  const height = isPortrait ? 1350 : 1080;

  const themeName: ThemePreset = resolveThemePreset(settings.theme);

  const isFinalResult =
    Boolean(isTournamentEnded || settings.isManuallyEnded) &&
    viewMode === 'OVERALL';
  const championTeam = standings[0];

  const matchHeaderSubtitle =
    viewMode === 'SINGLE_MATCH'
      ? `MATCH ${selectedMatchNumber ?? 1} STANDING`
      : isFinalResult
        ? 'OFFICIAL FINAL STANDINGS'
        : totalCompletedMatches > 0
          ? `AFTER MATCH ${totalCompletedMatches} OF ${
              settings.mode === 'CHAMPION_RUSH'
                ? settings.championRush.maxMatches
                : settings.totalMatchesPlanned
            }`
          : 'OFFICIAL STANDINGS';

  const themeProps = {
    settings,
    standings,
    isPortrait,
    viewMode,
    selectedMatchNumber,
    totalCompletedMatches,
    isFinalResult,
    championTeam,
    matchHeaderSubtitle,
    isExporting,
  };

  const renderActiveThemeEngine = () => {
    switch (themeName) {
      case 'v2':
        return <ThemeYellowFFMAI {...themeProps} />;
      case 'scarlet':
        return <ThemeScarletStrike {...themeProps} />;
      case 'volt':
        return <ThemeApexVolt {...themeProps} />;
      case 'whiteout':
        return <ThemeWhiteoutPro {...themeProps} />;
      case 'blue':
        return <ThemeArcticCyan {...themeProps} />;
      case 'gold':
        return <ThemeCyberRose {...themeProps} />;
      case 'eclipse':
        return <ThemeImperialGold {...themeProps} />;
      default:
        return <ThemeYellowFFMAI {...themeProps} />;
    }
  };

  return (
    <div
      id="result-graphic"
      ref={graphicRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      className={`relative overflow-hidden bg-[#070506] text-white select-none ${
        isExporting ? 'no-animation' : ''
      }`}
    >
      {renderActiveThemeEngine()}
    </div>
  );
};
