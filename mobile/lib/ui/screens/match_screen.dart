import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/scoring.dart';
import '../../models/tournament_models.dart';
import '../../state/tournament_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class MatchScreen extends StatefulWidget {
  final TournamentStore store;
  final VoidCallback onOpenPoster;
  final VoidCallback onCreateTournament;
  final VoidCallback onEditEvent;
  final String? preferredMatchId;
  final int matchFocusNonce;

  const MatchScreen({
    super.key,
    required this.store,
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
  }) async {
    final teamCount = tournament.teams.length.clamp(1, 20);
    final usedRanks = <int, String>{};
    for (final t in tournament.teams) {
      if (t.id == team.id) continue;
      final p = match.entries[t.id]?.placement;
      if (p != null) {
        usedRanks[p] = t.name;
      }
    }

    final picked = await showModalBottomSheet<int?>(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SheetHeader(
                  title: 'Set Rank · ${team.name}',
                  subtitle: 'Match #${match.matchNumber} placement',
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
                const SizedBox(height: 14),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: teamCount,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 4,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 1.45,
                  ),
                  itemBuilder: (_, idx) {
                    final rank = idx + 1;
                    final selected = currentPlacement == rank;
                    final usedBy = usedRanks[rank];
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
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.accent
                              : usedBy != null
                                  ? AppColors.inputFill
                                  : AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected
                                ? AppColors.accent
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
                                    : usedBy != null
                                        ? AppColors.textMuted
                                        : rank == 1
                                            ? AppColors.accentBright
                                            : AppColors.textPrimary,
                                fontSize: rank == 1 ? 10 : 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text(
                              usedBy != null ? 'Taken' : '+$pts pts',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: selected
                                    ? AppColors.inkOnAccent
                                        .withValues(alpha: 0.78)
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

    if (picked == null || !mounted) return;
    widget.store.updateMatchEntry(
      matchId: match.id,
      teamId: team.id,
      placement: picked == -1 ? null : picked,
      kills: currentKills,
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
        // Top Tournament Header Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 12, 8),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        StatusPill(
                          label: tournament.settings.mode ==
                                  TournamentMode.championRush
                              ? 'RUSH ${tournament.settings.championRush.targetPoints}'
                              : 'SCRIM',
                          backgroundColor: AppColors.accentSurface,
                          borderColor: AppColors.accentBorder,
                          textColor: AppColors.accentBright,
                        ),
                        const SizedBox(width: 8),
                        if (isConcluded)
                          const StatusPill(
                            label: 'ENDED',
                            backgroundColor: AppColors.emeraldSurface,
                            borderColor: Color(0x5522C55E),
                            textColor: AppColors.emerald,
                          )
                        else if (rushLeaderCount > 0)
                          StatusPill(
                            label: '$rushLeaderCount MATCH POINT',
                            backgroundColor: AppColors.crimsonSurface,
                            borderColor: const Color(0x55EF4444),
                            textColor: AppColors.crimson,
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      tournament.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.4,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: widget.onOpenPoster,
                tooltip: 'Open Poster Studio',
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.surfaceElevated,
                  side: const BorderSide(color: AppColors.borderSubtle),
                ),
                icon: const Icon(
                  Icons.photo_library_outlined,
                  size: 19,
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
                    child: Text('Edit Teams & Settings'),
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
          height: 44,
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
                        horizontal: 14,
                        vertical: 9,
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
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Icon(
                            m.isCompleted
                                ? Icons.check_circle_rounded
                                : Icons.edit_rounded,
                            size: 14,
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
                      horizontal: 14,
                      vertical: 9,
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
                          size: 16,
                          color: AppColors.accentBright,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'New Match',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 12,
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
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 8),
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
      ],
    );
  }

  Widget _buildScorecard(
    TournamentRecord tournament,
    MatchRecord activeMatch,
    int unrankedCount,
    List<String> duplicateRanks,
  ) {
    final completedReady = !activeMatch.isCompleted && duplicateRanks.isEmpty;

    return Column(
      children: [
        if (duplicateRanks.isNotEmpty || unrankedCount > 0)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 2, 20, 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: duplicateRanks.isNotEmpty
                    ? AppColors.crimsonSurface
                    : AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: duplicateRanks.isNotEmpty
                      ? const Color(0x55EF4444)
                      : AppColors.borderSubtle,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    duplicateRanks.isNotEmpty
                        ? Icons.warning_amber_rounded
                        : Icons.info_outline_rounded,
                    size: 16,
                    color: duplicateRanks.isNotEmpty
                        ? AppColors.crimson
                        : AppColors.accentBright,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      duplicateRanks.isNotEmpty
                          ? 'Duplicate rank(s): ${duplicateRanks.join(', ')}'
                          : '$unrankedCount squad(s) need placement rank',
                      style: TextStyle(
                        color: duplicateRanks.isNotEmpty
                            ? AppColors.crimson
                            : AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

        Expanded(
          child: ListView.builder(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 2, 20, 16),
            itemCount: tournament.teams.length,
            itemBuilder: (_, index) {
              final team = tournament.teams[index];
              final entry = activeMatch.entries[team.id];
              final placement = entry?.placement;
              final kills = entry?.kills ?? 0;
              final res = calculateTeamMatchResult(
                team.id,
                placement,
                kills,
                tournament.settings.pointSystem,
              );

              return RepaintBoundary(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 11,
                  ),
                  decoration: BoxDecoration(
                    color: placement == 1
                        ? AppColors.accentSurface
                        : AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: placement == 1
                          ? AppColors.accentBorder
                          : AppColors.borderSubtle,
                    ),
                  ),
                  child: Row(
                    children: [
                      SquadBadge(
                        teamName: team.name,
                        shortCode: team.shortCode,
                        logoUrl: team.logoUrl,
                        size: 38,
                        highlight: placement == 1,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              team.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Total ${res.totalPoints} pts (${res.placementPoints}+${res.killPoints})',
                              style: kTabularNumbers.copyWith(
                                color: AppColors.textMuted,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // 1-Tap Rank Pill
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
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: placement == 1
                                ? AppColors.accent
                                : AppColors.inputFill,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: placement == 1
                                  ? AppColors.accent
                                  : AppColors.borderStrong,
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            placement == null ? 'RANK' : '#$placement',
                            style: kTabularNumbers.copyWith(
                              color: placement == 1
                                  ? AppColors.inkOnAccent
                                  : placement != null
                                      ? AppColors.textPrimary
                                      : AppColors.textMuted,
                              fontSize: placement == null ? 11 : 13,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Tactile Kill Stepper
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.inputFill,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _KillStepButton(
                              icon: Icons.remove_rounded,
                              enabled: !activeMatch.isCompleted && kills > 0,
                              onTap: () {
                                HapticFeedback.selectionClick();
                                widget.store.updateMatchEntry(
                                  matchId: activeMatch.id,
                                  teamId: team.id,
                                  placement: placement,
                                  kills: kills - 1,
                                );
                              },
                            ),
                            SizedBox(
                              width: 28,
                              child: Center(
                                child: Text(
                                  '$kills',
                                  style: kTabularNumbers.copyWith(
                                    color: AppColors.textPrimary,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ),
                            _KillStepButton(
                              icon: Icons.add_rounded,
                              enabled: !activeMatch.isCompleted,
                              onTap: () {
                                HapticFeedback.selectionClick();
                                widget.store.updateMatchEntry(
                                  matchId: activeMatch.id,
                                  teamId: team.id,
                                  placement: placement,
                                  kills: kills + 1,
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                ),
              );
            },
          ),
        ),

        // Match Completion Bar (cleanly anchored above bottom nav bar)
        Container(
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
                    Expanded(
                      child: PrimaryPillButton(
                        label: 'Export Poster',
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
        ),
      ],
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
            const Spacer(),
            TextButton.icon(
              onPressed: widget.onOpenPoster,
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
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
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
