import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

class _WizardProgress {
  int rank;
  _RapidPhase phase;
  String? selectedTeamId;
  int draftKills;
  final List<_RapidSnapshot> reverseStack;
  final List<_RapidSnapshot> redoStack;

  _WizardProgress({
    required this.rank,
    required this.phase,
    this.selectedTeamId,
    this.draftKills = 0,
    List<_RapidSnapshot>? reverseStack,
    List<_RapidSnapshot>? redoStack,
  })  : reverseStack = reverseStack ?? [],
        redoStack = redoStack ?? [];
}

Future<bool> showFullScreenRapidOverlay({
  required BuildContext context,
  required TournamentRecord tournament,
  required MatchRecord activeMatch,
  required TournamentStore store,
}) async {
  final completedAll = await showGeneralDialog<bool>(
    context: context,
    barrierDismissible: false,
    barrierColor: Colors.transparent,
    transitionDuration: const Duration(milliseconds: 220),
    pageBuilder: (dialogCtx, _, __) {
      return AnimatedBuilder(
        animation: store,
        builder: (_, __) {
          final currentTournament = store.activeTournament ?? tournament;
          final currentMatch = currentTournament.matches.firstWhere(
            (m) => m.id == activeMatch.id,
            orElse: () => activeMatch,
          );
          return _FullScreenRapidDialog(
            tournament: currentTournament,
            activeMatch: currentMatch,
            store: store,
            onDoneToStandings: () => Navigator.of(dialogCtx).pop(true),
            onDismiss: () => Navigator.of(dialogCtx).pop(false),
          );
        },
      );
    },
    transitionBuilder: (_, anim, __, child) {
      final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutCubic);
      return FadeTransition(opacity: curved, child: child);
    },
  );
  return completedAll ?? false;
}

class _FullScreenRapidDialog extends StatefulWidget {
  final TournamentRecord tournament;
  final MatchRecord activeMatch;
  final TournamentStore store;
  final VoidCallback onDoneToStandings;
  final VoidCallback onDismiss;

  const _FullScreenRapidDialog({
    required this.tournament,
    required this.activeMatch,
    required this.store,
    required this.onDoneToStandings,
    required this.onDismiss,
  });

  @override
  State<_FullScreenRapidDialog> createState() => _FullScreenRapidDialogState();
}

class _FullScreenRapidDialogState extends State<_FullScreenRapidDialog> {
  late _WizardProgress _wiz;

  @override
  void initState() {
    super.initState();
    _wiz = _initialProgress();
  }

  _WizardProgress _initialProgress() {
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
      return _WizardProgress(rank: teamCount, phase: _RapidPhase.done);
    }

    if (openRanks.length == 1 && unplaced.length == 1) {
      final lastTeam = unplaced.first;
      return _WizardProgress(
        rank: openRanks.first,
        phase: _RapidPhase.enterKills,
        selectedTeamId: lastTeam.id,
        draftKills: match.entries[lastTeam.id]?.kills ?? 0,
      );
    }

    return _WizardProgress(rank: openRanks.first, phase: _RapidPhase.pickTeam);
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
    HapticFeedback.selectionClick();
    final snap = _RapidSnapshot(
      entries: _snapshotEntries(),
      rank: _wiz.rank,
      phase: _RapidPhase.pickTeam,
      selectedTeamId: null,
      draftKills: 0,
    );

    final targetRank = _wiz.rank;
    final currentKills = widget.activeMatch.entries[team.id]?.kills ?? 0;

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
      _wiz.reverseStack.add(snap);
      _wiz.redoStack.clear();
      _wiz.selectedTeamId = team.id;
      _wiz.draftKills = currentKills;
      _wiz.phase = _RapidPhase.enterKills;
    });
  }

  void _confirmKills() {
    final chosenId = _wiz.selectedTeamId;
    if (chosenId == null) return;

    HapticFeedback.mediumImpact();
    final snap = _RapidSnapshot(
      entries: _snapshotEntries(),
      rank: _wiz.rank,
      phase: _RapidPhase.enterKills,
      selectedTeamId: chosenId,
      draftKills: _wiz.draftKills,
    );

    final teamCount = widget.tournament.teams.length;
    final sanitizedKills = _wiz.draftKills.clamp(0, 99);

    final nextEntries = <({String teamId, int? placement, int kills})>[];
    final placedByRank = <int, String>{};
    final unplacedTeams = <Team>[];

    for (final tm in widget.tournament.teams) {
      final entry = widget.activeMatch.entries[tm.id];
      final p = tm.id == chosenId ? _wiz.rank : entry?.placement;
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
      widget.onDoneToStandings();
      return;
    }

    final nextRank = openRanks.first;
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
        _wiz.reverseStack.add(snap);
        _wiz.redoStack.clear();
        _wiz.rank = nextRank;
        _wiz.selectedTeamId = lastTeam.id;
        _wiz.draftKills = lastKills;
        _wiz.phase = _RapidPhase.enterKills;
      });
      return;
    }

    widget.store.applyBatchMatchResults(
      matchId: widget.activeMatch.id,
      entries: nextEntries,
    );
    setState(() {
      _wiz.reverseStack.add(snap);
      _wiz.redoStack.clear();
      _wiz.rank = nextRank;
      _wiz.selectedTeamId = null;
      _wiz.draftKills = 0;
      _wiz.phase = _RapidPhase.pickTeam;
    });
  }

  void _reverseStep() {
    if (_wiz.reverseStack.isEmpty) return;
    HapticFeedback.selectionClick();
    final target = _wiz.reverseStack.removeLast();
    _wiz.redoStack.add(_RapidSnapshot(
      entries: _snapshotEntries(),
      rank: _wiz.rank,
      phase: _wiz.phase,
      selectedTeamId: _wiz.selectedTeamId,
      draftKills: _wiz.draftKills,
    ));

    widget.store.applyBatchMatchResults(
      matchId: widget.activeMatch.id,
      entries: target.entries,
    );
    setState(() {
      _wiz.rank = target.rank;
      _wiz.phase = target.phase;
      _wiz.selectedTeamId = target.selectedTeamId;
      _wiz.draftKills = target.draftKills;
    });
  }

  void _redoStep() {
    if (_wiz.redoStack.isEmpty) return;
    HapticFeedback.selectionClick();
    final target = _wiz.redoStack.removeLast();
    _wiz.reverseStack.add(_RapidSnapshot(
      entries: _snapshotEntries(),
      rank: _wiz.rank,
      phase: _wiz.phase,
      selectedTeamId: _wiz.selectedTeamId,
      draftKills: _wiz.draftKills,
    ));

    widget.store.applyBatchMatchResults(
      matchId: widget.activeMatch.id,
      entries: target.entries,
    );
    setState(() {
      _wiz.rank = target.rank;
      _wiz.phase = target.phase;
      _wiz.selectedTeamId = target.selectedTeamId;
      _wiz.draftKills = target.draftKills;
    });
  }

  void _resetAll() {
    HapticFeedback.mediumImpact();
    final snap = _RapidSnapshot(
      entries: _snapshotEntries(),
      rank: _wiz.rank,
      phase: _wiz.phase,
      selectedTeamId: _wiz.selectedTeamId,
      draftKills: _wiz.draftKills,
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
      _wiz.reverseStack.add(snap);
      _wiz.redoStack.clear();
      _wiz.rank = 1;
      _wiz.selectedTeamId = null;
      _wiz.draftKills = 0;
      _wiz.phase = _RapidPhase.pickTeam;
    });
  }

  void _appendDigit(int d) {
    HapticFeedback.selectionClick();
    setState(() {
      final next = _wiz.draftKills == 0 ? d : _wiz.draftKills * 10 + d;
      _wiz.draftKills = next.clamp(0, 99);
    });
  }

  void _backspaceDigit() {
    HapticFeedback.selectionClick();
    setState(() {
      _wiz.draftKills = _wiz.draftKills ~/ 10;
    });
  }

  @override
  Widget build(BuildContext context) {
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

    final selectedTeam = _wiz.selectedTeamId != null
        ? teams.where((t) => t.id == _wiz.selectedTeamId).firstOrNull
        : null;

    final isFinalStep = _wiz.phase == _RapidPhase.enterKills &&
        teams
            .where((t) =>
                t.id != _wiz.selectedTeamId &&
                (match.entries[t.id]?.placement == null ||
                    match.entries[t.id]!.placement! < 1 ||
                    match.entries[t.id]!.placement! > teamCount))
            .isEmpty;

    return Material(
      key: const Key('rapid-fullscreen-overlay'),
      type: MaterialType.transparency,
      child: Stack(
        children: [
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
              child: Container(color: const Color(0xCC06080D)),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
              child: Column(
                children: [
                  // Minimal Top Controls: Close left, Reverse & Redo right
                  Row(
                    children: [
                      _CircleCloseButton(onTap: widget.onDismiss),
                      const Spacer(),
                      _MinimalActionChip(
                        icon: Icons.undo_rounded,
                        label: 'Reverse',
                        enabled: _wiz.reverseStack.isNotEmpty,
                        onTap: _reverseStep,
                      ),
                      const SizedBox(width: 8),
                      _MinimalActionChip(
                        icon: Icons.redo_rounded,
                        label: 'Redo',
                        enabled: _wiz.redoStack.isNotEmpty,
                        onTap: _redoStep,
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  Expanded(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 260),
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
                      child: _wiz.phase == _RapidPhase.pickTeam
                          ? _buildPickTeamStep(unplaced)
                          : _wiz.phase == _RapidPhase.enterKills &&
                                  selectedTeam != null
                              ? _buildKillsStep(selectedTeam, isFinalStep)
                              : _buildAlreadyDoneStep(teamCount),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPickTeamStep(List<Team> unplaced) {
    final headline = _wiz.rank == 1
        ? 'Which team took Booyah?'
        : 'Which team placed ${_ordinal(_wiz.rank)}?';

    return Column(
      key: ValueKey('pick_${_wiz.rank}'),
      children: [
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.accent,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            '#${_wiz.rank} Team',
            style: const TextStyle(
              color: Color(0xFF090B0F),
              fontSize: 12,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.4,
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          headline,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 24,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 20),
        Expanded(
          child: GridView.builder(
            physics: const BouncingScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              mainAxisExtent: 76,
            ),
            itemCount: unplaced.length,
            itemBuilder: (_, idx) {
              final team = unplaced[idx];
              return Material(
                color: const Color(0xFF131722),
                borderRadius: BorderRadius.circular(18),
                child: InkWell(
                  onTap: () => _pickTeam(team),
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: const Color(0xFF283044),
                        width: 1.2,
                      ),
                    ),
                    child: Row(
                      children: [
                        SquadBadge(
                          teamName: team.name,
                          shortCode: team.shortCode,
                          logoUrl: team.logoUrl,
                          size: 38,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            team.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 14,
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
    );
  }

  Widget _buildKillsStep(Team team, bool isFinalStep) {
    final nextRank =
        _wiz.rank < widget.tournament.teams.length ? _wiz.rank + 1 : null;

    return SingleChildScrollView(
      key: ValueKey('kills_${_wiz.rank}_${team.id}'),
      physics: const BouncingScrollPhysics(),
      child: Column(
        children: [
          const SizedBox(height: 8),

          // Selected Squad Elevated Card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFF161A26),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.accentBorder, width: 1.3),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: Text(
                    '#${_wiz.rank}',
                    style: const TextStyle(
                      color: Color(0xFF090B0F),
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                SquadBadge(
                  teamName: team.name,
                  shortCode: team.shortCode,
                  logoUrl: team.logoUrl,
                  size: 40,
                  highlight: true,
                ),
                const SizedBox(width: 12),
                Flexible(
                  child: Text(
                    team.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // Clean Total Kills? Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF111520),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF283044)),
            ),
            child: Column(
              children: [
                const Text(
                  'Total Kills?',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  width: 112,
                  height: 58,
                  decoration: BoxDecoration(
                    color: const Color(0xFF090B11),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.accentBorder, width: 1.4),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '${_wiz.draftKills}',
                    style: const TextStyle(
                      color: AppColors.accentBright,
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                GridView(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    mainAxisExtent: 48,
                  ),
                  children: [
                    for (int d = 1; d <= 9; d++)
                      _KeyTile(label: '$d', onTap: () => _appendDigit(d)),
                    _KeyTile(
                      label: 'CLR',
                      muted: true,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _wiz.draftKills = 0);
                      },
                    ),
                    _KeyTile(label: '0', onTap: () => _appendDigit(0)),
                    _KeyTile(
                      icon: Icons.backspace_outlined,
                      muted: true,
                      onTap: _backspaceDigit,
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton.icon(
                    onPressed: _confirmKills,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: const Color(0xFF090B0F),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    icon: Icon(
                      isFinalStep
                          ? Icons.check_circle_rounded
                          : Icons.arrow_forward_rounded,
                      size: 20,
                    ),
                    label: Text(
                      isFinalStep
                          ? 'Done · View Standings'
                          : nextRank != null
                              ? 'Next · ${_ordinal(nextRank)}'
                              : 'Next',
                      style: const TextStyle(
                        fontSize: 15,
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

  Widget _buildAlreadyDoneStep(int teamCount) {
    return Center(
      key: const ValueKey('done'),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF111520),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFF283044)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'All $teamCount Teams Entered',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: FilledButton(
                onPressed: widget.onDoneToStandings,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  foregroundColor: const Color(0xFF090B0F),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                ),
                child: const Text(
                  'View Standings',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: OutlinedButton(
                onPressed: _resetAll,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.textPrimary,
                  side: const BorderSide(color: AppColors.borderStrong),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                ),
                child: const Text(
                  'Re-enter Ranks',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CircleCloseButton extends StatelessWidget {
  final VoidCallback onTap;

  const _CircleCloseButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF131722),
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF283044)),
          ),
          child: const Icon(
            Icons.close_rounded,
            size: 20,
            color: AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}

class _MinimalActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool enabled;
  final VoidCallback onTap;

  const _MinimalActionChip({
    required this.icon,
    required this.label,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF131722),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(999),
        child: Opacity(
          opacity: enabled ? 1.0 : 0.35,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: const Color(0xFF283044)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 15, color: AppColors.textPrimary),
                const SizedBox(width: 5),
                Text(
                  label,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _KeyTile extends StatelessWidget {
  final String? label;
  final IconData? icon;
  final bool muted;
  final VoidCallback onTap;

  const _KeyTile({
    this.label,
    this.icon,
    this.muted = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: muted ? const Color(0xFF0D1018) : const Color(0xFF171C2A),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: muted ? const Color(0xFF1E2434) : const Color(0xFF2B344A),
            ),
          ),
          alignment: Alignment.center,
          child: icon != null
              ? Icon(icon, size: 20, color: AppColors.textSecondary)
              : Text(
                  label ?? '',
                  style: TextStyle(
                    color: muted ? AppColors.textSecondary : AppColors.textPrimary,
                    fontSize: muted ? 12 : 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
        ),
      ),
    );
  }
}
