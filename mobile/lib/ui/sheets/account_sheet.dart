import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/screenshot_scanner.dart';
import '../../state/auth_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

class AccountSheet extends StatefulWidget {
  final AuthStore authStore;
  final VoidCallback onOpenJson;
  final VoidCallback onOpenRules;
  final VoidCallback onOpenAdmin;

  const AccountSheet({
    super.key,
    required this.authStore,
    required this.onOpenJson,
    required this.onOpenRules,
    required this.onOpenAdmin,
  });

  @override
  State<AccountSheet> createState() => _AccountSheetState();
}

class _AccountSheetState extends State<AccountSheet> {
  final TextEditingController _apiKeyCtrl = TextEditingController();
  String _savedKey = '';
  String _verifiedModel = 'gemini-2.5-flash';
  bool _obscureKey = true;
  bool _verifying = false;
  bool _showGuide = false;
  String? _keyFeedback;
  bool _keyFeedbackIsError = false;

  @override
  void initState() {
    super.initState();
    _loadSavedKey();
  }

  @override
  void dispose() {
    _apiKeyCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSavedKey() async {
    final email = widget.authStore.firebaseUser?.email ??
        widget.authStore.allowedRecord?.email;
    final stored = await getStoredGeminiApiKey(email);
    final model = await getStoredGeminiModel(email);
    if (!mounted) return;
    setState(() {
      _savedKey = stored;
      _verifiedModel = model;
      if (stored.isNotEmpty && _apiKeyCtrl.text.isEmpty) {
        _apiKeyCtrl.text = stored;
      }
      _showGuide = stored.isEmpty;
    });
  }

  Future<void> _pasteFromClipboard() async {
    final clip = await Clipboard.getData(Clipboard.kTextPlain);
    final text = (clip?.text ?? '').trim();
    if (text.isEmpty) return;
    HapticFeedback.selectionClick();
    setState(() {
      _apiKeyCtrl.text = text;
      _keyFeedback = null;
    });
  }

  Future<void> _verifyAndSave() async {
    if (_verifying) return;
    final raw = _apiKeyCtrl.text.trim();
    if (raw.isEmpty) {
      setState(() {
        _keyFeedback = 'Paste your Google AI Studio API key first.';
        _keyFeedbackIsError = true;
      });
      return;
    }

    setState(() {
      _verifying = true;
      _keyFeedback = null;
    });

    final res = await verifyGeminiApiKey(raw);
    if (!mounted) return;

    if (!res.valid) {
      HapticFeedback.mediumImpact();
      setState(() {
        _verifying = false;
        _keyFeedback = res.error ?? 'API key verification failed.';
        _keyFeedbackIsError = true;
      });
      return;
    }

    final email = widget.authStore.firebaseUser?.email ??
        widget.authStore.allowedRecord?.email;
    final clean = sanitizeGeminiApiKey(raw);
    final chosenModel = res.model ?? 'gemini-2.5-flash';
    await setStoredGeminiApiKey(
      userEmail: email,
      apiKey: clean,
      verifiedModel: chosenModel,
    );
    HapticFeedback.heavyImpact();
    if (!mounted) return;
    setState(() {
      _verifying = false;
      _savedKey = clean;
      _verifiedModel = chosenModel;
      _obscureKey = true;
      _showGuide = false;
      _keyFeedback = 'Gemini API verified & ready ($chosenModel).';
      _keyFeedbackIsError = false;
    });
  }

  Future<void> _removeKey() async {
    final email = widget.authStore.firebaseUser?.email ??
        widget.authStore.allowedRecord?.email;
    await clearStoredGeminiApiKey(email);
    HapticFeedback.selectionClick();
    if (!mounted) return;
    setState(() {
      _savedKey = '';
      _apiKeyCtrl.clear();
      _showGuide = true;
      _keyFeedback = 'Removed saved Gemini API key from this device.';
      _keyFeedbackIsError = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.authStore,
      builder: (context, _) {
        final user = widget.authStore.firebaseUser;
        final record = widget.authStore.allowedRecord;
        final canUseAiAuto = widget.authStore.canUseAiAuto;
        final displayName = record?.displayName.isNotEmpty == true
            ? record!.displayName
            : (user?.displayName ?? 'Organizer');
        final email = user?.email ?? record?.email ?? 'Signed out';
        final bottomInset = MediaQuery.of(context).viewInsets.bottom;

        return Padding(
          padding: EdgeInsets.only(bottom: bottomInset),
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SheetHeader(
                    title: 'Organizer Workspace',
                    subtitle: 'Firebase verified session & device tools',
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
                                    label: widget.authStore.isAdmin
                                        ? 'ADMIN'
                                        : 'ORGANIZER',
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

                  if (canUseAiAuto) ...[
                    TactileCard(
                      padding: const EdgeInsets.all(14),
                      borderColor: _savedKey.isNotEmpty
                          ? const Color(0x5510B981)
                          : AppColors.accentBorder,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: _savedKey.isNotEmpty
                                      ? AppColors.emeraldSurface
                                      : AppColors.accentSurface,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  Icons.vpn_key_rounded,
                                  size: 17,
                                  color: _savedKey.isNotEmpty
                                      ? AppColors.emerald
                                      : AppColors.accentBright,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'AI Auto Standings · Gemini API',
                                      style: TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    Text(
                                      _savedKey.isNotEmpty
                                          ? 'Connected (${maskGeminiApiKey(_savedKey)} · $_verifiedModel)'
                                          : 'Add your free Google AI Studio key to scan screenshots',
                                      style: const TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              StatusPill(
                                label:
                                    _savedKey.isNotEmpty ? 'ACTIVE' : 'REQUIRED',
                                backgroundColor: _savedKey.isNotEmpty
                                    ? AppColors.emeraldSurface
                                    : AppColors.accentSurface,
                                borderColor: _savedKey.isNotEmpty
                                    ? const Color(0x5510B981)
                                    : AppColors.accentBorder,
                                textColor: _savedKey.isNotEmpty
                                    ? AppColors.emerald
                                    : AppColors.accentBright,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _apiKeyCtrl,
                            obscureText: _obscureKey,
                            autocorrect: false,
                            enableSuggestions: false,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Paste AIza... Gemini API key',
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 11,
                              ),
                              suffixIcon: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    visualDensity: VisualDensity.compact,
                                    tooltip: 'Paste key',
                                    onPressed: _pasteFromClipboard,
                                    icon: const Icon(
                                      Icons.content_paste_rounded,
                                      size: 17,
                                      color: AppColors.accentBright,
                                    ),
                                  ),
                                  IconButton(
                                    visualDensity: VisualDensity.compact,
                                    tooltip: _obscureKey
                                        ? 'Show API key'
                                        : 'Hide API key',
                                    onPressed: () => setState(
                                        () => _obscureKey = !_obscureKey),
                                    icon: Icon(
                                      _obscureKey
                                          ? Icons.visibility_outlined
                                          : Icons.visibility_off_outlined,
                                      size: 17,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: PrimaryPillButton(
                                  label: _verifying
                                      ? 'Verifying...'
                                      : 'Verify & Save Key',
                                  icon: Icons.verified_rounded,
                                  isLoading: _verifying,
                                  onPressed: _verifying ? null : _verifyAndSave,
                                ),
                              ),
                              if (_savedKey.isNotEmpty) ...[
                                const SizedBox(width: 8),
                                SecondaryPillButton(
                                  label: 'Remove',
                                  icon: Icons.delete_outline_rounded,
                                  textColor: AppColors.crimson,
                                  borderColor: const Color(0x55EF4444),
                                  onPressed: _removeKey,
                                ),
                              ],
                            ],
                          ),
                          if (_keyFeedback != null) ...[
                            const SizedBox(height: 9),
                            Text(
                              _keyFeedback!,
                              style: TextStyle(
                                color: _keyFeedbackIsError
                                    ? AppColors.crimson
                                    : AppColors.emerald,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: () =>
                                setState(() => _showGuide = !_showGuide),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.help_outline_rounded,
                                  size: 14,
                                  color: AppColors.accentBright,
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  _showGuide
                                      ? 'Hide free API key setup guide'
                                      : 'How to get a free Gemini API key (30 sec)',
                                  style: const TextStyle(
                                    color: AppColors.accentBright,
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (_showGuide) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(11),
                              decoration: BoxDecoration(
                                color: AppColors.inputFill,
                                borderRadius: BorderRadius.circular(12),
                                border:
                                    Border.all(color: AppColors.borderSubtle),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    '1. Open aistudio.google.com/apikey in Chrome and sign in with Google.\n'
                                    '2. Tap "Create API Key" (Free tier — scans ~250–1,000 matches/day with zero billing).\n'
                                    '3. Copy the AIza... key, tap Paste above, and tap Verify & Save.',
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 11,
                                      height: 1.45,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  GestureDetector(
                                    onTap: () async {
                                      await Clipboard.setData(
                                        const ClipboardData(
                                          text:
                                              'https://aistudio.google.com/apikey',
                                        ),
                                      );
                                      HapticFeedback.selectionClick();
                                      if (!mounted) return;
                                      setState(() {
                                        _keyFeedback =
                                            'Copied https://aistudio.google.com/apikey — open in browser to create your free key.';
                                        _keyFeedbackIsError = false;
                                      });
                                    },
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.copy_rounded,
                                          size: 13,
                                          color: AppColors.accentBright,
                                        ),
                                        SizedBox(width: 5),
                                        Text(
                                          'Copy aistudio.google.com/apikey URL',
                                          style: TextStyle(
                                            color: AppColors.accentBright,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],

                  _SheetTile(
                    icon: Icons.tune_rounded,
                    title: 'Scoring Matrix & Rules',
                    subtitle: 'Customize placement points and kill multipliers',
                    onTap: () {
                      Navigator.pop(context);
                      widget.onOpenRules();
                    },
                  ),
                  const SizedBox(height: 8),
                  _SheetTile(
                    icon: Icons.data_object_rounded,
                    title: 'JSON Backup & Restore',
                    subtitle: 'Export tournaments or restore saved data',
                    onTap: () {
                      Navigator.pop(context);
                      widget.onOpenJson();
                    },
                  ),
                  if (widget.authStore.isAdmin) ...[
                    const SizedBox(height: 8),
                    _SheetTile(
                      icon: Icons.verified_user_outlined,
                      title:
                          'Access Control (${widget.authStore.allUsers.length})',
                      subtitle: 'Manage authorized accounts & AI Auto access',
                      accent: true,
                      onTap: () {
                        Navigator.pop(context);
                        widget.onOpenAdmin();
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
                      await widget.authStore.logout();
                    },
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'ESP CALC STUDIO · MADE BY MR. OPPY',
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
