import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Match,
  PointSystemConfig,
  StandingsResult,
  Team,
  TournamentMode,
  TournamentRecord,
  TournamentSettings,
  ChampionRushConfig,
} from '../types/tournament';
import {
  calculateTournamentStandings,
  DEFAULT_PLACEMENT_POINTS,
  DEFAULT_TIE_BREAK_ORDER,
} from '../lib/scoring';

export const DEFAULT_POINT_SYSTEM: PointSystemConfig = {
  placementPoints: [...DEFAULT_PLACEMENT_POINTS],
  killPoints: 1,
};

export const INITIAL_SETTINGS: TournamentSettings = {
  mode: 'SCRIM',
  name: 'FREE FIRE BANGLADESH CHAMPIONSHIP',
  roundOrDay: 'GRAND FINALS - DAY 1',
  hostName: 'BD ESPORTS ARENA',
  sponsorName: 'RED BULL / ASUS ROG',
  showLogos: true,
  totalMatchesPlanned: 5,
  teamCount: 12,
  pointSystem: { ...DEFAULT_POINT_SYSTEM },
  tieBreakOrder: [...DEFAULT_TIE_BREAK_ORDER],
  championRush: {
    targetPoints: 50,
    maxMatches: 8,
    allowSameMatchBooyahActivation: false,
  },
  theme: 'v2',
  isManuallyEnded: false,
};

export function generateInitials(name: string): string {
  if (!name) return 'FF';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 3).toUpperCase();
  }
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function formatDateTime(date: Date = new Date()): string {
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function createDefaultTeams(names: string[]): Team[] {
  return names.map((name, idx) => ({
    id: `team_${idx + 1}_${Date.now()}`,
    name,
    shortCode: generateInitials(name),
  }));
}

export const SAMPLE_TEAM_NAMES = [
  'RED CLIFF',
  'FALLEN ONES',
  'AXON BLAZE',
  'HIGH FLYER',
  'TT',
  'MAJESTIC',
  'TOXIC EMPIRE 2.0',
  'NO RULES',
  'BISHNUPUR STAR CLUB',
  'TEAM NIGHT RIDE',
  'WARFAKERS',
  'BDR ESPORTS',
];

const initialTeamsList = createDefaultTeams(SAMPLE_TEAM_NAMES);
const initialTournamentId = 'tourn_default_1';
const initialMatch1Id = `match_${initialTournamentId}_1`;

const initialMatch1Entries: Record<string, { teamId: string; placement: number | null; kills: number }> = {};
for (const t of initialTeamsList) {
  initialMatch1Entries[t.id] = { teamId: t.id, placement: null, kills: 0 };
}

const defaultInitialTournament: TournamentRecord = {
  id: initialTournamentId,
  name: 'FREE FIRE BANGLADESH CHAMPIONSHIP',
  createdAt: formatDateTime(),
  createdAtTimestamp: Date.now(),
  settings: { ...INITIAL_SETTINGS },
  teams: initialTeamsList,
  matches: [
    {
      id: initialMatch1Id,
      matchNumber: 1,
      entries: initialMatch1Entries,
      isCompleted: false,
      createdAt: Date.now(),
    },
  ],
  isEnded: false,
};

export interface TournamentStoreState {
  tournaments: TournamentRecord[];
  activeTournamentId: string | null;
  defaultPointSystem: PointSystemConfig;
  currentTab: string; // 'home' | 'create' | 'history' | 'results' | matchId

  // Reactive conveniences representing active tournament
  teams: Team[];
  matches: Match[];
  settings: TournamentSettings;
  history: TournamentRecord[][];

  // Active Tournament Getters
  getActiveTournament: () => TournamentRecord | null;
  getStandings: () => StandingsResult;

  // Navigation
  setCurrentTab: (tab: string) => void;

  // Tournament Management
  createTournament: (data: {
    name: string;
    mode: TournamentMode;
    roundOrDay?: string;
    hostName?: string;
    sponsorName?: string;
    showLogos?: boolean;
    customLogoUrl?: string;
    teamCount?: number;
    teamNames?: string[];
    teams?: { name: string; logoUrl?: string }[];
    totalMatchesPlanned?: number;
    championRush?: {
      targetPoints: number;
      maxMatches: number;
      allowSameMatchBooyahActivation: boolean;
    };
  }) => string;

  updateTournament: (
    tournamentId: string,
    data: {
      name?: string;
      mode?: TournamentMode;
      roundOrDay?: string;
      hostName?: string;
      sponsorName?: string;
      showLogos?: boolean;
      customLogoUrl?: string;
      totalMatchesPlanned?: number;
      championRush?: ChampionRushConfig;
      teams?: Team[];
    }
  ) => void;

  switchActiveTournament: (id: string, targetTab?: string) => void;
  deleteTournament: (id: string) => void;
  endActiveTournament: () => void;
  reopenActiveTournament: () => void;
  endTournamentById: (id: string) => void;
  reopenTournamentById: (id: string) => void;
  endTournament: () => void;
  reopenTournament: () => void;

  // Active Tournament Updates
  setSettings: (updates: Partial<TournamentSettings>) => void;
  updateActiveSettings: (updates: Partial<TournamentSettings>) => void;
  updateDefaultPointSystem: (updates: Partial<PointSystemConfig>) => void;
  setTeams: (teams: Team[]) => void;
  addTeam: (name: string) => boolean;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  removeTeam: (teamId: string) => void;
  reorderTeams: (startIndex: number, endIndex: number) => void;

  // Active Tournament Matches
  createMatch: () => string;
  updateMatchEntry: (
    matchId: string,
    teamId: string,
    placement: number | null,
    kills: number
  ) => void;
  completeMatch: (matchId: string) => void;
  reopenMatch: (matchId: string) => void;
  deleteMatch: (matchId: string) => void;

  // Utility Actions
  undo: () => void;
  resetTournament: () => void;
  exportJson: () => string;
  importJson: (json: string) => boolean;

  // Demo Tournament Loader
  loadDemoTeams: () => void;
  loadFullDemoTournament: () => void;
}

function resolveActive(tournaments: TournamentRecord[], activeId: string | null) {
  const active = (activeId ? tournaments.find((t) => t.id === activeId) : null) || tournaments[0] || null;
  return {
    activeTournament: active,
    teams: active ? active.teams : [],
    matches: active ? active.matches : [],
    settings: active ? active.settings : INITIAL_SETTINGS,
  };
}

export const useTournamentStore = create<TournamentStoreState>()(
  persist(
    (set, get) => ({
      tournaments: [defaultInitialTournament],
      activeTournamentId: initialTournamentId,
      defaultPointSystem: { ...DEFAULT_POINT_SYSTEM },
      currentTab: 'home',

      teams: defaultInitialTournament.teams,
      matches: defaultInitialTournament.matches,
      settings: defaultInitialTournament.settings,
      history: [],

      getActiveTournament: () => {
        const { tournaments, activeTournamentId } = get();
        return resolveActive(tournaments, activeTournamentId).activeTournament;
      },

      getStandings: () => {
        const active = get().getActiveTournament();
        if (!active) {
          return {
            standings: [],
            tournamentConcluded: false,
          };
        }
        return calculateTournamentStandings(active.teams, active.matches, active.settings);
      },

      setCurrentTab: (tab: string) => set({ currentTab: tab }),

      createTournament: (data) => {
        const now = new Date();
        const tournamentId = `tourn_${now.getTime()}`;
        const formattedDate = formatDateTime(now);

        const pointSys = get().defaultPointSystem;

        const newTeams: Team[] = data.teams && data.teams.length > 0
          ? data.teams.map((t, idx) => ({
              id: `team_${tournamentId}_${idx + 1}`,
              name: t.name.trim() || `Squad ${idx + 1}`,
              logoUrl: t.logoUrl,
              shortCode: generateInitials(t.name.trim() || `S${idx + 1}`),
            }))
          : (data.teamNames || []).map((name, idx) => ({
              id: `team_${tournamentId}_${idx + 1}`,
              name: name.trim() || `Squad ${idx + 1}`,
              shortCode: generateInitials(name.trim() || `S${idx + 1}`),
            }));

        const newSettings: TournamentSettings = {
          mode: data.mode,
          name: data.name.trim() || `Tournament ${formattedDate}`,
          roundOrDay: data.roundOrDay?.trim() || 'FINALS',
          hostName: data.hostName?.trim() || 'BD ESPORTS ARENA',
          sponsorName: data.sponsorName?.trim() || 'ARENA SPONSORS',
          showLogos: data.showLogos ?? true,
          customLogoUrl: data.customLogoUrl,
          totalMatchesPlanned: data.totalMatchesPlanned || 5,
          teamCount: newTeams.length,
          pointSystem: { ...pointSys },
          tieBreakOrder: [...DEFAULT_TIE_BREAK_ORDER],
          championRush: data.championRush || {
            targetPoints: 50,
            maxMatches: 8,
            allowSameMatchBooyahActivation: false,
          },
          theme: 'v2',
          isManuallyEnded: false,
        };

        const match1Id = `match_${tournamentId}_1`;
        const initialEntries: Record<string, { teamId: string; placement: number | null; kills: number }> = {};
        for (const t of newTeams) {
          initialEntries[t.id] = { teamId: t.id, placement: null, kills: 0 };
        }

        const match1: Match = {
          id: match1Id,
          matchNumber: 1,
          entries: initialEntries,
          isCompleted: false,
          createdAt: Date.now(),
        };

        const newRecord: TournamentRecord = {
          id: tournamentId,
          name: newSettings.name,
          createdAt: formattedDate,
          createdAtTimestamp: now.getTime(),
          settings: newSettings,
          teams: newTeams,
          matches: [match1],
          isEnded: false,
        };

        const nextTournaments = [newRecord, ...get().tournaments];
        const resolved = resolveActive(nextTournaments, tournamentId);

        set({
          tournaments: nextTournaments,
          activeTournamentId: tournamentId,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: match1Id,
        });

        return tournamentId;
      },

      updateTournament: (tournamentId, data) => {
        const target = get().tournaments.find((t) => t.id === tournamentId);
        if (!target) return;

        const updatedSettings: TournamentSettings = {
          ...target.settings,
          name: data.name !== undefined ? data.name : target.settings.name,
          mode: data.mode !== undefined ? data.mode : target.settings.mode,
          roundOrDay: data.roundOrDay !== undefined ? data.roundOrDay : target.settings.roundOrDay,
          hostName: data.hostName !== undefined ? data.hostName : target.settings.hostName,
          sponsorName: data.sponsorName !== undefined ? data.sponsorName : target.settings.sponsorName,
          showLogos: data.showLogos !== undefined ? data.showLogos : target.settings.showLogos,
          customLogoUrl: data.customLogoUrl !== undefined ? data.customLogoUrl : target.settings.customLogoUrl,
          totalMatchesPlanned: data.totalMatchesPlanned !== undefined ? data.totalMatchesPlanned : target.settings.totalMatchesPlanned,
          championRush: data.championRush !== undefined ? data.championRush : target.settings.championRush,
          teamCount: data.teams ? data.teams.length : target.settings.teamCount,
        };

        const updatedTeams = data.teams ? data.teams : target.teams;

        // Ensure all matches have entries for all teams
        const updatedMatches = target.matches.map((m) => {
          const entries = { ...m.entries };
          for (const tm of updatedTeams) {
            if (!entries[tm.id]) {
              entries[tm.id] = { teamId: tm.id, placement: null, kills: 0 };
            }
          }
          return { ...m, entries };
        });

        // If tournament is ended, recompute champion info
        let nextChampionTeamName = target.championTeamName;
        let nextChampionScore = target.championScore;
        if (target.isEnded) {
          const standingsRes = calculateTournamentStandings(updatedTeams, updatedMatches, updatedSettings);
          const topSquad = standingsRes.standings[0];
          if (topSquad) {
            nextChampionTeamName = topSquad.teamName;
            nextChampionScore = topSquad.totalPoints;
          }
        }

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            name: updatedSettings.name,
            settings: updatedSettings,
            teams: updatedTeams,
            matches: updatedMatches,
            championTeamName: nextChampionTeamName,
            championScore: nextChampionScore,
          };
        });

        const resolved = resolveActive(nextTournaments, tournamentId);
        set({
          tournaments: nextTournaments,
          activeTournamentId: tournamentId,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      switchActiveTournament: (id: string, targetTab?: string) => {
        const tourn = get().tournaments.find((t) => t.id === id);
        if (tourn) {
          document.documentElement.setAttribute('data-theme', tourn.settings.theme || 'crimson');
          const lastMatch = tourn.matches[tourn.matches.length - 1];
          const resolved = resolveActive(get().tournaments, id);
          set({
            activeTournamentId: id,
            teams: resolved.teams,
            matches: resolved.matches,
            settings: resolved.settings,
            currentTab: targetTab || (lastMatch ? lastMatch.id : 'results'),
          });
        }
      },

      deleteTournament: (id: string) => {
        const remaining = get().tournaments.filter((t) => t.id !== id);
        const nextActiveId = get().activeTournamentId === id ? (remaining[0]?.id || null) : get().activeTournamentId;
        const resolved = resolveActive(remaining, nextActiveId);
        set({
          tournaments: remaining,
          activeTournamentId: nextActiveId,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: 'history',
        });
      },

      endActiveTournament: () => {
        const active = get().getActiveTournament();
        if (!active) return;

        const standingsResult = calculateTournamentStandings(active.teams, active.matches, {
          ...active.settings,
          isManuallyEnded: true,
        });

        const championTeam = standingsResult.standings[0];

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            isEnded: true,
            championTeamName: championTeam?.teamName || 'Leader',
            championScore: championTeam?.totalPoints || 0,
            settings: {
              ...t.settings,
              isManuallyEnded: true,
            },
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: 'results',
        });
      },

      reopenActiveTournament: () => {
        const active = get().getActiveTournament();
        if (!active) return;

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            isEnded: false,
            settings: {
              ...t.settings,
              isManuallyEnded: false,
            },
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      endTournamentById: (id: string) => {
        const tourn = get().tournaments.find((t) => t.id === id);
        if (!tourn) return;

        const standingsResult = calculateTournamentStandings(tourn.teams, tourn.matches, {
          ...tourn.settings,
          isManuallyEnded: true,
        });

        const championTeam = standingsResult.standings[0];

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            isEnded: true,
            championTeamName: championTeam?.teamName || 'Leader',
            championScore: championTeam?.totalPoints || 0,
            settings: {
              ...t.settings,
              isManuallyEnded: true,
            },
          };
        });

        const resolved = resolveActive(nextTournaments, get().activeTournamentId);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      reopenTournamentById: (id: string) => {
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            isEnded: false,
            settings: {
              ...t.settings,
              isManuallyEnded: false,
            },
          };
        });

        const resolved = resolveActive(nextTournaments, get().activeTournamentId);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      endTournament: () => {
        get().endActiveTournament();
      },

      reopenTournament: () => {
        get().reopenActiveTournament();
      },

      setSettings: (updates: Partial<TournamentSettings>) => {
        get().updateActiveSettings(updates);
      },

      updateActiveSettings: (updates: Partial<TournamentSettings>) => {
        const active = get().getActiveTournament();
        if (!active) return;

        if (updates.theme) {
          document.documentElement.setAttribute('data-theme', updates.theme);
        }

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            name: updates.name || t.name,
            settings: { ...t.settings, ...updates },
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      updateDefaultPointSystem: (updates: Partial<PointSystemConfig>) => {
        set((state) => ({
          defaultPointSystem: { ...state.defaultPointSystem, ...updates },
        }));
      },

      setTeams: (newTeams: Team[]) => {
        const active = get().getActiveTournament();
        if (!active) return;

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            teams: newTeams,
            settings: { ...t.settings, teamCount: newTeams.length },
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      addTeam: (name: string): boolean => {
        const active = get().getActiveTournament();
        if (!active) return false;
        if (active.teams.length >= 20) return false;

        const newTeam: Team = {
          id: `team_${active.id}_${Date.now()}`,
          name: name.trim(),
          shortCode: generateInitials(name.trim()),
        };

        const updatedTeams = [...active.teams, newTeam];
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            teams: updatedTeams,
            settings: { ...t.settings, teamCount: updatedTeams.length },
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
        return true;
      },

      updateTeam: (teamId: string, updates: Partial<Team>) => {
        const active = get().getActiveTournament();
        if (!active) return;

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            teams: t.teams.map((tm) => (tm.id === teamId ? { ...tm, ...updates } : tm)),
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      removeTeam: (teamId: string) => {
        const active = get().getActiveTournament();
        if (!active || active.teams.length <= 2) return;

        const updatedTeams = active.teams.filter((t) => t.id !== teamId);
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            teams: updatedTeams,
            settings: { ...t.settings, teamCount: updatedTeams.length },
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      reorderTeams: (startIndex: number, endIndex: number) => {
        const active = get().getActiveTournament();
        if (!active) return;

        const reordered = Array.from(active.teams);
        const [removed] = reordered.splice(startIndex, 1);
        reordered.splice(endIndex, 0, removed);

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            teams: reordered,
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      createMatch: () => {
        const active = get().getActiveTournament();
        if (!active) return '';

        const nextNum = active.matches.length + 1;
        const matchId = `match_${active.id}_${nextNum}_${Date.now()}`;

        const initialEntries: Record<string, { teamId: string; placement: number | null; kills: number }> = {};
        for (const t of active.teams) {
          initialEntries[t.id] = { teamId: t.id, placement: null, kills: 0 };
        }

        const newMatch: Match = {
          id: matchId,
          matchNumber: nextNum,
          entries: initialEntries,
          isCompleted: false,
          createdAt: Date.now(),
        };

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            matches: [...t.matches, newMatch],
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: matchId,
        });

        return matchId;
      },

      updateMatchEntry: (matchId, teamId, placement, kills) => {
        const active = get().getActiveTournament();
        if (!active) return;

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            matches: t.matches.map((m) => {
              if (m.id !== matchId) return m;
              const currentEntry = m.entries[teamId] || { teamId, placement: null, kills: 0 };
              return {
                ...m,
                entries: {
                  ...m.entries,
                  [teamId]: {
                    ...currentEntry,
                    placement,
                    kills: Math.max(0, kills),
                  },
                },
              };
            }),
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      completeMatch: (matchId) => {
        const active = get().getActiveTournament();
        if (!active) return;

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            matches: t.matches.map((m) => (m.id === matchId ? { ...m, isCompleted: true } : m)),
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      reopenMatch: (matchId) => {
        const active = get().getActiveTournament();
        if (!active) return;

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            matches: t.matches.map((m) => (m.id === matchId ? { ...m, isCompleted: false } : m)),
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: matchId,
        });
      },

      deleteMatch: (matchId) => {
        const active = get().getActiveTournament();
        if (!active) return;

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          const remaining = t.matches.filter((m) => m.id !== matchId);
          const renumbered = remaining.map((m, index) => ({
            ...m,
            matchNumber: index + 1,
          }));
          return {
            ...t,
            matches: renumbered,
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: 'home',
        });
      },

      undo: () => {
        const history = get().history;
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        const nextHistory = history.slice(0, -1);
        const resolved = resolveActive(previousState, get().activeTournamentId);
        set({
          tournaments: previousState,
          history: nextHistory,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
      },

      resetTournament: () => {
        const active = get().getActiveTournament();
        if (!active) return;

        const defaultTeams = createDefaultTeams(SAMPLE_TEAM_NAMES);
        const match1Id = `match_${active.id}_1`;
        const initialEntries: Record<string, { teamId: string; placement: number | null; kills: number }> = {};
        for (const t of defaultTeams) {
          initialEntries[t.id] = { teamId: t.id, placement: null, kills: 0 };
        }

        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          return {
            ...t,
            teams: defaultTeams,
            matches: [
              {
                id: match1Id,
                matchNumber: 1,
                entries: initialEntries,
                isCompleted: false,
                createdAt: Date.now(),
              },
            ],
            settings: { ...INITIAL_SETTINGS },
            isEnded: false,
          };
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: 'home',
        });
      },

      exportJson: () => {
        const state = get();
        return JSON.stringify(
          {
            tournaments: state.tournaments,
            activeTournamentId: state.activeTournamentId,
            defaultPointSystem: state.defaultPointSystem,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        );
      },

      importJson: (json: string): boolean => {
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed.tournaments)) {
            const nextActiveId = parsed.activeTournamentId || parsed.tournaments[0]?.id || null;
            const resolved = resolveActive(parsed.tournaments, nextActiveId);
            set({
              tournaments: parsed.tournaments,
              activeTournamentId: nextActiveId,
              defaultPointSystem: parsed.defaultPointSystem || { ...DEFAULT_POINT_SYSTEM },
              teams: resolved.teams,
              matches: resolved.matches,
              settings: resolved.settings,
              currentTab: 'home',
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      loadDemoTeams: () => {
        const active = get().getActiveTournament();
        if (!active) return;
        const demoTeams = createDefaultTeams(SAMPLE_TEAM_NAMES);
        get().setTeams(demoTeams);
      },

      loadFullDemoTournament: () => {
        const now = new Date();
        const tournamentId = `tourn_demo_${now.getTime()}`;
        const formattedDate = formatDateTime(now);

        const demoTeams = createDefaultTeams(SAMPLE_TEAM_NAMES);

        const sampleMatches: Match[] = [
          {
            id: `m1_${tournamentId}`,
            matchNumber: 1,
            isCompleted: true,
            createdAt: now.getTime() - 40000,
            entries: {
              [demoTeams[0].id]: { teamId: demoTeams[0].id, placement: 4, kills: 8 },
              [demoTeams[1].id]: { teamId: demoTeams[1].id, placement: 1, kills: 9 },
              [demoTeams[2].id]: { teamId: demoTeams[2].id, placement: 6, kills: 7 },
              [demoTeams[3].id]: { teamId: demoTeams[3].id, placement: 7, kills: 5 },
              [demoTeams[4].id]: { teamId: demoTeams[4].id, placement: 5, kills: 6 },
              [demoTeams[5].id]: { teamId: demoTeams[5].id, placement: 8, kills: 5 },
              [demoTeams[6].id]: { teamId: demoTeams[6].id, placement: 9, kills: 5 },
              [demoTeams[7].id]: { teamId: demoTeams[7].id, placement: 10, kills: 6 },
              [demoTeams[8].id]: { teamId: demoTeams[8].id, placement: 11, kills: 4 },
              [demoTeams[9].id]: { teamId: demoTeams[9].id, placement: 12, kills: 5 },
              [demoTeams[10].id]: { teamId: demoTeams[10].id, placement: 2, kills: 3 },
              [demoTeams[11].id]: { teamId: demoTeams[11].id, placement: 5, kills: 2 },
            },
          },
          {
            id: `m2_${tournamentId}`,
            matchNumber: 2,
            isCompleted: true,
            createdAt: now.getTime() - 30000,
            entries: {
              [demoTeams[0].id]: { teamId: demoTeams[0].id, placement: 4, kills: 9 },
              [demoTeams[1].id]: { teamId: demoTeams[1].id, placement: 5, kills: 8 },
              [demoTeams[2].id]: { teamId: demoTeams[2].id, placement: 1, kills: 10 },
              [demoTeams[3].id]: { teamId: demoTeams[3].id, placement: 8, kills: 4 },
              [demoTeams[4].id]: { teamId: demoTeams[4].id, placement: 7, kills: 6 },
              [demoTeams[5].id]: { teamId: demoTeams[5].id, placement: 7, kills: 6 },
              [demoTeams[6].id]: { teamId: demoTeams[6].id, placement: 11, kills: 6 },
              [demoTeams[7].id]: { teamId: demoTeams[7].id, placement: 12, kills: 6 },
              [demoTeams[8].id]: { teamId: demoTeams[8].id, placement: 2, kills: 5 },
              [demoTeams[9].id]: { teamId: demoTeams[9].id, placement: 9, kills: 5 },
              [demoTeams[10].id]: { teamId: demoTeams[10].id, placement: 11, kills: 3 },
              [demoTeams[11].id]: { teamId: demoTeams[11].id, placement: 11, kills: 2 },
            },
          },
          {
            id: `m3_${tournamentId}`,
            matchNumber: 3,
            isCompleted: true,
            createdAt: now.getTime() - 20000,
            entries: {
              [demoTeams[0].id]: { teamId: demoTeams[0].id, placement: 5, kills: 8 },
              [demoTeams[1].id]: { teamId: demoTeams[1].id, placement: 6, kills: 7 },
              [demoTeams[2].id]: { teamId: demoTeams[2].id, placement: 8, kills: 7 },
              [demoTeams[3].id]: { teamId: demoTeams[3].id, placement: 1, kills: 6 },
              [demoTeams[4].id]: { teamId: demoTeams[4].id, placement: 8, kills: 6 },
              [demoTeams[5].id]: { teamId: demoTeams[5].id, placement: 7, kills: 5 },
              [demoTeams[6].id]: { teamId: demoTeams[6].id, placement: 7, kills: 5 },
              [demoTeams[7].id]: { teamId: demoTeams[7].id, placement: 11, kills: 6 },
              [demoTeams[8].id]: { teamId: demoTeams[8].id, placement: 6, kills: 4 },
              [demoTeams[9].id]: { teamId: demoTeams[9].id, placement: 10, kills: 5 },
              [demoTeams[10].id]: { teamId: demoTeams[10].id, placement: 11, kills: 3 },
              [demoTeams[11].id]: { teamId: demoTeams[11].id, placement: 12, kills: 2 },
            },
          },
          {
            id: `m4_${tournamentId}`,
            matchNumber: 4,
            isCompleted: true,
            createdAt: now.getTime() - 10000,
            entries: {
              [demoTeams[0].id]: { teamId: demoTeams[0].id, placement: 8, kills: 7 },
              [demoTeams[1].id]: { teamId: demoTeams[1].id, placement: 9, kills: 6 },
              [demoTeams[2].id]: { teamId: demoTeams[2].id, placement: 11, kills: 6 },
              [demoTeams[3].id]: { teamId: demoTeams[3].id, placement: 11, kills: 4 },
              [demoTeams[4].id]: { teamId: demoTeams[4].id, placement: 11, kills: 6 },
              [demoTeams[5].id]: { teamId: demoTeams[5].id, placement: 7, kills: 5 },
              [demoTeams[6].id]: { teamId: demoTeams[6].id, placement: 7, kills: 5 },
              [demoTeams[7].id]: { teamId: demoTeams[7].id, placement: 8, kills: 6 },
              [demoTeams[8].id]: { teamId: demoTeams[8].id, placement: 11, kills: 4 },
              [demoTeams[9].id]: { teamId: demoTeams[9].id, placement: 11, kills: 5 },
              [demoTeams[10].id]: { teamId: demoTeams[10].id, placement: 11, kills: 3 },
              [demoTeams[11].id]: { teamId: demoTeams[11].id, placement: 12, kills: 2 },
            },
          },
          {
            id: `m5_${tournamentId}`,
            matchNumber: 5,
            isCompleted: true,
            createdAt: now.getTime(),
            entries: {
              [demoTeams[0].id]: { teamId: demoTeams[0].id, placement: 10, kills: 7 },
              [demoTeams[1].id]: { teamId: demoTeams[1].id, placement: 11, kills: 6 },
              [demoTeams[2].id]: { teamId: demoTeams[2].id, placement: 11, kills: 5 },
              [demoTeams[3].id]: { teamId: demoTeams[3].id, placement: 10, kills: 3 },
              [demoTeams[4].id]: { teamId: demoTeams[4].id, placement: 11, kills: 5 },
              [demoTeams[5].id]: { teamId: demoTeams[5].id, placement: 11, kills: 5 },
              [demoTeams[6].id]: { teamId: demoTeams[6].id, placement: 8, kills: 5 },
              [demoTeams[7].id]: { teamId: demoTeams[7].id, placement: 8, kills: 5 },
              [demoTeams[8].id]: { teamId: demoTeams[8].id, placement: 11, kills: 3 },
              [demoTeams[9].id]: { teamId: demoTeams[9].id, placement: 9, kills: 4 },
              [demoTeams[10].id]: { teamId: demoTeams[10].id, placement: 11, kills: 3 },
              [demoTeams[11].id]: { teamId: demoTeams[11].id, placement: 12, kills: 1 },
            },
          },
        ];

        const demoRecord: TournamentRecord = {
          id: tournamentId,
          name: 'FREE FIRE BANGLADESH CHAMPIONSHIP',
          createdAt: formattedDate,
          createdAtTimestamp: now.getTime(),
          settings: {
            ...INITIAL_SETTINGS,
            isManuallyEnded: true,
          },
          teams: demoTeams,
          matches: sampleMatches,
          isEnded: true,
          championTeamName: 'RED CLIFF',
          championScore: 63,
        };

        const nextTournaments = [demoRecord, ...get().tournaments];
        const resolved = resolveActive(nextTournaments, tournamentId);

        set({
          tournaments: nextTournaments,
          activeTournamentId: tournamentId,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: 'results',
        });
      },
    }),
    {
      name: 'freefire_multi_tournament_store_v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
