import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/roster_helpers.dart';
import '../../core/scoring.dart';
import '../../models/tournament_models.dart';
import '../../state/auth_state.dart';
import '../../state/tournament_state.dart';
import '../../theme/app_theme.dart';
import '../sheets/scan_screenshot_sheet.dart';
import '../sheets/squad_players_sheet.dart';
import '../widgets/app_components.dart';
import '../widgets/rapid_entry_wizard.dart';

class MatchScreen extends StatefulWidget {
  final TournamentStore store;
  final AuthStore? authStore;
  final VoidCallback onOpenPoster;
  final VoidCallback onCreateTournament;
  final VoidCallback onEditEvent;
  final String? preferredMatchId;
  final int matchFocusNonce;

  const MatchScreen({
    super.key,
    required this.store,
    this.authStore,
    required this.onOpenPoster,
    required this.onCreateTournament,
    required this.onEditEvent,
    this.preferredMatchId,
    this.matchFocusNonce = 0,
  });

  @override
  State<MatchScreen> createState() => _MatchScreenState();
}

class _MatchScreenState extends State<MatchScreen> {
  int _tab = 0; // 0 = Scorecard, 1 = Standings
  int _standingsScope = 0; // 0 = Overall, 1 = This Match
  String? _selectedMatchId;
  final Map<String, List<List<({String teamId, int? placement, int kills})>>>
      _undoStacksByMatch = {};

  void _pushUndoSnapshot(
    TournamentRecord tournament,
    MatchRecord match, {
    String? highlightedTeamId,
  }) {
    final snap = [
      for (final t in tournament.teams)
        (
          teamId: t.id,
          placement: match.entries[t.id]?.placement,
          kills: match.entries[t.id]?.kills ?? 0,
        ),
    ];
    final stack = _undoStacksByMatch.putIfAbsent(match.id, () => []);
    stack.add(snap);
    if (stack.length > 20) {
      stack.removeAt(0);
    }
  }

  Future<void> _openPlayersSheet(TournamentRecord tournament) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => SquadPlayersSheet(
        teams: tournament.teams,
        autoResultEnabled: tournament.settings.autoResultFromScreenshot,
        onSave: (updatedTeams, autoResultEnabled) {
          widget.store.updateTournament(
            tournament.id,
            teams: updatedTeams,
            autoResultFromScreenshot: autoResultEnabled,
          );
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Saved squad team member IGNs.'),
              ),
            );
          }
        },
      ),
    );
  }

  Future<void> _openScannerSheet(
    TournamentRecord tournament,
    MatchRecord match,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ScanScreenshotSheet(
        matchNumber: match.matchNumber,
        teams: tournament.teams,
        autoResultEnabled: tournament.settings.autoResultFromScreenshot,
        assignedApiKeys: widget.authStore?.userAiApiKeys ?? const [],
        isAdmin: widget.authStore?.isAdmin ?? false,
        onUpdatePlayers: (updatedTeams, autoResultEnabled) {
          widget.store.updateTournament(
            tournament.id,
            teams: updatedTeams,
            autoResultFromScreenshot: autoResultEnabled,
          );
        },
        onApply: (entries, learnedByTeamId) {
          widget.store.applyBatchMatchResults(
            matchId: match.id,
            entries: entries,
            learnedByTeamId: learnedByTeamId,
          );
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Applied ${entries.length} scanned rank(s) to Match #${match.matchNumber}.',
                ),
              ),
            );
          }
        },
      ),
    );
  }

  Future<void> _copyStandingsText(
    TournamentRecord tournament,
    List<TeamCumulativeStanding> rows, {
    required StandingsViewMode viewMode,
    int? matchNumber,
  }) async {
    final completedMatches =
        tournament.matches.where((m) => m.isCompleted).length;
    final summary = formatStandingsTextSummary(
      settings: tournament.settings,
      standings: rows,
      viewMode: viewMode,
      matchNumber: matchNumber,
      completedMatches: completedMatches,
    );
    await Clipboard.setData(ClipboardData(text: summary));
    HapticFeedback.mediumImpact();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Standings text copied for WhatsApp / Discord.'),
      ),
    );
  }

  @override
  void didUpdateWidget(covariant MatchScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.matchFocusNonce != oldWidget.matchFocusNonce &&
        widget.preferredMatchId != null) {
      setState(() {
        _selectedMatchId = widget.preferredMatchId;
        _tab = 0;
      });
    }
  }

  MatchRecord? _resolveActiveMatch(TournamentRecord tournament) {
    if (tournament.matches.isEmpty) return null;
    if (_selectedMatchId != null) {
      for (final m in tournament.matches) {
        if (m.id == _selectedMatchId) return m;
      }
    }
    for (final m in tournament.matches.reversed) {
      if (!m.isCompleted) return m;
    }
    return tournament.matches.last;
  }

  Future<void> _openRankPicker({
    required TournamentRecord tournament,
    required MatchRecord match,
    required Team team,
    required int? currentPlacement,
    required int currentKills,
    bool recordUndo = false,
  }) async {
    final teamCount = tournament.teams.length.clamp(1, 20);
    final occupantByRank = <int, Team>{};
    for (final t in tournament.teams) {
      if (t.id == team.id) continue;
      final p = match.entries[t.id]?.placement;
      if (p != null && p >= 1 && p <= teamCount && !occupantByRank.containsKey(p)) {
        occupantByRank[p] = t;
      }
    }

    int? nextOpenRank;
    for (int r = 1; r <= teamCount; r++) {
      if (r != currentPlacement && !occupantByRank.containsKey(r)) {
        nextOpenRank = r;
        break;
      }
    }

    final picked = await showModalBottomSheet<int?>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SheetHeader(
                  title: 'Set Rank · ${team.name}',
                  subtitle: 'Tap an open rank or tap an assigned slot to swap',
                  trailing: currentPlacement != null
                      ? TextButton(
                          onPressed: () => Navigator.pop(ctx, -1),
                          child: const Text(
                            'Clear',
                            style: TextStyle(
                              color: AppColors.crimson,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        )
                      : null,
                ),
                const SizedBox(height: 12),
                GridView.builder(
                  padding: EdgeInsets.zero,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: teamCount,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    mainAxisExtent: 50,
                  ),
                  itemBuilder: (_, idx) {
                    final rank = idx + 1;
                    final selected = currentPlacement == rank;
                    final occupant = occupantByRank[rank];
                    final isNextOpen =
                        !selected && occupant == null && nextOpenRank == rank;
                    final pts = getPlacementPoints(
                      rank,
                      tournament.settings.pointSystem,
                    );

                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        Navigator.pop(ctx, rank);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.accent
                              : isNextOpen
                                  ? AppColors.accentSurface
                                  : occupant != null
                                      ? AppColors.inputFill
                                      : AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected
                                ? AppColors.accent
                                : isNextOpen
                                    ? AppColors.accentBorder
                                    : rank == 1
                                        ? AppColors.accentBorder
                                        : AppColors.borderSubtle,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              rank == 1 ? '#1 BOOYAH' : '#$rank',
                              style: kTabularNumbers.copyWith(
                                color: selected
                                    ? AppColors.inkOnAccent
                                    : isNextOpen || rank == 1
                                        ? AppColors.accentBright
                                        : AppColors.textPrimary,
                                fontSize: rank == 1 ? 11 : 13.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              occupant != null
                                  ? 'Swap · ${occupant.shortCode ?? occupant.name}'
                                  : isNextOpen
                                      ? 'Next · +${pts}p'
                                      : '+${pts}p',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: selected
                                    ? AppColors.inkOnAccent
                                        .withValues(alpha: 0.78)
                                    : isNextOpen
                                        ? AppColors.accentBright
                                        : AppColors.textMuted,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        );
      },
    );

    if (picked == null || !mounted || picked == currentPlacement) return;
    if (recordUndo) {
      _pushUndoSnapshot(tournament, match, highlightedTeamId: team.id);
    }

    if (picked == -1) {
      widget.store.updateMatchEntry(
        matchId: match.id,
        teamId: team.id,
        placement: null,
        kills: currentKills,
      );
      return;
    }

    final occupant = occupantByRank[picked];
    if (occupant != null) {
      final occKills = match.entries[occupant.id]?.kills ?? 0;
      widget.store.applyBatchMatchResults(
        matchId: match.id,
        entries: [
          (teamId: team.id, placement: picked, kills: currentKills),
          (
            teamId: occupant.id,
            placement: currentPlacement,
            kills: occKills,
          ),
        ],
      );
    } else {
      widget.store.updateMatchEntry(
        matchId: match.id,
        teamId: team.id,
        placement: picked,
        kills: currentKills,
      );
    }
  }

  Future<void> _openQuickKillsPicker({
    required MatchRecord match,
    required Team team,
    required int? placement,
    required int currentKills,
  }) async {
    if (match.isCompleted) return;
    final nextKills = await showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _QuickKillsPickerSheet(
        teamName: team.name,
        placement: placement,
        initialKills: currentKills,
      ),
    );
    if (nextKills == null || !mounted) return;
    HapticFeedback.selectionClick();
    widget.store.updateMatchEntry(
      matchId: match.id,
      teamId: team.id,
      placement: placement,
      kills: nextKills,
    );
  }

  Future<void> _confirmReset(TournamentRecord tournament) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Reset Match Data?'),
        content: Text(
          'This clears all match scores in "${tournament.name}" while keeping teams and rules.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.crimson),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      widget.store.resetActiveMatchData();
      setState(() => _selectedMatchId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tournament = widget.store.activeTournament;
    if (tournament == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: TactileCard(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.sports_esports_rounded,
                  size: 36,
                  color: AppColors.accentBright,
                ),
                const SizedBox(height: 12),
                const Text(
                  'No Active Tournament',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Launch a Scrim Series or Champion Rush lobby to score matches live.',
                  textAlign: TextAlign.center,
                  style:
                      TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 18),
                PrimaryPillButton(
                  label: 'Create Tournament',
                  icon: Icons.add_rounded,
                  expand: true,
                  onPressed: widget.onCreateTournament,
                ),
              ],
            ),
          ),
        ),
      );
    }

    final activeMatch = _resolveActiveMatch(tournament)!;
    final standingsResult = widget.store.getStandings();

    // Validation summary for the selected match
    final placementCounts = <int, int>{};
    int unrankedCount = 0;
    for (final team in tournament.teams) {
      final p = activeMatch.entries[team.id]?.placement;
      if (p == null) {
        unrankedCount++;
      } else {
        placementCounts[p] = (placementCounts[p] ?? 0) + 1;
      }
    }
    final duplicateRanks = placementCounts.entries
        .where((e) => e.value > 1)
        .map((e) => '#${e.key}')
        .toList()
      ..sort();

    final isConcluded = standingsResult.tournamentConcluded;
    final rushLeaderCount = standingsResult.standings
        .where((s) => s.rushStatus.status == RushStatusType.active)
        .length;

    return Column(
      children: [
        // Top Tournament Header Bar (compact 1-row layout so scorecard breathes)
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 12, 4),
          child: Row(
            children: [
              StatusPill(
                label: tournament.settings.mode == TournamentMode.championRush
                    ? 'RUSH ${tournament.settings.championRush.targetPoints}'
                    : 'SCRIM',
                backgroundColor: AppColors.accentSurface,
                borderColor: AppColors.accentBorder,
                textColor: AppColors.accentBright,
              ),
              if (isConcluded) ...[
                const SizedBox(width: 6),
                const StatusPill(
                  label: 'ENDED',
                  backgroundColor: AppColors.emeraldSurface,
                  borderColor: Color(0x5522C55E),
                  textColor: AppColors.emerald,
                ),
              ] else if (rushLeaderCount > 0) ...[
                const SizedBox(width: 6),
                StatusPill(
                  label: '$rushLeaderCount MATCH PT',
                  backgroundColor: AppColors.crimsonSurface,
                  borderColor: const Color(0x55EF4444),
                  textColor: AppColors.crimson,
                ),
              ],
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  tournament.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              IconButton(
                onPressed: widget.onOpenPoster,
                tooltip: 'Open Poster Studio',
                visualDensity: VisualDensity.compact,
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.surfaceElevated,
                  side: const BorderSide(color: AppColors.borderSubtle),
                ),
                icon: const Icon(
                  Icons.photo_library_outlined,
                  size: 18,
                  color: AppColors.accentBright,
                ),
              ),
              PopupMenuButton<String>(
                color: AppColors.surfaceElevated,
                icon: const Icon(
                  Icons.more_vert_rounded,
                  color: AppColors.textSecondary,
                ),
                onSelected: (action) {
                  switch (action) {
                    case 'edit':
                      widget.onEditEvent();
                      break;
                    case 'players':
                      _openPlayersSheet(tournament);
                      break;
                    case 'toggleEnd':
                      if (tournament.isEnded ||
                          tournament.settings.isManuallyEnded) {
                        widget.store.reopenActiveTournament();
                      } else {
                        widget.store.endActiveTournament();
                      }
                      break;
                    case 'deleteMatch':
                      if (tournament.matches.length > 1) {
                        widget.store.deleteMatch(activeMatch.id);
                        setState(() => _selectedMatchId = null);
                      }
                      break;
                    case 'reset':
                      _confirmReset(tournament);
                      break;
                  }
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Text('Squads & Settings'),
                  ),
                  if (widget.authStore?.canUseAiAuto ?? false)
                    const PopupMenuItem(
                      value: 'players',
                      child: Text('Squad Players (AI Scan)'),
                    ),
                  PopupMenuItem(
                    value: 'toggleEnd',
                    child: Text(
                      tournament.isEnded || tournament.settings.isManuallyEnded
                          ? 'Reopen Tournament'
                          : 'End Tournament Now',
                    ),
                  ),
                  if (tournament.matches.length > 1)
                    PopupMenuItem(
                      value: 'deleteMatch',
                      child: Text('Delete Match ${activeMatch.matchNumber}'),
                    ),
                  const PopupMenuItem(
                    value: 'reset',
                    child: Text(
                      'Reset All Scores',
                      style: TextStyle(color: AppColors.crimson),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Match Switcher Horizontal Strip
        SizedBox(
          height: 36,
          child: ListView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20),
            children: [
              ...tournament.matches.map((m) {
                final selected = m.id == activeMatch.id;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _selectedMatchId = m.id);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 160),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.accent : AppColors.surface,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: selected
                              ? AppColors.accent
                              : AppColors.borderSubtle,
                        ),
                      ),
                      child: Row(
                        children: [
                          Text(
                            'M${m.matchNumber}',
                            style: kTabularNumbers.copyWith(
                              color: selected
                                  ? AppColors.inkOnAccent
                                  : AppColors.textPrimary,
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Icon(
                            m.isCompleted
                                ? Icons.check_circle_rounded
                                : Icons.edit_rounded,
                            size: 13.5,
                            color: selected
                                ? AppColors.inkOnAccent
                                : m.isCompleted
                                    ? AppColors.emerald
                                    : AppColors.textMuted,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              if (!isConcluded)
                GestureDetector(
                  onTap: () {
                    HapticFeedback.mediumImpact();
                    final createdId = widget.store.createMatch();
                    if (createdId.isNotEmpty) {
                      setState(() => _selectedMatchId = createdId);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: AppColors.borderStrong),
                    ),
                    child: const Row(
                      children: [
                        Icon(
                          Icons.add_rounded,
                          size: 15,
                          color: AppColors.accentBright,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'New Match',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),

        // Segmented View Switch: Scorecard | Standings
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 6, 20, 6),
          child: SegmentedToggle<int>(
            selected: _tab,
            onChanged: (v) => setState(() => _tab = v),
            items: const [
              (
                value: 0,
                label: 'Scorecard',
                icon: Icons.edit_note_rounded,
              ),
              (
                value: 1,
                label: 'Standings',
                icon: Icons.leaderboard_rounded,
              ),
            ],
          ),
        ),

        Expanded(
          child: _tab == 0
              ? _buildScorecard(
                  tournament,
                  activeMatch,
                  unrankedCount,
                  duplicateRanks,
                )
              : _buildStandings(tournament, activeMatch, standingsResult),
        ),
        _buildMatchBottomActionBar(
          tournament: tournament,
          activeMatch: activeMatch,
          duplicateRanks: duplicateRanks,
          standingsResult: standingsResult,
        ),
      ],
    );
  }

  Widget _buildScorecard(
    TournamentRecord tournament,
    MatchRecord activeMatch,
    int unrankedCount,
    List<String> duplicateRanks,
  ) {
    final teamCount = tournament.teams.length;
    final rankedCount = (teamCount - unrankedCount).clamp(0, teamCount);
    final totalKills = tournament.teams.fold<int>(
      0,
      (sum, tm) => sum + (activeMatch.entries[tm.id]?.kills ?? 0),
    );
    final allPlacedCleanly = rankedCount == teamCount && duplicateRanks.isEmpty;
    final showAiScan =
        (widget.authStore?.canUseAiAuto ?? false) && !activeMatch.isCompleted;

    return Column(
      children: [
        // Single Clean Scorecard Action Bar (Progress + Optional AI Scan + Rapid)
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '$rankedCount/$teamCount Ranked · ${totalKills}K',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: kTabularNumbers.copyWith(
                        color: duplicateRanks.isNotEmpty
                            ? AppColors.crimson
                            : allPlacedCleanly
                                ? AppColors.emerald
                                : AppColors.textPrimary,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  if (showAiScan) ...[
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        _openScannerSheet(tournament, activeMatch);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 11,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.accentSurface,
                          borderRadius: BorderRadius.circular(11),
                          border: Border.all(color: AppColors.accentBorder),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.document_scanner_rounded,
                              size: 14,
                              color: AppColors.accentBright,
                            ),
                            SizedBox(width: 5),
                            Text(
                              'AI Scan',
                              style: TextStyle(
                                color: AppColors.accentBright,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  if (!activeMatch.isCompleted)
                    FilledButton.icon(
                      onPressed: () async {
                        HapticFeedback.mediumImpact();
                        final finishedToStandings =
                            await showFullScreenRapidOverlay(
                          context: context,
                          tournament: tournament,
                          activeMatch: activeMatch,
                          store: widget.store,
                        );
                        if (finishedToStandings && mounted) {
                          setState(() => _tab = 1);
                        }
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        foregroundColor: const Color(0xFF090B0F),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 9,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      icon: const Icon(Icons.bolt_rounded, size: 17),
                      label: const Text(
                        'Rapid',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                ],
              ),
              if (duplicateRanks.isNotEmpty) ...[
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.crimsonSurface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0x55EF4444)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.warning_amber_rounded,
                        size: 14,
                        color: AppColors.crimson,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Duplicate rank(s): ${duplicateRanks.join(', ')} · Tap any rank to swap',
                          style: const TextStyle(
                            color: AppColors.crimson,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),

        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: Container(
              decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.fromLTRB(12, 9, 12, 9),
                          decoration: const BoxDecoration(
                            color: AppColors.surfaceElevated,
                            border: Border(
                              bottom: BorderSide(color: AppColors.borderSubtle),
                            ),
                          ),
                          child: const Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'SLOT · SQUAD',
                                  style: TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.7,
                                  ),
                                ),
                              ),
                              SizedBox(
                                width: 58,
                                child: Text(
                                  'RANK',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.7,
                                  ),
                                ),
                              ),
                              SizedBox(width: 8),
                              SizedBox(
                                width: 96,
                                child: Text(
                                  'KILLS',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.7,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: ListView.separated(
                            physics: const BouncingScrollPhysics(),
                            itemCount: tournament.teams.length,
                            separatorBuilder: (_, __) => const Divider(
                              height: 1,
                              color: AppColors.borderSubtle,
                            ),
                            itemBuilder: (_, index) {
                              final team = tournament.teams[index];
                              final entry = activeMatch.entries[team.id];
                              final placement = entry?.placement;
                              final kills = entry?.kills ?? 0;
                              final isDup = placement != null &&
                                  duplicateRanks.contains('#$placement');
                              final isBooyah = placement == 1 && !isDup;
                              final res = calculateTeamMatchResult(
                                team.id,
                                placement,
                                kills,
                                tournament.settings.pointSystem,
                              );

                              return RepaintBoundary(
                                child: Container(
                                  color: isDup
                                      ? AppColors.crimsonSurface
                                      : isBooyah
                                          ? AppColors.accentSurface
                                          : null,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  child: Row(
                                    children: [
                                      SizedBox(
                                        width: 20,
                                        child: Text(
                                          '${index + 1}'.padLeft(2, '0'),
                                          style: kTabularNumbers.copyWith(
                                            color: AppColors.textMuted,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      SquadBadge(
                                        teamName: team.name,
                                        shortCode: team.shortCode,
                                        logoUrl: team.logoUrl,
                                        size: 34,
                                        highlight: isBooyah,
                                      ),
                                      const SizedBox(width: 9),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              team.name,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                color: AppColors.textPrimary,
                                                fontSize: 13.5,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                            const SizedBox(height: 1),
                                            Text(
                                              '${res.totalPoints}p (${res.placementPoints}+${res.killPoints})',
                                              style: kTabularNumbers.copyWith(
                                                color: isBooyah
                                                    ? AppColors.accentBright
                                                    : AppColors.textMuted,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      GestureDetector(
                                        onTap: activeMatch.isCompleted
                                            ? null
                                            : () => _openRankPicker(
                                                  tournament: tournament,
                                                  match: activeMatch,
                                                  team: team,
                                                  currentPlacement: placement,
                                                  currentKills: kills,
                                                ),
                                        child: Container(
                                          width: 58,
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 8,
                                          ),
                                          decoration: BoxDecoration(
                                            color: isDup
                                                ? AppColors.crimsonSurface
                                                : isBooyah
                                                    ? AppColors.accent
                                                    : AppColors.inputFill,
                                            borderRadius:
                                                BorderRadius.circular(11),
                                            border: Border.all(
                                              color: isDup
                                                  ? AppColors.crimson
                                                  : isBooyah
                                                      ? AppColors.accent
                                                      : placement != null
                                                          ? AppColors.accentBorder
                                                          : AppColors
                                                              .borderStrong,
                                            ),
                                          ),
                                          alignment: Alignment.center,
                                          child: Text(
                                            placement == null
                                                ? 'RANK'
                                                : '#$placement',
                                            style: kTabularNumbers.copyWith(
                                              color: isDup
                                                  ? AppColors.crimson
                                                  : isBooyah
                                                      ? AppColors.inkOnAccent
                                                      : placement != null
                                                          ? AppColors.textPrimary
                                                          : AppColors.textMuted,
                                              fontSize:
                                                  placement == null ? 10.5 : 13,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      _QuickKillStepper(
                                        kills: kills,
                                        enabled: !activeMatch.isCompleted,
                                        onDecrement: () {
                                          HapticFeedback.selectionClick();
                                          widget.store.updateMatchEntry(
                                            matchId: activeMatch.id,
                                            teamId: team.id,
                                            placement: placement,
                                            kills: kills - 1,
                                          );
                                        },
                                        onIncrement: () {
                                          HapticFeedback.selectionClick();
                                          widget.store.updateMatchEntry(
                                            matchId: activeMatch.id,
                                            teamId: team.id,
                                            placement: placement,
                                            kills: kills + 1,
                                          );
                                        },
                                        onTapNumber: () => _openQuickKillsPicker(
                                          match: activeMatch,
                                          team: team,
                                          placement: placement,
                                          currentKills: kills,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildMatchBottomActionBar({
    required TournamentRecord tournament,
    required MatchRecord activeMatch,
    required List<String> duplicateRanks,
    required StandingsResult standingsResult,
  }) {
    final completedReady = !activeMatch.isCompleted && duplicateRanks.isEmpty;
    final matchIndex =
        tournament.matches.indexWhere((m) => m.id == activeMatch.id);
    final nextExistingMatch =
        (matchIndex >= 0 && matchIndex < tournament.matches.length - 1)
            ? tournament.matches[matchIndex + 1]
            : null;
    final maxAllowed = tournament.settings.mode == TournamentMode.championRush
        ? tournament.settings.championRush.maxMatches
        : tournament.settings.totalMatchesPlanned;
    final canCreateNext = !standingsResult.tournamentConcluded &&
        !tournament.isEnded &&
        nextExistingMatch == null &&
        tournament.matches.length < maxAllowed;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.canvas,
        border: Border(
          top: BorderSide(color: AppColors.borderSubtle),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
      child: activeMatch.isCompleted
          ? Row(
              children: [
                Expanded(
                  child: SecondaryPillButton(
                    label: 'Reopen Match ${activeMatch.matchNumber}',
                    icon: Icons.lock_open_rounded,
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      widget.store.reopenMatch(activeMatch.id);
                    },
                  ),
                ),
                const SizedBox(width: 10),
                if (nextExistingMatch != null)
                  Expanded(
                    child: PrimaryPillButton(
                      label: 'Match ${nextExistingMatch.matchNumber}',
                      icon: Icons.arrow_forward_rounded,
                      onPressed: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _selectedMatchId = nextExistingMatch.id;
                          _tab = 0;
                        });
                      },
                    ),
                  )
                else if (canCreateNext)
                  Expanded(
                    child: PrimaryPillButton(
                      label: 'Start Match ${tournament.matches.length + 1}',
                      icon: Icons.add_rounded,
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        final nextId = widget.store.createMatch();
                        if (nextId.isNotEmpty) {
                          setState(() {
                            _selectedMatchId = nextId;
                            _tab = 0;
                          });
                        }
                      },
                    ),
                  )
                else
                  Expanded(
                    child: PrimaryPillButton(
                      label: 'Poster Studio',
                      icon: Icons.photo_library_rounded,
                      onPressed: widget.onOpenPoster,
                    ),
                  ),
              ],
            )
          : PrimaryPillButton(
              label: duplicateRanks.isNotEmpty
                  ? 'Fix Duplicate Ranks First'
                  : 'Complete Match ${activeMatch.matchNumber}',
              icon: Icons.check_circle_rounded,
              expand: true,
              onPressed: completedReady
                  ? () {
                      HapticFeedback.heavyImpact();
                      widget.store.completeMatch(activeMatch.id);
                      setState(() => _tab = 1);
                    }
                  : null,
            ),
    );
  }

  Widget _buildStandings(
    TournamentRecord tournament,
    MatchRecord activeMatch,
    StandingsResult standingsResult,
  ) {
    final rows = _standingsScope == 0
        ? standingsResult.standings
        : calculateSingleMatchStandings(
            tournament.teams,
            activeMatch,
            tournament.settings.pointSystem,
            tournament.settings.tieBreakOrder,
          );
    final isRush = tournament.settings.mode == TournamentMode.championRush;
    final targetPts = tournament.settings.championRush.targetPoints;

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      children: [
        Row(
          children: [
            Expanded(
              child: Align(
                alignment: Alignment.centerLeft,
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _ScopePill(
                        label: 'Overall',
                        selected: _standingsScope == 0,
                        onTap: () => setState(() => _standingsScope = 0),
                      ),
                      const SizedBox(width: 8),
                      _ScopePill(
                        label: 'Match ${activeMatch.matchNumber}',
                        selected: _standingsScope == 1,
                        onTap: () => setState(() => _standingsScope = 1),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 6),
            IconButton(
              tooltip: 'Copy Standings Text',
              visualDensity: VisualDensity.compact,
              onPressed: rows.isEmpty
                  ? null
                  : () => _copyStandingsText(
                        tournament,
                        rows,
                        viewMode: _standingsScope == 0
                            ? StandingsViewMode.overall
                            : StandingsViewMode.singleMatch,
                        matchNumber: activeMatch.matchNumber,
                      ),
              icon: const Icon(
                Icons.copy_all_rounded,
                size: 18,
                color: AppColors.textSecondary,
              ),
            ),
            TextButton.icon(
              onPressed: widget.onOpenPoster,
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              ),
              icon: const Icon(
                Icons.share_rounded,
                size: 16,
                color: AppColors.accentBright,
              ),
              label: const Text(
                'Poster',
                style: TextStyle(
                  color: AppColors.accentBright,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Column header
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Row(
            children: [
              SizedBox(
                width: 28,
                child: Text(
                  '#',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Expanded(
                child: Text(
                  'SQUAD',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              SizedBox(
                width: 34,
                child: Text(
                  'W',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              SizedBox(
                width: 40,
                child: Text(
                  'KILLS',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              SizedBox(
                width: 48,
                child: Text(
                  'PTS',
                  textAlign: TextAlign.right,
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),

        ...rows.map((s) {
          final isChamp = s.rushStatus.status == RushStatusType.champion;
          final isRushActive = s.rushStatus.status == RushStatusType.active;
          final isTop1 = s.rank == 1;

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
              decoration: BoxDecoration(
                color: isChamp || isTop1
                    ? AppColors.accentSurface
                    : AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isChamp || isTop1
                      ? AppColors.accentBorder
                      : isRushActive
                          ? const Color(0x55EF4444)
                          : AppColors.borderSubtle,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      SizedBox(
                        width: 28,
                        child: Text(
                          '${s.rank}',
                          style: kTabularNumbers.copyWith(
                            color: isTop1
                                ? AppColors.accentBright
                                : AppColors.textSecondary,
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      SquadBadge(
                        teamName: s.teamName,
                        shortCode: s.shortCode,
                        logoUrl: s.logoUrl,
                        size: 32,
                        highlight: isTop1 || isChamp,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              s.teamName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            if (isChamp || isRushActive)
                              Text(
                                isChamp ? 'CHAMPION' : 'MATCH POINT ACTIVE',
                                style: TextStyle(
                                  color: isChamp
                                      ? AppColors.accentBright
                                      : AppColors.crimson,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                          ],
                        ),
                      ),
                      SizedBox(
                        width: 34,
                        child: Text(
                          '${s.booyahCount}',
                          textAlign: TextAlign.center,
                          style: kTabularNumbers.copyWith(
                            color: s.booyahCount > 0
                                ? AppColors.accentBright
                                : AppColors.textMuted,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 40,
                        child: Text(
                          '${s.kills}',
                          textAlign: TextAlign.center,
                          style: kTabularNumbers.copyWith(
                            color: AppColors.textPrimary,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 48,
                        child: Text(
                          '${s.totalPoints}',
                          textAlign: TextAlign.right,
                          style: kTabularNumbers.copyWith(
                            color: isTop1
                                ? AppColors.accentBright
                                : AppColors.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_standingsScope == 0 && isRush && targetPts > 0) ...[
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: s.progressToTarget,
                        minHeight: 4,
                        backgroundColor: AppColors.inputFill,
                        valueColor: AlwaysStoppedAnimation(
                          isChamp || isRushActive
                              ? AppColors.crimson
                              : AppColors.accent,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _QuickKillStepper extends StatelessWidget {
  final int kills;
  final bool enabled;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;
  final VoidCallback onTapNumber;

  const _QuickKillStepper({
    required this.kills,
    required this.enabled,
    required this.onDecrement,
    required this.onIncrement,
    required this.onTapNumber,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.inputFill,
        borderRadius: BorderRadius.circular(11),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _KillStepButton(
            icon: Icons.remove_rounded,
            enabled: enabled && kills > 0,
            onTap: onDecrement,
          ),
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: enabled ? onTapNumber : null,
            child: Container(
              width: 30,
              padding: const EdgeInsets.symmetric(vertical: 8),
              alignment: Alignment.center,
              child: Text(
                '$kills',
                style: kTabularNumbers.copyWith(
                  color: AppColors.textPrimary,
                  fontSize: 13.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          _KillStepButton(
            icon: Icons.add_rounded,
            enabled: enabled,
            onTap: onIncrement,
          ),
        ],
      ),
    );
  }
}

class _QuickKillsPickerSheet extends StatefulWidget {
  final String teamName;
  final int? placement;
  final int initialKills;

  const _QuickKillsPickerSheet({
    required this.teamName,
    required this.placement,
    required this.initialKills,
  });

  @override
  State<_QuickKillsPickerSheet> createState() => _QuickKillsPickerSheetState();
}

class _QuickKillsPickerSheetState extends State<_QuickKillsPickerSheet> {
  late final TextEditingController _customCtrl;

  @override
  void initState() {
    super.initState();
    _customCtrl = TextEditingController(text: '${widget.initialKills}');
  }

  @override
  void dispose() {
    _customCtrl.dispose();
    super.dispose();
  }

  void _submitCustom() {
    final parsed = int.tryParse(_customCtrl.text.trim());
    if (parsed == null || parsed < 0) return;
    Navigator.pop(context, parsed);
  }

  @override
  Widget build(BuildContext context) {
    final rankLabel =
        widget.placement != null ? '#${widget.placement} · ' : '';

    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          20,
          0,
          20,
          20 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SheetHeader(
              title: 'Kills · $rankLabel${widget.teamName}',
              subtitle: 'Tap a number below or type any total (20+)',
            ),
            const SizedBox(height: 12),
            GridView.builder(
              padding: EdgeInsets.zero,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 20,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 5,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                mainAxisExtent: 44,
              ),
              itemBuilder: (_, value) {
                final selected = widget.initialKills == value;
                return GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    Navigator.pop(context, value);
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: selected
                          ? AppColors.accent
                          : AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: selected
                            ? AppColors.accent
                            : AppColors.borderSubtle,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$value',
                      style: kTabularNumbers.copyWith(
                        color: selected
                            ? AppColors.inkOnAccent
                            : AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _customCtrl,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _submitCustom(),
                    style: kTabularNumbers.copyWith(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Custom Kills',
                      hintText: 'e.g. 24',
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                PrimaryPillButton(
                  label: 'Apply',
                  onPressed: _submitCustom,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _KillStepButton extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  const _KillStepButton({
    required this.icon,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: enabled ? onTap : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Icon(
          icon,
          size: 16,
          color: enabled ? AppColors.textPrimary : AppColors.textMuted,
        ),
      ),
    );
  }
}

class _ScopePill extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _ScopePill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? AppColors.accent : AppColors.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? AppColors.accent : AppColors.borderSubtle,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? AppColors.inkOnAccent : AppColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
