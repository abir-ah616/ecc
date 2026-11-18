import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/scoring.dart';
import '../../models/tournament_models.dart';
import '../../state/tournament_state.dart';
import '../../theme/app_theme.dart';
import 'app_components.dart';

enum _RapidPhase { pickTeam, enterKills, done }

class _RapidSnapshot {
  final List<({String teamId, int? placement, int kills})> entries;
  final int rank;
  final _RapidPhase phase;
  final String? selectedTeamId;
  final int draftKills;

  const _RapidSnapshot({
    required this.entries,
    required this.rank,
    required this.phase,
    required this.selectedTeamId,
    required this.draftKills,
  });
}

class _MatchWizardData {
  int rank;
  _RapidPhase phase;
  String? selectedTeamId;
  int draftKills;
  final List<_RapidSnapshot> reverseStack;
  final List<_RapidSnapshot> redoStack;

  _MatchWizardData({
    required this.rank,
    required this.phase,
    this.selectedTeamId,
    this.draftKills = 0,
    List<_RapidSnapshot>? reverseStack,
    List<_RapidSnapshot>? redoStack,
  })  : reverseStack = reverseStack ?? [],
        redoStack = redoStack ?? [];
}

class RapidEntryWizard extends StatefulWidget {
  final TournamentRecord tournament;
  final MatchRecord activeMatch;
  final TournamentStore store;
  final VoidCallback onFinishedToTeamList;

  const RapidEntryWizard({
    super.key,
    required this.tournament,
    required this.activeMatch,
    required this.store,
    required this.onFinishedToTeamList,
  });

  @override
  State<RapidEntryWizard> createState() => _RapidEntryWizardState();
}

class _RapidEntryWizardState extends State<RapidEntryWizard> {
  final Map<String, _MatchWizardData> _byMatchId = {};

  _MatchWizardData _stateForCurrentMatch() {
    final existing = _byMatchId[widget.activeMatch.id];
    if (existing != null) return existing;

    final created = _buildInitialWizardState();
    _byMatchId[widget.activeMatch.id] = created;
    return created;
  }

  _MatchWizardData _buildInitialWizardState() {
    final teams = widget.tournament.teams;
    final match = widget.activeMatch;
    final teamCount = teams.length;
    final placedByRank = <int, Team>{};
    final unplaced = <Team>[];

    for (final tm in teams) {
      final p = match.entries[tm.id]?.placement;
      if (p != null && p >= 1 && p <= teamCount && !placedByRank.containsKey(p)) {
        placedByRank[p] = tm;
      } else {
        unplaced.add(tm);
      }
    }

    final openRanks = [
      for (int r = 1; r <= teamCount; r++)
        if (!placedByRank.containsKey(r)) r,
    ];

    if (match.isCompleted || openRanks.isEmpty || unplaced.isEmpty) {
      return _MatchWizardData(rank: teamCount, phase: _RapidPhase.done);
    }

    if (openRanks.length == 1 && unplaced.length == 1) {
      final onlyTeam = unplaced.first;
      return _MatchWizardData(
        rank: openRanks.first,
        phase: _RapidPhase.enterKills,
        selectedTeamId: onlyTeam.id,
        draftKills: match.entries[onlyTeam.id]?.kills ?? 0,
      );
    }

    return _MatchWizardData(rank: openRanks.first, phase: _RapidPhase.pickTeam);
  }

  List<({String teamId, int? placement, int kills})> _snapshotEntries() {
    return [
      for (final tm in widget.tournament.teams)
        (
          teamId: tm.id,
          placement: widget.activeMatch.entries[tm.id]?.placement,
          kills: widget.activeMatch.entries[tm.id]?.kills ?? 0,
        ),
    ];
  }

  String _ordinal(int rank) {
    final mod100 = rank % 100;
    if (mod100 >= 11 && mod100 <= 13) return '${rank}th';
    switch (rank % 10) {
      case 1:
        return '${rank}st';
      case 2:
        return '${rank}nd';
      case 3:
        return '${rank}rd';
      default:
        return '${rank}th';
    }
  }

  void _pickTeam(Team team) {
    if (widget.activeMatch.isCompleted) return;
    HapticFeedback.selectionClick();
    final state = _stateForCurrentMatch();
    final snap = _RapidSnapshot(
      entries: _snapshotEntries(),
      rank: state.rank,
      phase: _RapidPhase.pickTeam,
      selectedTeamId: null,
      draftKills: 0,
    );

    final targetRank = state.rank;
    final currentKills = widget.activeMatch.entries[team.id]?.kills ?? 0;

    // Assign rank safely (clear any previous occupant of targetRank just in case)
    final updatedEntries = <({String teamId, int? placement, int kills})>[];
    for (final tm in widget.tournament.teams) {
      final prev = widget.activeMatch.entries[tm.id];
      if (tm.id == team.id) {
        updatedEntries.add((
          teamId: tm.id,
          placement: targetRank,
          kills: currentKills,
        ));
      } else if (prev?.placement == targetRank) {
        updatedEntries.add((
          teamId: tm.id,
          placement: null,
          kills: prev?.kills ?? 0,
        ));
      } else {
        updatedEntries.add((
          teamId: tm.id,
          placement: prev?.placement,
          kills: prev?.kills ?? 0,
        ));
      }
    }

    widget.store.applyBatchMatchResults(
      matchId: widget.activeMatch.id,
      entries: updatedEntries,
    );

    setState(() {
      state.reverseStack.add(snap);
      state.redoStack.clear();
      state.selectedTeamId = team.id;
      state.draftKills = currentKills;
      state.phase = _RapidPhase.enterKills;
    });
  }

  void _confirmKills() {
    if (widget.activeMatch.isCompleted) return;
    final state = _stateForCurrentMatch();
    final chosenId = state.selectedTeamId;
    if (chosenId == null) return;

    HapticFeedback.mediumImpact();
    final snap = _RapidSnapshot(
      entries: _snapshotEntries(),
      rank: state.rank,
      phase: _RapidPhase.enterKills,
      selectedTeamId: chosenId,
      draftKills: state.draftKills,
    );

    final teamCount = widget.tournament.teams.length;
    final sanitizedKills = state.draftKills.clamp(0, 99);

    // Build post-commit entries & find what ranks/teams remain
    final nextEntries = <({String teamId, int? placement, int kills})>[];
    final placedByRank = <int, String>{};
    final unplacedTeams = <Team>[];

    for (final tm in widget.tournament.teams) {
      final entry = widget.activeMatch.entries[tm.id];
      final p = tm.id == chosenId ? state.rank : entry?.placement;
      final k = tm.id == chosenId ? sanitizedKills : (entry?.kills ?? 0);
      nextEntries.add((teamId: tm.id, placement: p, kills: k));
      if (p != null && p >= 1 && p <= teamCount && !placedByRank.containsKey(p)) {
        placedByRank[p] = tm.id;
      } else {
        unplacedTeams.add(tm);
      }
    }

    final openRanks = [
      for (int r = 1; r <= teamCount; r++)
        if (!placedByRank.containsKey(r)) r,
    ];

    if (openRanks.isEmpty || unplacedTeams.isEmpty) {
      widget.store.applyBatchMatchResults(
        matchId: widget.activeMatch.id,
        entries: nextEntries,
      );
      setState(() {
        state.reverseStack.add(snap);
        state.redoStack.clear();
        state.selectedTeamId = null;
        state.draftKills = 0;
        state.phase = _RapidPhase.done;
      });
      widget.onFinishedToTeamList();
      return;
    }

    final nextRank = openRanks.first;
    // Auto-select sole remaining squad directly into Total Kills?
    if (openRanks.length == 1 && unplacedTeams.length == 1) {
      final lastTeam = unplacedTeams.first;
      final lastKills = widget.activeMatch.entries[lastTeam.id]?.kills ?? 0;
      final autoEntries = nextEntries.map((e) {
        if (e.teamId == lastTeam.id) {
          return (teamId: e.teamId, placement: nextRank, kills: lastKills);
        }
        return e;
      }).toList();

      widget.store.applyBatchMatchResults(
        matchId: widget.activeMatch.id,
        entries: autoEntries,
      );
      setState(() {
        state.reverseStack.add(snap);
        state.redoStack.clear();
        state.rank = nextRank;
        state.selectedTeamId = lastTeam.id;
        state.draftKills = lastKills;
        state.phase = _RapidPhase.enterKills;
      });
      return;
    }

    widget.store.applyBatchMatchResults(
      matchId: widget.activeMatch.id,
      entries: nextEntries,
    );
    setState(() {
      state.reverseStack.add(snap);
      state.redoStack.clear();
      state.rank = nextRank;
      state.selectedTeamId = null;
      state.draftKills = 0;
      state.phase = _RapidPhase.pickTeam;
    });
  }

  void _reverseStep() {
    if (widget.activeMatch.isCompleted) return;
    final state = _stateForCurrentMatch();
    if (state.reverseStack.isEmpty) return;

    HapticFeedback.selectionClick();
    final target = state.reverseStack.removeLast();
    state.redoStack.add(_RapidSnapshot(
      entries: _snapshotEntries(),
      rank: state.rank,
      phase: state.phase,
      selectedTeamId: state.selectedTeamId,
      draftKills: state.draftKills,
    ));

    widget.store.applyBatchMatchResults(
      matchId: widget.activeMatch.id,
      entries: target.entries,
    );
    setState(() {
      state.rank = target.rank;
      state.phase = target.phase;
      state.selectedTeamId = target.selectedTeamId;
      state.draftKills = target.draftKills;
    });
  }

  void _redoStep() {
    if (widget.activeMatch.isCompleted) return;
    final state = _stateForCurrentMatch();
    if (state.redoStack.isEmpty) return;

    HapticFeedback.selectionClick();
    final target = state.redoStack.removeLast();
    state.reverseStack.add(_RapidSnapshot(
      entries: _snapshotEntries(),
      rank: state.rank,
      phase: state.phase,
      selectedTeamId: state.selectedTeamId,
      draftKills: state.draftKills,
    ));

    widget.store.applyBatchMatchResults(
      matchId: widget.activeMatch.id,
      entries: target.entries,
    );
    setState(() {
      state.rank = target.rank;
      state.phase = target.phase;
      state.selectedTeamId = target.selectedTeamId;
      state.draftKills = target.draftKills;
    });
  }

  void _resetAll() {
    if (widget.activeMatch.isCompleted) return;
    HapticFeedback.mediumImpact();
    final state = _stateForCurrentMatch();
    final snap = _RapidSnapshot(
      entries: _snapshotEntries(),
      rank: state.rank,
      phase: state.phase,
      selectedTeamId: state.selectedTeamId,
      draftKills: state.draftKills,
    );

    final cleared = [
      for (final tm in widget.tournament.teams)
        (
          teamId: tm.id,
          placement: null,
          kills: widget.activeMatch.entries[tm.id]?.kills ?? 0,
        ),
    ];

    widget.store.applyBatchMatchResults(
      matchId: widget.activeMatch.id,
      entries: cleared,
    );
    setState(() {
      state.reverseStack.add(snap);
      state.redoStack.clear();
      state.rank = 1;
      state.selectedTeamId = null;
      state.draftKills = 0;
      state.phase = _RapidPhase.pickTeam;
    });
  }

  void _appendDigit(int d) {
    HapticFeedback.selectionClick();
    final state = _stateForCurrentMatch();
    setState(() {
      final next = state.draftKills == 0 ? d : state.draftKills * 10 + d;
      state.draftKills = next.clamp(0, 99);
    });
  }

  void _backspaceDigit() {
    HapticFeedback.selectionClick();
    final state = _stateForCurrentMatch();
    setState(() {
      state.draftKills = state.draftKills ~/ 10;
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = _stateForCurrentMatch();
    final teams = widget.tournament.teams;
    final match = widget.activeMatch;
    final teamCount = teams.length;

    final placedByRank = <int, Team>{};
    final unplaced = <Team>[];
    for (final tm in teams) {
      final p = match.entries[tm.id]?.placement;
      if (p != null && p >= 1 && p <= teamCount && !placedByRank.containsKey(p)) {
        placedByRank[p] = tm;
      } else {
        unplaced.add(tm);
      }
    }

    // Keep state synchronized if external edits (e.g. from Team List) cleared/added ranks
    if (!match.isCompleted &&
        state.phase == _RapidPhase.pickTeam &&
        placedByRank.containsKey(state.rank)) {
      final open = [
        for (int r = 1; r <= teamCount; r++)
          if (!placedByRank.containsKey(r)) r,
      ];
      if (open.isEmpty) {
        state.phase = _RapidPhase.done;
      } else {
        state.rank = open.first;
      }
    }

    final placedEntries = placedByRank.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));
    final selectedTeam = state.selectedTeamId != null
        ? teams.where((t) => t.id == state.selectedTeamId).firstOrNull
        : null;
    final placementPts = getPlacementPoints(
      state.rank,
      widget.tournament.settings.pointSystem,
    );
    final killPts = getKillPoints(
      state.draftKills,
      widget.tournament.settings.pointSystem,
    );

    final isFinalStep = state.phase == _RapidPhase.enterKills &&
        teams
            .where((t) =>
                t.id != state.selectedTeamId &&
                (match.entries[t.id]?.placement == null ||
                    match.entries[t.id]!.placement! < 1 ||
                    match.entries[t.id]!.placement! > teamCount))
            .isEmpty;

    if (match.isCompleted) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.borderSubtle),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.lock_outline_rounded,
                  size: 32,
                  color: AppColors.emerald,
                ),
                const SizedBox(height: 10),
                const Text(
                  'Match Already Saved',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Switch to Team List to review scores, or tap Edit above to unlock.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12.5,
                  ),
                ),
                const SizedBox(height: 14),
                FilledButton.icon(
                  onPressed: widget.onFinishedToTeamList,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: const Color(0xFF090B0F),
                  ),
                  icon: const Icon(Icons.format_list_numbered_rounded, size: 17),
                  label: const Text(
                    'Open Team List',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 0, 18, 10),
      child: Column(
        children: [
          // Top Rapid Header Bar: Current Stage Badge + Reverse & Redo
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderSubtle),
            ),
            child: Row(
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
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: state.phase == _RapidPhase.done
                                  ? AppColors.emeraldSurface
                                  : state.rank == 1
                                      ? AppColors.accent
                                      : AppColors.accentSurface,
                              borderRadius: BorderRadius.circular(9),
                              border: state.phase == _RapidPhase.done
                                  ? Border.all(color: const Color(0x5522C55E))
                                  : state.rank == 1
                                      ? null
                                      : Border.all(color: AppColors.accentBorder),
                            ),
                            child: Text(
                              state.phase == _RapidPhase.done
                                  ? 'ALL $teamCount DONE'
                                  : state.rank == 1
                                      ? '#1 BOOYAH'
                                      : '${_ordinal(state.rank).toUpperCase()} PLACE',
                              style: TextStyle(
                                color: state.phase == _RapidPhase.done
                                    ? AppColors.emerald
                                    : state.rank == 1
                                        ? const Color(0xFF090B0F)
                                        : AppColors.accentBright,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                          if (state.phase != _RapidPhase.done) ...[
                            const SizedBox(width: 6),
                            Text(
                              '+${placementPts}p',
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                _RapidActionPill(
                  icon: Icons.undo_rounded,
                  label: 'Reverse',
                  enabled: state.reverseStack.isNotEmpty,
                  onTap: _reverseStep,
                ),
                const SizedBox(width: 5),
                _RapidActionPill(
                  icon: Icons.redo_rounded,
                  label: 'Redo',
                  enabled: state.redoStack.isNotEmpty,
                  onTap: _redoStep,
                ),
                if (placedEntries.isNotEmpty) ...[
                  const SizedBox(width: 5),
                  _RapidActionPill(
                    icon: Icons.restart_alt_rounded,
                    label: '',
                    enabled: true,
                    onTap: _resetAll,
                  ),
                ],
              ],
            ),
          ),

          if (placedEntries.isNotEmpty) ...[
            const SizedBox(height: 8),
            SizedBox(
              height: 30,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: placedEntries.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (_, i) {
                  final e = placedEntries[i];
                  final k = match.entries[e.value.id]?.kills ?? 0;
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: e.key == 1
                          ? AppColors.accentSurface
                          : AppColors.surface,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(
                        color: e.key == 1
                            ? AppColors.accentBorder
                            : AppColors.borderSubtle,
                      ),
                    ),
                    child: Text(
                      '#${e.key} ${e.value.name} · ${k}K',
                      style: TextStyle(
                        color: e.key == 1
                            ? AppColors.accentBright
                            : AppColors.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  );
                },
              ),
            ),
          ],

          const SizedBox(height: 10),

          // Main Animated Stage
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 280),
              switchInCurve: Curves.easeOutCubic,
              switchOutCurve: Curves.easeInCubic,
              transitionBuilder: (child, anim) {
                return FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.14),
                      end: Offset.zero,
                    ).animate(anim),
                    child: child,
                  ),
                );
              },
              child: state.phase == _RapidPhase.pickTeam
                  ? _buildPickTeamPhase(state, unplaced)
                  : state.phase == _RapidPhase.enterKills && selectedTeam != null
                      ? _buildEnterKillsPhase(
                          state,
                          selectedTeam,
                          placementPts,
                          killPts,
                          isFinalStep,
                        )
                      : _buildDonePhase(teamCount),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPickTeamPhase(_RapidState state, List<Team> unplaced) {
    final question = state.rank == 1
        ? 'Which team took Booyah?'
        : 'Which team placed ${_ordinal(state.rank)}?';

    return Container(
      key: ValueKey('pick_${state.rank}'),
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            question,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 21,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Tap a squad below to lock placement and enter Total Kills.',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12.2,
            ),
          ),
          const SizedBox(height: 14),
          Expanded(
            child: GridView.builder(
              physics: const BouncingScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                mainAxisExtent: 74,
              ),
              itemCount: unplaced.length,
              itemBuilder: (_, idx) {
                final team = unplaced[idx];
                return Material(
                  color: AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    onTap: () => _pickTeam(team),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.borderStrong),
                      ),
                      child: Row(
                        children: [
                          SquadBadge(
                            teamName: team.name,
                            shortCode: team.shortCode,
                            logoUrl: team.logoUrl,
                            size: 36,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              team.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                height: 1.2,
                              ),
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
        ],
      ),
    );
  }

  Widget _buildEnterKillsPhase(
    _RapidState state,
    Team team,
    int placementPts,
    int killPts,
    bool isFinalStep,
  ) {
    final totalPts = placementPts + killPts;
    final nextRank = state.rank < widget.tournament.teams.length
        ? state.rank + 1
        : null;

    return SingleChildScrollView(
      key: ValueKey('kills_${state.rank}_${team.id}'),
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Rising Spotlight Squad Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF281B0C), Color(0xFF141822)],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.accentBorder, width: 1.2),
            ),
            child: Row(
              children: [
                SquadBadge(
                  teamName: team.name,
                  shortCode: team.shortCode,
                  logoUrl: team.logoUrl,
                  size: 44,
                  highlight: true,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        state.rank == 1
                            ? '#1 BOOYAH SQUAD'
                            : '${_ordinal(state.rank).toUpperCase()} PLACE SQUAD',
                        style: const TextStyle(
                          color: AppColors.accentBright,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.7,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        team.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '$totalPts pts',
                      style: const TextStyle(
                        color: AppColors.accentBright,
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      '${placementPts}p + ${killPts}k',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 10),

          // Bottom Pop-Up "Total Kills?" Keypad Card
          Container(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppColors.borderStrong),
            ),
            child: Column(
              children: [
                const Text(
                  'Total Kills?',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _StepperCircleButton(
                      icon: Icons.remove_rounded,
                      enabled: state.draftKills > 0,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          state.draftKills = (state.draftKills - 1).clamp(0, 99);
                        });
                      },
                    ),
                    const SizedBox(width: 14),
                    Container(
                      width: 92,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.canvas,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.accentBorder, width: 1.4),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${state.draftKills}',
                        style: const TextStyle(
                          color: AppColors.accentBright,
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    _StepperCircleButton(
                      icon: Icons.add_rounded,
                      enabled: true,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          state.draftKills = (state.draftKills + 1).clamp(0, 99);
                        });
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Stylized 3x4 Keypad with fixed thumb-friendly row height
                GridView(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 6,
                    crossAxisSpacing: 6,
                    mainAxisExtent: 42,
                  ),
                  children: [
                    for (int d = 1; d <= 9; d++)
                      _KeypadButton(
                        label: '$d',
                        onTap: () => _appendDigit(d),
                      ),
                    _KeypadButton(
                      label: 'CLR',
                      muted: true,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => state.draftKills = 0);
                      },
                    ),
                    _KeypadButton(
                      label: '0',
                      onTap: () => _appendDigit(0),
                    ),
                    _KeypadButton(
                      icon: Icons.backspace_outlined,
                      muted: true,
                      onTap: _backspaceDigit,
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    onPressed: _confirmKills,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: const Color(0xFF090B0F),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                    icon: Icon(
                      isFinalStep
                          ? Icons.check_circle_rounded
                          : Icons.arrow_forward_rounded,
                      size: 19,
                    ),
                    label: Text(
                      isFinalStep
                          ? 'Finish & Edit List'
                          : nextRank != null
                              ? 'Next · ${_ordinal(nextRank)} Place'
                              : 'Next',
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDonePhase(int teamCount) {
    return Center(
      key: const ValueKey('done'),
      child: Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.borderSubtle),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.emeraldSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x5522C55E)),
              ),
              child: const Icon(
                Icons.check_rounded,
                color: AppColors.emerald,
                size: 28,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'All $teamCount Squads Entered',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Review or adjust any placement and kills inside Team List, or tap Reverse to edit your last entry.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12.5,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: widget.onFinishedToTeamList,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: const Color(0xFF090B0F),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    icon: const Icon(Icons.edit_note_rounded, size: 19),
                    label: const Text(
                      'Edit in Team List',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: _resetAll,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textPrimary,
                    side: const BorderSide(color: AppColors.borderStrong),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 13,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: const Icon(Icons.restart_alt_rounded, size: 17),
                  label: const Text(
                    'Re-enter',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

typedef _RapidState = _MatchWizardData;

class _RapidActionPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool enabled;
  final VoidCallback onTap;

  const _RapidActionPill({
    required this.icon,
    required this.label,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Opacity(
        opacity: enabled ? 1.0 : 0.35,
        child: Container(
          padding: EdgeInsets.symmetric(
            horizontal: label.isEmpty ? 8 : 9,
            vertical: 6,
          ),
          decoration: BoxDecoration(
            color: AppColors.surfaceElevated,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.borderStrong),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 14, color: AppColors.textPrimary),
              if (label.isNotEmpty) ...[
                const SizedBox(width: 4),
                Text(
                  label,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StepperCircleButton extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  const _StepperCircleButton({
    required this.icon,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceElevated,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(14),
        child: Opacity(
          opacity: enabled ? 1.0 : 0.35,
          child: Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderStrong),
            ),
            child: Icon(icon, color: AppColors.textPrimary, size: 22),
          ),
        ),
      ),
    );
  }
}

class _KeypadButton extends StatelessWidget {
  final String? label;
  final IconData? icon;
  final bool muted;
  final VoidCallback onTap;

  const _KeypadButton({
    this.label,
    this.icon,
    this.muted = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: muted ? AppColors.inputFill : AppColors.surfaceElevated,
      borderRadius: BorderRadius.circular(13),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(13),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(13),
            border: Border.all(
              color: muted ? AppColors.borderSubtle : AppColors.borderStrong,
            ),
          ),
          alignment: Alignment.center,
          child: icon != null
              ? Icon(icon, size: 19, color: AppColors.textSecondary)
              : Text(
                  label ?? '',
                  style: TextStyle(
                    color: muted ? AppColors.textSecondary : AppColors.textPrimary,
                    fontSize: muted ? 12 : 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
        ),
      ),
    );
  }
}
