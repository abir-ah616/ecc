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
    if (!authStore.integrityTrusted) {
      return Scaffold(
        backgroundColor: AppColors.canvas,
        body: Stack(
          children: [
            const _ArenaScreenBackdrop(opacity: 0.35),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10131B),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.borderStrong),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: AppColors.crimsonSurface,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: AppColors.crimson.withValues(alpha: 0.45),
                                ),
                              ),
                              child: const Icon(
                                Icons.gpp_bad_outlined,
                                color: AppColors.crimson,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 14),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Security Check Failed',
                                    style: TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Untrusted or modified build detected',
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          authStore.integrityError ??
                              'This installation could not pass application integrity verification.',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                            height: 1.45,
                          ),
                        ),
                        const SizedBox(height: 18),
                        SizedBox(
                          width: double.infinity,
                          child: PrimaryPillButton(
                            label: 'Re-Verify Build',
                            icon: Icons.verified_user_outlined,
                            onPressed: authStore.initialize,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    final user = authStore.firebaseUser;

    // State 1: Signed into Google, but not allowlisted / disabled
    if (user != null && !authStore.isAllowed && !authStore.isLoading) {
      return Scaffold(
        backgroundColor: AppColors.canvas,
        body: Stack(
          children: [
            const _ArenaScreenBackdrop(opacity: 0.35),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10131B),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: AppColors.borderStrong,
                      ),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x99000000),
                          blurRadius: 36,
                          offset: Offset(0, 16),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: AppColors.crimsonSurface,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color:
                                      AppColors.crimson.withValues(alpha: 0.4),
                                ),
                              ),
                              child: const Icon(
                                Icons.shield_outlined,
                                color: AppColors.crimson,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 14),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Access Restricted',
                                    style: TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Account not enabled on workspace allowlist',
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        TactileCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Signed in as',
                                    style: TextStyle(
                                      color: AppColors.textMuted,
                                      fontSize: 12,
                                    ),
                                  ),
                                  Flexible(
                                    child: Text(
                                      user.email ?? 'Unknown email',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              const Divider(),
                              const SizedBox(height: 10),
                              Text(
                                authStore.authError ??
                                    'This Google account does not have organizer permission yet. Ask an administrator to authorize your email address.',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12.5,
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),
                        Row(
                          children: [
                            Expanded(
                              child: SecondaryPillButton(
                                label: 'Sign Out',
                                icon: Icons.logout_rounded,
                                onPressed: authStore.logout,
                              ),
                            ),
                            const SizedBox(width: 10),
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
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    // State 2: Default Broadcast Studio Sign In Gate (mirrors Web LoginView)
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: Stack(
        children: [
          const _ArenaScreenBackdrop(opacity: 0.45),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 20,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF0D1017),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x88000000),
                          blurRadius: 24,
                          offset: Offset(0, 12),
                        ),
                      ],
                    ),
                    foregroundDecoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: AppColors.accent.withValues(alpha: 0.28),
                        width: 1.1,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Top Atmospheric Studio Showcase (matches Web Left Panel)
                          _ShowcaseHeroPanel(),

                        // Bottom Sign-In Gate (matches Web Right Panel)
                        Container(
                          color: const Color(0xFF10131B),
                          padding: const EdgeInsets.all(22),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 11,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.accentSurface,
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(
                                    color: AppColors.accentBorder,
                                  ),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.lock_outline_rounded,
                                      size: 12,
                                      color: AppColors.accentBright,
                                    ),
                                    SizedBox(width: 6),
                                    Text(
                                      'Organizer Workspace',
                                      style: TextStyle(
                                        color: AppColors.accentBright,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'Sign in to Studio',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 21,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.4,
                                ),
                              ),
                              const SizedBox(height: 5),
                              const Text(
                                'Authorized organizer access only. Use your approved Google account to manage tournaments and export posters.',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12.5,
                                  height: 1.48,
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Two Feature Mini-Tiles matching Web grid
                              const Row(
                                children: [
                                  Expanded(
                                    child: _FeatureTile(
                                      icon: Icons.image_outlined,
                                      title: 'Poster Studio',
                                      subtitle: '16:9 & 4:5 HD exports',
                                    ),
                                  ),
                                  SizedBox(width: 10),
                                  Expanded(
                                    child: _FeatureTile(
                                      icon: Icons.tune_rounded,
                                      title: 'Champion Rush',
                                      subtitle: 'Live point engine',
                                    ),
                                  ),
                                ],
                              ),

                              if (authStore.authError != null) ...[
                                const SizedBox(height: 14),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.crimsonSurface,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: AppColors.crimson
                                          .withValues(alpha: 0.45),
                                    ),
                                  ),
                                  child: Text(
                                    authStore.authError!,
                                    style: const TextStyle(
                                      color: Color(0xFFFCA5A5),
                                      fontSize: 12,
                                      height: 1.4,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],

                              const SizedBox(height: 18),
                              _GoogleGradientButton(
                                isLoading: authStore.isLoading,
                                onPressed: () {
                                  HapticFeedback.lightImpact();
                                  authStore.signInWithGoogle();
                                },
                              ),

                              const SizedBox(height: 18),
                              Container(
                                padding: const EdgeInsets.only(top: 14),
                                decoration: const BoxDecoration(
                                  border: Border(
                                    top: BorderSide(
                                      color: Color(0x14FFFFFF),
                                    ),
                                  ),
                                ),
                                child: const Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Row(
                                        children: [
                                          Icon(
                                            Icons.verified_user_outlined,
                                            size: 14,
                                            color: AppColors.accent,
                                          ),
                                          SizedBox(width: 6),
                                          Flexible(
                                            child: Text(
                                              'Verified Broadcast Engine',
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
                                    ),
                                    SizedBox(width: 8),
                                    Text(
                                      'MADE BY MR. OPPY',
                                      style: TextStyle(
                                        color: AppColors.accentBright,
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1.1,
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
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ArenaScreenBackdrop extends StatelessWidget {
  final double opacity;

  const _ArenaScreenBackdrop({required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: IgnorePointer(
        child: RepaintBoundary(
          child: Stack(
            fit: StackFit.expand,
            children: [
              Opacity(
                opacity: opacity,
                child: Image.asset(
                  'assets/images/web_arena_bg.webp',
                  fit: BoxFit.cover,
                  cacheWidth: 900,
                  gaplessPlayback: true,
                  filterQuality: FilterQuality.low,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Color(0xFF090B0F),
                      Color(0xA6090B0F),
                      Color(0x8C090B0F),
                    ],
                    stops: [0.0, 0.55, 1.0],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShowcaseHeroPanel extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Container(
        constraints: const BoxConstraints(minHeight: 245),
        decoration: const BoxDecoration(
          color: Color(0xFF090B0F),
          border: Border(
            bottom: BorderSide(color: Color(0x14FFFFFF)),
          ),
        ),
        child: Stack(
          children: [
            Positioned.fill(
              child: Align(
                alignment: Alignment.topRight,
                child: FractionallySizedBox(
                  widthFactor: 0.88,
                  heightFactor: 1.0,
                  child: Opacity(
                    opacity: 0.88,
                    child: Image.asset(
                      'assets/images/hero_character.jpg',
                      fit: BoxFit.cover,
                      alignment: const Alignment(0.25, -0.35),
                      cacheWidth: 850,
                      gaplessPlayback: true,
                      filterQuality: FilterQuality.medium,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  ),
                ),
              ),
            ),
          // Left readability scrim
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Color(0xFF090B0F),
                    Color(0xE6090B0F),
                    Colors.transparent,
                  ],
                  stops: [0.0, 0.45, 1.0],
                ),
              ),
            ),
          ),
          // Top / Bottom vignette fade
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Color(0xFF090B0F),
                    Colors.transparent,
                    Color(0x73090B0F),
                  ],
                  stops: [0.0, 0.55, 1.0],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    EspCalcLogoMark(size: 42),
                    SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'EspCalc',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.2,
                            height: 1.05,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'BROADCAST STUDIO',
                          style: TextStyle(
                            color: Color(0xFFCBD5E1),
                            fontSize: 9.5,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 2.9,
                            height: 1.0,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'TOURNAMENT GRAPHICS',
                          style: TextStyle(
                            color: Color(0xFFCBD5E1),
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
                    const SizedBox(height: 8),
                    const Text(
                      'Create Professional',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                        height: 1.12,
                      ),
                    ),
                    Text(
                      'Esports Graphics',
                      style: TextStyle(
                        color: AppColors.accentBright,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        fontStyle: FontStyle.italic,
                        letterSpacing: -0.4,
                        height: 1.14,
                        shadows: [
                          Shadow(
                            color: AppColors.accent.withValues(alpha: 0.3),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 270),
                      child: const Text(
                        'Standings, Match Results, and More — All in One Broadcast Workspace.',
                        style: TextStyle(
                          color: Color(0xE6CBD5E1),
                          fontSize: 12,
                          height: 1.45,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _FeatureTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF171922), Color(0xFF10131A)],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF352B1E)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.accentBright),
          const SizedBox(height: 6),
          Text(
            title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

class _GoogleGradientButton extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onPressed;

  const _GoogleGradientButton({
    required this.isLoading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: isLoading
            ? null
            : const LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  Color(0xFFFBBF24),
                  Color(0xFFF59E0B),
                  Color(0xFFF97316),
                ],
              ),
        color: isLoading ? AppColors.accent.withValues(alpha: 0.4) : null,
        boxShadow: isLoading
            ? null
            : const [
                BoxShadow(
                  color: Color(0x47F59E0B),
                  blurRadius: 20,
                  offset: Offset(0, 8),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            child: Center(
              child: isLoading
                  ? const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 17,
                          height: 17,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.2,
                            color: AppColors.inkOnAccent,
                          ),
                        ),
                        SizedBox(width: 10),
                        Text(
                          'Signing in...',
                          style: TextStyle(
                            color: AppColors.inkOnAccent,
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    )
                  : const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.g_mobiledata_rounded,
                          size: 24,
                          color: AppColors.inkOnAccent,
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Continue with Google',
                          style: TextStyle(
                            color: AppColors.inkOnAccent,
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.1,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
