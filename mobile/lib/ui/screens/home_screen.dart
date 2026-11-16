import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/tournament_models.dart';
import '../../state/auth_state.dart';
import '../../state/tournament_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class HomeScreen extends StatelessWidget {
  final TournamentStore store;
  final AuthStore authStore;
  final VoidCallback onCreateTournament;
  final VoidCallback onOpenMatches;
  final void Function(String matchId) onOpenMatch;
  final VoidCallback onOpenPoster;
  final VoidCallback onOpenHistory;
  final VoidCallback onOpenRules;
  final VoidCallback onOpenTemplates;
  final void Function(TournamentRecord record) onEditEvent;
  final VoidCallback onOpenJson;
  final VoidCallback onOpenAccountSheet;

  const HomeScreen({
    super.key,
    required this.store,
    required this.authStore,
    required this.onCreateTournament,
    required this.onOpenMatches,
    required this.onOpenMatch,
    required this.onOpenPoster,
    required this.onOpenHistory,
    required this.onOpenRules,
    required this.onOpenTemplates,
    required this.onEditEvent,
    required this.onOpenJson,
    required this.onOpenAccountSheet,
  });

  @override
  Widget build(BuildContext context) {
    final active = store.activeTournament;
    final user = authStore.firebaseUser;
    final initial =
        (user?.displayName ?? user?.email ?? 'O').trim().isNotEmpty
            ? (user?.displayName ?? user?.email ?? 'O')
                .trim()
                .substring(0, 1)
                .toUpperCase()
            : 'O';
    final recentProjects = store.tournaments.take(2).toList();

    return CustomScrollView(
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      slivers: [
        SliverToBoxAdapter(
          child: _HeroBackdropSection(
            initial: initial,
            photoUrl: user?.photoURL,
            onOpenAccountSheet: onOpenAccountSheet,
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 2, 16, 114),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              _CreateTournamentBanner(onTap: onCreateTournament),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _FeatureStudioTile(
                      icon: Icons.image_outlined,
                      title: 'Poster Studio',
                      subtitle: 'Generate standings\n& match graphics',
                      onTap: onOpenPoster,
                    ),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: _FeatureStudioTile(
                      icon: Icons.emoji_events_outlined,
                      title: 'Score System',
                      subtitle: 'Customize points\nand rules',
                      onTap: onOpenRules,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 9),
              Row(
                children: [
                  Expanded(
                    child: _FeatureStudioTile(
                      icon: Icons.layers_outlined,
                      title: 'Templates',
                      subtitle: 'Ready-made\ntournament layouts',
                      onTap: onOpenTemplates,
                    ),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: _FeatureStudioTile(
                      icon: Icons.tune_rounded,
                      title: 'Settings',
                      subtitle: 'App preferences\nand export options',
                      onTap: onOpenAccountSheet,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _LiveTournamentBannerCard(
                active: active,
                onTap: active != null ? onOpenMatches : onCreateTournament,
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Recent Projects',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.2,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onOpenHistory();
                    },
                    behavior: HitTestBehavior.opaque,
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'View All',
                            style: TextStyle(
                              color: AppColors.accent,
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          SizedBox(width: 2),
                          Icon(
                            Icons.chevron_right_rounded,
                            size: 16,
                            color: AppColors.accent,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (recentProjects.isEmpty)
                _EmptyRecentCard(onTap: onCreateTournament)
              else
                ...List.generate(recentProjects.length, (index) {
                  final record = recentProjects[index];
                  final isActive = active?.id == record.id;
                  return Padding(
                    padding: EdgeInsets.only(
                      bottom: index == recentProjects.length - 1 ? 0 : 10,
                    ),
                    child: _RecentProjectTile(
                      record: record,
                      index: index,
                      isActive: isActive,
                      onOpen: () {
                        HapticFeedback.selectionClick();
                        store.switchActiveTournament(record.id);
                        onOpenMatches();
                      },
                      onOpenPoster: () {
                        HapticFeedback.selectionClick();
                        store.switchActiveTournament(record.id);
                        onOpenPoster();
                      },
                      onEdit: () => onEditEvent(record),
                      onDelete: () => _confirmDelete(context, record),
                    ),
                  );
                }),
              const SizedBox(height: 20),
              const _StudioFooterColophon(),
            ]),
          ),
        ),
      ],
    );
  }

  Future<void> _confirmDelete(
    BuildContext context,
    TournamentRecord record,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.sheet,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.borderStrong),
        ),
        title: const Text(
          'Delete Project?',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w800,
          ),
        ),
        content: Text(
          'Remove "${record.name}" from saved tournaments? This cannot be undone.',
          style: const TextStyle(color: AppColors.textSecondary, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.crimson,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      store.deleteTournament(record.id);
    }
  }
}

class _HeroBackdropSection extends StatelessWidget {
  final String initial;
  final String? photoUrl;
  final VoidCallback onOpenAccountSheet;

  const _HeroBackdropSection({
    required this.initial,
    this.photoUrl,
    required this.onOpenAccountSheet,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Stack(
        children: [
          Positioned.fill(
            child: ClipRect(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Align(
                    alignment: Alignment.topRight,
                    child: FractionallySizedBox(
                      widthFactor: 0.92,
                      heightFactor: 1.0,
                      child: Image.asset(
                        'assets/images/hero_character.jpg',
                        fit: BoxFit.cover,
                        alignment: const Alignment(0.35, -0.3),
                        cacheWidth: 850,
                        gaplessPlayback: true,
                        filterQuality: FilterQuality.medium,
                        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                      ),
                    ),
                  ),
                // Left obsidian readability scrim & top vignette
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [
                        AppColors.canvas,
                        AppColors.canvas.withValues(alpha: 0.95),
                        AppColors.canvas.withValues(alpha: 0.48),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.36, 0.64, 1.0],
                    ),
                  ),
                ),
      // Bottom melt into canvas
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0x8C090B0F),
                        Colors.transparent,
                        Color(0xA6090B0F),
                        AppColors.canvas,
                      ],
                      stops: [0.0, 0.25, 0.78, 1.0],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const EspCalcLogoMark(size: 40),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ESP CALC',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.2,
                            height: 1.05,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'BROADCAST STUDIO',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Color(0xFFB4BDCE),
                            fontSize: 9.5,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 3.1,
                            height: 1.0,
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onOpenAccountSheet();
                    },
                    child: OrganizerAvatar(
                      initial: initial,
                      photoUrl: photoUrl,
                      size: 36,
                      showRing: true,
                      showCrown: false,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  const Text(
                    'TOURNAMENT GRAPHICS',
                    style: TextStyle(
                      color: Color(0xFFB4BDCE),
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 2.0,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    width: 24,
                    height: 2,
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 265),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Create Professional',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                        height: 1.14,
                      ),
                    ),
                    Text(
                      'Esports Graphics',
                      style: TextStyle(
                        color: AppColors.accent,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        fontStyle: FontStyle.italic,
                        letterSpacing: -0.4,
                        height: 1.15,
                        shadows: [
                          Shadow(
                            color: AppColors.accent.withValues(alpha: 0.35),
                            blurRadius: 16,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Standings, Match Results, and More —\nAll in One Place.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    ),
    );
  }
}

class _CreateTournamentBanner extends StatelessWidget {
  final VoidCallback onTap;

  const _CreateTournamentBanner({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.accentBright.withValues(alpha: 0.72),
            const Color(0xFF6B4416),
            AppColors.accent.withValues(alpha: 0.78),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.accent.withValues(alpha: 0.18),
            blurRadius: 22,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(1.25),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(15),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.mediumImpact();
            onTap();
          },
          borderRadius: BorderRadius.circular(15),
          child: Ink(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF21170C),
                  Color(0xFF14151D),
                  Color(0xFF22160A),
                ],
                stops: [0.0, 0.55, 1.0],
              ),
            ),
            child: Stack(
              children: [
                // Bottom-right amber ember corner flare matching reference mockup
                Positioned(
                  right: -12,
                  bottom: -22,
                  child: Container(
                    width: 110,
                    height: 55,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(60),
                      gradient: RadialGradient(
                        colors: [
                          AppColors.accent.withValues(alpha: 0.42),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 13,
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(11),
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Color(0xFFFBBF24),
                              Color(0xFFF59E0B),
                              Color(0xFFD97706),
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.accent.withValues(alpha: 0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.add_rounded,
                          color: Color(0xFF090B0F),
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Create Tournament',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.2,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Start a new event',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: Color(0xFFCBD5E1),
                                fontSize: 12,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: Color(0xFFCBD5E1),
                        size: 22,
                      ),
                    ],
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

class _FeatureStudioTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _FeatureStudioTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF473722),
            Color(0xFF232735),
            Color(0xFF3A2D1D),
          ],
        ),
      ),
      padding: const EdgeInsets.all(1),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(13),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          borderRadius: BorderRadius.circular(13),
          child: Ink(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF171820),
                  Color(0xFF10131A),
                ],
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  left: -18,
                  bottom: -24,
                  child: Container(
                    width: 84,
                    height: 60,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(42),
                      gradient: RadialGradient(
                        colors: [
                          AppColors.accent.withValues(alpha: 0.16),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 13,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: const Color(0xFF231A10),
                          border: Border.all(
                            color: AppColors.accent.withValues(alpha: 0.36),
                          ),
                        ),
                        child: Icon(
                          icon,
                          size: 20,
                          color: AppColors.accentBright,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              subtitle,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 10.5,
                                height: 1.25,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
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

class _LiveTournamentBannerCard extends StatelessWidget {
  final TournamentRecord? active;
  final VoidCallback onTap;

  const _LiveTournamentBannerCard({
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasActive = active != null;
    final isEnded = active?.isEnded ?? false;
    final modeLabel = active?.settings.mode == TournamentMode.championRush
        ? 'Champion Rush'
        : 'Scrim Series';
    final squadCount = active?.teams.length ?? 12;
    final matchCount = active?.matches.length ?? 0;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFF3E3021),
            const Color(0xFF252936),
            AppColors.accent.withValues(alpha: 0.52),
          ],
        ),
      ),
      padding: const EdgeInsets.all(1),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(15),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          borderRadius: BorderRadius.circular(15),
          child: SizedBox(
            height: 112,
            child: Stack(
              fit: StackFit.expand,
              children: [
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF151821),
                        Color(0xFF0E1017),
                      ],
                    ),
                  ),
                ),
                // Right-aligned crystal trophy artwork seamlessly blended left
                Positioned(
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 158,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.asset(
                        'assets/images/crystal_trophy.jpg',
                        fit: BoxFit.cover,
                        alignment: Alignment.center,
                        cacheWidth: 300,
                        gaplessPlayback: true,
                        filterQuality: FilterQuality.low,
                        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                      ),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                            colors: [
                              Color(0xFF12151E),
                              Color(0xCC12151E),
                              Colors.transparent,
                            ],
                            stops: [0.0, 0.28, 0.72],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 13, 14, 13),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: hasActive && !isEnded
                                        ? const Color(0xFF4C1418)
                                        : const Color(0xFF282012),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: hasActive && !isEnded
                                          ? const Color(0xFFDC2626)
                                              .withValues(alpha: 0.75)
                                          : AppColors.accent
                                              .withValues(alpha: 0.55),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 6,
                                        height: 6,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: hasActive && !isEnded
                                              ? const Color(0xFFEF4444)
                                              : AppColors.accentBright,
                                        ),
                                      ),
                                      const SizedBox(width: 5),
                                      Text(
                                        hasActive
                                            ? (isEnded ? 'FINAL' : 'LIVE')
                                            : 'STANDBY',
                                        style: const TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    hasActive
                                        ? active!.settings.roundOrDay
                                            .toUpperCase()
                                        : 'NO ACTIVE LOBBY',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Color(0xFFCBD5E1),
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 1.3,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (hasActive)
                              _KineticEventTitle(title: active!.name)
                            else
                              const Text(
                                'Ready for Match Day',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  fontStyle: FontStyle.italic,
                                  letterSpacing: -0.3,
                                ),
                              ),
                            const SizedBox(height: 5),
                            Text(
                              hasActive
                                  ? '$modeLabel  ·  $squadCount Squads  ·  $matchCount ${matchCount == 1 ? 'Match' : 'Matches'}'
                                  : 'Create a tournament to start scoring',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: Color(0xFFCBD5E1),
                        size: 22,
                      ),
                    ],
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

class _KineticEventTitle extends StatelessWidget {
  final String title;

  const _KineticEventTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    final normalized = title.trim().isEmpty
        ? 'TOURNAMENT'
        : title.trim().toUpperCase();
    final parts = normalized.split(RegExp(r'\s+'));
    String lead;
    String tail;
    if (parts.length <= 1) {
      lead = normalized;
      tail = '';
    } else if (parts.length == 2) {
      lead = parts.first;
      tail = ' ${parts.last}';
    } else {
      final splitAt = parts.length > 3 ? parts.length - 2 : parts.length - 1;
      lead = parts.sublist(0, splitAt).join(' ');
      tail = ' ${parts.sublist(splitAt).join(' ')}';
    }

    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: RichText(
        maxLines: 1,
        text: TextSpan(
          children: [
            TextSpan(
              text: lead,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18.5,
                fontWeight: FontWeight.w900,
                fontStyle: FontStyle.italic,
                letterSpacing: -0.3,
              ),
            ),
            if (tail.isNotEmpty)
              TextSpan(
                text: tail,
                style: const TextStyle(
                  color: AppColors.accent,
                  fontSize: 18.5,
                  fontWeight: FontWeight.w900,
                  fontStyle: FontStyle.italic,
                  letterSpacing: -0.3,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _RecentProjectTile extends StatelessWidget {
  final TournamentRecord record;
  final int index;
  final bool isActive;
  final VoidCallback onOpen;
  final VoidCallback onOpenPoster;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _RecentProjectTile({
    required this.record,
    required this.index,
    required this.isActive,
    required this.onOpen,
    required this.onOpenPoster,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final palette = themePaletteFor(record.settings.theme);
    final thumbLabel = index.isEven ? 'OVERALL\nSTANDINGS' : 'MATCH\nRESULTS';

    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: const Color(0xFF11141C),
            border: Border.all(
              color: isActive
                  ? AppColors.accent.withValues(alpha: 0.42)
                  : AppColors.borderSubtle,
            ),
          ),
          child: Row(
            children: [
              // Stylized broadcast thumbnail preview colored by event theme
              Container(
                width: 96,
                height: 52,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(9),
                  gradient: palette.preset == ThemePreset.whiteout
                      ? const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xFFFFFFFF),
                            Color(0xFFE2E8F0),
                            Color(0xFFDC142C),
                          ],
                        )
                      : LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            palette.secondary.withValues(alpha: 0.9),
                            const Color(0xFF121318),
                            palette.primary.withValues(alpha: 0.78),
                          ],
                        ),
                  border: Border.all(
                    color: palette.preset == ThemePreset.whiteout
                        ? const Color(0x88DC142C)
                        : palette.primary.withValues(alpha: 0.45),
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Positioned(
                      right: -14,
                      top: -10,
                      child: Transform.rotate(
                        angle: -0.35,
                        child: Container(
                          width: 42,
                          height: 80,
                          color: palette.preset == ThemePreset.whiteout
                              ? const Color(0x33DC142C)
                              : Colors.white.withValues(alpha: 0.08),
                        ),
                      ),
                    ),
                    Center(
                      child: Text(
                        thumbLabel,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: palette.preset == ThemePreset.whiteout
                              ? const Color(0xFF111318)
                              : Colors.white,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w900,
                          fontStyle: FontStyle.italic,
                          height: 1.08,
                          letterSpacing: 0.2,
                          shadows: palette.preset == ThemePreset.whiteout
                              ? null
                              : const [
                                  Shadow(color: Colors.black87, blurRadius: 8),
                                ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      record.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.1,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _formatProjectSubtitle(record),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: onOpen,
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A1E29),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.borderStrong),
                  ),
                  child: const Icon(
                    Icons.open_in_new_rounded,
                    size: 16,
                    color: Color(0xFFCBD5E1),
                  ),
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(
                  Icons.more_vert_rounded,
                  size: 19,
                  color: AppColors.textSecondary,
                ),
                color: AppColors.surfaceElevated,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: const BorderSide(color: AppColors.borderStrong),
                ),
                onSelected: (value) {
                  switch (value) {
                    case 'open':
                      onOpen();
                      break;
                    case 'poster':
                      onOpenPoster();
                      break;
                    case 'edit':
                      onEdit();
                      break;
                    case 'delete':
                      onDelete();
                      break;
                  }
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(
                    value: 'open',
                    child: Text(
                      'Open Lobby',
                      style: TextStyle(color: AppColors.textPrimary),
                    ),
                  ),
                  PopupMenuItem(
                    value: 'poster',
                    child: Text(
                      'Poster Studio',
                      style: TextStyle(color: AppColors.textPrimary),
                    ),
                  ),
                  PopupMenuItem(
                    value: 'edit',
                    child: Text(
                      'Edit Event',
                      style: TextStyle(color: AppColors.textPrimary),
                    ),
                  ),
                  PopupMenuItem(
                    value: 'delete',
                    child: Text(
                      'Delete',
                      style: TextStyle(color: AppColors.crimson),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatProjectSubtitle(TournamentRecord record) {
    if (record.createdAtTimestamp > 0) {
      final dt = DateTime.fromMillisecondsSinceEpoch(record.createdAtTimestamp);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Updated just now';
      if (diff.inMinutes < 60) return 'Updated ${diff.inMinutes}m ago';
      if (diff.inHours < 24) {
        final h = diff.inHours;
        return 'Updated $h ${h == 1 ? 'hour' : 'hours'} ago';
      }
      if (diff.inDays == 1) return 'Updated yesterday';
      if (diff.inDays < 7) return 'Updated ${diff.inDays} days ago';
    }
    return '${record.teams.length} Squads · ${record.matches.length} Matches';
  }
}

class _EmptyRecentCard extends StatelessWidget {
  final VoidCallback onTap;

  const _EmptyRecentCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: const Color(0xFF11141C),
            border: Border.all(color: AppColors.borderSubtle),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: AppColors.surfaceElevated,
                  border: Border.all(color: AppColors.borderStrong),
                ),
                child: const Icon(
                  Icons.history_rounded,
                  color: AppColors.textSecondary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'No recent tournaments yet',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Your created lobbies and graphics appear here',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StudioFooterColophon extends StatelessWidget {
  const _StudioFooterColophon();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          height: 1,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.transparent,
                AppColors.borderStrong.withValues(alpha: 0.7),
                Colors.transparent,
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'MADE BY MR. OPPY',
          style: TextStyle(
            color: AppColors.accentBright,
            fontSize: 10.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.6,
          ),
        ),
      ],
    );
  }
}
