import type { TournamentMode } from '../types/tournament';

export interface TournamentLayoutPreset {
  id: string;
  title: string;
  subtitle: string;
  mode: TournamentMode;
  defaultEventName: string;
  roundOrDay: string;
  totalMatchesPlanned: number;
  targetPoints: number;
  maxMatches: number;
  squadCount: number;
  badge: string;
}

export const TOURNAMENT_TEMPLATES: TournamentLayoutPreset[] = [
  {
    id: 'classic-5',
    title: 'Classic Scrim (5 Matches)',
    subtitle: '12 squads · 5 matches · Standard Finals layout',
    mode: 'SCRIM',
    defaultEventName: 'FREE FIRE SCRIM SERIES',
    roundOrDay: 'GRAND FINALS',
    totalMatchesPlanned: 5,
    targetPoints: 80,
    maxMatches: 8,
    squadCount: 12,
    badge: 'POPULAR',
  },
  {
    id: 'rush-50',
    title: 'Champion Rush 50',
    subtitle: '12 squads · 50 pts target · Up to 8 matches',
    mode: 'CHAMPION_RUSH',
    defaultEventName: 'CHAMPION RUSH SERIES',
    roundOrDay: 'FINALS · RUSH 50',
    totalMatchesPlanned: 6,
    targetPoints: 50,
    maxMatches: 8,
    squadCount: 12,
    badge: 'RUSH 50',
  },
  {
    id: 'rush-80',
    title: 'Champion Rush 80 Pro',
    subtitle: '12 squads · 80 pts target · Up to 10 matches',
    mode: 'CHAMPION_RUSH',
    defaultEventName: 'PRO CHAMPIONSHIP FINALS',
    roundOrDay: 'GRAND FINALS',
    totalMatchesPlanned: 8,
    targetPoints: 80,
    maxMatches: 10,
    squadCount: 12,
    badge: 'PRO',
  },
  {
    id: 'quick-3',
    title: 'Fast Lobby Qualifier',
    subtitle: '12 squads · 3 quick qualifier matches',
    mode: 'SCRIM',
    defaultEventName: 'OPEN QUALIFIER GROUP',
    roundOrDay: 'QUALIFIERS',
    totalMatchesPlanned: 3,
    targetPoints: 50,
    maxMatches: 6,
    squadCount: 12,
    badge: 'FAST',
  },
];
