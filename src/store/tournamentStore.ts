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
  SavedSquadRecord,
  OrganizerDefaults,
} from '../types/tournament';
import type { TournamentLayoutPreset } from '../lib/templates';
import {
  calculateTournamentStandings,
  DEFAULT_PLACEMENT_POINTS,
  DEFAULT_TIE_BREAK_ORDER,
} from '../lib/scoring';
import { sanitizeImportedTournamentPayload } from '../lib/authValidation';
import {
  buildSquadPlayerFields,
  incrementStageOrDayLabel,
  isPlaceholderSquadName,
  resolveSquadPlayers,
  toSquadVaultId,
} from '../lib/rosterHelpers';

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
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last) && parts[0].length > 0) {
    return `${parts[0][0]}${last}`.slice(0, 4).toUpperCase();
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

// Initial empty default tournaments list (No sample or fake demo data loaded by default)

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

export interface CloudSyncHooks {
  onTournamentUpsert?: (record: TournamentRecord) => void;
  onTournamentDelete?: (tournamentId: string) => void;
  onSquadsUpsert?: (squads: SavedSquadRecord[]) => void;
  onSquadDelete?: (squadId: string) => void;
  onMetaUpdate?: () => void;
}

let cloudHooks: CloudSyncHooks = {};
export function registerCloudSyncHooks(hooks: CloudSyncHooks) {
  cloudHooks = hooks;
}

function mergeTeamsIntoVault(
  existing: SavedSquadRecord[],
  teams: Team[],
  now = Date.now()
): { nextVault: SavedSquadRecord[]; changed: SavedSquadRecord[] } {
  const byId = new Map<string, SavedSquadRecord>();
  for (const sq of existing) {
    byId.set(sq.id, sq);
  }
  const changed: SavedSquadRecord[] = [];

  for (const t of teams) {
    const cleanName = t.name.trim();
    if (isPlaceholderSquadName(cleanName)) continue;
    const id = toSquadVaultId(cleanName);
    const prev = byId.get(id);
    const mergedLearned = Array.from(
      new Set([...(prev?.learnedTokens || []), ...(t.learnedTokens || [])])
    ).slice(0, 32);

    const explicitPlayers = resolveSquadPlayers(t);
    const mergedPlayers =
      explicitPlayers.length > 0 ? explicitPlayers : resolveSquadPlayers(prev);
    const playerFields = buildSquadPlayerFields(mergedPlayers);

    const nextItem: SavedSquadRecord = {
      id,
      name: cleanName.slice(0, 120),
      shortCode: (t.shortCode || generateInitials(cleanName)).slice(0, 12),
      logoUrl: t.logoUrl || prev?.logoUrl,
      ...playerFields,
      learnedTokens: mergedLearned.length > 0 ? mergedLearned : undefined,
      updatedAt: now,
    };
    byId.set(id, nextItem);
    changed.push(nextItem);
  }

  const nextVault = Array.from(byId.values()).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
  return { nextVault, changed };
}

export interface TournamentStoreState {
  tournaments: TournamentRecord[];
  activeTournamentId: string | null;
  defaultPointSystem: PointSystemConfig;
  savedSquads: SavedSquadRecord[];
  organizerDefaults: OrganizerDefaults;
  cloudSyncStatus: CloudSyncStatus;
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
  pendingTemplate: TournamentLayoutPreset | null;
  setCurrentTab: (tab: string) => void;
  openCreateWithTemplate: (preset?: TournamentLayoutPreset) => void;
  clearPendingTemplate: () => void;

  // Tournament Management
  createTournament: (data: {
    name: string;
    mode: TournamentMode;
    roundOrDay?: string;
    hostName?: string;
    sponsorName?: string;
    showLogos?: boolean;
    customLogoUrl?: string;
    autoResultFromScreenshot?: boolean;
    teamCount?: number;
    teamNames?: string[];
    teams?: {
      name: string;
      logoUrl?: string;
      player1?: string;
      player2?: string;
      players?: string[];
      learnedTokens?: string[];
    }[];
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
      autoResultFromScreenshot?: boolean;
      totalMatchesPlanned?: number;
      championRush?: ChampionRushConfig;
      teams?: Team[];
    }
  ) => void;

  duplicateTournament: (sourceId: string) => string | null;

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

  // Squad Vault
  findSavedSquadByName: (name: string) => SavedSquadRecord | undefined;
  upsertSavedSquad: (
    squad: Omit<SavedSquadRecord, 'id' | 'shortCode' | 'updatedAt'> & {
      id?: string;
      shortCode?: string;
    }
  ) => void;
  deleteSavedSquad: (squadId: string) => void;

  // Active Tournament Matches
  createMatch: () => string;
  updateMatchEntry: (
    matchId: string,
    teamId: string,
    placement: number | null,
    kills: number
  ) => void;
  applyBatchMatchResults: (
    matchId: string,
    entries: Array<{ teamId: string; placement: number | null; kills: number }>,
    learnedByTeamId?: Record<string, string[]>
  ) => void;
  completeMatch: (matchId: string) => void;
  reopenMatch: (matchId: string) => void;
  deleteMatch: (matchId: string) => void;

  // Cloud Sync internal setters
  setCloudSyncStatus: (status: CloudSyncStatus) => void;
  applyCloudWorkspace: (payload: {
    tournaments?: TournamentRecord[];
    savedSquads?: SavedSquadRecord[];
    activeTournamentId?: string | null;
    defaultPointSystem?: PointSystemConfig;
    organizerDefaults?: OrganizerDefaults;
  }) => void;

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
      tournaments: [],
      activeTournamentId: null,
      defaultPointSystem: { ...DEFAULT_POINT_SYSTEM },
      savedSquads: [],
      organizerDefaults: {
        hostName: '',
        sponsorName: '',
      },
      cloudSyncStatus: 'idle',
      currentTab: 'home',
      pendingTemplate: null,

      teams: [],
      matches: [],
      settings: INITIAL_SETTINGS,
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

      setCurrentTab: (tab: string) =>
        set((state) => ({
          currentTab: tab,
          pendingTemplate: tab === 'create' ? state.pendingTemplate : null,
        })),

      openCreateWithTemplate: (preset) =>
        set({
          pendingTemplate: preset ?? null,
          currentTab: 'create',
        }),

      clearPendingTemplate: () => set({ pendingTemplate: null }),

      createTournament: (data) => {
        const now = new Date();
        const nowMs = now.getTime();
        const tournamentId = `tourn_${nowMs}`;
        const formattedDate = formatDateTime(now);

        const pointSys = get().defaultPointSystem;
        const vault = get().savedSquads;

        const newTeams: Team[] =
          data.teams && data.teams.length > 0
            ? data.teams.map((t, idx) => {
                const cleanName = t.name.trim() || `Squad ${idx + 1}`;
                const vaultHit = !isPlaceholderSquadName(cleanName)
                  ? vault.find((v) => v.id === toSquadVaultId(cleanName))
                  : undefined;
                const explicitPlayers = resolveSquadPlayers(t);
                const resolvedPlayers =
                  explicitPlayers.length > 0
                    ? explicitPlayers
                    : resolveSquadPlayers(vaultHit);
                const playerFields = buildSquadPlayerFields(resolvedPlayers);
                return {
                  id: `team_${tournamentId}_${idx + 1}`,
                  name: cleanName,
                  logoUrl: t.logoUrl || vaultHit?.logoUrl,
                  shortCode: generateInitials(cleanName || `S${idx + 1}`),
                  ...playerFields,
                  learnedTokens:
                    t.learnedTokens && t.learnedTokens.length > 0
                      ? t.learnedTokens
                      : vaultHit?.learnedTokens,
                };
              })
            : (data.teamNames || []).map((name, idx) => {
                const cleanName = name.trim() || `Squad ${idx + 1}`;
                return {
                  id: `team_${tournamentId}_${idx + 1}`,
                  name: cleanName,
                  shortCode: generateInitials(cleanName || `S${idx + 1}`),
                };
              });

        const prevDefaults = get().organizerDefaults;
        const cleanHost = data.hostName?.trim() || '';
        const cleanSponsor = data.sponsorName?.trim() || '';
        const nextDefaults: OrganizerDefaults = {
          hostName: cleanHost || prevDefaults.hostName,
          sponsorName: cleanSponsor || prevDefaults.sponsorName,
          customLogoUrl: data.customLogoUrl || prevDefaults.customLogoUrl,
        };

        const newSettings: TournamentSettings = {
          mode: data.mode,
          name: data.name.trim() || `Tournament ${formattedDate}`,
          roundOrDay: data.roundOrDay?.trim() || 'FINALS',
          hostName: cleanHost || 'BD ESPORTS ARENA',
          sponsorName: cleanSponsor || 'ARENA SPONSORS',
          showLogos: data.showLogos ?? true,
          customLogoUrl: data.customLogoUrl,
          autoResultFromScreenshot: Boolean(data.autoResultFromScreenshot),
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
        const initialEntries: Record<
          string,
          { teamId: string; placement: number | null; kills: number }
        > = {};
        for (const t of newTeams) {
          initialEntries[t.id] = { teamId: t.id, placement: null, kills: 0 };
        }

        const match1: Match = {
          id: match1Id,
          matchNumber: 1,
          entries: initialEntries,
          isCompleted: false,
          createdAt: nowMs,
        };

        const newRecord: TournamentRecord = {
          id: tournamentId,
          name: newSettings.name,
          createdAt: formattedDate,
          createdAtTimestamp: nowMs,
          updatedAt: nowMs,
          settings: newSettings,
          teams: newTeams,
          matches: [match1],
          isEnded: false,
        };

        const { nextVault, changed: vaultChanged } = mergeTeamsIntoVault(
          vault,
          newTeams,
          nowMs
        );
        const nextTournaments = [newRecord, ...get().tournaments];
        const resolved = resolveActive(nextTournaments, tournamentId);

        set({
          tournaments: nextTournaments,
          activeTournamentId: tournamentId,
          savedSquads: nextVault,
          organizerDefaults: nextDefaults,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: match1Id,
        });

        cloudHooks.onTournamentUpsert?.(newRecord);
        if (vaultChanged.length > 0) cloudHooks.onSquadsUpsert?.(vaultChanged);
        cloudHooks.onMetaUpdate?.();

        return tournamentId;
      },

      updateTournament: (tournamentId, data) => {
        const target = get().tournaments.find((t) => t.id === tournamentId);
        if (!target) return;
        const nowMs = Date.now();

        const updatedSettings: TournamentSettings = {
          ...target.settings,
          name: data.name !== undefined ? data.name : target.settings.name,
          mode: data.mode !== undefined ? data.mode : target.settings.mode,
          roundOrDay:
            data.roundOrDay !== undefined
              ? data.roundOrDay
              : target.settings.roundOrDay,
          hostName:
            data.hostName !== undefined ? data.hostName : target.settings.hostName,
          sponsorName:
            data.sponsorName !== undefined
              ? data.sponsorName
              : target.settings.sponsorName,
          showLogos:
            data.showLogos !== undefined
              ? data.showLogos
              : target.settings.showLogos,
          customLogoUrl:
            data.customLogoUrl !== undefined
              ? data.customLogoUrl
              : target.settings.customLogoUrl,
          autoResultFromScreenshot:
            data.autoResultFromScreenshot !== undefined
              ? data.autoResultFromScreenshot
              : target.settings.autoResultFromScreenshot,
          totalMatchesPlanned:
            data.totalMatchesPlanned !== undefined
              ? data.totalMatchesPlanned
              : target.settings.totalMatchesPlanned,
          championRush:
            data.championRush !== undefined
              ? data.championRush
              : target.settings.championRush,
          teamCount: data.teams ? data.teams.length : target.settings.teamCount,
        };

        const updatedTeams = data.teams ? data.teams : target.teams;

        const updatedMatches = target.matches.map((m) => {
          const entries = { ...m.entries };
          for (const tm of updatedTeams) {
            if (!entries[tm.id]) {
              entries[tm.id] = { teamId: tm.id, placement: null, kills: 0 };
            }
          }
          return { ...m, entries };
        });

        let nextChampionTeamName = target.championTeamName;
        let nextChampionScore = target.championScore;
        if (target.isEnded) {
          const standingsRes = calculateTournamentStandings(
            updatedTeams,
            updatedMatches,
            updatedSettings
          );
          const topSquad = standingsRes.standings[0];
          if (topSquad) {
            nextChampionTeamName = topSquad.teamName;
            nextChampionScore = topSquad.totalPoints;
          }
        }

        let updatedRecord: TournamentRecord | null = null;
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== tournamentId) return t;
          updatedRecord = {
            ...t,
            name: updatedSettings.name,
            updatedAt: nowMs,
            settings: updatedSettings,
            teams: updatedTeams,
            matches: updatedMatches,
            championTeamName: nextChampionTeamName,
            championScore: nextChampionScore,
          };
          return updatedRecord;
        });

        const { nextVault, changed: vaultChanged } = mergeTeamsIntoVault(
          get().savedSquads,
          updatedTeams,
          nowMs
        );
        const prevDefaults = get().organizerDefaults;
        const nextDefaults: OrganizerDefaults = {
          hostName: data.hostName?.trim() || prevDefaults.hostName,
          sponsorName: data.sponsorName?.trim() || prevDefaults.sponsorName,
          customLogoUrl: data.customLogoUrl || prevDefaults.customLogoUrl,
        };

        const resolved = resolveActive(nextTournaments, tournamentId);
        set({
          tournaments: nextTournaments,
          activeTournamentId: tournamentId,
          savedSquads: nextVault,
          organizerDefaults: nextDefaults,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });

        if (updatedRecord) cloudHooks.onTournamentUpsert?.(updatedRecord);
        if (vaultChanged.length > 0) cloudHooks.onSquadsUpsert?.(vaultChanged);
        cloudHooks.onMetaUpdate?.();
      },

      duplicateTournament: (sourceId: string) => {
        const source = get().tournaments.find((t) => t.id === sourceId);
        if (!source) return null;

        const now = new Date();
        const nowMs = now.getTime();
        const tournamentId = `tourn_${nowMs}`;
        const formattedDate = formatDateTime(now);

        const clonedTeams: Team[] = source.teams.map((tm, idx) => ({
          id: `team_${tournamentId}_${idx + 1}`,
          name: tm.name,
          logoUrl: tm.logoUrl,
          shortCode: tm.shortCode || generateInitials(tm.name),
          ...buildSquadPlayerFields(resolveSquadPlayers(tm)),
          learnedTokens: tm.learnedTokens ? [...tm.learnedTokens] : undefined,
        }));

        const nextRound = incrementStageOrDayLabel(source.settings.roundOrDay);
        const clonedSettings: TournamentSettings = {
          ...source.settings,
          roundOrDay: nextRound,
          isManuallyEnded: false,
          pointSystem: {
            placementPoints: [...source.settings.pointSystem.placementPoints],
            killPoints: source.settings.pointSystem.killPoints,
          },
          tieBreakOrder: [...source.settings.tieBreakOrder],
          championRush: { ...source.settings.championRush },
        };

        const match1Id = `match_${tournamentId}_1`;
        const initialEntries: Record<
          string,
          { teamId: string; placement: number | null; kills: number }
        > = {};
        for (const t of clonedTeams) {
          initialEntries[t.id] = { teamId: t.id, placement: null, kills: 0 };
        }

        const clonedRecord: TournamentRecord = {
          id: tournamentId,
          name: clonedSettings.name,
          createdAt: formattedDate,
          createdAtTimestamp: nowMs,
          updatedAt: nowMs,
          settings: clonedSettings,
          teams: clonedTeams,
          matches: [
            {
              id: match1Id,
              matchNumber: 1,
              entries: initialEntries,
              isCompleted: false,
              createdAt: nowMs,
            },
          ],
          isEnded: false,
        };

        const nextTournaments = [clonedRecord, ...get().tournaments];
        const resolved = resolveActive(nextTournaments, tournamentId);
        document.documentElement.setAttribute(
          'data-theme',
          clonedSettings.theme || 'v2'
        );

        set({
          tournaments: nextTournaments,
          activeTournamentId: tournamentId,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: match1Id,
        });

        cloudHooks.onTournamentUpsert?.(clonedRecord);
        cloudHooks.onMetaUpdate?.();
        return tournamentId;
      },

      switchActiveTournament: (id: string, targetTab?: string) => {
        const tourn = get().tournaments.find((t) => t.id === id);
        if (tourn) {
          document.documentElement.setAttribute('data-theme', tourn.settings.theme || 'v2');
          const lastMatch = tourn.matches[tourn.matches.length - 1];
          const resolved = resolveActive(get().tournaments, id);
          set({
            activeTournamentId: id,
            teams: resolved.teams,
            matches: resolved.matches,
            settings: resolved.settings,
            currentTab: targetTab || (lastMatch ? lastMatch.id : 'results'),
          });
          cloudHooks.onMetaUpdate?.();
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
        cloudHooks.onTournamentDelete?.(id);
        cloudHooks.onMetaUpdate?.();
      },

      endActiveTournament: () => {
        const active = get().getActiveTournament();
        if (!active) return;
        const nowMs = Date.now();

        const standingsResult = calculateTournamentStandings(active.teams, active.matches, {
          ...active.settings,
          isManuallyEnded: true,
        });

        const championTeam = standingsResult.standings[0];

        let updatedRecord: TournamentRecord | null = null;
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          updatedRecord = {
            ...t,
            updatedAt: nowMs,
            isEnded: true,
            championTeamName: championTeam?.teamName || 'Leader',
            championScore: championTeam?.totalPoints || 0,
            settings: {
              ...t.settings,
              isManuallyEnded: true,
            },
          };
          return updatedRecord;
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: 'results',
        });
        if (updatedRecord) cloudHooks.onTournamentUpsert?.(updatedRecord);
      },

      reopenActiveTournament: () => {
        const active = get().getActiveTournament();
        if (!active) return;
        const nowMs = Date.now();

        let updatedRecord: TournamentRecord | null = null;
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          updatedRecord = {
            ...t,
            updatedAt: nowMs,
            isEnded: false,
            settings: {
              ...t.settings,
              isManuallyEnded: false,
            },
          };
          return updatedRecord;
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
        if (updatedRecord) cloudHooks.onTournamentUpsert?.(updatedRecord);
      },

      endTournamentById: (id: string) => {
        const tourn = get().tournaments.find((t) => t.id === id);
        if (!tourn) return;
        const nowMs = Date.now();

        const standingsResult = calculateTournamentStandings(tourn.teams, tourn.matches, {
          ...tourn.settings,
          isManuallyEnded: true,
        });

        const championTeam = standingsResult.standings[0];

        let updatedRecord: TournamentRecord | null = null;
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== id) return t;
          updatedRecord = {
            ...t,
            updatedAt: nowMs,
            isEnded: true,
            championTeamName: championTeam?.teamName || 'Leader',
            championScore: championTeam?.totalPoints || 0,
            settings: {
              ...t.settings,
              isManuallyEnded: true,
            },
          };
          return updatedRecord;
        });

        const resolved = resolveActive(nextTournaments, get().activeTournamentId);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
        if (updatedRecord) cloudHooks.onTournamentUpsert?.(updatedRecord);
      },

      reopenTournamentById: (id: string) => {
        const nowMs = Date.now();
        let updatedRecord: TournamentRecord | null = null;
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== id) return t;
          updatedRecord = {
            ...t,
            updatedAt: nowMs,
            isEnded: false,
            settings: {
              ...t.settings,
              isManuallyEnded: false,
            },
          };
          return updatedRecord;
        });

        const resolved = resolveActive(nextTournaments, get().activeTournamentId);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
        if (updatedRecord) cloudHooks.onTournamentUpsert?.(updatedRecord);
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
        const nowMs = Date.now();

        if (updates.theme) {
          document.documentElement.setAttribute('data-theme', updates.theme);
        }

        let updatedRecord: TournamentRecord | null = null;
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          updatedRecord = {
            ...t,
            updatedAt: nowMs,
            name: updates.name || t.name,
            settings: { ...t.settings, ...updates },
          };
          return updatedRecord;
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
        if (updatedRecord) cloudHooks.onTournamentUpsert?.(updatedRecord);
      },

      updateDefaultPointSystem: (updates: Partial<PointSystemConfig>) => {
        set((state) => ({
          defaultPointSystem: { ...state.defaultPointSystem, ...updates },
        }));
        cloudHooks.onMetaUpdate?.();
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

      findSavedSquadByName: (name: string) => {
        const clean = name.trim();
        if (!clean || isPlaceholderSquadName(clean)) return undefined;
        const targetId = toSquadVaultId(clean);
        return get().savedSquads.find((s) => s.id === targetId);
      },

      upsertSavedSquad: (squad) => {
        const cleanName = squad.name.trim();
        if (isPlaceholderSquadName(cleanName)) return;
        const nowMs = Date.now();
        const id = squad.id || toSquadVaultId(cleanName);
        const existing = get().savedSquads.find((s) => s.id === id);
        const mergedLearned = Array.from(
          new Set([
            ...(existing?.learnedTokens || []),
            ...(squad.learnedTokens || []),
          ])
        ).slice(0, 32);

        const record: SavedSquadRecord = {
          id,
          name: cleanName.slice(0, 120),
          shortCode: (squad.shortCode || generateInitials(cleanName)).slice(0, 12),
          logoUrl: squad.logoUrl !== undefined ? squad.logoUrl : existing?.logoUrl,
          player1: squad.player1 !== undefined ? squad.player1.trim() : existing?.player1,
          player2: squad.player2 !== undefined ? squad.player2.trim() : existing?.player2,
          learnedTokens: mergedLearned.length > 0 ? mergedLearned : undefined,
          updatedAt: nowMs,
        };

        const nextVault = [
          record,
          ...get().savedSquads.filter((s) => s.id !== id),
        ];
        set({ savedSquads: nextVault });
        cloudHooks.onSquadsUpsert?.([record]);
      },

      deleteSavedSquad: (squadId: string) => {
        set((state) => ({
          savedSquads: state.savedSquads.filter((s) => s.id !== squadId),
        }));
        cloudHooks.onSquadDelete?.(squadId);
      },

      createMatch: () => {
        const active = get().getActiveTournament();
        if (!active) return '';
        const nowMs = Date.now();

        const nextNum = active.matches.length + 1;
        const matchId = `match_${active.id}_${nextNum}_${nowMs}`;

        const initialEntries: Record<string, { teamId: string; placement: number | null; kills: number }> = {};
        for (const t of active.teams) {
          initialEntries[t.id] = { teamId: t.id, placement: null, kills: 0 };
        }

        const newMatch: Match = {
          id: matchId,
          matchNumber: nextNum,
          entries: initialEntries,
          isCompleted: false,
          createdAt: nowMs,
        };

        let updatedRecord: TournamentRecord | null = null;
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          updatedRecord = {
            ...t,
            updatedAt: nowMs,
            matches: [...t.matches, newMatch],
          };
          return updatedRecord;
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
          currentTab: matchId,
        });

        if (updatedRecord) cloudHooks.onTournamentUpsert?.(updatedRecord);
        return matchId;
      },

      updateMatchEntry: (matchId, teamId, placement, kills) => {
        const active = get().getActiveTournament();
        if (!active) return;
        const nowMs = Date.now();

        let updatedRecord: TournamentRecord | null = null;
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          updatedRecord = {
            ...t,
            updatedAt: nowMs,
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
          return updatedRecord;
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
        if (updatedRecord) cloudHooks.onTournamentUpsert?.(updatedRecord);
      },

      applyBatchMatchResults: (matchId, entries, learnedByTeamId) => {
        const active = get().getActiveTournament();
        if (!active) return;
        const nowMs = Date.now();

        let updatedRecord: TournamentRecord | null = null;
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;

          const nextTeams = learnedByTeamId
            ? t.teams.map((tm) => {
                const extra = learnedByTeamId[tm.id];
                if (!extra || extra.length === 0) return tm;
                const combined = Array.from(
                  new Set([...(tm.learnedTokens || []), ...extra])
                ).slice(0, 32);
                return { ...tm, learnedTokens: combined };
              })
            : t.teams;

          const nextMatches = t.matches.map((m) => {
            if (m.id !== matchId) return m;
            const nextEntries = { ...m.entries };
            for (const item of entries) {
              nextEntries[item.teamId] = {
                teamId: item.teamId,
                placement: item.placement,
                kills: Math.max(0, item.kills),
              };
            }
            return { ...m, entries: nextEntries };
          });

          updatedRecord = {
            ...t,
            updatedAt: nowMs,
            teams: nextTeams,
            matches: nextMatches,
          };
          return updatedRecord;
        });

        let nextVault = get().savedSquads;
        let vaultChanged: SavedSquadRecord[] = [];
        if (updatedRecord && learnedByTeamId) {
          const merged = mergeTeamsIntoVault(
            nextVault,
            (updatedRecord as TournamentRecord).teams,
            nowMs
          );
          nextVault = merged.nextVault;
          vaultChanged = merged.changed;
        }

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          savedSquads: nextVault,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });

        if (updatedRecord) cloudHooks.onTournamentUpsert?.(updatedRecord);
        if (vaultChanged.length > 0) cloudHooks.onSquadsUpsert?.(vaultChanged);
      },

      completeMatch: (matchId) => {
        const active = get().getActiveTournament();
        if (!active) return;
        const nowMs = Date.now();

        let updatedRecord: TournamentRecord | null = null;
        const nextTournaments = get().tournaments.map((t) => {
          if (t.id !== active.id) return t;
          updatedRecord = {
            ...t,
            updatedAt: nowMs,
            matches: t.matches.map((m) => (m.id === matchId ? { ...m, isCompleted: true } : m)),
          };
          return updatedRecord;
        });

        const resolved = resolveActive(nextTournaments, active.id);
        set({
          tournaments: nextTournaments,
          teams: resolved.teams,
          matches: resolved.matches,
          settings: resolved.settings,
        });
        if (updatedRecord) cloudHooks.onTournamentUpsert?.(updatedRecord);
      },

      setCloudSyncStatus: (status) => set({ cloudSyncStatus: status }),

      applyCloudWorkspace: (payload) => {
        const state = get();
        const nextTournaments = payload.tournaments ?? state.tournaments;
        const nextSavedSquads = payload.savedSquads ?? state.savedSquads;
        const candidateActiveId =
          payload.activeTournamentId !== undefined
            ? payload.activeTournamentId
            : state.activeTournamentId;
        const validActiveId =
          candidateActiveId && nextTournaments.some((t) => t.id === candidateActiveId)
            ? candidateActiveId
            : nextTournaments[0]?.id ?? null;
        const resolved = resolveActive(nextTournaments, validActiveId);

        set({
          tournaments: nextTournaments,
          savedSquads: nextSavedSquads,
          activeTournamentId: validActiveId,
          defaultPointSystem: payload.defaultPointSystem ?? state.defaultPointSystem,
          organizerDefaults: payload.organizerDefaults ?? state.organizerDefaults,
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
          if (typeof json !== 'string' || json.length > 15_000_000) return false;
          const rawParsed = JSON.parse(json);
          const parsed = sanitizeImportedTournamentPayload(rawParsed);
          if (parsed && Array.isArray(parsed.tournaments)) {
            const tournaments = parsed.tournaments as TournamentRecord[];
            const nextActiveId =
              (typeof parsed.activeTournamentId === 'string' && parsed.activeTournamentId) ||
              tournaments[0]?.id ||
              null;
            const resolved = resolveActive(tournaments, nextActiveId);
            const importedPointSys =
              parsed.defaultPointSystem !== null &&
              typeof parsed.defaultPointSystem === 'object' &&
              Array.isArray((parsed.defaultPointSystem as PointSystemConfig).placementPoints)
                ? (parsed.defaultPointSystem as PointSystemConfig)
                : { ...DEFAULT_POINT_SYSTEM };
            set({
              tournaments,
              activeTournamentId: nextActiveId,
              defaultPointSystem: importedPointSys,
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
      partialize: (state) => ({
        tournaments: state.tournaments,
        activeTournamentId: state.activeTournamentId,
        defaultPointSystem: state.defaultPointSystem,
        savedSquads: state.savedSquads,
        organizerDefaults: state.organizerDefaults,
        currentTab: state.currentTab,
        teams: state.teams,
        matches: state.matches,
        settings: state.settings,
      }),
    }
  )
);
