import type {
  StandingsViewMode,
  TeamCumulativeStanding,
  TournamentSettings,
} from '../../../types/tournament';

export interface GraphicThemeProps {
  settings: TournamentSettings;
  standings: TeamCumulativeStanding[];
  isPortrait: boolean;
  viewMode: StandingsViewMode;
  selectedMatchNumber?: number;
  totalCompletedMatches: number;
  isFinalResult: boolean;
  championTeam?: TeamCumulativeStanding;
  matchHeaderSubtitle: string;
  isExporting?: boolean;
}
