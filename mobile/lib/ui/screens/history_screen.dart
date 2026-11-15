import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/scoring.dart';
import '../../models/tournament_models.dart';
import '../../state/tournament_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

enum _HistoryFilter { all, live, completed }

class HistoryScreen extends StatefulWidget {
  final TournamentStore store;
  final VoidCallback onOpenMatches;
  final VoidCallback onOpenPoster;
  final VoidCallback onCreateTournament;
  final void Function(TournamentRecord record) onEditTournament;

  const HistoryScreen({
    super.key,
    required this.store,
    required this.onOpenMatches,
    required this.onOpenPoster,
    required this.onCreateTournament,
    required this.onEditTournament,
  });

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  _HistoryFilter _filter = _HistoryFilter.all;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _confirmDelete(TournamentRecord record) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete Tournament?'),
        content: Text(
          'Permanently remove "${record.name}" and all ${record.matches.length} match records from this device?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.crimson),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      HapticFeedback.mediumImpact();
      widget.store.deleteTournament(record.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchCtrl.text.trim().toLowerCase();
    final activeId = widget.store.activeTournament?.id;

    final filtered = widget.store.tournaments.where((t) {
      final isDone = t.isEnded || t.settings.isManuallyEnded;
      if (_filter == _HistoryFilter.live && isDone) return false;
      if (_filter == _HistoryFilter.completed && !isDone) return false;
      if (query.isEmpty) return true;
      final inName = t.name.toLowerCase().contains(query);
      final inTeams =
          t.teams.any((tm) => tm.name.toLowerCase().contains(query));
      return inName || inTeams;
    }).toList();

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      children: [
        const Text(
          'History',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          '${widget.store.tournaments.length} saved tournament(s) on this device',
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _searchCtrl,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText: 'Search tournaments or squads...',
            prefixIcon: const Icon(
              Icons.search_rounded,
              size: 19,
              color: AppColors.textMuted,
            ),
            suffixIcon: _searchCtrl.text.isNotEmpty
                ? IconButton(
                    onPressed: () => setState(() => _searchCtrl.clear()),
                    icon: const Icon(
                      Icons.close_rounded,
                      size: 18,
                      color: AppColors.textMuted,
                    ),
                  )
                : null,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _FilterChip(
              label: 'All',
              selected: _filter == _HistoryFilter.all,
              onTap: () => setState(() => _filter = _HistoryFilter.all),
            ),
            const SizedBox(width: 8),
            _FilterChip(
              label: 'Live',
              selected: _filter == _HistoryFilter.live,
              onTap: () => setState(() => _filter = _HistoryFilter.live),
            ),
            const SizedBox(width: 8),
            _FilterChip(
              label: 'Completed',
              selected: _filter == _HistoryFilter.completed,
              onTap: () => setState(() => _filter = _HistoryFilter.completed),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (filtered.isEmpty)
          TactileCard(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Icon(
                  Icons.inventory_2_outlined,
                  size: 32,
                  color: AppColors.textMuted,
                ),
                const SizedBox(height: 10),
                const Text(
                  'No Matching Tournaments',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Start a new lobby or clear your search filters.',
                  textAlign: TextAlign.center,
                  style:
                      TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 14),
                PrimaryPillButton(
                  label: 'New Tournament',
                  icon: Icons.add_rounded,
                  onPressed: widget.onCreateTournament,
                ),
              ],
            ),
          )
        else
          ...filtered.map((record) {
            final isCurrent = record.id == activeId;
            final isDone = record.isEnded || record.settings.isManuallyEnded;
            final completedCount =
                record.matches.where((m) => m.isCompleted).length;
            final palette = themePaletteFor(record.settings.theme);
            final computed = calculateTournamentStandings(
              record.teams,
              record.matches,
              record.settings,
            );
            final leader =
                computed.standings.isNotEmpty ? computed.standings.first : null;
            final championName = record.championTeamName ?? leader?.teamName;
            final championPts = record.championScore ?? leader?.totalPoints;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: TactileCard(
                elevated: isCurrent,
                padding: const EdgeInsets.all(16),
                borderColor: isCurrent
                    ? palette.primary.withValues(alpha: 0.45)
                    : AppColors.borderSubtle,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        StatusPill(
                          label: isDone ? 'ENDED' : 'LIVE',
                          backgroundColor: isDone
                              ? AppColors.emeraldSurface
                              : palette.primary.withValues(alpha: 0.14),
                          borderColor: isDone
                              ? const Color(0x5522C55E)
                              : palette.primary.withValues(alpha: 0.4),
                          textColor:
                              isDone ? AppColors.emerald : palette.primary,
                        ),
                        const SizedBox(width: 6),
                        StatusPill(
                          label: palette.label.toUpperCase(),
                          backgroundColor: AppColors.inputFill,
                          borderColor: AppColors.borderSubtle,
                          textColor: AppColors.textSecondary,
                        ),
                        if (isCurrent) ...[
                          const SizedBox(width: 6),
                          const StatusPill(
                            label: 'ACTIVE',
                            backgroundColor: AppColors.surfaceElevated,
                            borderColor: AppColors.borderStrong,
                            textColor: AppColors.textPrimary,
                          ),
                        ],
                        const Spacer(),
                        PopupMenuButton<String>(
                          color: AppColors.surfaceElevated,
                          icon: const Icon(
                            Icons.more_horiz_rounded,
                            color: AppColors.textSecondary,
                          ),
                          onSelected: (v) {
                            if (v == 'duplicate') {
                              HapticFeedback.mediumImpact();
                              widget.store.duplicateTournament(record.id);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Cloned "${record.name}" and set active',
                                  ),
                                ),
                              );
                            } else if (v == 'edit') {
                              widget.onEditTournament(record);
                            } else if (v == 'toggleEnd') {
                              if (isDone) {
                                widget.store.reopenTournamentById(record.id);
                              } else {
                                widget.store.endTournamentById(record.id);
                              }
                            } else if (v == 'delete') {
                              _confirmDelete(record);
                            }
                          },
                          itemBuilder: (_) => [
                            const PopupMenuItem(
                              value: 'duplicate',
                              child: Text('Duplicate for New Day'),
                            ),
                            const PopupMenuItem(
                              value: 'edit',
                              child: Text('Edit Details'),
                            ),
                            PopupMenuItem(
                              value: 'toggleEnd',
                              child: Text(
                                isDone ? 'Reopen Event' : 'Mark Completed',
                              ),
                            ),
                            const PopupMenuItem(
                              value: 'delete',
                              child: Text(
                                'Delete Tournament',
                                style: TextStyle(color: AppColors.crimson),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          width: 3,
                          height: 18,
                          decoration: BoxDecoration(
                            color: palette.primary,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            record.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${record.teams.length} squads · $completedCount/${record.matches.length} matches · ${record.createdAt}',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    if (championName != null && (championPts ?? 0) > 0) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 7,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.inputFill,
                          borderRadius: BorderRadius.circular(11),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isDone
                                  ? Icons.emoji_events_rounded
                                  : Icons.leaderboard_rounded,
                              size: 14,
                              color: palette.primary,
                            ),
                            const SizedBox(width: 7),
                            Expanded(
                              child: Text(
                                isDone
                                    ? 'Champion · $championName'
                                    : 'Current Leader · $championName',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            Text(
                              '$championPts pts',
                              style: kTabularNumbers.copyWith(
                                color: palette.primary,
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: SecondaryPillButton(
                            label: isCurrent ? 'Open Lobby' : 'Switch & Open',
                            icon: Icons.login_rounded,
                            onPressed: () {
                              widget.store.switchActiveTournament(record.id);
                              widget.onOpenMatches();
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: SecondaryPillButton(
                            label: 'Poster',
                            icon: Icons.photo_library_outlined,
                            onPressed: () {
                              widget.store.switchActiveTournament(record.id);
                              widget.onOpenPoster();
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
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
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOutCubic,
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
