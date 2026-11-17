import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/roster_helpers.dart';
import '../../core/scoring.dart';
import '../../models/tournament_models.dart';
import '../../state/tournament_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class _DraftSquad {
  String id;
  TextEditingController controller;
  TextEditingController player1Ctrl;
  TextEditingController player2Ctrl;
  String? logoUrl;
  List<String> learnedTokens;

  _DraftSquad({
    required this.id,
    required String name,
    this.logoUrl,
    String player1 = '',
    String player2 = '',
    List<String> learnedTokens = const [],
  })  : controller = TextEditingController(text: name),
        player1Ctrl = TextEditingController(text: player1),
        player2Ctrl = TextEditingController(text: player2),
        learnedTokens = List<String>.from(learnedTokens);

  void dispose() {
    controller.dispose();
    player1Ctrl.dispose();
    player2Ctrl.dispose();
  }
}

class TournamentLayoutPreset {
  final String title;
  final String subtitle;
  final String badge;
  final TournamentMode mode;
  final String roundOrDay;
  final int squadCount;
  final int matchesPlanned;
  final int rushTargetPoints;

  const TournamentLayoutPreset({
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.mode,
    required this.roundOrDay,
    required this.squadCount,
    required this.matchesPlanned,
    this.rushTargetPoints = 80,
  });
}

const List<TournamentLayoutPreset> kTournamentTemplates = [
  TournamentLayoutPreset(
    title: 'Default Scrim',
    subtitle: '3 matches · 12 teams · Standard Scrim format',
    badge: 'DEFAULT',
    mode: TournamentMode.scrim,
    roundOrDay: 'SCRIM SERIES',
    squadCount: 12,
    matchesPlanned: 3,
  ),
  TournamentLayoutPreset(
    title: 'Quick Champion Rush',
    subtitle: '5 max matches · 50 pts activate · 12 teams',
    badge: 'RUSH 50',
    mode: TournamentMode.championRush,
    roundOrDay: 'FINALS · RUSH 50',
    squadCount: 12,
    matchesPlanned: 5,
    rushTargetPoints: 50,
  ),
  TournamentLayoutPreset(
    title: 'Scrim Pro',
    subtitle: '5 matches · 12 teams · Pro Finals layout',
    badge: 'SCRIM PRO',
    mode: TournamentMode.scrim,
    roundOrDay: 'GRAND FINALS',
    squadCount: 12,
    matchesPlanned: 5,
  ),
  TournamentLayoutPreset(
    title: 'Champion Rush Pro',
    subtitle: '8 max matches · 80 pts activate · 12 teams',
    badge: 'RUSH PRO',
    mode: TournamentMode.championRush,
    roundOrDay: 'GRAND FINALS',
    squadCount: 12,
    matchesPlanned: 8,
    rushTargetPoints: 80,
  ),
];

const List<int> _kScrimMatchPresets = [3, 4, 5, 6, 8, 10];
const List<int> _kRushTargetPresets = [50, 75, 80, 100, 120];
const List<int> _kRushMaxMatchPresets = [5, 6, 7, 8, 10];
const List<int> _kSquadCountPresets = [4, 6, 8, 12, 16, 18, 20];

class CreateTournamentScreen extends StatefulWidget {
  final TournamentStore store;
  final TournamentRecord? editingTournament;
  final TournamentLayoutPreset? initialPreset;
  final VoidCallback onSaved;
  final VoidCallback? onCancel;

  const CreateTournamentScreen({
    super.key,
    required this.store,
    this.editingTournament,
    this.initialPreset,
    required this.onSaved,
    this.onCancel,
  });

  @override
  State<CreateTournamentScreen> createState() => _CreateTournamentScreenState();
}

class _CreateTournamentScreenState extends State<CreateTournamentScreen> {
  int _step = 0; // 0 = Format & Rules, 1 = Squads & Branding
  late TournamentMode _mode;
  late TextEditingController _nameCtrl;
  late TextEditingController _roundCtrl;
  late TextEditingController _hostCtrl;
  late TextEditingController _sponsorCtrl;
  late TextEditingController _targetPointsCtrl;
  late TextEditingController _maxMatchesCtrl;
  late TextEditingController _scrimMatchesCtrl;
  late TextEditingController _customSquadCtrl;
  late bool _allowSameMatchActivation;
  late bool _showLogos;
  late bool _autoResultFromScreenshot;
  late bool _customScrimMatches;
  late bool _customTargetPoints;
  late bool _customMaxMatches;
  late bool _customSquadCount;
  String? _customLogoUrl;
  late List<_DraftSquad> _squads;

  final ImagePicker _picker = ImagePicker();

  bool get _isEditing => widget.editingTournament != null;

  @override
  void initState() {
    super.initState();
    final edit = widget.editingTournament;
    if (edit != null) {
      final s = edit.settings;
      _mode = s.mode;
      _nameCtrl = TextEditingController(text: s.name);
      _roundCtrl = TextEditingController(text: s.roundOrDay);
      _hostCtrl = TextEditingController(text: s.hostName ?? '');
      _sponsorCtrl = TextEditingController(text: s.sponsorName ?? '');
      _targetPointsCtrl = TextEditingController(
        text: s.championRush.targetPoints.toString(),
      );
      _maxMatchesCtrl = TextEditingController(
        text: s.championRush.maxMatches.toString(),
      );
      _scrimMatchesCtrl = TextEditingController(
        text: s.totalMatchesPlanned.toString(),
      );
      _allowSameMatchActivation = s.championRush.allowSameMatchBooyahActivation;
      _showLogos = s.showLogos;
      _autoResultFromScreenshot = s.autoResultFromScreenshot;
      _customLogoUrl = s.customLogoUrl;
      _squads = edit.teams
          .map(
            (t) => _DraftSquad(
              id: t.id,
              name: t.name,
              logoUrl: t.logoUrl,
              player1: t.player1 ?? '',
              player2: t.player2 ?? '',
              learnedTokens: t.learnedTokens,
            ),
          )
          .toList();
      _customTargetPoints =
          !_kRushTargetPresets.contains(s.championRush.targetPoints);
      _customMaxMatches =
          !_kRushMaxMatchPresets.contains(s.championRush.maxMatches);
      _customScrimMatches =
          !_kScrimMatchPresets.contains(s.totalMatchesPlanned);
      _customSquadCount = !_kSquadCountPresets.contains(_squads.length);
      _customSquadCtrl = TextEditingController(text: '${_squads.length}');
    } else {
      final preset = widget.initialPreset;
      final orgDefaults = widget.store.organizerDefaults;
      final initRushTarget = preset?.rushTargetPoints ?? 80;
      final initRushMax = preset?.matchesPlanned ?? 8;
      final initScrimMatches = preset?.matchesPlanned ?? 5;
      _mode = preset?.mode ?? TournamentMode.scrim;
      _nameCtrl = TextEditingController();
      _roundCtrl =
          TextEditingController(text: preset?.roundOrDay ?? 'GRAND FINALS');
      _hostCtrl = TextEditingController(text: orgDefaults.hostName);
      _sponsorCtrl = TextEditingController(text: orgDefaults.sponsorName);
      _targetPointsCtrl = TextEditingController(text: '$initRushTarget');
      _maxMatchesCtrl = TextEditingController(text: '$initRushMax');
      _scrimMatchesCtrl = TextEditingController(text: '$initScrimMatches');
      _allowSameMatchActivation = false;
      _showLogos = true;
      _autoResultFromScreenshot = false;
      _customLogoUrl = orgDefaults.customLogoUrl;
      final count = preset?.squadCount ?? 12;
      _squads = [
        for (int i = 1; i <= count; i++)
          _DraftSquad(id: 'new_$i', name: 'Team $i'),
      ];
      _customTargetPoints = !_kRushTargetPresets.contains(initRushTarget);
      _customMaxMatches = !_kRushMaxMatchPresets.contains(initRushMax);
      _customScrimMatches = !_kScrimMatchPresets.contains(initScrimMatches);
      _customSquadCount = !_kSquadCountPresets.contains(_squads.length);
      _customSquadCtrl = TextEditingController(text: '${_squads.length}');
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _roundCtrl.dispose();
    _hostCtrl.dispose();
    _sponsorCtrl.dispose();
    _targetPointsCtrl.dispose();
    _maxMatchesCtrl.dispose();
    _scrimMatchesCtrl.dispose();
    _customSquadCtrl.dispose();
    for (final s in _squads) {
      s.dispose();
    }
    super.dispose();
  }

  void _autoHydrateSquadFromVault(_DraftSquad squad) {
    final hit = widget.store.findSavedSquadByName(squad.controller.text);
    if (hit == null) return;
    if (squad.logoUrl == null && hit.logoUrl != null) {
      squad.logoUrl = hit.logoUrl;
    }
    if (squad.player1Ctrl.text.trim().isEmpty &&
        (hit.player1 ?? '').trim().isNotEmpty) {
      squad.player1Ctrl.text = hit.player1!.trim();
    }
    if (squad.player2Ctrl.text.trim().isEmpty &&
        (hit.player2 ?? '').trim().isNotEmpty) {
      squad.player2Ctrl.text = hit.player2!.trim();
    }
    if (hit.learnedTokens.isNotEmpty) {
      squad.learnedTokens = <String>{
        ...squad.learnedTokens,
        ...hit.learnedTokens,
      }.toList();
    }
  }

  Future<String?> _pickImageAsDataUrl() async {
    try {
      final file = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 320,
        maxHeight: 320,
        imageQuality: 85,
      );
      if (file == null) return null;
      final bytes = await file.readAsBytes();
      final lower = file.name.toLowerCase();
      final mime = lower.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return 'data:$mime;base64,${base64Encode(bytes)}';
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not read image from gallery.')),
        );
      }
      return null;
    }
  }

  Future<void> _bulkUploadLogos() async {
    try {
      final files = await _picker.pickMultiImage(
        maxWidth: 320,
        maxHeight: 320,
        imageQuality: 85,
      );
      if (files.isEmpty) return;

      final usedIndices = <int>{};
      final squadNames = _squads.map((s) => s.controller.text.trim()).toList();
      var matchedCount = 0;

      for (final file in files) {
        final idx = matchLogoFilenameToSquadIndex(
          file.name,
          squadNames,
          usedIndices,
        );
        if (idx < 0 || idx >= _squads.length) continue;
        final bytes = await file.readAsBytes();
        final lower = file.name.toLowerCase();
        final mime = lower.endsWith('.png') ? 'image/png' : 'image/jpeg';
        _squads[idx].logoUrl = 'data:$mime;base64,${base64Encode(bytes)}';
        usedIndices.add(idx);
        matchedCount++;
      }

      if (!mounted) return;
      HapticFeedback.mediumImpact();
      setState(() {});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Attached $matchedCount logo(s) to squads.')),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not import multiple logos.')),
        );
      }
    }
  }

  Future<void> _openSquadVaultSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        var search = '';
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final vault = widget.store.savedSquads.where((s) {
              if (search.isEmpty) return true;
              return s.name.toLowerCase().contains(search.toLowerCase());
            }).toList();

            return SafeArea(
              child: SizedBox(
                height: MediaQuery.of(ctx).size.height * 0.72,
                child: Column(
                  children: [
                    SheetHeader(
                      title: 'Saved Squad Vault (${vault.length})',
                      subtitle: 'Tap a squad to drop into the next empty slot',
                      trailing: TextButton(
                        onPressed: () {
                          final existingNames = _squads
                              .map((s) => s.controller.text.trim().toLowerCase())
                              .toSet();
                          var added = 0;
                          setState(() {
                            for (final sv in vault) {
                              if (existingNames.contains(sv.name.toLowerCase())) {
                                continue;
                              }
                              final emptyIdx = _squads.indexWhere(
                                (sq) => isPlaceholderSquadName(
                                  sq.controller.text,
                                ),
                              );
                              if (emptyIdx != -1) {
                                _squads[emptyIdx].controller.text = sv.name;
                                _squads[emptyIdx].logoUrl = sv.logoUrl;
                                _squads[emptyIdx].player1Ctrl.text =
                                    sv.player1 ?? '';
                                _squads[emptyIdx].player2Ctrl.text =
                                    sv.player2 ?? '';
                                _squads[emptyIdx].learnedTokens =
                                    List<String>.from(sv.learnedTokens);
                                existingNames.add(sv.name.toLowerCase());
                                added++;
                              }
                            }
                          });
                          Navigator.pop(ctx);
                          if (added > 0 && mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Filled $added slot(s) from Squad Vault.',
                                ),
                              ),
                            );
                          }
                        },
                        child: const Text(
                          'Fill Empty',
                          style: TextStyle(
                            color: AppColors.accentBright,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
                      child: TextField(
                        onChanged: (v) => setModalState(() => search = v),
                        decoration: const InputDecoration(
                          hintText: 'Filter saved squads...',
                          prefixIcon: Icon(
                            Icons.search_rounded,
                            size: 18,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: vault.isEmpty
                          ? const Center(
                              child: Text(
                                'No saved squads yet.',
                                style: TextStyle(color: AppColors.textMuted),
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                              itemCount: vault.length,
                              itemBuilder: (_, idx) {
                                final sv = vault[idx];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: TactileCard(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 10,
                                    ),
                                    onTap: () {
                                      HapticFeedback.selectionClick();
                                      setState(() {
                                        final emptyIdx = _squads.indexWhere(
                                          (sq) => isPlaceholderSquadName(
                                            sq.controller.text,
                                          ),
                                        );
                                        if (emptyIdx != -1) {
                                          _squads[emptyIdx].controller.text =
                                              sv.name;
                                          _squads[emptyIdx].logoUrl = sv.logoUrl;
                                          _squads[emptyIdx].player1Ctrl.text =
                                              sv.player1 ?? '';
                                          _squads[emptyIdx].player2Ctrl.text =
                                              sv.player2 ?? '';
                                          _squads[emptyIdx].learnedTokens =
                                              List<String>.from(
                                            sv.learnedTokens,
                                          );
                                        } else if (_squads.length < 24) {
                                          _squads.add(
                                            _DraftSquad(
                                              id: 'vault_${DateTime.now().microsecondsSinceEpoch}',
                                              name: sv.name,
                                              logoUrl: sv.logoUrl,
                                              player1: sv.player1 ?? '',
                                              player2: sv.player2 ?? '',
                                              learnedTokens: sv.learnedTokens,
                                            ),
                                          );
                                        }
                                        _customSquadCtrl.text =
                                            '${_squads.length}';
                                      });
                                      Navigator.pop(ctx);
                                    },
                                    child: Row(
                                      children: [
                                        SquadBadge(
                                          teamName: sv.name,
                                          shortCode: sv.shortCode,
                                          logoUrl: sv.logoUrl,
                                          size: 36,
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                sv.name,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                  color: AppColors.textPrimary,
                                                  fontSize: 13.5,
                                                  fontWeight: FontWeight.w800,
                                                ),
                                              ),
                                              if ((sv.player1 ?? '')
                                                  .trim()
                                                  .isNotEmpty)
                                                Text(
                                                  'P1: ${sv.player1}${((sv.player2 ?? '').trim().isNotEmpty) ? ' · P2: ${sv.player2}' : ''}',
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    color: AppColors.textMuted,
                                                    fontSize: 11,
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                        IconButton(
                                          onPressed: () {
                                            widget.store
                                                .deleteSavedSquad(sv.id);
                                            setModalState(() {});
                                          },
                                          icon: const Icon(
                                            Icons.delete_outline_rounded,
                                            size: 18,
                                            color: AppColors.textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _setTeamCount(int target) {
    final clamped = target.clamp(2, 24);
    HapticFeedback.selectionClick();
    setState(() {
      if (_squads.length < clamped) {
        for (int i = _squads.length + 1; i <= clamped; i++) {
          _squads.add(
            _DraftSquad(
              id: 'new_${DateTime.now().microsecondsSinceEpoch}_$i',
              name: 'Team $i',
            ),
          );
        }
      } else if (_squads.length > clamped) {
        final removed = _squads.sublist(clamped);
        for (final s in removed) {
          s.dispose();
        }
        _squads = _squads.sublist(0, clamped);
      }
      _customSquadCtrl.text = '$clamped';
    });
  }

  Future<void> _openPasteRosterSheet() async {
    final pasteCtrl = TextEditingController();
    final result = await showModalBottomSheet<List<String>>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            0,
            20,
            MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SheetHeader(
                title: 'Smart Paste Slot List',
                subtitle:
                    'Paste WhatsApp/Discord slot lists — numbers & tags stripped automatically',
              ),
              const SizedBox(height: 14),
              TextField(
                controller: pasteCtrl,
                maxLines: 7,
                autofocus: true,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                decoration: const InputDecoration(
                  hintText:
                      'Slot 01 - EVOS DIVINE (Confirmed)\nSlot 02 - TEAM VAMPIRES\n03. BURIRAM UNITED\n...',
                ),
              ),
              const SizedBox(height: 16),
              PrimaryPillButton(
                label: 'Apply Roster',
                icon: Icons.playlist_add_check_rounded,
                expand: true,
                onPressed: () {
                  final raw = pasteCtrl.text;
                  var parsed = parseSmartSlotList(raw, maxTeams: 24);
                  if (parsed.length <= 1 && raw.contains(',')) {
                    parsed = raw
                        .split(RegExp(r'[,;]+'))
                        .map((e) => e.trim())
                        .where((e) => e.isNotEmpty)
                        .take(24)
                        .toList();
                  }
                  Navigator.pop(ctx, parsed);
                },
              ),
            ],
          ),
        );
      },
    );
    pasteCtrl.dispose();
    if (result != null && result.isNotEmpty && mounted) {
      HapticFeedback.mediumImpact();
      setState(() {
        for (final s in _squads) {
          s.dispose();
        }
        _squads = [
          for (int i = 0; i < result.length; i++)
            () {
              final hit = widget.store.findSavedSquadByName(result[i]);
              return _DraftSquad(
                id: 'pasted_${DateTime.now().microsecondsSinceEpoch}_$i',
                name: result[i],
                logoUrl: hit?.logoUrl,
                player1: hit?.player1 ?? '',
                player2: hit?.player2 ?? '',
                learnedTokens: hit?.learnedTokens ?? const [],
              );
            }(),
        ];
        _customSquadCount = !_kSquadCountPresets.contains(_squads.length);
        _customSquadCtrl.text = '${_squads.length}';
      });
    }
  }

  void _submit() {
    if (_autoResultFromScreenshot) {
      for (int i = 0; i < _squads.length; i++) {
        if (_squads[i].player1Ctrl.text.trim().isEmpty) {
          final sqLabel = _squads[i].controller.text.trim().isEmpty
              ? 'Squad #${i + 1}'
              : _squads[i].controller.text.trim();
          setState(() => _step = 1);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Enter Player 1 IGN for $sqLabel (or turn off Auto Result from Screenshot).',
              ),
            ),
          );
          return;
        }
      }
    }

    final targetPts =
        (int.tryParse(_targetPointsCtrl.text.trim()) ?? 80).clamp(1, 999);
    final maxMatches =
        (int.tryParse(_maxMatchesCtrl.text.trim()) ?? 8).clamp(1, 50);
    final scrimMatches =
        (int.tryParse(_scrimMatchesCtrl.text.trim()) ?? 5).clamp(1, 50);

    final rushConfig = ChampionRushConfig(
      targetPoints: targetPts,
      maxMatches: maxMatches,
      allowSameMatchBooyahActivation: _allowSameMatchActivation,
    );

    final builtTeams = [
      for (int i = 0; i < _squads.length; i++)
        () {
          final sq = _squads[i];
          final cleanName = sq.controller.text.trim().isEmpty
              ? 'Team ${i + 1}'
              : sq.controller.text.trim();
          final p1 = sq.player1Ctrl.text.trim();
          final p2 = sq.player2Ctrl.text.trim();
          return Team(
            id: sq.id,
            name: cleanName,
            logoUrl: sq.logoUrl,
            shortCode: generateTeamInitials(cleanName),
            player1: p1.isEmpty ? null : p1,
            player2: p2.isEmpty ? null : p2,
            learnedTokens: sq.learnedTokens,
          );
        }(),
    ];

    if (_isEditing) {
      final edit = widget.editingTournament!;
      widget.store.updateTournament(
        edit.id,
        name: _nameCtrl.text.trim().isEmpty ? edit.name : _nameCtrl.text.trim(),
        mode: _mode,
        roundOrDay: _roundCtrl.text.trim().isEmpty
            ? 'FINALS'
            : _roundCtrl.text.trim(),
        hostName: _hostCtrl.text.trim(),
        sponsorName: _sponsorCtrl.text.trim(),
        showLogos: _showLogos,
        customLogoUrl: _customLogoUrl,
        clearCustomLogo: _customLogoUrl == null,
        autoResultFromScreenshot: _autoResultFromScreenshot,
        totalMatchesPlanned: scrimMatches,
        championRush: rushConfig,
        teams: builtTeams,
      );
    } else {
      widget.store.createTournament(
        name: _nameCtrl.text.trim(),
        mode: _mode,
        roundOrDay: _roundCtrl.text.trim(),
        hostName: _hostCtrl.text.trim(),
        sponsorName: _sponsorCtrl.text.trim(),
        showLogos: _showLogos,
        customLogoUrl: _customLogoUrl,
        autoResultFromScreenshot: _autoResultFromScreenshot,
        richSquads: builtTeams,
        totalMatchesPlanned: scrimMatches,
        championRush: rushConfig,
      );
    }

    HapticFeedback.heavyImpact();
    widget.onSaved();
  }

  @override
  Widget build(BuildContext context) {
    final currentTargetPts = int.tryParse(_targetPointsCtrl.text.trim());
    final currentMaxMatches = int.tryParse(_maxMatchesCtrl.text.trim());
    final currentScrimMatches = int.tryParse(_scrimMatchesCtrl.text.trim());

    return Column(
      children: [
        // Top Header + Progress Stepper
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (_step == 1 || widget.onCancel != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: IconButton(
                        onPressed: () {
                          if (_step == 1) {
                            setState(() => _step = 0);
                          } else {
                            widget.onCancel?.call();
                          }
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: AppColors.surfaceElevated,
                          side: const BorderSide(color: AppColors.borderSubtle),
                        ),
                        icon: const Icon(
                          Icons.arrow_back_rounded,
                          size: 18,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isEditing ? 'Edit Tournament' : 'New Tournament',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                          ),
                        ),
                        Text(
                          _step == 0
                              ? 'Step 1 of 2 · Format & Rules'
                              : 'Step 2 of 2 · Squads & Branding',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.accent,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      height: 4,
                      decoration: BoxDecoration(
                        color: _step == 1
                            ? AppColors.accent
                            : AppColors.borderSubtle,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            child: _step == 0
                ? _buildStepOne(
                    currentTargetPts,
                    currentMaxMatches,
                    currentScrimMatches,
                  )
                : _buildStepTwo(),
          ),
        ),
      ],
    );
  }

  Widget _buildStepOne(
    int? currentTargetPts,
    int? currentMaxMatches,
    int? currentScrimMatches,
  ) {
    return ListView(
      key: const ValueKey('step1'),
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 120),
      children: [
        TactileCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Tournament Identity',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _nameCtrl,
                textCapitalization: TextCapitalization.characters,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
                decoration: const InputDecoration(
                  labelText: 'Event Name',
                  hintText: 'e.g. FFWS REGIONAL FINALS',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _roundCtrl,
                textCapitalization: TextCapitalization.characters,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                decoration: const InputDecoration(
                  labelText: 'Round or Day Subtitle',
                  hintText: 'e.g. GRAND FINALS · DAY 1',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            'FORMAT',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.0,
            ),
          ),
        ),

        Row(
          children: [
            Expanded(
              child: _FormatCard(
                title: 'Scrim Series',
                subtitle: 'Fixed match count · highest points wins',
                icon: Icons.scoreboard_rounded,
                selected: _mode == TournamentMode.scrim,
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _mode = TournamentMode.scrim);
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _FormatCard(
                title: 'Champion Rush',
                subtitle: 'Hit target pts + Booyah to crown Champion',
                icon: Icons.local_fire_department_rounded,
                selected: _mode == TournamentMode.championRush,
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _mode = TournamentMode.championRush);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        if (_mode == TournamentMode.scrim)
          TactileCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Planned Matches',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Pick a match count or tap Custom.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ..._kScrimMatchPresets.map((val) {
                      return _QuickValueChip(
                        label: '$val Matches',
                        selected:
                            !_customScrimMatches && currentScrimMatches == val,
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() {
                            _customScrimMatches = false;
                            _scrimMatchesCtrl.text = '$val';
                          });
                        },
                      );
                    }),
                    _QuickValueChip(
                      label: 'Custom',
                      selected: _customScrimMatches,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _customScrimMatches = !_customScrimMatches);
                      },
                    ),
                  ],
                ),
                if (_customScrimMatches) ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _scrimMatchesCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (_) => setState(() {}),
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Custom Total Matches',
                      hintText: 'e.g. 7',
                      suffixText: 'matches',
                    ),
                  ),
                ],
              ],
            ),
          )
        else
          TactileCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Champion Rush Parameters',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'TARGET POINT THRESHOLD',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ..._kRushTargetPresets.map((val) {
                      return _QuickValueChip(
                        label: '$val pts',
                        selected: !_customTargetPoints && currentTargetPts == val,
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() {
                            _customTargetPoints = false;
                            _targetPointsCtrl.text = '$val';
                          });
                        },
                      );
                    }),
                    _QuickValueChip(
                      label: 'Custom',
                      selected: _customTargetPoints,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(
                          () => _customTargetPoints = !_customTargetPoints,
                        );
                      },
                    ),
                  ],
                ),
                if (_customTargetPoints) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _targetPointsCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (_) => setState(() {}),
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Custom Target Points',
                      hintText: 'Enter custom target points (e.g. 65)',
                      suffixText: 'pts',
                    ),
                  ),
                ],
                const SizedBox(height: 18),
                const Text(
                  'MAX MATCHES CEILING',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ..._kRushMaxMatchPresets.map((val) {
                      return _QuickValueChip(
                        label: '$val',
                        selected: !_customMaxMatches && currentMaxMatches == val,
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() {
                            _customMaxMatches = false;
                            _maxMatchesCtrl.text = '$val';
                          });
                        },
                      );
                    }),
                    _QuickValueChip(
                      label: 'Custom',
                      selected: _customMaxMatches,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _customMaxMatches = !_customMaxMatches);
                      },
                    ),
                  ],
                ),
                if (_customMaxMatches) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _maxMatchesCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (_) => setState(() {}),
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Custom Max Matches Ceiling',
                      hintText: 'e.g. 12',
                      suffixText: 'matches',
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.inputFill,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.borderSubtle),
                  ),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Same-Match Booyah Activation',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Crown winner on the exact match they hit target + #1',
                              style: TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Switch.adaptive(
                        value: _allowSameMatchActivation,
                        activeThumbColor: AppColors.accent,
                        onChanged: (v) {
                          HapticFeedback.selectionClick();
                          setState(() => _allowSameMatchActivation = v);
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

        const SizedBox(height: 20),
        PrimaryPillButton(
          label: 'Continue to Squads',
          icon: Icons.arrow_forward_rounded,
          expand: true,
          onPressed: () {
            FocusScope.of(context).unfocus();
            setState(() => _step = 1);
          },
        ),
      ],
    );
  }

  Widget _buildStepTwo() {
    return ListView(
      key: const ValueKey('step2'),
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 120),
      children: [
        TactileCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Poster Credits & Emblem',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _hostCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Host / Org',
                        hintText: 'Optional',
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _sponsorCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Sponsor',
                        hintText: 'Optional',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  GestureDetector(
                    onTap: () async {
                      final img = await _pickImageAsDataUrl();
                      if (img != null && mounted) {
                        setState(() => _customLogoUrl = img);
                      }
                    },
                    child: SquadBadge(
                      teamName: _nameCtrl.text.trim().isEmpty
                          ? 'FF'
                          : _nameCtrl.text.trim(),
                      logoUrl: _customLogoUrl,
                      size: 46,
                      highlight: true,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Tournament Emblem',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          _customLogoUrl == null
                              ? 'Tap emblem to upload custom badge'
                              : 'Custom badge ready for posters',
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_customLogoUrl != null)
                    IconButton(
                      onPressed: () => setState(() => _customLogoUrl = null),
                      icon: const Icon(
                        Icons.close_rounded,
                        size: 18,
                        color: AppColors.textSecondary,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Expanded(
                    child: Text(
                      'Show Team Logos on Standings Poster',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Switch.adaptive(
                    value: _showLogos,
                    activeThumbColor: AppColors.accent,
                    onChanged: (v) {
                      HapticFeedback.selectionClick();
                      setState(() => _showLogos = v);
                    },
                  ),
                ],
              ),
              const Divider(height: 18),
              Row(
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Auto Result from Screenshot',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          '100% Free Offline OCR · Requires Player 1 IGN per squad (plain letters work with stylish symbols)',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Switch.adaptive(
                    value: _autoResultFromScreenshot,
                    activeThumbColor: AppColors.accent,
                    onChanged: (v) {
                      HapticFeedback.selectionClick();
                      setState(() => _autoResultFromScreenshot = v);
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Squad Count & Quick Tools Bar
        Row(
          children: [
            Expanded(
              child: Text(
                'SQUADS (${_squads.length})',
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                ),
              ),
            ),
            SecondaryPillButton(
              label: 'Paste List',
              icon: Icons.content_paste_rounded,
              onPressed: _openPasteRosterSheet,
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _QuickValueChip(
              label: 'Bulk Logos',
              selected: false,
              onTap: _bulkUploadLogos,
            ),
            if (widget.store.savedSquads.isNotEmpty)
              _QuickValueChip(
                label: 'Squad Vault (${widget.store.savedSquads.length})',
                selected: false,
                onTap: _openSquadVaultSheet,
              ),
          ],
        ),
        const SizedBox(height: 10),

        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ..._kSquadCountPresets.map((cnt) {
              return _QuickValueChip(
                label: '$cnt Squads',
                selected: !_customSquadCount && _squads.length == cnt,
                onTap: () {
                  setState(() => _customSquadCount = false);
                  _setTeamCount(cnt);
                },
              );
            }),
            _QuickValueChip(
              label: 'Custom',
              selected: _customSquadCount,
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() {
                  _customSquadCount = !_customSquadCount;
                  _customSquadCtrl.text = '${_squads.length}';
                });
              },
            ),
          ],
        ),
        if (_customSquadCount) ...[
          const SizedBox(height: 12),
          TextField(
            controller: _customSquadCtrl,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            onChanged: (raw) {
              final parsed = int.tryParse(raw.trim());
              if (parsed != null && parsed >= 2) {
                _setTeamCount(parsed);
              }
            },
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
            decoration: const InputDecoration(
              labelText: 'Custom Squad Count (2-24)',
              hintText: 'e.g. 14',
              suffixText: 'squads',
            ),
          ),
        ],
        const SizedBox(height: 12),

        ...List.generate(_squads.length, (i) {
          final squad = _squads[i];
          final missingP1 = _autoResultFromScreenshot &&
              squad.player1Ctrl.text.trim().isEmpty;

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Container(
              padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: missingP1
                      ? AppColors.accentBorder
                      : AppColors.borderSubtle,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      SizedBox(
                        width: 24,
                        child: Text(
                          '#${i + 1}',
                          style: kTabularNumbers.copyWith(
                            color: AppColors.textMuted,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () async {
                          final img = await _pickImageAsDataUrl();
                          if (img != null && mounted) {
                            setState(() => squad.logoUrl = img);
                          }
                        },
                        child: SquadBadge(
                          teamName: squad.controller.text.trim().isEmpty
                              ? 'T${i + 1}'
                              : squad.controller.text.trim(),
                          logoUrl: squad.logoUrl,
                          size: 38,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: squad.controller,
                          onChanged: (_) {
                            _autoHydrateSquadFromVault(squad);
                            setState(() {});
                          },
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Team ${i + 1}',
                            filled: false,
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 8,
                            ),
                          ),
                        ),
                      ),
                      if (squad.logoUrl != null)
                        IconButton(
                          onPressed: () => setState(() => squad.logoUrl = null),
                          icon: const Icon(
                            Icons.hide_image_outlined,
                            size: 18,
                            color: AppColors.textMuted,
                          ),
                        ),
                      if (_squads.length > 2)
                        IconButton(
                          onPressed: () {
                            HapticFeedback.selectionClick();
                            setState(() {
                              final removed = _squads.removeAt(i);
                              removed.dispose();
                            });
                          },
                          icon: const Icon(
                            Icons.close_rounded,
                            size: 18,
                            color: AppColors.textMuted,
                          ),
                        ),
                    ],
                  ),
                  if (_autoResultFromScreenshot) ...[
                    const SizedBox(height: 6),
                    Padding(
                      padding: const EdgeInsets.only(right: 4, bottom: 2),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: squad.player1Ctrl,
                              onChanged: (_) => setState(() {}),
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                              ),
                              decoration: const InputDecoration(
                                labelText: 'Player 1 IGN *',
                                hintText: 'Plain word e.g. OPPY',
                                isDense: true,
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 9,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: squad.player2Ctrl,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                              ),
                              decoration: const InputDecoration(
                                labelText: 'Player 2 (Opt)',
                                hintText: 'Optional 2nd IGN',
                                isDense: true,
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 9,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        }),

        if (_squads.length < 24)
          SecondaryPillButton(
            label: 'Add Squad Slot',
            icon: Icons.add_rounded,
            expand: true,
            onPressed: () => _setTeamCount(_squads.length + 1),
          ),

        const SizedBox(height: 20),
        PrimaryPillButton(
          label: _isEditing ? 'Save Changes' : 'Launch Tournament',
          icon: _isEditing
              ? Icons.check_rounded
              : Icons.rocket_launch_rounded,
          expand: true,
          onPressed: _submit,
        ),
      ],
    );
  }
}

class _FormatCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _FormatCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return TactileCard(
      onTap: onTap,
      padding: const EdgeInsets.all(15),
      backgroundColor:
          selected ? AppColors.accentSurface : AppColors.surface,
      borderColor: selected ? AppColors.accentBorder : AppColors.borderSubtle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                size: 20,
                color: selected ? AppColors.accentBright : AppColors.textSecondary,
              ),
              const Spacer(),
              if (selected)
                const Icon(
                  Icons.check_circle_rounded,
                  size: 17,
                  color: AppColors.accentBright,
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 11,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickValueChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _QuickValueChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.accent : AppColors.inputFill,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? AppColors.accent : AppColors.borderStrong,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? AppColors.inkOnAccent : AppColors.textPrimary,
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
