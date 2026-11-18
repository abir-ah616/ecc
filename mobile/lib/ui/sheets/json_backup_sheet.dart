import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../state/tournament_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class JsonBackupSheet extends StatefulWidget {
  final TournamentStore store;

  const JsonBackupSheet({super.key, required this.store});

  @override
  State<JsonBackupSheet> createState() => _JsonBackupSheetState();
}

class _JsonBackupSheetState extends State<JsonBackupSheet> {
  final TextEditingController _importCtrl = TextEditingController();
  String? _statusMessage;
  bool _isError = false;

  @override
  void dispose() {
    _importCtrl.dispose();
    super.dispose();
  }

  Future<void> _copyBackup() async {
    final json = widget.store.exportJson();
    await Clipboard.setData(ClipboardData(text: json));
    HapticFeedback.mediumImpact();
    if (!mounted) return;
    setState(() {
      _isError = false;
      _statusMessage =
          'Copied JSON backup (${widget.store.tournaments.length} tournaments) to clipboard.';
    });
  }

  Future<void> _shareBackupFile() async {
    if (kIsWeb) {
      await _copyBackup();
      return;
    }
    try {
      final dir = await getTemporaryDirectory();
      final file = File(
        '${dir.path}/esp_calc_backup_${DateTime.now().millisecondsSinceEpoch}.json',
      );
      await file.writeAsString(widget.store.exportJson(), encoding: utf8);
      await Share.shareXFiles([XFile(file.path)], text: 'EspCalc Backup');
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isError = true;
        _statusMessage = 'Could not share backup file: $e';
      });
    }
  }

  void _restore() {
    final raw = _importCtrl.text.trim();
    if (raw.isEmpty) {
      setState(() {
        _isError = true;
        _statusMessage = 'Paste a valid JSON backup before restoring.';
      });
      return;
    }

    final ok = widget.store.importJson(raw);
    HapticFeedback.mediumImpact();
    setState(() {
      if (ok) {
        _isError = false;
        _statusMessage =
            'Restored ${widget.store.tournaments.length} tournament(s) successfully.';
        _importCtrl.clear();
      } else {
        _isError = true;
        _statusMessage = 'Invalid JSON structure. Must contain a tournaments array.';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          0,
          20,
          MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SheetHeader(
                title: 'JSON Backup & Restore',
                subtitle:
                    '${widget.store.tournaments.length} tournament(s) currently stored',
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: PrimaryPillButton(
                      label: 'Copy JSON',
                      icon: Icons.copy_rounded,
                      onPressed: _copyBackup,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: SecondaryPillButton(
                      label: 'Export File',
                      icon: Icons.ios_share_rounded,
                      onPressed: _shareBackupFile,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Text(
                'RESTORE FROM JSON',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.9,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _importCtrl,
                maxLines: 5,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 12,
                  fontFamily: 'monospace',
                ),
                decoration: const InputDecoration(
                  hintText: '{"tournaments": [...]}',
                ),
              ),
              const SizedBox(height: 12),
              if (_statusMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _isError
                          ? AppColors.crimsonSurface
                          : AppColors.emeraldSurface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _isError
                            ? const Color(0x55EF4444)
                            : const Color(0x5522C55E),
                      ),
                    ),
                    child: Text(
                      _statusMessage!,
                      style: TextStyle(
                        color: _isError
                            ? AppColors.crimson
                            : AppColors.emerald,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              SecondaryPillButton(
                label: 'Restore Backup',
                icon: Icons.restore_rounded,
                expand: true,
                onPressed: _restore,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
