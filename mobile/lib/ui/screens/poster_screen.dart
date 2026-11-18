import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:gal/gal.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import '../../core/roster_helpers.dart';
import '../../core/scoring.dart';
import '../../models/tournament_models.dart';
import '../../services/poster_server.dart';
import '../../state/tournament_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class PosterScreen extends StatefulWidget {
  final TournamentStore store;
  final VoidCallback onCreateTournament;
  final bool isActive;

  const PosterScreen({
    super.key,
    required this.store,
    required this.onCreateTournament,
    this.isActive = true,
  });

  @override
  State<PosterScreen> createState() => _PosterScreenState();
}

class _PosterScreenState extends State<PosterScreen> {
  AspectRatioMode _aspectRatio = AspectRatioMode.ratio16x9;
  StandingsViewMode _viewMode = StandingsViewMode.overall;
  int _selectedMatchNumber = 1;

  WebViewController? _webController;
  bool _bridgeReady = false;
  bool _isExporting = false;
  bool _pendingWebSync = false;
  String? _lastSavedBannerText;
  Completer<Uint8List>? _pendingExport;
  int _reqSeq = 0;
  String? _lastPushedSignature;

  @override
  void initState() {
    super.initState();
    widget.store.addListener(_onStoreChanged);
    _syncDefaultMatchNumber();
    if (!kIsWeb && WebViewPlatform.instance != null) {
      _initWebView();
    }
  }

  @override
  void dispose() {
    widget.store.removeListener(_onStoreChanged);
    super.dispose();
  }

  void _syncDefaultMatchNumber() {
    final t = widget.store.activeTournament;
    if (t != null && t.matches.isNotEmpty) {
      final completed = t.matches.where((m) => m.isCompleted).toList();
      _selectedMatchNumber = completed.isNotEmpty
          ? completed.last.matchNumber
          : t.matches.last.matchNumber;
    }
  }

  void _onStoreChanged() {
    if (!mounted) return;
    final t = widget.store.activeTournament;
    if (t == null) {
      _lastPushedSignature = null;
      return;
    }
    if (t.matches.isNotEmpty &&
        !t.matches.any((m) => m.matchNumber == _selectedMatchNumber)) {
      _syncDefaultMatchNumber();
    }
    if (!widget.isActive) {
      _pendingWebSync = true;
      return;
    }
    _pushPayloadToWebView();
  }

  @override
  void didUpdateWidget(covariant PosterScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive && _pendingWebSync) {
      _pendingWebSync = false;
      _pushPayloadToWebView();
    }
  }

  Future<void> _initWebView() async {
    final url = await LocalPosterAssetServer.instance.ensureStarted();
    final ctrl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF090B0F))
      ..addJavaScriptChannel(
        'FlutterPosterBridge',
        onMessageReceived: _handleJsMessage,
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            if (uri != null &&
                LocalPosterAssetServer.instance.isAllowedPosterUri(uri)) {
              return NavigationDecision.navigate;
            }
            return NavigationDecision.prevent;
          },
          onPageFinished: (_) {
            if (mounted) {
              setState(() => _bridgeReady = true);
              _pushPayloadToWebView(force: true);
            }
          },
        ),
      );

    final platformCtrl = ctrl.platform;
    if (platformCtrl is AndroidWebViewController) {
      await platformCtrl.setAllowFileAccess(false);
    }

    if (!mounted) return;
    setState(() => _webController = ctrl);
    await ctrl.loadRequest(Uri.parse(url));
  }

  void _handleJsMessage(JavaScriptMessage msg) {
    try {
      final decoded = jsonDecode(msg.message) as Map<String, dynamic>;
      final type = decoded['type'];
      if (type == 'ready') {
        if (mounted && !_bridgeReady) {
          setState(() => _bridgeReady = true);
        } else {
          _bridgeReady = true;
        }
        _pushPayloadToWebView(force: true);
      } else if (type == 'exportResult') {
        final completer = _pendingExport;
        if (completer == null || completer.isCompleted) return;
        final ok = decoded['ok'] as bool? ?? false;
        final dataUrl = decoded['dataUrl'] as String?;
        if (ok && dataUrl != null && dataUrl.contains(',')) {
          final b64 = dataUrl.split(',').last;
          completer.complete(base64Decode(b64));
        } else {
          completer.completeError(
            Exception(decoded['error'] ?? 'Poster render failed'),
          );
        }
      }
    } catch (e) {
      if (_pendingExport != null && !_pendingExport!.isCompleted) {
        _pendingExport!.completeError(e);
      }
    }
  }

  Map<String, dynamic>? _buildPayload() {
    final tournament = widget.store.activeTournament;
    if (tournament == null) return null;

    final overallResult = widget.store.getStandings();
    final completedMatches =
        tournament.matches.where((m) => m.isCompleted).length;

    List<TeamCumulativeStanding> activeRows = overallResult.standings;
    if (_viewMode == StandingsViewMode.singleMatch &&
        tournament.matches.isNotEmpty) {
      final chosen = tournament.matches.firstWhere(
        (m) => m.matchNumber == _selectedMatchNumber,
        orElse: () => tournament.matches.first,
      );
      activeRows = calculateSingleMatchStandings(
        tournament.teams,
        chosen,
        tournament.settings.pointSystem,
        tournament.settings.tieBreakOrder,
      );
    }

    return {
      'settings': tournament.settings.toJson(),
      'standings': activeRows.map((s) => s.toJson()).toList(),
      'aspectRatio': _aspectRatio == AspectRatioMode.ratio4x5 ? '4:5' : '16:9',
      'viewMode': _viewMode == StandingsViewMode.singleMatch
          ? 'SINGLE_MATCH'
          : 'OVERALL',
      'selectedMatchNumber': _selectedMatchNumber,
      'totalCompletedMatches': completedMatches,
      'isTournamentEnded':
          overallResult.tournamentConcluded || tournament.isEnded,
    };
  }

  Future<void> _pushPayloadToWebView({bool force = false}) async {
    if (!widget.isActive && !force) {
      _pendingWebSync = true;
      return;
    }
    final ctrl = _webController;
    final payload = _buildPayload();
    if (ctrl == null || payload == null) return;

    final signature = jsonEncode(payload);
    if (!force && signature == _lastPushedSignature) {
      return;
    }

    final safeJson = jsonEncode(signature);
    final script = '''
      (function() {
        var data = JSON.parse($safeJson);
        window.__pendingPosterPayload = data;
        if (typeof window.renderStandingsPayload === 'function') {
          window.renderStandingsPayload(data);
        }
      })();
    ''';
    try {
      await ctrl.runJavaScript(script);
      _lastPushedSignature = signature;
    } catch (_) {}
  }

  Future<File> _exportPosterFile() async {
    final ctrl = _webController;
    if (ctrl == null || !_bridgeReady) {
      throw Exception('Poster engine is still warming up.');
    }
    await _pushPayloadToWebView(force: true);

    final reqId = 'exp_${++_reqSeq}';
    final completer = Completer<Uint8List>();
    _pendingExport = completer;

    await ctrl.runJavaScript("window.exportStandingsPng('$reqId', 2);");

    final bytes = await completer.future.timeout(
      const Duration(seconds: 35),
      onTimeout: () => throw Exception('Poster export timed out.'),
    );

    final dir = await getTemporaryDirectory();
    final safeName = (widget.store.activeTournament?.name ?? 'standings')
        .replaceAll(RegExp(r'[^a-zA-Z0-9_-]+'), '_')
        .toLowerCase();
    final file = File(
      '${dir.path}/${safeName}_${DateTime.now().millisecondsSinceEpoch}.png',
    );
    await file.writeAsBytes(bytes, flush: true);
    return file;
  }

  Future<void> _saveToGallery() async {
    if (_isExporting) return;
    HapticFeedback.mediumImpact();
    setState(() => _isExporting = true);
    try {
      final file = await _exportPosterFile();
      await Gal.putImage(file.path, album: 'EspCalc');
      final ratioLabel =
          _aspectRatio == AspectRatioMode.ratio4x5 ? '4:5 Post' : '16:9 Wide';
      if (mounted) {
        setState(() {
          _lastSavedBannerText = 'Saved $ratioLabel 2x PNG to Gallery';
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Future<void> _openMetaEditor(TournamentRecord tournament) async {
    final nameCtrl = TextEditingController(text: tournament.settings.name);
    final roundCtrl =
        TextEditingController(text: tournament.settings.roundOrDay);
    final hostCtrl =
        TextEditingController(text: tournament.settings.hostName ?? '');
    final sponsorCtrl =
        TextEditingController(text: tournament.settings.sponsorName ?? '');

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(ctx).bottom,
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SheetHeader(
                    title: 'Broadcast Labels',
                    subtitle: 'Updates live on the poster canvas',
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: nameCtrl,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(labelText: 'Event Title'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: roundCtrl,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                        labelText: 'Stage / Round Subtitle'),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: hostCtrl,
                          decoration: const InputDecoration(
                              labelText: 'Host (optional)'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: sponsorCtrl,
                          decoration: const InputDecoration(
                              labelText: 'Sponsor (optional)'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  PrimaryPillButton(
                    label: 'Apply to Poster',
                    icon: Icons.check_rounded,
                    expand: true,
                    onPressed: () => Navigator.pop(ctx, true),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );

    if (saved == true && mounted) {
      widget.store.updateActivePosterMeta(
        name: nameCtrl.text,
        roundOrDay: roundCtrl.text,
        hostName: hostCtrl.text,
        sponsorName: sponsorCtrl.text,
      );
    }
    nameCtrl.dispose();
    roundCtrl.dispose();
    hostCtrl.dispose();
    sponsorCtrl.dispose();
  }

  Future<void> _sharePoster() async {
    if (_isExporting) return;
    HapticFeedback.mediumImpact();
    setState(() => _isExporting = true);
    try {
      final file = await _exportPosterFile();
      await Share.shareXFiles(
        [XFile(file.path)],
        text: '${widget.store.activeTournament?.name ?? 'Standings'} Poster',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Share failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tournament = widget.store.activeTournament;
    if (tournament == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: TactileCard(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.photo_library_outlined,
                  size: 36,
                  color: AppColors.accentBright,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Poster Studio',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Create a tournament to render broadcast-ready 16:9 and 4:5 standings posters.',
                  textAlign: TextAlign.center,
                  style:
                      TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 18),
                PrimaryPillButton(
                  label: 'Create Tournament',
                  icon: Icons.add_rounded,
                  expand: true,
                  onPressed: widget.onCreateTournament,
                ),
              ],
            ),
          ),
        ),
      );
    }

    final currentTheme = tournament.settings.theme;
    final activePalette = themePaletteFor(currentTheme);
    final previewRatio =
        _aspectRatio == AspectRatioMode.ratio4x5 ? 4 / 5 : 16 / 9;

    const double bottomClearance = 10;
    final maxPreviewHeight = MediaQuery.sizeOf(context).height * 0.25;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Poster Studio',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                          ),
                        ),
                        Text(
                          'Live broadcast graphics · 2x PNG export',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  StatusPill(
                    label: activePalette.label.toUpperCase(),
                    backgroundColor:
                        activePalette.primary.withValues(alpha: 0.14),
                    borderColor: activePalette.primary.withValues(alpha: 0.45),
                    textColor: activePalette.primary,
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Pinned Live Hybrid-Composition Monitor (no ClipRRect or Flutter overlay)
              AnimatedContainer(
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOutCubic,
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFF090B0F),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: activePalette.primary.withValues(alpha: 0.28),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: activePalette.primary.withValues(alpha: 0.14),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxHeight: maxPreviewHeight),
                  child: Center(
                    child: AspectRatio(
                      aspectRatio: previewRatio,
                      child: _buildLivePreview(),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 10, 20, bottomClearance),
            children: [
              // Theme Swatch Strip
              const Text(
                'BROADCAST THEME',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                ),
              ),
              const SizedBox(height: 6),
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: broadcastThemePalettes.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, idx) {
                    final swatch = broadcastThemePalettes[idx];
                    final selected = swatch.preset == currentTheme;
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        widget.store.updateActiveTheme(swatch.preset);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        curve: Curves.easeOutCubic,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.surfaceElevated
                              : AppColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected
                                ? swatch.primary
                                : AppColors.borderSubtle,
                            width: selected ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 18,
                              height: 18,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [swatch.primary, swatch.secondary],
                                ),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.22),
                                  width: 0.8,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              swatch.label,
                              style: TextStyle(
                                color: selected
                                    ? AppColors.textPrimary
                                    : AppColors.textSecondary,
                                fontSize: 12.5,
                                fontWeight: selected
                                    ? FontWeight.w800
                                    : FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),

              // Aspect Ratio & View Scope Controls
              SegmentedToggle<AspectRatioMode>(
                selected: _aspectRatio,
                accentColor: activePalette.primary,
                onChanged: (v) {
                  setState(() {
                    _aspectRatio = v;
                    _lastSavedBannerText = null;
                  });
                  _pushPayloadToWebView();
                },
                items: const [
                  (
                    value: AspectRatioMode.ratio16x9,
                    label: '16:9 Wide',
                    icon: Icons.crop_16_9_rounded,
                  ),
                  (
                    value: AspectRatioMode.ratio4x5,
                    label: '4:5 Post',
                    icon: Icons.crop_portrait_rounded,
                  ),
                ],
              ),
              const SizedBox(height: 10),
              SegmentedToggle<StandingsViewMode>(
                selected: _viewMode,
                accentColor: activePalette.primary,
                onChanged: (v) {
                  setState(() => _viewMode = v);
                  _pushPayloadToWebView();
                },
                items: const [
                  (
                    value: StandingsViewMode.overall,
                    label: 'Overall Table',
                    icon: Icons.public_rounded,
                  ),
                  (
                    value: StandingsViewMode.singleMatch,
                    label: 'Single Match',
                    icon: Icons.looks_one_rounded,
                  ),
                ],
              ),

              if (_viewMode == StandingsViewMode.singleMatch &&
                  tournament.matches.isNotEmpty) ...[
                const SizedBox(height: 10),
                SizedBox(
                  height: 38,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: tournament.matches.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, idx) {
                      final m = tournament.matches[idx];
                      final selected = m.matchNumber == _selectedMatchNumber;
                      return GestureDetector(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() => _selectedMatchNumber = m.matchNumber);
                          _pushPayloadToWebView();
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 160),
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: selected
                                ? activePalette.primary
                                : AppColors.surface,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(
                              color: selected
                                  ? activePalette.primary
                                  : AppColors.borderSubtle,
                            ),
                          ),
                          child: Text(
                            'Match ${m.matchNumber}',
                            style: TextStyle(
                              color: selected
                                  ? AppColors.inkOnAccent
                                  : AppColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],

              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _PosterMetaChip(
                      icon: tournament.settings.showLogos
                          ? Icons.verified_rounded
                          : Icons.hide_image_outlined,
                      label: tournament.settings.showLogos
                          ? 'Squad Logos: On'
                          : 'Squad Logos: Off',
                      active: tournament.settings.showLogos,
                      accentColor: activePalette.primary,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        widget.store.updateActivePosterMeta(
                          showLogos: !tournament.settings.showLogos,
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _PosterMetaChip(
                      icon: Icons.edit_outlined,
                      label: tournament.settings.roundOrDay,
                      active: false,
                      accentColor: activePalette.primary,
                      onTap: () => _openMetaEditor(tournament),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: _lastSavedBannerText == null
                    ? const SizedBox.shrink()
                    : Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.emeraldSurface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: AppColors.emerald.withValues(alpha: 0.45),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.check_circle_rounded,
                                size: 17,
                                color: AppColors.emerald,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _lastSavedBannerText!,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              if (_aspectRatio == AspectRatioMode.ratio16x9)
                                TextButton(
                                  onPressed: () {
                                    setState(() {
                                      _aspectRatio = AspectRatioMode.ratio4x5;
                                      _lastSavedBannerText = null;
                                    });
                                    _pushPayloadToWebView();
                                  },
                                  style: TextButton.styleFrom(
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                    ),
                                  ),
                                  child: const Text(
                                    'Try 4:5',
                                    style: TextStyle(
                                      color: AppColors.emerald,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
              ),
            ],
          ),
        ),

        // Sticky Export Bottom Bar (always visible above bottom dock)
        Container(
          decoration: const BoxDecoration(
            color: AppColors.canvas,
            border: Border(
              top: BorderSide(color: AppColors.borderSubtle),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
          child: Row(
            children: [
              Expanded(
                child: PrimaryPillButton(
                  label: 'Save PNG',
                  icon: Icons.download_rounded,
                  accentColor: activePalette.primary,
                  isLoading: _isExporting,
                  onPressed: kIsWeb ? null : _saveToGallery,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: SecondaryPillButton(
                  label: 'Share',
                  icon: Icons.ios_share_rounded,
                  onPressed: kIsWeb || _isExporting ? null : _sharePoster,
                ),
              ),
              const SizedBox(width: 8),
              SecondaryPillButton(
                label: 'Copy',
                icon: Icons.copy_all_rounded,
                onPressed: () async {
                  final overallResult = widget.store.getStandings();
                  final completedMatches =
                      tournament.matches.where((m) => m.isCompleted).length;
                  List<TeamCumulativeStanding> activeRows =
                      overallResult.standings;
                  if (_viewMode == StandingsViewMode.singleMatch &&
                      tournament.matches.isNotEmpty) {
                    final chosen = tournament.matches.firstWhere(
                      (m) => m.matchNumber == _selectedMatchNumber,
                      orElse: () => tournament.matches.first,
                    );
                    activeRows = calculateSingleMatchStandings(
                      tournament.teams,
                      chosen,
                      tournament.settings.pointSystem,
                      tournament.settings.tieBreakOrder,
                    );
                  }
                  final summary = formatStandingsTextSummary(
                    settings: tournament.settings,
                    standings: activeRows,
                    viewMode: _viewMode,
                    matchNumber: _selectedMatchNumber,
                    completedMatches: completedMatches,
                  );
                  await Clipboard.setData(ClipboardData(text: summary));
                  HapticFeedback.mediumImpact();
                  if (!mounted) return;
                  setState(() {
                    _lastSavedBannerText =
                        'Standings text copied for WhatsApp / Discord';
                  });
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLivePreview() {
    if (kIsWeb || WebViewPlatform.instance == null) {
      return Container(
        color: const Color(0xFF090B0F),
        alignment: Alignment.center,
        padding: const EdgeInsets.all(20),
        child: const Text(
          'Live Broadcast Poster engine runs natively on Android & iOS builds.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 13,
          ),
        ),
      );
    }

    final ctrl = _webController;
    if (ctrl == null) {
      return const ColoredBox(
        color: Color(0xFF090B0F),
        child: Center(
          child: CircularProgressIndicator(color: AppColors.accent),
        ),
      );
    }

    var params = PlatformWebViewWidgetCreationParams(
      controller: ctrl.platform,
    );
    if (WebViewPlatform.instance is AndroidWebViewPlatform) {
      params = AndroidWebViewWidgetCreationParams
          .fromPlatformWebViewWidgetCreationParams(
        params,
        displayWithHybridComposition: true,
      );
    }
    return WebViewWidget.fromPlatformCreationParams(params: params);
  }
}

class _PosterMetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final Color accentColor;
  final VoidCallback onTap;

  const _PosterMetaChip({
    required this.icon,
    required this.label,
    required this.active,
    required this.accentColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color:
              active ? accentColor.withValues(alpha: 0.12) : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: active
                ? accentColor.withValues(alpha: 0.45)
                : AppColors.borderSubtle,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 14,
              color: active ? accentColor : AppColors.textSecondary,
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color:
                      active ? AppColors.textPrimary : AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
