import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/roster_helpers.dart';
import '../../models/tournament_models.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class SquadPlayersSheet extends StatefulWidget {
  final List<Team> teams;
  final bool autoResultEnabled;
  final void Function(List<Team> updatedTeams, bool autoResultEnabled) onSave;

  const SquadPlayersSheet({
    super.key,
    required this.teams,
    required this.autoResultEnabled,
    required this.onSave,
  });

  @override
  State<SquadPlayersSheet> createState() => _SquadPlayersSheetState();
}

class _SquadPlayersSheetState extends State<SquadPlayersSheet> {
  late bool _autoEnabled;
  late Map<String, List<TextEditingController>> _ctrlsByTeamId;

  @override
  void initState() {
    super.initState();
    _autoEnabled = widget.autoResultEnabled;
    _ctrlsByTeamId = {};
    for (final t in widget.teams) {
      final existing = resolveSquadPlayers(
        players: t.players,
        player1: t.player1,
        player2: t.player2,
      );
      _ctrlsByTeamId[t.id] = existing.isNotEmpty
          ? existing.map((p) => TextEditingController(text: p)).toList()
          : [TextEditingController()];
    }
  }

  @override
  void dispose() {
    for (final list in _ctrlsByTeamId.values) {
      for (final c in list) {
        c.dispose();
      }
    }
    super.dispose();
  }

  void _addMember(String teamId) {
    final list = _ctrlsByTeamId[teamId];
    if (list == null || list.length >= 5) return;
    HapticFeedback.selectionClick();
    setState(() {
      list.add(TextEditingController());
    });
  }

  void _removeMember(String teamId, int idx) {
    final list = _ctrlsByTeamId[teamId];
    if (list == null) return;
    HapticFeedback.selectionClick();
    setState(() {
      if (list.length <= 1) {
        list.first.clear();
      } else {
        final removed = list.removeAt(idx);
        removed.dispose();
      }
    });
  }

  void _save() {
    var anyPlayerAdded = false;
    final nextTeams = <Team>[];

    for (final t in widget.teams) {
      final rawList =
          (_ctrlsByTeamId[t.id] ?? const []).map((c) => c.text).toList();
      final pf = buildSquadPlayerFields(rawList);
      if (pf.players.isNotEmpty) anyPlayerAdded = true;
      nextTeams.add(
        t.copyWith(
          player1: pf.player1,
          clearPlayer1: pf.player1 == null,
          player2: pf.player2,
          clearPlayer2: pf.player2 == null,
          players: pf.players,
        ),
      );
    }

    HapticFeedback.heavyImpact();
    widget.onSave(nextTeams, _autoEnabled || anyPlayerAdded);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: DraggableScrollableSheet(
        initialChildSize: 0.88,
        minChildSize: 0.55,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, scrollCtrl) {
          return Container(
            decoration: const BoxDecoration(
              color: AppColors.sheet,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                SheetHeader(
                  title: 'Squad Team Members (Beta)',
                  subtitle:
                      'Add or edit player IGNs anytime · Plain words match stylish symbols',
                  trailing: IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(
                      Icons.close_rounded,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                Expanded(
                  child: ListView(
                    controller: scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                    children: [
                      // Auto-Result Switch
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 11,
                        ),
                        decoration: BoxDecoration(
                          color: _autoEnabled
                              ? AppColors.accentSurface
                              : AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _autoEnabled
                                ? AppColors.accentBorder
                                : AppColors.borderSubtle,
                          ),
                        ),
                        child: Row(
                          children: [
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        'Auto Result from Screenshot',
                                        style: TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      SizedBox(width: 6),
                                      StatusPill(
                                        label: 'BETA',
                                        backgroundColor: AppColors.accentSurface,
                                        borderColor: AppColors.accentBorder,
                                        textColor: AppColors.accentBright,
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: 3),
                                  Text(
                                    'Turn on anytime and add 1–5 team member IGNs per squad.',
                                    style: TextStyle(
                                      color: AppColors.textMuted,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Switch.adaptive(
                              value: _autoEnabled,
                              activeThumbColor: AppColors.accent,
                              onChanged: (v) {
                                HapticFeedback.selectionClick();
                                setState(() => _autoEnabled = v);
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      ...List.generate(widget.teams.length, (i) {
                        final team = widget.teams[i];
                        final ctrls = _ctrlsByTeamId[team.id] ?? const [];

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.borderSubtle),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      '#${(i + 1).toString().padLeft(2, '0')}',
                                      style: kTabularNumbers.copyWith(
                                        color: AppColors.textMuted,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    SquadBadge(
                                      teamName: team.name,
                                      shortCode: team.shortCode,
                                      logoUrl: team.logoUrl,
                                      size: 28,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        team.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                    if (ctrls.length < 5)
                                      TextButton.icon(
                                        style: TextButton.styleFrom(
                                          visualDensity: VisualDensity.compact,
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                        ),
                                        onPressed: () => _addMember(team.id),
                                        icon: const Icon(
                                          Icons.add_rounded,
                                          size: 15,
                                          color: AppColors.accentBright,
                                        ),
                                        label: const Text(
                                          'Add Member',
                                          style: TextStyle(
                                            color: AppColors.accentBright,
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                ...List.generate(ctrls.length, (mIdx) {
                                  final ctrl = ctrls[mIdx];
                                  return Padding(
                                    padding: EdgeInsets.only(
                                      bottom: mIdx == ctrls.length - 1 ? 0 : 6,
                                    ),
                                    child: TextField(
                                      controller: ctrl,
                                      onChanged: (_) => setState(() {}),
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      decoration: InputDecoration(
                                        hintText:
                                            'Member ${mIdx + 1} IGN (e.g. OPPY)',
                                        isDense: true,
                                        contentPadding:
                                            const EdgeInsets.symmetric(
                                          horizontal: 11,
                                          vertical: 9,
                                        ),
                                        suffixIcon: (ctrls.length > 1 ||
                                                ctrl.text.isNotEmpty)
                                            ? IconButton(
                                                visualDensity:
                                                    VisualDensity.compact,
                                                onPressed: () =>
                                                    _removeMember(team.id, mIdx),
                                                icon: const Icon(
                                                  Icons.close_rounded,
                                                  size: 16,
                                                  color: AppColors.textMuted,
                                                ),
                                              )
                                            : null,
                                      ),
                                    ),
                                  );
                                }),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
                SafeArea(
                  top: false,
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 14),
                    decoration: const BoxDecoration(
                      color: AppColors.canvas,
                      border: Border(
                        top: BorderSide(color: AppColors.borderSubtle),
                      ),
                    ),
                    child: PrimaryPillButton(
                      label: 'Save Team Members',
                      icon: Icons.check_circle_rounded,
                      expand: true,
                      onPressed: _save,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
