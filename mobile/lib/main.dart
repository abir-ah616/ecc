import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'models/tournament_models.dart';
import 'state/auth_state.dart';
import 'state/tournament_state.dart';
import 'theme/app_theme.dart';
import 'ui/screens/create_tournament_screen.dart';
import 'ui/screens/history_screen.dart';
import 'ui/screens/home_screen.dart';
import 'ui/screens/login_screen.dart';
import 'ui/screens/match_screen.dart';
import 'ui/screens/poster_screen.dart';
import 'ui/screens/rules_screen.dart';
import 'ui/sheets/account_sheet.dart';
import 'ui/sheets/admin_dashboard_sheet.dart';
import 'ui/sheets/json_backup_sheet.dart';
import 'ui/widgets/app_components.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.canvas,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const EspCalcApp());
}

enum _AppTab { home, matches, poster, history }

class EspCalcApp extends StatefulWidget {
  final AuthStore? authStoreOverride;
  final TournamentStore? tournamentStoreOverride;
  final bool skipAutoInit;

  const EspCalcApp({
    super.key,
    this.authStoreOverride,
    this.tournamentStoreOverride,
    this.skipAutoInit = false,
  });

  @override
  State<EspCalcApp> createState() => _EspCalcAppState();
}

class _EspCalcAppState extends State<EspCalcApp> {
  late final AuthStore _authStore;
  late final TournamentStore _tournamentStore;

  @override
  void initState() {
    super.initState();
    _authStore = widget.authStoreOverride ?? AuthStore();
    _tournamentStore = widget.tournamentStoreOverride ?? TournamentStore();
    if (!widget.skipAutoInit) {
      _authStore.initialize();
      _tournamentStore.hydrate();
    }
  }

  @override
  void dispose() {
    if (widget.authStoreOverride == null) _authStore.dispose();
    if (widget.tournamentStoreOverride == null) _tournamentStore.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Esports Calculator',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      home: AnimatedBuilder(
        animation: Listenable.merge([_authStore, _tournamentStore]),
        builder: (context, _) {
          final Widget child;
          if (_authStore.isLoading || !_tournamentStore.isHydrated) {
            child = const _BootScreen(key: ValueKey('boot'));
          } else if (_authStore.firebaseUser == null || !_authStore.isAllowed) {
            child = LoginScreen(
              key: const ValueKey('login'),
              authStore: _authStore,
            );
          } else {
            child = OrganizerShell(
              key: const ValueKey('shell'),
              authStore: _authStore,
              tournamentStore: _tournamentStore,
            );
          }

          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 240),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeIn,
            child: child,
          );
        },
      ),
    );
  }
}

class _BootScreen extends StatelessWidget {
  const _BootScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.canvas,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            EspCalcLogoMark(size: 58),
            SizedBox(height: 18),
            SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: AppColors.accent,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OrganizerShell extends StatefulWidget {
  final AuthStore authStore;
  final TournamentStore tournamentStore;

  const OrganizerShell({
    super.key,
    required this.authStore,
    required this.tournamentStore,
  });

  @override
  State<OrganizerShell> createState() => _OrganizerShellState();
}

class _SlideUpPageRoute<T> extends PageRouteBuilder<T> {
  _SlideUpPageRoute({required WidgetBuilder builder})
      : super(
          transitionDuration: const Duration(milliseconds: 260),
          reverseTransitionDuration: const Duration(milliseconds: 210),
          pageBuilder: (ctx, _, __) => builder(ctx),
          transitionsBuilder: (_, anim, __, child) {
            final curved = CurvedAnimation(
              parent: anim,
              curve: Curves.easeOutCubic,
              reverseCurve: Curves.easeInCubic,
            );
            return FadeTransition(
              opacity: curved,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, 0.055),
                  end: Offset.zero,
                ).animate(curved),
                child: child,
              ),
            );
          },
        );
}

class _OrganizerShellState extends State<OrganizerShell> {
  _AppTab _tab = _AppTab.home;
  String? _focusedMatchId;
  int _matchFocusNonce = 0;

  void _openCreate({
    TournamentRecord? editing,
    TournamentLayoutPreset? preset,
  }) {
    HapticFeedback.mediumImpact();
    Navigator.of(context).push(
      _SlideUpPageRoute<void>(
        builder: (routeCtx) => Scaffold(
          backgroundColor: AppColors.canvas,
          body: SafeArea(
            child: CreateTournamentScreen(
              store: widget.tournamentStore,
              editingTournament: editing,
              initialPreset: preset,
              onCancel: () => Navigator.of(routeCtx).pop(),
              onSaved: () {
                Navigator.of(routeCtx).pop();
                if (mounted) {
                  setState(() => _tab = _AppTab.matches);
                }
              },
            ),
          ),
        ),
      ),
    );
  }

  void _openTemplatesSheet() {
    HapticFeedback.selectionClick();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetCtx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SheetHeader(
                title: 'Tournament Templates',
                subtitle: 'Ready-made formats & squad counts',
              ),
              const SizedBox(height: 14),
              for (int i = 0; i < kTournamentTemplates.length; i++) ...[
                if (i > 0) const SizedBox(height: 10),
                TactileCard(
                  onTap: () {
                    Navigator.pop(sheetCtx);
                    _openCreate(preset: kTournamentTemplates[i]);
                  },
                  padding: const EdgeInsets.all(14),
                  borderColor: AppColors.borderStrong,
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.accentSurface,
                          borderRadius: BorderRadius.circular(11),
                          border: Border.all(color: AppColors.accentBorder),
                        ),
                        child: Icon(
                          kTournamentTemplates[i].mode ==
                                  TournamentMode.championRush
                              ? Icons.local_fire_department_rounded
                              : Icons.layers_rounded,
                          size: 19,
                          color: AppColors.accentBright,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    kTournamentTemplates[i].title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 7,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.accentSurface,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: AppColors.accentBorder,
                                    ),
                                  ),
                                  child: Text(
                                    kTournamentTemplates[i].badge,
                                    style: const TextStyle(
                                      color: AppColors.accentBright,
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.4,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              kTournamentTemplates[i].subtitle,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 11.5,
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
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _openMatch(String matchId) {
    HapticFeedback.selectionClick();
    setState(() {
      _focusedMatchId = matchId;
      _matchFocusNonce++;
      _tab = _AppTab.matches;
    });
  }

  void _openRules() {
    Navigator.of(context).push(
      _SlideUpPageRoute<void>(
        builder: (_) => Scaffold(
          backgroundColor: AppColors.canvas,
          appBar: AppBar(title: const Text('Scoring Matrix')),
          body: SafeArea(
            child: AnimatedBuilder(
              animation: widget.tournamentStore,
              builder: (_, __) => RulesScreen(store: widget.tournamentStore),
            ),
          ),
        ),
      ),
    );
  }

  void _openJsonSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => JsonBackupSheet(store: widget.tournamentStore),
    );
  }

  void _openAdminSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => AdminDashboardSheet(authStore: widget.authStore),
    );
  }

  void _openAccountSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => AccountSheet(
        authStore: widget.authStore,
        onOpenJson: _openJsonSheet,
        onOpenRules: _openRules,
        onOpenAdmin: _openAdminSheet,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.tournamentStore.activeTournament;
    final eventAccent = active != null
        ? themePaletteFor(active.settings.theme).primary
        : AppColors.accent;
    final dockAlignX = -1.0 + (2.0 * _tab.index / (_AppTab.values.length - 1));

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: Stack(
        children: [
          Positioned.fill(
            child: AmbientBackdrop(accentColor: eventAccent, intensity: 0.085),
          ),
          Column(
            children: [
              Expanded(
                child: SafeArea(
                  bottom: false,
                  child: IndexedStack(
                    index: _tab.index,
                    children: [
                      HomeScreen(
                        store: widget.tournamentStore,
                        authStore: widget.authStore,
                        onCreateTournament: () => _openCreate(),
                        onOpenMatches: () =>
                            setState(() => _tab = _AppTab.matches),
                        onOpenMatch: _openMatch,
                        onOpenPoster: () =>
                            setState(() => _tab = _AppTab.poster),
                        onOpenHistory: () =>
                            setState(() => _tab = _AppTab.history),
                        onOpenRules: _openRules,
                        onOpenTemplates: _openTemplatesSheet,
                        onEditEvent: (rec) => _openCreate(editing: rec),
                        onOpenJson: _openJsonSheet,
                        onOpenAccountSheet: _openAccountSheet,
                      ),
                      MatchScreen(
                        store: widget.tournamentStore,
                        preferredMatchId: _focusedMatchId,
                        matchFocusNonce: _matchFocusNonce,
                        onOpenPoster: () =>
                            setState(() => _tab = _AppTab.poster),
                        onCreateTournament: () => _openCreate(),
                        onEditEvent: () {
                          if (active != null) _openCreate(editing: active);
                        },
                      ),
                      PosterScreen(
                        store: widget.tournamentStore,
                        onCreateTournament: () => _openCreate(),
                      ),
                      HistoryScreen(
                        store: widget.tournamentStore,
                        onOpenMatches: () =>
                            setState(() => _tab = _AppTab.matches),
                        onOpenPoster: () =>
                            setState(() => _tab = _AppTab.poster),
                        onCreateTournament: () => _openCreate(),
                        onEditTournament: (rec) => _openCreate(editing: rec),
                      ),
                    ],
                  ),
                ),
              ),

              // Dedicated Docked Navigation Bar (sits cleanly below all tab content)
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFF0E1016), Color(0xFF090A0E)],
                  ),
                  border: Border(
                    top: BorderSide(color: Color(0xFF231B12)),
                  ),
                ),
                child: SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: AnimatedAlign(
                            alignment: Alignment(dockAlignX, 0),
                            duration: const Duration(milliseconds: 220),
                            curve: Curves.easeOutCubic,
                            child: FractionallySizedBox(
                              widthFactor: 1 / _AppTab.values.length,
                              heightFactor: 1,
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                                      Color(0xFF2B1C0B),
                                      Color(0xFF140F0A),
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: AppColors.accent.withValues(alpha: 0.72),
                                    width: 1.1,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.accent
                                          .withValues(alpha: 0.16),
                                      blurRadius: 14,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                        Row(
                          children: [
                            _DockItem(
                              icon: Icons.home_rounded,
                              label: 'Home',
                              selected: _tab == _AppTab.home,
                              onTap: () => _selectTab(_AppTab.home),
                            ),
                            _DockItem(
                              icon: Icons.scoreboard_rounded,
                              label: 'Matches',
                              selected: _tab == _AppTab.matches,
                              onTap: () => _selectTab(_AppTab.matches),
                            ),
                            _DockItem(
                              icon: Icons.photo_library_rounded,
                              label: 'Poster',
                              selected: _tab == _AppTab.poster,
                              onTap: () => _selectTab(_AppTab.poster),
                            ),
                            _DockItem(
                              icon: Icons.history_rounded,
                              label: 'History',
                              selected: _tab == _AppTab.history,
                              onTap: () => _selectTab(_AppTab.history),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _selectTab(_AppTab next) {
    if (_tab == next) return;
    HapticFeedback.selectionClick();
    setState(() => _tab = next);
  }
}

class _DockItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _DockItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 9),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedScale(
                scale: selected ? 1.06 : 1.0,
                duration: const Duration(milliseconds: 180),
                curve: Curves.easeOutCubic,
                child: Icon(
                  icon,
                  size: 20,
                  color: selected
                      ? AppColors.accentBright
                      : AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 3),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 180),
                style: TextStyle(
                  color: selected
                      ? AppColors.accentBright
                      : AppColors.textSecondary,
                  fontSize: 11,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                ),
                child: Text(label),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
