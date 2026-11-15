import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/scoring.dart';
import '../../models/tournament_models.dart';
import '../../state/tournament_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class RulesScreen extends StatefulWidget {
  final TournamentStore store;

  const RulesScreen({super.key, required this.store});

  @override
  State<RulesScreen> createState() => _RulesScreenState();
}

class _RulesScreenState extends State<RulesScreen> {
  bool _showAll20 = false;

  void _applyPreset(List<int> placements, int kills) {
    HapticFeedback.mediumImpact();
    widget.store.updateDefaultPointSystem(
      PointSystemConfig(
        placementPoints: List<int>.from(placements),
        killPoints: kills,
      ),
    );
  }

  void _updateRankPoint(int index, int value) {
    final next = List<int>.from(widget.store.defaultPointSystem.placementPoints);
    if (index >= 0 && index < next.length) {
      next[index] = value < 0 ? 0 : value;
      widget.store.updateDefaultPointSystem(
        widget.store.defaultPointSystem.copyWith(placementPoints: next),
      );
    }
  }

  void _adjustKillPoints(int delta) {
    HapticFeedback.selectionClick();
    final next = widget.store.defaultPointSystem.killPoints + delta;
    widget.store.updateDefaultPointSystem(
      widget.store.defaultPointSystem.copyWith(
        killPoints: next < 0 ? 0 : next,
      ),
    );
  }

  bool _isOfficialPreset(PointSystemConfig cfg) {
    return cfg.killPoints == 1 &&
        cfg.placementPoints.length >= 10 &&
        cfg.placementPoints[0] == 12 &&
        cfg.placementPoints[1] == 9 &&
        cfg.placementPoints[9] == 1;
  }

  bool _isClassic20(PointSystemConfig cfg) {
    return cfg.killPoints == 1 &&
        cfg.placementPoints.length >= 11 &&
        cfg.placementPoints[0] == 20 &&
        cfg.placementPoints[1] == 17 &&
        cfg.placementPoints[10] == 1;
  }

  @override
  Widget build(BuildContext context) {
    final config = widget.store.defaultPointSystem;
    final count = _showAll20 ? 20 : 12;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        title: const Text(
          'Scoring Rules',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: StatusPill(
                label: 'Auto-saved',
                backgroundColor: AppColors.emeraldSurface,
                borderColor: AppColors.emerald.withValues(alpha: 0.45),
                textColor: AppColors.emerald,
              ),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 36),
        physics: const BouncingScrollPhysics(),
        children: [
          const Text(
            'SCORING PRESETS',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 10),
          TactileCard(
            onTap: () => _applyPreset(defaultPlacementPoints, 1),
            borderColor: _isOfficialPreset(config)
                ? AppColors.accentBorder
                : AppColors.borderSubtle,
            backgroundColor: _isOfficialPreset(config)
                ? AppColors.accentSurface
                : AppColors.surface,
            child: Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Official 12-Point (FFWS Standard)',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        '#1 = 12 pts · #2 = 9 · #3 = 8 ... #10 = 1 · 1 pt/kill',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                if (_isOfficialPreset(config))
                  const StatusPill(
                    label: 'Active',
                    backgroundColor: AppColors.accent,
                    borderColor: AppColors.accent,
                    textColor: AppColors.inkOnAccent,
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          TactileCard(
            onTap: () => _applyPreset(classic20PlacementPoints, 1),
            borderColor: _isClassic20(config)
                ? AppColors.accentBorder
                : AppColors.borderSubtle,
            backgroundColor: _isClassic20(config)
                ? AppColors.accentSurface
                : AppColors.surface,
            child: Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Classic 20-Point Scrim',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        '#1 = 20 pts · #2 = 17 · #3 = 15 ... #11 = 1 · 1 pt/kill',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                if (_isClassic20(config))
                  const StatusPill(
                    label: 'Active',
                    backgroundColor: AppColors.accent,
                    borderColor: AppColors.accent,
                    textColor: AppColors.inkOnAccent,
                  ),
              ],
            ),
          ),

          const SizedBox(height: 22),
          const Text(
            'ELIMINATION POINTS',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 10),
          TactileCard(
            child: Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Points per Kill',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Awarded per elimination in a match',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.inputFill,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.borderStrong),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => _adjustKillPoints(-1),
                        icon: const Icon(Icons.remove_rounded, size: 18),
                      ),
                      SizedBox(
                        width: 28,
                        child: Center(
                          child: Text(
                            '${config.killPoints}',
                            style: kTabularNumbers.copyWith(
                              color: AppColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => _adjustKillPoints(1),
                        icon: const Icon(Icons.add_rounded, size: 18),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 22),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'PLACEMENT POINTS BY RANK',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.0,
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _showAll20 = !_showAll20),
                child: Text(
                  _showAll20 ? 'Show 1-12' : 'Show All 20',
                  style: const TextStyle(
                    color: AppColors.accentBright,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.55,
            ),
            itemCount: count,
            itemBuilder: (context, index) {
              final pts = index < config.placementPoints.length
                  ? config.placementPoints[index]
                  : 0;
              return TactileCard(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                borderRadius: 14,
                borderColor: index == 0
                    ? AppColors.accentBorder
                    : AppColors.borderSubtle,
                onTap: () => _promptRankPointEdit(context, index, pts),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      index == 0 ? '#1 Booyah' : '#${index + 1}',
                      style: TextStyle(
                        color: index == 0
                            ? AppColors.accentBright
                            : AppColors.textSecondary,
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      '$pts pts',
                      style: kTabularNumbers.copyWith(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),

          const SizedBox(height: 22),
          const Text(
            'TIE-BREAKER HIERARCHY',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 10),
          TactileCard(
            child: Column(
              children: const [
                _TieItem(rank: '1', label: 'Highest Cumulative Total Points'),
                Divider(height: 18),
                _TieItem(rank: '2', label: 'Most Booyahs (1st Place Finishes)'),
                Divider(height: 18),
                _TieItem(rank: '3', label: 'Highest Placement Points'),
                Divider(height: 18),
                _TieItem(rank: '4', label: 'Highest Total Eliminations'),
                Divider(height: 18),
                _TieItem(rank: '5', label: 'Best Last-Match Placement'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _promptRankPointEdit(
    BuildContext context,
    int index,
    int currentVal,
  ) async {
    final controller = TextEditingController(text: '$currentVal');
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SheetHeader(
              title: 'Rank #${index + 1} Placement Points',
              subtitle: 'Points awarded for finishing #${index + 1}',
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  TextField(
                    controller: controller,
                    autofocus: true,
                    keyboardType: TextInputType.number,
                    style: kTabularNumbers.copyWith(
                      color: AppColors.textPrimary,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  PrimaryPillButton(
                    label: 'Save Points',
                    expand: true,
                    onPressed: () {
                      final parsed = int.tryParse(controller.text.trim()) ?? 0;
                      _updateRankPoint(index, parsed);
                      Navigator.of(ctx).pop();
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
    controller.dispose();
  }
}

class _TieItem extends StatelessWidget {
  final String rank;
  final String label;

  const _TieItem({required this.rank, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: AppColors.surfaceElevated,
            borderRadius: BorderRadius.circular(7),
          ),
          child: Center(
            child: Text(
              rank,
              style: kTabularNumbers.copyWith(
                color: AppColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
