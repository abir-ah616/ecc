import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/roster_helpers.dart';
import '../../models/tournament_models.dart';
import '../../services/screenshot_scanner.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';
import 'squad_players_sheet.dart';

class _EditableScanRow {
  final int rank;
  int kills;
  String teamId;
  final String rawPlayerText;
  final List<String> normalizedTokens;
  final double matchConfidence;

  _EditableScanRow({
    required this.rank,
    required this.kills,
    required this.teamId,
    this.rawPlayerText = '',
    this.normalizedTokens = const [],
    this.matchConfidence = 0,
  });
}

class ScanScreenshotSheet extends StatefulWidget {
  final int matchNumber;
  final List<Team> teams;
  final bool autoResultEnabled;
  final void Function(List<Team> updatedTeams, bool autoResultEnabled)
      onUpdatePlayers;
  final void Function(
    List<({String teamId, int? placement, int kills})> entries,
    Map<String, List<String>> learnedByTeamId,
  ) onApply;

  const ScanScreenshotSheet({
    super.key,
    required this.matchNumber,
    required this.teams,
    required this.autoResultEnabled,
    required this.onUpdatePlayers,
    required this.onApply,
  });

  @override
  State<ScanScreenshotSheet> createState() => _ScanScreenshotSheetState();
}

class _ScanScreenshotSheetState extends State<ScanScreenshotSheet> {
  final ImagePicker _picker = ImagePicker();
  late List<Team> _teams;
  late bool _autoEnabled;
  List<XFile> _pickedImages = [];
  List<_EditableScanRow> _rows = [];
  bool _isScanning = false;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    _teams = List<Team>.from(widget.teams);
    _autoEnabled = widget.autoResultEnabled;
  }

  Future<void> _openPlayersEditor() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => SquadPlayersSheet(
        teams: _teams,
        autoResultEnabled: _autoEnabled,
        onSave: (updatedTeams, nextAuto) {
          widget.onUpdatePlayers(updatedTeams, nextAuto);
          if (!mounted) return;
          setState(() {
            _teams = updatedTeams;
            _autoEnabled = nextAuto;
            if (_rows.isNotEmpty) {
              final scannedLike = _rows
                  .map(
                    (r) => ScannedRankRow(
                      rank: r.rank,
                      kills: r.kills,
                      rawPlayerText: r.rawPlayerText,
                      normalizedTokens: r.normalizedTokens,
                      confidence: 80,
                      isEdgeClipped: false,
                      sourceImageIndex: 0,
                    ),
                  )
                  .toList();
              final rematched =
                  matchScannedRowsToTeams(scannedLike, updatedTeams);
              final byRank = {for (final m in rematched) m.rank: m};
              final usedTeams = _rows
                  .where((r) => r.teamId.isNotEmpty)
                  .map((r) => r.teamId)
                  .toSet();
              for (final r in _rows) {
                if (r.teamId.isNotEmpty) continue;
                final hit = byRank[r.rank];
                if (hit?.matchedTeamId != null &&
                    !usedTeams.contains(hit!.matchedTeamId)) {
                  r.teamId = hit.matchedTeamId!;
                  usedTeams.add(r.teamId);
                }
              }
            }
          });
        },
      ),
    );
  }

  Future<void> _pickImages() async {
    try {
      final selected = await _picker.pickMultiImage(imageQuality: 95);
      if (selected.isEmpty) return;
      setState(() {
        _pickedImages = [..._pickedImages, ...selected].take(3).toList();
        _errorMsg = null;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _errorMsg = 'Could not load screenshots from gallery.';
        });
      }
    }
  }

  Future<void> _runScan() async {
    if (_pickedImages.isEmpty) return;
    HapticFeedback.mediumImpact();
    setState(() {
      _isScanning = true;
      _errorMsg = null;
    });

    try {
      final matched = await scanMatchScreenshotsOffline(
        filePaths: _pickedImages.map((f) => f.path).toList(),
        teams: _teams,
      );

      final byRank = <int, MatchedScanRow>{
        for (final r in matched) r.rank: r,
      };
      final maxRank = math.max(
        _teams.length,
        matched.isEmpty
            ? 0
            : matched.map((r) => r.rank).reduce(math.max),
      );

      final built = <_EditableScanRow>[];
      for (int rk = 1; rk <= maxRank; rk++) {
        final hit = byRank[rk];
        built.add(
          _EditableScanRow(
            rank: rk,
            kills: hit?.kills ?? 0,
            teamId: hit?.matchedTeamId ?? '',
            rawPlayerText: hit?.rawPlayerText ?? '',
            normalizedTokens: hit?.normalizedTokens ?? const [],
            matchConfidence: hit?.matchConfidence ?? 0,
          ),
        );
      }

      if (!mounted) return;
      setState(() {
        _rows = built;
        _isScanning = false;
        if (matched.isEmpty) {
          _errorMsg =
              'No rank rows detected. Ensure the screenshot shows the post-match scoreboard (#1..#12).';
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isScanning = false;
        _errorMsg = 'Offline OCR scan failed. Please try a clearer screenshot.';
      });
    }
  }

  Set<String> _computeDuplicateTeamIds() {
    final counts = <String, int>{};
    for (final r in _rows) {
      if (r.teamId.isEmpty) continue;
      counts[r.teamId] = (counts[r.teamId] ?? 0) + 1;
    }
    return counts.entries
        .where((e) => e.value > 1)
        .map((e) => e.key)
        .toSet();
  }

  void _confirmAndApply() {
    final dupIds = _computeDuplicateTeamIds();
    if (dupIds.isNotEmpty) return;

    final entries = <({String teamId, int? placement, int kills})>[];
    final learnedByTeam = <String, List<String>>{};

    for (final r in _rows) {
      if (r.teamId.isEmpty) continue;
      entries.add((
        teamId: r.teamId,
        placement: r.rank,
        kills: math.max(0, r.kills),
      ));
      final tokens = extractLearnableTokens(r.normalizedTokens);
      if (tokens.isNotEmpty) {
        final prev = learnedByTeam[r.teamId] ?? const <String>[];
        learnedByTeam[r.teamId] = <String>{...prev, ...tokens}.toList();
      }
    }

    HapticFeedback.heavyImpact();
    widget.onApply(entries, learnedByTeam);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final dupTeamIds = _computeDuplicateTeamIds();
    final assignedCount = _rows.where((r) => r.teamId.isNotEmpty).length;
    final configuredSquads = _teams
        .where(
          (t) => resolveSquadPlayers(
            players: t.players,
            player1: t.player1,
            player2: t.player2,
          ).isNotEmpty,
        )
        .length;

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.55,
      maxChildSize: 0.95,
      expand: false,
      builder: (ctx, scrollCtrl) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.sheet,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              SheetHeader(
                title: 'Scan Match #${widget.matchNumber} Result (Beta)',
                subtitle:
                    '100% Free On-Device OCR · Attach 1-3 screenshots (overlaps deduplicated)',
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextButton.icon(
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 6,
                        ),
                      ),
                      onPressed: _openPlayersEditor,
                      icon: const Icon(
                        Icons.group_outlined,
                        size: 16,
                        color: AppColors.accentBright,
                      ),
                      label: Text(
                        'Players ($configuredSquads/${_teams.length})',
                        style: const TextStyle(
                          color: AppColors.accentBright,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(
                        Icons.close_rounded,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  controller: scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                  children: [
                    if (!_autoEnabled || configuredSquads == 0)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.accentSurface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.accentBorder),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  !_autoEnabled
                                      ? 'Auto-Match is currently off. Turn it on and add squad member IGNs anytime.'
                                      : 'Add 1 or more team member IGNs per squad so OCR matches squads automatically.',
                                  style: const TextStyle(
                                    color: AppColors.accentBright,
                                    fontSize: 11.5,
                                    height: 1.35,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: _openPlayersEditor,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 11,
                                    vertical: 7,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.accent,
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text(
                                    !_autoEnabled ? 'Turn On' : 'Add IGNs',
                                    style: const TextStyle(
                                      color: AppColors.inkOnAccent,
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                    // Picked screenshot strip
                    Row(
                      children: [
                        Expanded(
                          child: SecondaryPillButton(
                            label: _pickedImages.isEmpty
                                ? 'Pick 1-3 Screenshots'
                                : 'Add More (${_pickedImages.length}/3)',
                            icon: Icons.add_photo_alternate_rounded,
                            onPressed: _pickedImages.length >= 3 || _isScanning
                                ? null
                                : _pickImages,
                          ),
                        ),
                        if (_pickedImages.isNotEmpty) ...[
                          const SizedBox(width: 10),
                          Expanded(
                            child: PrimaryPillButton(
                              label: _rows.isEmpty ? 'Run OCR Scan' : 'Re-Scan',
                              icon: Icons.document_scanner_rounded,
                              isLoading: _isScanning,
                              onPressed: _isScanning ? null : _runScan,
                            ),
                          ),
                        ],
                      ],
                    ),

                    if (_pickedImages.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 68,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _pickedImages.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 10),
                          itemBuilder: (_, idx) {
                            final f = _pickedImages[idx];
                            return Stack(
                              clipBehavior: Clip.none,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    width: 108,
                                    height: 68,
                                    decoration: BoxDecoration(
                                      border: Border.all(
                                        color: AppColors.borderStrong,
                                      ),
                                    ),
                                    child: Image.file(
                                      File(f.path),
                                      fit: BoxFit.cover,
                                      cacheWidth: 240,
                                      errorBuilder: (_, __, ___) => const Center(
                                        child: Icon(
                                          Icons.image_outlined,
                                          color: AppColors.textMuted,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                Positioned(
                                  right: -6,
                                  top: -6,
                                  child: GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _pickedImages.removeAt(idx);
                                      });
                                    },
                                    child: Container(
                                      width: 22,
                                      height: 22,
                                      decoration: const BoxDecoration(
                                        color: AppColors.crimson,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.close_rounded,
                                        size: 13,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                    ],

                    if (_errorMsg != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.crimsonSurface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0x55EF4444)),
                        ),
                        child: Text(
                          _errorMsg!,
                          style: const TextStyle(
                            color: AppColors.crimson,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],

                    if (_rows.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Text(
                            'REVIEW RANKS ($assignedCount/${widget.teams.length} MATCHED)',
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.9,
                            ),
                          ),
                          const Spacer(),
                          if (dupTeamIds.isNotEmpty)
                            const Text(
                              'Fix duplicate squad',
                              style: TextStyle(
                                color: AppColors.crimson,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ...List.generate(_rows.length, (i) {
                        final row = _rows[i];
                        final isDup = row.teamId.isNotEmpty &&
                            dupTeamIds.contains(row.teamId);

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Container(
                            padding: const EdgeInsets.fromLTRB(12, 10, 10, 10),
                            decoration: BoxDecoration(
                              color: isDup
                                  ? AppColors.crimsonSurface
                                  : row.rank == 1
                                      ? AppColors.accentSurface
                                      : AppColors.surface,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isDup
                                    ? AppColors.crimson
                                    : row.rank == 1
                                        ? AppColors.accentBorder
                                        : AppColors.borderSubtle,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 34,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 5,
                                      ),
                                      decoration: BoxDecoration(
                                        color: row.rank == 1
                                            ? AppColors.accent
                                            : AppColors.inputFill,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        '#${row.rank}',
                                        style: kTabularNumbers.copyWith(
                                          color: row.rank == 1
                                              ? AppColors.inkOnAccent
                                              : AppColors.textPrimary,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppColors.inputFill,
                                          borderRadius:
                                              BorderRadius.circular(10),
                                          border: Border.all(
                                            color: row.teamId.isEmpty
                                                ? AppColors.accentBorder
                                                : AppColors.borderSubtle,
                                          ),
                                        ),
                                        child: DropdownButtonHideUnderline(
                                          child: DropdownButton<String>(
                                            value: row.teamId.isEmpty
                                                ? ''
                                                : row.teamId,
                                            isExpanded: true,
                                            dropdownColor:
                                                AppColors.surfaceElevated,
                                            style: const TextStyle(
                                              color: AppColors.textPrimary,
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                            ),
                                            items: [
                                              const DropdownMenuItem(
                                                value: '',
                                                child: Text(
                                                  '-- Select Squad --',
                                                  style: TextStyle(
                                                    color: AppColors.textMuted,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ),
                                              ..._teams.map(
                                                (tm) => DropdownMenuItem(
                                                  value: tm.id,
                                                  child: Text(
                                                    tm.name,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ),
                                            ],
                                            onChanged: (nextId) {
                                              setState(() {
                                                row.teamId = nextId ?? '';
                                              });
                                            },
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    // Kills stepper
                                    Container(
                                      decoration: BoxDecoration(
                                        color: AppColors.inputFill,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(
                                          color: AppColors.borderSubtle,
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          InkWell(
                                            onTap: row.kills > 0
                                                ? () => setState(
                                                      () => row.kills--,
                                                    )
                                                : null,
                                            child: const Padding(
                                              padding: EdgeInsets.all(7),
                                              child: Icon(
                                                Icons.remove_rounded,
                                                size: 15,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                          ),
                                          SizedBox(
                                            width: 24,
                                            child: Text(
                                              '${row.kills}',
                                              textAlign: TextAlign.center,
                                              style: kTabularNumbers.copyWith(
                                                color: AppColors.textPrimary,
                                                fontSize: 13,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                          ),
                                          InkWell(
                                            onTap: () =>
                                                setState(() => row.kills++),
                                            child: const Padding(
                                              padding: EdgeInsets.all(7),
                                              child: Icon(
                                                Icons.add_rounded,
                                                size: 15,
                                                color: AppColors.textPrimary,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                if (row.rawPlayerText.isNotEmpty) ...[
                                  const SizedBox(height: 5),
                                  Text(
                                    'OCR: ${row.rawPlayerText}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: AppColors.textMuted,
                                      fontSize: 10.5,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ),
              if (_rows.isNotEmpty)
                SafeArea(
                  top: false,
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 14),
                    decoration: const BoxDecoration(
                      color: AppColors.canvas,
                      border: Border(
                        top: BorderSide(color: AppColors.borderSubtle),
                      ),
                    ),
                    child: PrimaryPillButton(
                      label: dupTeamIds.isNotEmpty
                          ? 'Fix Duplicate Squads First'
                          : 'Apply $assignedCount Squads to Match #${widget.matchNumber}',
                      icon: Icons.check_circle_rounded,
                      expand: true,
                      onPressed: assignedCount > 0 && dupTeamIds.isEmpty
                          ? _confirmAndApply
                          : null,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
