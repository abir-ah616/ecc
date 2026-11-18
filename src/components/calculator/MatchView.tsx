import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  Plus,
  Minus,
  Crown,
  Circle,
  LockOpen,
  ScanLine,
  Copy,
  Check,
  Image as ImageIcon,
  Zap,
  ListOrdered,
  Users,
  ChevronDown,
} from 'lucide-react';
import {
  useTournamentStore,
  generateInitials,
} from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { LiveStandingsPanel } from './LiveStandingsPanel';
import { RankPickerPopover } from './RankPickerPopover';
import { RapidWizard } from './RapidWizard';
import { ScanScreenshotModal } from './ScanScreenshotModal';
import { SquadPlayersModal } from './SquadPlayersModal';
import { getPlacementPoints, getKillPoints } from '../../lib/scoring';
import { formatStandingsTextSummary } from '../../lib/rosterHelpers';
import {
  buildSwapOrAssignRankBatch,
  computeMatchScorecardSummary,
  confirmRapidKills,
  createInitialRapidState,
  pickRapidTeam,
  redoRapidStep,
  reverseRapidStep,
  snapshotMatchEntries,
  type RapidWizardSnapshot,
  type RapidWizardState,
} from '../../lib/scorecardHelpers';
import type { Match, Team } from '../../types/tournament';

interface MatchViewProps {
  match: Match;
}

interface ActiveRankPopover {
  team: Team;
  currentRank: number | null;
  anchorRect: DOMRect;
}

export const MatchView: React.FC<MatchViewProps> = ({ match }) => {
  const {
    teams,
    settings,
    matches,
    updateMatchEntry,
    applyBatchMatchResults,
    completeMatch,
    reopenMatch,
    deleteMatch,
    setCurrentTab,
    createMatch,
    getStandings,
    getActiveTournament,
    updateTournament,
  } = useTournamentStore();
  const { canUseAiAuto } = useAuthStore();

  const [mobilePane, setMobilePane] = useState<'entry' | 'standings'>('entry');
  const [entryMode, setEntryMode] = useState<'slot' | 'rapid'>('slot');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isPlayersOpen, setIsPlayersOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [rapidByMatchId, setRapidByMatchId] = useState<
    Record<string, RapidWizardState>
  >({});
  const [rapidDoneBannerMatchId, setRapidDoneBannerMatchId] = useState<
    string | null
  >(null);
  const [rankPopover, setRankPopover] = useState<ActiveRankPopover | null>(null);

  const rankInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const killsInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const standingsResult = getStandings();
  const cumulativeByTeam = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of standingsResult.standings) {
      map.set(row.teamId, row.totalPoints);
    }
    return map;
  }, [standingsResult]);

  const summary = useMemo(
    () => computeMatchScorecardSummary(teams, match),
    [teams, match]
  );

  const {
    rankedCount,
    totalKills,
    duplicatePlacements,
    unassignedRanks,
    nextOpenRank,
    teamByRank,
    unplacedTeams,
    placedRows,
    hasErrors,
  } = summary;

  const rawRapidWizard = useMemo(
    () => rapidByMatchId[match.id] ?? createInitialRapidState(teams, match),
    [rapidByMatchId, match, teams]
  );

  const activeRapidWizard = useMemo<RapidWizardState>(() => {
    if (
      rawRapidWizard.phase === 'pick_team' &&
      !unassignedRanks.includes(rawRapidWizard.rank)
    ) {
      if (unassignedRanks.length === 0 || unplacedTeams.length === 0) {
        return { ...rawRapidWizard, phase: 'done', selectedTeamId: null };
      }
      if (unassignedRanks.length === 1 && unplacedTeams.length === 1) {
        const onlyTeam = unplacedTeams[0];
        return {
          ...rawRapidWizard,
          rank: unassignedRanks[0],
          phase: 'enter_kills',
          selectedTeamId: onlyTeam.id,
          draftKills: match.entries[onlyTeam.id]?.kills ?? 0,
        };
      }
      return { ...rawRapidWizard, rank: unassignedRanks[0] };
    }
    return rawRapidWizard;
  }, [rawRapidWizard, unassignedRanks, unplacedTeams, match.entries]);

  const currentIndex = matches.findIndex((m) => m.id === match.id);
  const nextMatchInList =
    currentIndex >= 0 && currentIndex < matches.length - 1
      ? matches[currentIndex + 1]
      : null;

  const maxAllowed =
    settings.mode === 'CHAMPION_RUSH'
      ? settings.championRush.maxMatches
      : settings.totalMatchesPlanned;
  const maxMatchesReached = matches.length >= maxAllowed;
  const canAddMatch = !standingsResult.tournamentConcluded && !maxMatchesReached;

  const setCurrentRapidWizard = (nextWizard: RapidWizardState) => {
    setRapidByMatchId((prev) => ({
      ...prev,
      [match.id]: nextWizard,
    }));
  };

  const handleResetRanks = () => {
    if (match.isCompleted || rankedCount === 0) return;
    const snap: RapidWizardSnapshot = {
      entries: snapshotMatchEntries(teams, match),
      rank: activeRapidWizard.rank,
      phase: activeRapidWizard.phase,
      selectedTeamId: activeRapidWizard.selectedTeamId,
      draftKills: activeRapidWizard.draftKills,
    };
    const cleared = teams.map((t) => ({
      teamId: t.id,
      placement: null,
      kills: match.entries[t.id]?.kills ?? 0,
    }));
    applyBatchMatchResults(match.id, cleared);
    setRapidDoneBannerMatchId(null);
    setCurrentRapidWizard({
      rank: 1,
      phase: 'pick_team',
      selectedTeamId: null,
      draftKills: 0,
      reverseStack: [...activeRapidWizard.reverseStack, snap],
      redoStack: [],
    });
  };

  const handleAutoFillLast = () => {
    if (
      match.isCompleted ||
      unassignedRanks.length !== 1 ||
      unplacedTeams.length !== 1
    ) {
      return;
    }
    const lastTeam = unplacedTeams[0];
    const lastRank = unassignedRanks[0];
    updateMatchEntry(
      match.id,
      lastTeam.id,
      lastRank,
      match.entries[lastTeam.id]?.kills ?? 0
    );
  };

  const handleRapidPickTeam = (teamId: string) => {
    if (match.isCompleted) return;
    setRapidDoneBannerMatchId(null);
    const { nextState, updates } = pickRapidTeam({
      state: activeRapidWizard,
      teams,
      match,
      teamId,
    });
    applyBatchMatchResults(match.id, updates);
    setCurrentRapidWizard(nextState);
  };

  const handleRapidDraftKillsChange = (nextKills: number) => {
    setCurrentRapidWizard({
      ...activeRapidWizard,
      draftKills: Math.max(0, Math.min(99, Math.floor(nextKills))),
    });
  };

  const handleRapidConfirmKills = () => {
    if (match.isCompleted) return;
    const { nextState, updates, completedAll } = confirmRapidKills({
      state: activeRapidWizard,
      teams,
      match,
    });
    if (updates.length > 0) {
      applyBatchMatchResults(match.id, updates);
    }
    setCurrentRapidWizard(nextState);
    if (completedAll) {
      setRapidDoneBannerMatchId(match.id);
      setEntryMode('slot');
    }
  };

  const handleRapidReverse = () => {
    if (match.isCompleted) return;
    const res = reverseRapidStep({
      state: activeRapidWizard,
      teams,
      match,
    });
    if (!res) return;
    applyBatchMatchResults(match.id, res.updates);
    setCurrentRapidWizard(res.nextState);
  };

  const handleRapidRedo = () => {
    if (match.isCompleted) return;
    const res = redoRapidStep({
      state: activeRapidWizard,
      teams,
      match,
    });
    if (!res) return;
    applyBatchMatchResults(match.id, res.updates);
    setCurrentRapidWizard(res.nextState);
  };

  const handleAssignOrSwapRank = (
    teamId: string,
    nextRank: number | null
  ) => {
    if (match.isCompleted) return;
    const updates = buildSwapOrAssignRankBatch({
      teams,
      match,
      targetTeamId: teamId,
      targetRank: nextRank,
    });
    applyBatchMatchResults(match.id, updates);
  };

  const handlePlacementChange = (teamId: string, val: string) => {
    const entry = match.entries[teamId] || {
      teamId,
      placement: null,
      kills: 0,
    };
    const num = parseInt(val, 10);
    const placement =
      Number.isNaN(num) || num <= 0 ? null : Math.min(teams.length, num);
    updateMatchEntry(match.id, teamId, placement, entry.kills);
  };

  const handleKillsChange = (teamId: string, val: string) => {
    const entry = match.entries[teamId] || {
      teamId,
      placement: null,
      kills: 0,
    };
    const num = parseInt(val, 10);
    const kills = Number.isNaN(num) || num < 0 ? 0 : num;
    updateMatchEntry(match.id, teamId, entry.placement, kills);
  };

  const handleAdjustKills = (teamId: string, delta: number) => {
    const entry = match.entries[teamId] || {
      teamId,
      placement: null,
      kills: 0,
    };
    const next = Math.max(0, (entry.kills || 0) + delta);
    updateMatchEntry(match.id, teamId, entry.placement, next);
  };

  const openRankPopover = (
    event: React.MouseEvent<HTMLButtonElement>,
    team: Team,
    currentRank: number | null
  ) => {
    if (match.isCompleted) return;
    setRankPopover({
      team,
      currentRank,
      anchorRect: event.currentTarget.getBoundingClientRect(),
    });
  };

  const handleCopyStandingsText = async () => {
    const completedCount = matches.filter((m) => m.isCompleted).length;
    const text = formatStandingsTextSummary({
      settings,
      standings: standingsResult.standings,
      viewMode: 'OVERALL',
      completedMatches: completedCount,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleSaveAndOpenPoster = () => {
    completeMatch(match.id);
    setCurrentTab('results');
  };

  const handleSaveAndContinue = () => {
    completeMatch(match.id);
    const updatedState = useTournamentStore.getState();
    const updatedStandings = updatedState.getStandings();

    if (updatedStandings.tournamentConcluded) {
      setCurrentTab('results');
      return;
    }

    if (nextMatchInList) {
      setCurrentTab(nextMatchInList.id);
      return;
    }

    const reachedCap =
      updatedState.matches.length >=
      (updatedState.settings.mode === 'CHAMPION_RUSH'
        ? updatedState.settings.championRush.maxMatches
        : updatedState.settings.totalMatchesPlanned);

    if (!reachedCap) {
      const newMatchId = createMatch();
      setCurrentTab(newMatchId);
    } else {
      setCurrentTab('results');
    }
  };

  const primaryCtaLabel = nextMatchInList
    ? `Save & Go to Match ${nextMatchInList.matchNumber}`
    : canAddMatch
    ? `Save & Start Match ${matches.length + 1}`
    : 'Save & Open Poster';

  const progressPct =
    teams.length > 0 ? Math.min(100, (rankedCount / teams.length) * 100) : 0;
  const allPlacedCleanly = rankedCount === teams.length && !hasErrors;

  return (
    <div className="space-y-5 select-none">
      {/* Mobile-Only Match Switcher Strip */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
        {matches.map((m) => {
          const isSelected = m.id === match.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                setCurrentTab(m.id);
              }}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                isSelected
                  ? 'glass-accent text-amber-300'
                  : 'glass-tile text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Circle className="h-3 w-3 text-amber-400" />
              )}
              <span>Match {m.matchNumber}</span>
            </button>
          );
        })}

        {canAddMatch && (
          <button
            type="button"
            onClick={() => {
              const newId = createMatch();
              setCurrentTab(newId);
            }}
            className="glass-tile border-dashed hover:border-amber-400 hover:text-amber-300 inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Match</span>
          </button>
        )}
      </div>

      {/* Mobile Segmented View Switcher */}
      <div className="glass-panel grid grid-cols-2 gap-1 rounded-xl p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePane('entry')}
          className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
            mobilePane === 'entry'
              ? 'bg-white/[0.12] text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Score Entry ({teams.length})
        </button>
        <button
          type="button"
          onClick={() => setMobilePane('standings')}
          className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
            mobilePane === 'standings'
              ? 'bg-white/[0.12] text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Standings
        </button>
      </div>

      {/* Split Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Scorecard Editor */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobilePane === 'entry' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Match Control Header & Progress Bar */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Match {match.matchNumber} Scorecard
                </h2>
                {match.isCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/12 border border-emerald-500/25 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Saved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/12 border border-amber-500/25 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                    Draft
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {canUseAiAuto && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsScanOpen(true)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        settings.autoResultFromScreenshot
                          ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                          : 'glass-pill text-slate-200'
                      }`}
                    >
                      <ScanLine className="h-3.5 w-3.5" />
                      <span>AI Scan</span>
                      <span
                        className={`rounded px-1 py-0.2 text-[10px] font-bold uppercase tracking-wide ${
                          settings.autoResultFromScreenshot
                            ? 'bg-zinc-950/20 text-zinc-950'
                            : 'border border-amber-400/40 bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        Beta
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPlayersOpen(true)}
                      title="Add or edit squad team member IGNs for AI screenshot auto-matching"
                      className="glass-pill inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5 text-amber-400" />
                      <span>Players</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleCopyStandingsText}
                  title="Copy plain-text standings for WhatsApp / Discord"
                  className="glass-pill inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                {match.isCompleted && (
                  <button
                    type="button"
                    onClick={() => reopenMatch(match.id)}
                    className="glass-pill inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <LockOpen className="h-3 w-3" />
                    <span>Mark Draft</span>
                  </button>
                )}

                {matches.length > 1 &&
                  (confirmDelete ? (
                    <div className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          deleteMatch(match.id);
                          setConfirmDelete(false);
                        }}
                        className="rounded bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-500 cursor-pointer"
                      >
                        Delete Match
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded px-2 py-1 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      title={`Delete Match ${match.matchNumber}`}
                      className="glass-pill flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Entry Method Segmented Bar + Match Completion Meter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <div className="glass-input grid grid-cols-2 sm:inline-flex rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setEntryMode('slot')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    entryMode === 'slot'
                      ? 'bg-amber-500 text-zinc-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                  <span>Team List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('rapid')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    entryMode === 'rapid'
                      ? 'bg-amber-500 text-zinc-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Rapid Mode</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
                <div className="flex items-center gap-2 text-xs tabular-nums">
                  <span
                    className={`font-bold ${
                      allPlacedCleanly ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    {rankedCount}/{teams.length} Ranked
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-300 font-medium">
                    {totalKills} Kills
                  </span>
                </div>

                {!match.isCompleted &&
                  unassignedRanks.length === 1 &&
                  unplacedTeams.length === 1 &&
                  !hasErrors && (
                    <button
                      type="button"
                      onClick={handleAutoFillLast}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                      <span>Auto-fill #{unassignedRanks[0]}</span>
                    </button>
                  )}
              </div>
            </div>

            {/* Clean Progress Track */}
            <div className="space-y-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0B0E14]">
                <div
                  className={`h-full transition-all duration-200 ${
                    allPlacedCleanly ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {hasErrors ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>
                    Duplicate rank:{' '}
                    <strong className="text-white">
                      {Array.from(duplicatePlacements)
                        .sort((a, b) => a - b)
                        .map((p) => `#${p}`)
                        .join(', ')}
                    </strong>
                    . Use the rank picker dropdown on either row to swap cleanly.
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  {entryMode === 'rapid'
                    ? 'Step through Booyah down to last rank, then review or edit anytime in Team List.'
                    : 'Enter finish rank (or click the selector beside Rank to pick/swap) and team kills.'}
                </p>
              )}
            </div>
          </div>

          {/* MODE 2: GUIDED RAPID WIZARD */}
          {entryMode === 'rapid' ? (
            <RapidWizard
              teams={teams}
              match={match}
              pointSystem={settings.pointSystem}
              wizard={activeRapidWizard}
              unplacedTeams={unplacedTeams}
              placedRows={placedRows}
              rankedCount={rankedCount}
              completionNotice={rapidDoneBannerMatchId === match.id}
              onPickTeam={handleRapidPickTeam}
              onDraftKillsChange={handleRapidDraftKillsChange}
              onConfirmKills={handleRapidConfirmKills}
              onReverse={handleRapidReverse}
              onRedo={handleRapidRedo}
              onResetRanks={handleResetRanks}
              onSwitchToList={() => setEntryMode('slot')}
            />
          ) : (
            /* MODE 1: UNIFIED TEAM LIST SCORECARD */
            <div className="space-y-3">
              {rapidDoneBannerMatchId === match.id && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      Rapid entry complete — edit any placement or kill count below.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRapidDoneBannerMatchId(null)}
                    className="text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="glass-panel overflow-hidden rounded-2xl">
              <div className="hidden sm:flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Slot &amp; Squad</span>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-center">Rank</span>
                  <span className="w-[106px] text-center">Kills</span>
                  <span className="w-14 text-right">Match</span>
                </div>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {teams.map((team, idx) => {
                  const entry = match.entries[team.id] || {
                    teamId: team.id,
                    placement: null,
                    kills: 0,
                  };
                  const isDuplicate =
                    entry.placement !== null &&
                    duplicatePlacements.has(entry.placement);
                  const placementPts = getPlacementPoints(
                    entry.placement,
                    settings.pointSystem
                  );
                  const killPts = getKillPoints(entry.kills, settings.pointSystem);
                  const totalMatchPts = placementPts + killPts;
                  const isBooyah = entry.placement === 1 && !isDuplicate;
                  const overallPts = cumulativeByTeam.get(team.id) ?? 0;
                  const nextTeam = teams[idx + 1];

                  return (
                    <div
                      key={team.id}
                      className={`px-3.5 sm:px-4 py-3 transition-colors ${
                        isDuplicate
                          ? 'bg-rose-950/30'
                          : isBooyah
                          ? 'bg-amber-500/[0.07]'
                          : 'hover:bg-white/[0.015]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div className="flex items-center justify-between gap-2.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 shrink-0 text-[11px] font-bold text-slate-500 tabular-nums">
                              {String(idx + 1).padStart(2, '0')}
                            </span>

                            <div className="glass-input flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs font-bold text-slate-300">
                              {team.logoUrl ? (
                                <img
                                  src={team.logoUrl}
                                  alt=""
                                  className="h-full w-full object-contain p-0.5"
                                />
                              ) : (
                                generateInitials(team.name)
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-semibold text-white">
                                  {team.name}
                                </span>
                                {isBooyah && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950 shrink-0">
                                    <Crown className="h-2.5 w-2.5" />
                                    #1
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 tabular-nums">
                                Overall: {overallPts} pts
                              </div>
                            </div>
                          </div>

                          <div className="sm:hidden text-right shrink-0">
                            <div
                              className={`text-sm font-bold tabular-nums leading-none ${
                                totalMatchPts > 0
                                  ? isBooyah
                                    ? 'text-amber-300'
                                    : 'text-white'
                                  : 'text-slate-500'
                              }`}
                            >
                              {totalMatchPts}p
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                              {placementPts}+{killPts}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 border-t border-white/[0.06] sm:border-t-0 sm:pt-0 shrink-0">
                          {/* Hybrid Rank Input + Quick Pick / Swap Popover */}
                          <div className="flex items-center gap-1.5">
                            <span className="sm:hidden text-[11px] font-medium text-slate-400">
                              Rank
                            </span>
                            <div
                              className={`inline-flex h-9 w-24 items-center overflow-hidden rounded-xl border transition-colors ${
                                isDuplicate
                                  ? 'border-rose-500/70 bg-rose-950/35'
                                  : isBooyah
                                  ? 'border-amber-500/70 bg-amber-500/[0.12]'
                                  : 'glass-input focus-within:border-amber-400'
                              }`}
                            >
                              <input
                                ref={(el) => {
                                  rankInputRefs.current[team.id] = el;
                                }}
                                id={`rank-${match.id}-${team.id}`}
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={teams.length}
                                disabled={match.isCompleted}
                                value={entry.placement ?? ''}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    killsInputRefs.current[team.id]?.focus();
                                    killsInputRefs.current[team.id]?.select();
                                  }
                                }}
                                onChange={(e) =>
                                  handlePlacementChange(team.id, e.target.value)
                                }
                                placeholder="—"
                                aria-label={`Rank for ${team.name}`}
                                className={`h-full min-w-0 flex-1 bg-transparent pl-2 text-center text-sm font-bold tabular-nums focus:outline-none ${
                                  isDuplicate
                                    ? 'text-rose-200'
                                    : isBooyah
                                    ? 'text-amber-300'
                                    : 'text-white'
                                }`}
                              />
                              <button
                                type="button"
                                disabled={match.isCompleted}
                                onClick={(e) =>
                                  openRankPopover(e, team, entry.placement)
                                }
                                title="Pick or swap placement rank"
                                aria-label={`Choose placement rank for ${team.name}`}
                                className="flex h-full w-8 shrink-0 items-center justify-center border-l border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-35 cursor-pointer"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Kills Stepper */}
                          <div className="flex items-center gap-1.5">
                            <span className="sm:hidden text-[11px] font-medium text-slate-400">
                              Kills
                            </span>
                            <div className="glass-input inline-flex items-center rounded-xl p-0.5">
                              <button
                                type="button"
                                disabled={match.isCompleted || entry.kills <= 0}
                                onClick={() => handleAdjustKills(team.id, -1)}
                                aria-label={`Decrease kills for ${team.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-35 transition-colors cursor-pointer"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <input
                                ref={(el) => {
                                  killsInputRefs.current[team.id] = el;
                                }}
                                type="number"
                                inputMode="numeric"
                                min={0}
                                disabled={match.isCompleted}
                                value={entry.kills}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (nextTeam) {
                                      rankInputRefs.current[nextTeam.id]?.focus();
                                      rankInputRefs.current[nextTeam.id]?.select();
                                    }
                                  }
                                }}
                                onChange={(e) =>
                                  handleKillsChange(team.id, e.target.value)
                                }
                                aria-label={`Kills for ${team.name}`}
                                className="h-8 w-9 bg-transparent text-center text-sm font-bold text-white tabular-nums focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={match.isCompleted}
                                onClick={() => handleAdjustKills(team.id, 1)}
                                aria-label={`Increase kills for ${team.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-35 transition-colors cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Match Points */}
                          <div className="hidden sm:block w-14 text-right">
                            <div
                              className={`text-sm font-bold tabular-nums leading-tight ${
                                totalMatchPts > 0
                                  ? isBooyah
                                    ? 'text-amber-300'
                                    : 'text-white'
                                  : 'text-slate-500'
                              }`}
                            >
                              {totalMatchPts}p
                            </div>
                            <div className="text-[10px] text-slate-500 tabular-nums">
                              {placementPts}+{killPts}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          )}

          {/* Primary Save, Quick Poster & Next Bar */}
          <div className="glass-panel flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => completeMatch(match.id)}
                disabled={hasErrors}
                className="glass-pill rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {match.isCompleted ? 'Re-save Match' : 'Save Only'}
              </button>

              <button
                type="button"
                onClick={handleSaveAndOpenPoster}
                disabled={hasErrors}
                className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-amber-300 hover:text-amber-200 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Save &amp; Poster</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={hasErrors}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <span>{primaryCtaLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: Sticky Live Standings Leaderboard */}
        <div
          className={`lg:col-span-5 ${
            mobilePane === 'standings' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="lg:sticky lg:top-20">
            <LiveStandingsPanel />
          </div>
        </div>
      </div>

      {rankPopover && (
        <RankPickerPopover
          anchorRect={rankPopover.anchorRect}
          team={rankPopover.team}
          teams={teams}
          currentRank={rankPopover.currentRank}
          nextOpenRank={nextOpenRank}
          teamByRank={teamByRank}
          pointSystem={settings.pointSystem}
          onSelectRank={(nextRank) =>
            handleAssignOrSwapRank(rankPopover.team.id, nextRank)
          }
          onClose={() => setRankPopover(null)}
        />
      )}

      {canUseAiAuto && (
        <ScanScreenshotModal
          isOpen={isScanOpen}
          matchNumber={match.matchNumber}
          teams={teams}
          autoResultFromScreenshot={Boolean(settings.autoResultFromScreenshot)}
          onClose={() => setIsScanOpen(false)}
          onUpdatePlayers={(updatedTeams, autoResultEnabled) => {
            const active = getActiveTournament();
            if (!active) return;
            updateTournament(active.id, {
              teams: updatedTeams,
              autoResultFromScreenshot: autoResultEnabled,
            });
          }}
          onApply={(entries, learnedByTeamId) => {
            applyBatchMatchResults(match.id, entries, learnedByTeamId);
          }}
        />
      )}

      {canUseAiAuto && isPlayersOpen && (
        <SquadPlayersModal
          isOpen={isPlayersOpen}
          teams={teams}
          autoResultFromScreenshot={Boolean(settings.autoResultFromScreenshot)}
          onClose={() => setIsPlayersOpen(false)}
          onSave={(updatedTeams, autoResultEnabled) => {
            const active = getActiveTournament();
            if (!active) return;
            updateTournament(active.id, {
              teams: updatedTeams,
              autoResultFromScreenshot: autoResultEnabled,
            });
          }}
        />
      )}
    </div>
  );
};
