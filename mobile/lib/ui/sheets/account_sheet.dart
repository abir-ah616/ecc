import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../state/auth_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class AccountSheet extends StatelessWidget {
  final AuthStore authStore;
  final VoidCallback onOpenJson;
  final VoidCallback onOpenRules;
  final VoidCallback onOpenAdmin;
  final VoidCallback onOpenWhatsNew;

  const AccountSheet({
    super.key,
    required this.authStore,
    required this.onOpenJson,
    required this.onOpenRules,
    required this.onOpenAdmin,
    required this.onOpenWhatsNew,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: authStore,
      builder: (context, _) {
        final user = authStore.firebaseUser;
        final record = authStore.allowedRecord;
        final displayName = record?.displayName.isNotEmpty == true
            ? record!.displayName
            : (user?.displayName ?? 'Organizer');
        final email = user?.email ?? record?.email ?? 'Signed out';

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SheetHeader(
                  title: 'Organizer Workspace',
                  subtitle: 'Verified cloud session & device tools',
                ),
                const SizedBox(height: 16),
                TactileCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      OrganizerAvatar(
                        initial: displayName,
                        photoUrl: user?.photoURL,
                        size: 48,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    displayName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                StatusPill(
                                  label:
                                      authStore.isAdmin ? 'ADMIN' : 'ORGANIZER',
                                  backgroundColor: AppColors.accentSurface,
                                  borderColor: AppColors.accentBorder,
                                  textColor: AppColors.accentBright,
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              email,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                _SheetTile(
                  icon: Icons.tune_rounded,
                  title: 'Scoring Matrix & Rules',
                  subtitle: 'Customize placement points and kill multipliers',
                  onTap: () {
                    Navigator.pop(context);
                    onOpenRules();
                  },
                ),
                const SizedBox(height: 8),
                _SheetTile(
                  icon: Icons.new_releases_rounded,
                  title: "What's New in v1.1",
                  subtitle: 'AI Auto Detect, Rapid Point Enter & More Themes',
                  accent: true,
                  onTap: () {
                    Navigator.pop(context);
                    onOpenWhatsNew();
                  },
                ),
                const SizedBox(height: 8),
                _SheetTile(
                  icon: Icons.data_object_rounded,
                  title: 'JSON Backup & Restore',
                  subtitle: 'Export tournaments or restore saved data',
                  onTap: () {
                    Navigator.pop(context);
                    onOpenJson();
                  },
                ),
                if (authStore.isAdmin) ...[
                  const SizedBox(height: 8),
                  _SheetTile(
                    icon: Icons.verified_user_outlined,
                    title: 'Admin & AI Management (${authStore.allUsers.length})',
                    subtitle: 'Manage accounts, AI Beta access & per-user API keys',
                    accent: true,
                    onTap: () {
                      Navigator.pop(context);
                      onOpenAdmin();
                    },
                  ),
                ],
                const SizedBox(height: 16),

                SecondaryPillButton(
                  label: 'Sign Out',
                  icon: Icons.logout_rounded,
                  textColor: AppColors.crimson,
                  borderColor: const Color(0x55EF4444),
                  expand: true,
                  onPressed: () async {
                    HapticFeedback.mediumImpact();
                    Navigator.pop(context);
                    await authStore.logout();
                  },
                ),
                const SizedBox(height: 14),
                const Text(
                  'ESPCALC STUDIO · MADE BY MR. OPPY',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.0,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _SheetTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool accent;
  final VoidCallback onTap;

  const _SheetTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.accent = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return TactileCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      borderColor: accent ? AppColors.accentBorder : AppColors.borderSubtle,
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: accent ? AppColors.accentSurface : AppColors.inputFill,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(
              icon,
              size: 19,
              color: accent ? AppColors.accentBright : AppColors.textPrimary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.chevron_right_rounded,
            size: 20,
            color: AppColors.textMuted,
          ),
        ],
      ),
    );
  }
}
