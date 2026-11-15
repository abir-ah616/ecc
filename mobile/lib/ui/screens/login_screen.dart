import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../state/auth_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class LoginScreen extends StatelessWidget {
  final AuthStore authStore;

  const LoginScreen({super.key, required this.authStore});

  @override
  Widget build(BuildContext context) {
    final user = authStore.firebaseUser;

    // Signed into Google, but not allowlisted / disabled
    if (user != null && !authStore.isAllowed && !authStore.isLoading) {
      return Scaffold(
        backgroundColor: AppColors.canvas,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: AppColors.crimsonSurface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.crimson.withValues(alpha: 0.4),
                    ),
                  ),
                  child: const Icon(
                    Icons.shield_outlined,
                    color: AppColors.crimson,
                    size: 28,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Access Restricted',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 6),
                const Text(
                  'Your Google account is signed in, but is not currently authorized on the organizer allowlist.',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                TactileCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'SIGNED IN ACCOUNT',
                        style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.9,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        user.email ?? 'Unknown email',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Divider(),
                      const SizedBox(height: 10),
                      const Text(
                        'Ask an administrator to authorize this email in Admin Access Control, or switch Google accounts.',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    Expanded(
                      child: SecondaryPillButton(
                        label: 'Sign Out',
                        icon: Icons.logout_rounded,
                        onPressed: authStore.logout,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: PrimaryPillButton(
                        label: 'Switch Account',
                        icon: Icons.swap_horiz_rounded,
                        onPressed: () {
                          authStore.clearAuthError();
                          authStore.signInWithGoogle();
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: Stack(
        children: [
          const Positioned.fill(
            child: AmbientBackdrop(
              accentColor: AppColors.accent,
              intensity: 0.1,
            ),
          ),
          const Positioned.fill(
            child: IgnorePointer(
              child: RepaintBoundary(
                child: CustomPaint(painter: _GridBackdropPainter()),
              ),
            ),
          ),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final showShowcase = constraints.maxHeight >= 630;
                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight,
                    ),
                    child: IntrinsicHeight(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 12),
                            // Minimal brand emblem
                            const Row(
                              children: [
                                EspCalcLogoMark(size: 46),
                                SizedBox(width: 14),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'ESP CALC',
                                      style: TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 18,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: -0.3,
                                      ),
                                    ),
                                    Text(
                                      'Mobile Standings Studio',
                                      style: TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            if (showShowcase) ...[
                              const Spacer(),
                              const _StudioPreviewCard(),
                            ],
                            const Spacer(),
                            const StatusPill(
                              label: 'ORGANIZER WORKSPACE',
                              backgroundColor: AppColors.surfaceElevated,
                              borderColor: AppColors.borderStrong,
                              textColor: AppColors.textSecondary,
                              icon: Icons.lock_outline_rounded,
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Score live lobbies.\nExport broadcast\nstandings.',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 33,
                                fontWeight: FontWeight.w800,
                                height: 1.08,
                                letterSpacing: -1.1,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'Sign in with an approved Google account to manage Classic Scrim and Champion Rush tournaments on mobile.',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 14,
                                height: 1.48,
                              ),
                            ),
                            if (authStore.authError != null) ...[
                              const SizedBox(height: 16),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppColors.crimsonSurface,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: AppColors.crimson
                                        .withValues(alpha: 0.45),
                                  ),
                                ),
                                child: Text(
                                  authStore.authError!,
                                  style: const TextStyle(
                                    color: Color(0xFFFCA5A5),
                                    fontSize: 12.5,
                                    height: 1.4,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 24),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                onPressed: authStore.isLoading
                                    ? null
                                    : () {
                                        HapticFeedback.lightImpact();
                                        authStore.signInWithGoogle();
                                      },
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.textPrimary,
                                  foregroundColor: AppColors.inkOnAccent,
                                  disabledBackgroundColor: AppColors.textPrimary
                                      .withValues(alpha: 0.4),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 16,
                                  ),
                                  shape: const StadiumBorder(),
                                ),
                                child: authStore.isLoading
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.3,
                                          color: AppColors.inkOnAccent,
                                        ),
                                      )
                                    : const Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.g_mobiledata_rounded,
                                              size: 26),
                                          SizedBox(width: 8),
                                          Text(
                                            'Continue with Google',
                                            style: TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800,
                                              letterSpacing: -0.2,
                                            ),
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                            const SizedBox(height: 14),
                            const Center(
                              child: Text(
                                'Authorized Organizer Access · Made by MR. OPPY',
                                style: TextStyle(
                                  color: AppColors.textMuted,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
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
}

class _GridBackdropPainter extends CustomPainter {
  const _GridBackdropPainter();

  @override
  void paint(Canvas canvas, Size size) {
    const step = 36.0;
    final paint = Paint()
      ..color = const Color(0x08FFFFFF)
      ..strokeWidth = 1.0;

    final maxY = size.height * 0.62;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, maxY), paint);
    }
    for (double y = 0; y < maxY; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _StudioPreviewCard extends StatelessWidget {
  const _StudioPreviewCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.surfaceTop, AppColors.surface],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderStrong),
        boxShadow: const [
          BoxShadow(
            color: Color(0x66000000),
            blurRadius: 28,
            offset: Offset(0, 14),
          ),
        ],
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'GRAND FINALS · LIVE STANDINGS',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.9,
                ),
              ),
              Text(
                '2X EXPORT',
                style: TextStyle(
                  color: AppColors.accentBright,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
          SizedBox(height: 10),
          _PreviewBoardRow(
            rank: 1,
            squad: 'APEX PREDATORS',
            meta: '2W · 24K',
            points: '58',
            accent: AppColors.accentBright,
          ),
          SizedBox(height: 6),
          _PreviewBoardRow(
            rank: 2,
            squad: 'NOVA SQUAD',
            meta: '1W · 19K',
            points: '46',
            accent: Color(0xFFCBD5E1),
          ),
          SizedBox(height: 6),
          _PreviewBoardRow(
            rank: 3,
            squad: 'VORTEX ESPORTS',
            meta: '0W · 18K',
            points: '39',
            accent: Color(0xFFD97706),
          ),
        ],
      ),
    );
  }
}

class _PreviewBoardRow extends StatelessWidget {
  final int rank;
  final String squad;
  final String meta;
  final String points;
  final Color accent;

  const _PreviewBoardRow({
    required this.rank,
    required this.squad,
    required this.meta,
    required this.points,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: AppColors.inputFill,
        borderRadius: BorderRadius.circular(11),
        border: Border.all(
          color: rank == 1 ? AppColors.accentBorder : AppColors.borderSubtle,
        ),
      ),
      child: Row(
        children: [
          Text(
            '#$rank',
            style: kTabularNumbers.copyWith(
              color: accent,
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              squad,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Text(
            meta,
            style: kTabularNumbers.copyWith(
              color: AppColors.textMuted,
              fontSize: 11,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            '$points PTS',
            style: kTabularNumbers.copyWith(
              color: rank == 1 ? accent : AppColors.textPrimary,
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
