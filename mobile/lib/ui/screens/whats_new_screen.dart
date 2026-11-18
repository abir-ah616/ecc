import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../state/tournament_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class WhatsNewScreen extends StatelessWidget {
  final TournamentStore store;
  final VoidCallback onOpenMatches;
  final VoidCallback onOpenPoster;
  final VoidCallback onCreateTournament;

  const WhatsNewScreen({
    super.key,
    required this.store,
    required this.onOpenMatches,
    required this.onOpenPoster,
    required this.onCreateTournament,
  });

  @override
  Widget build(BuildContext context) {
    final hasActive = store.activeTournament != null;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF1A1510), Color(0xFF111520)],
              ),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppColors.accentBorder),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x33000000),
                  blurRadius: 20,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.accentSurface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.accentBorder),
                      ),
                      child: const Text(
                        'ESPCALC v1.1',
                        style: TextStyle(
                          color: AppColors.accentBright,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'com.mroppy.espcalc',
                        textAlign: TextAlign.end,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Text(
                  "What's New",
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 25,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Faster step-by-step live scoring, AI screenshot standings extraction, and expanded broadcast poster styles.',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: PrimaryPillButton(
                        label: hasActive ? 'Open Scorecard' : 'New Tournament',
                        icon: Icons.bolt_rounded,
                        onPressed: () {
                          HapticFeedback.mediumImpact();
                          if (hasActive) {
                            onOpenMatches();
                          } else {
                            onCreateTournament();
                          }
                        },
                      ),
                    ),
                    if (hasActive) ...[
                      const SizedBox(width: 10),
                      SecondaryPillButton(
                        label: 'Themes',
                        icon: Icons.palette_outlined,
                        onPressed: () {
                          HapticFeedback.selectionClick();
                          onOpenPoster();
                        },
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const _FeatureHighlightCard(
            badge: 'AI · BETA',
            badgeColor: Color(0xFF38BDF8),
            icon: Icons.document_scanner_rounded,
            title: 'AI Auto Detect',
            description:
                'Snap or pick a match-end standings screenshot to automatically map team placements and eliminations cleanly into your match scorecard.',
            bullets: [
              'Reads placements & kill totals straight from match screenshots',
              'Matches squad names directly to your tournament roster',
              'Editable immediately inside Team List after detection',
            ],
          ),
          const SizedBox(height: 12),
          const _FeatureHighlightCard(
            badge: 'NEW WORKFLOW',
            badgeColor: AppColors.accentBright,
            icon: Icons.bolt_rounded,
            title: 'New Rapid Mode Point Enter',
            description:
                'Starts by asking "Which team took Booyah?" with oversized tap cards. Tapping a squad animates it into the spotlight as a simple "Total Kills?" keypad slides up from the bottom.',
            bullets: [
              'One clean question at a time: Booyah, 2nd, 3rd, through final rank',
              'Built-in Reverse & Redo buttons fix mistakes without restarting',
              'Switch straight into normal Team List anytime to review or edit',
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0x26A855F7),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0x66A855F7)),
                      ),
                      child: const Icon(
                        Icons.palette_rounded,
                        size: 20,
                        color: Color(0xFFD8B4FE),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0x26A855F7),
                              borderRadius: BorderRadius.circular(5),
                            ),
                            child: Text(
                              '${broadcastThemePalettes.length} STYLES',
                              style: const TextStyle(
                                color: Color(0xFFD8B4FE),
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.7,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'More Themes',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 16.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'Three new high-contrast broadcast poster styles — Inferno Blaze, Obsidian Noir, and Royal Amethyst — added alongside all 7 signature themes.',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12.8,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final theme in broadcastThemePalettes)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
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
                            Container(
                              width: 11,
                              height: 11,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: [theme.primary, theme.secondary],
                                ),
                              ),
                            ),
                            const SizedBox(width: 7),
                            Text(
                              theme.label,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureHighlightCard extends StatelessWidget {
  final String badge;
  final Color badgeColor;
  final IconData icon;
  final String title;
  final String description;
  final List<String> bullets;

  const _FeatureHighlightCard({
    required this.badge,
    required this.badgeColor,
    required this.icon,
    required this.title,
    required this.description,
    required this.bullets,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: badgeColor.withValues(alpha: 0.4)),
                ),
                child: Icon(icon, size: 20, color: badgeColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Text(
                        badge,
                        style: TextStyle(
                          color: badgeColor,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.7,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            description,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12.8,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 12),
          for (int i = 0; i < bullets.length; i++) ...[
            if (i > 0) const SizedBox(height: 6),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Container(
                    width: 5,
                    height: 5,
                    decoration: BoxDecoration(
                      color: badgeColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: Text(
                    bullets[i],
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 12.2,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
