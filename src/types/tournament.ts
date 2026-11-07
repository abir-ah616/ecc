export type TournamentMode = 'SCRIM' | 'CHAMPION_RUSH';

export type ThemePreset = 'v2' | 'crimson' | 'blue' | 'gold' | 'emerald' | 'violet';

export type StandingsViewMode = 'OVERALL' | 'SINGLE_MATCH';

export type AspectRatioMode = '16:9' | '4:5'; // 1920x1080 vs 1080x1350

export interface PointSystemConfig {
  placementPoints: number[]; // Index 0 = 1st place (12), Index 1 = 2nd (9), ..., 10th (1), 11th+ (0)
  killPoints: number;        // Default: 1 pt per kill
}

export type TieBreakCriterion =
  | 'totalPoints'
  | 'booyahs'
  | 'placementPoints'
  | 'kills'
  | 'lastMatchPlacement';

export interface ChampionRushConfig {
  targetPoints: number;                  // 50, 60, 70, or custom
  maxMatches: number;                    // 5, 8, 10, or custom (up to 10)
  allowSameMatchBooyahActivation: boolean; // Default false (must be active *prior* to match to win)
}

export interface TournamentSettings {
  mode: TournamentMode;
  name: string;
  roundOrDay: string;                    // e.g. "Grand Finals - Day 1"
  hostName?: string;                     // e.g. "BD ESPORTS ARENA"
  hostLogoUrl?: string;
  sponsorName?: string;                  // e.g. "RED BULL / ASUS ROG"
  sponsorLogoUrl?: string;
  showLogos?: boolean;                    // User rule: option to toggle logo on/off
  totalMatchesPlanned: number;           // For Scrim (2, 3, 5, or custom 1-10)
  teamCount: number;                     // 12 (default) or 15 (league room), 2-20
  pointSystem: PointSystemConfig;
  tieBreakOrder: TieBreakCriterion[];    // [totalPoints, booyahs, placementPoints, kills, lastMatchPlacement]
  championRush: ChampionRushConfig;
  theme: ThemePreset;
  customLogoUrl?: string;                // Uploaded tournament logo data URL
  isManuallyEnded?: boolean;             // When organizer clicks "End Tournament"
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;                      // Optional data URL
  shortCode?: string;                    // 2-3 letter initials fallback
}

export interface TeamMatchEntry {
  teamId: string;
  placement: number | null;              // 1 to N (null while drafting)
  kills: number;                         // >= 0
}

export interface Match {
  id: string;
  matchNumber: number;                   // 1-based index (Match 1, Match 2...)
  entries: Record<string, TeamMatchEntry>; // teamId -> entry
  isCompleted: boolean;
  createdAt: number;
}

export type TeamRushStatus =
  | { status: 'NOT_ACTIVE' }
  | { status: 'ACTIVE'; activatedAtMatch: number }
  | { status: 'CHAMPION'; crownedAtMatch: number };

export interface TeamMatchResult {
  teamId: string;
  placement: number;
  placementPoints: number;
  kills: number;
  killPoints: number;
  totalPoints: number;
  isBooyah: boolean;
}

export interface TeamCumulativeStanding {
  teamId: string;
  teamName: string;
  logoUrl?: string;
  shortCode?: string;
  rank: number;
  booyahCount: number;
  kills: number;
  killPoints: number;
  placementPoints: number;
  totalPoints: number;
  lastMatchPlacement: number;
  rushStatus: TeamRushStatus;
  progressToTarget: number; // 0.0 to 1.0 (for Champion Rush progress bar)
}

export interface StandingsResult {
  standings: TeamCumulativeStanding[];
  championTeamId?: string;
  tournamentConcluded: boolean;
  conclusionReason?: 'CHAMPION_CROWNED' | 'MAX_MATCHES_REACHED' | 'SCRIM_COMPLETED' | 'ORGANIZER_ENDED';
}

export interface TournamentRecord {
  id: string;
  name: string;
  createdAt: string;       // Formatted Date & Time e.g. "24 Oct 2026, 07:50 PM"
  createdAtTimestamp: number;
  settings: TournamentSettings;
  teams: Team[];
  matches: Match[];
  isEnded: boolean;
  championTeamName?: string;
  championScore?: number;
}
