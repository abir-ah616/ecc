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
    id: 'default-scrim',
    title: 'Default Scrim',
    subtitle: '3 matches · 12 teams · Standard Scrim format',
    mode: 'SCRIM',
    defaultEventName: 'FREE FIRE SCRIM',
    roundOrDay: 'SCRIM SERIES',
    totalMatchesPlanned: 3,
    targetPoints: 50,
    maxMatches: 6,
    squadCount: 12,
    badge: 'DEFAULT',
  },
  {
    id: 'quick-rush',
    title: 'Quick Champion Rush',
    subtitle: '5 max matches · 50 pts activate · 12 teams',
    mode: 'CHAMPION_RUSH',
    defaultEventName: 'CHAMPION RUSH SERIES',
    roundOrDay: 'FINALS · RUSH 50',
    totalMatchesPlanned: 5,
    targetPoints: 50,
    maxMatches: 5,
    squadCount: 12,
    badge: 'RUSH 50',
  },
  {
    id: 'scrim-pro',
    title: 'Scrim Pro',
    subtitle: '5 matches · 12 teams · Pro Finals layout',
    mode: 'SCRIM',
    defaultEventName: 'FREE FIRE PRO SCRIM',
    roundOrDay: 'GRAND FINALS',
    totalMatchesPlanned: 5,
    targetPoints: 80,
    maxMatches: 8,
    squadCount: 12,
    badge: 'SCRIM PRO',
  },
  {
    id: 'rush-pro',
    title: 'Champion Rush Pro',
    subtitle: '8 max matches · 80 pts activate · 12 teams',
    mode: 'CHAMPION_RUSH',
    defaultEventName: 'PRO CHAMPIONSHIP FINALS',
    roundOrDay: 'GRAND FINALS',
    totalMatchesPlanned: 8,
    targetPoints: 80,
    maxMatches: 8,
    squadCount: 12,
    badge: 'RUSH PRO',
  },
];
