import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/firebase_config.dart';
import '../../models/auth_models.dart';
import '../../services/screenshot_scanner.dart';
import '../../state/auth_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

enum _MobileUserFilter { all, admin, user, disabled, temp }

enum _AdminSection { users, aiKeys }

enum _AiKeyFilter { all, enabled, needsKeys }

class AdminDashboardSheet extends StatefulWidget {
  final AuthStore authStore;

  const AdminDashboardSheet({super.key, required this.authStore});

  @override
  State<AdminDashboardSheet> createState() => _AdminDashboardSheetState();
}

class _AdminDashboardSheetState extends State<AdminDashboardSheet> {
  final _emailCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _newAiKeysCtrl = TextEditingController();
  final _searchCtrl = TextEditingController();
  final _aiSearchCtrl = TextEditingController();
  final Map<String, TextEditingController> _keyDraftCtrls = {};

  _AdminSection _section = _AdminSection.users;
  UserRole _newRole = UserRole.user;
  bool _newAllowAiAuto = false;
  _MobileUserFilter _filter = _MobileUserFilter.all;
  _AiKeyFilter _aiFilter = _AiKeyFilter.all;

  bool _saving = false;
  bool _togglingTemp = false;
  String? _feedback;

  String? _busyAiEmail;
  final Set<String> _revealedKeyIds = <String>{};
  final Map<String, ({bool isError, String message})> _rowStatusByEmail = {};

  TextEditingController _draftCtrlFor(String email) {
    return _keyDraftCtrls.putIfAbsent(email, () => TextEditingController());
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _nameCtrl.dispose();
    _notesCtrl.dispose();
    _newAiKeysCtrl.dispose();
    _searchCtrl.dispose();
    _aiSearchCtrl.dispose();
    for (final c in _keyDraftCtrls.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _addUser() async {
    if (_saving) return;
    setState(() {
      _saving = true;
      _feedback = null;
    });
    try {
      final initialKeys = parseMultiApiKeyInput(_newAiKeysCtrl.text);
      final shouldAllowAi = _newRole == UserRole.admin ||
          _newAllowAiAuto ||
          initialKeys.isNotEmpty;

      await widget.authStore.addAllowedUser(
        email: _emailCtrl.text,
        displayName: _nameCtrl.text,
        role: _newRole,
        allowAiAuto: shouldAllowAi,
        aiApiKeys: initialKeys.isNotEmpty ? initialKeys : null,
        notes: _notesCtrl.text,
      );
      HapticFeedback.mediumImpact();
      _emailCtrl.clear();
      _nameCtrl.clear();
      _notesCtrl.clear();
      _newAiKeysCtrl.clear();
      _newAllowAiAuto = false;
      if (mounted) {
        setState(() {
          _feedback = initialKeys.isNotEmpty
              ? 'User added with ${initialKeys.length} personal API key(s).'
              : 'User added to Firestore allowlist.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(
            () => _feedback = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _toggleTempLogin(bool nextValue) async {
    if (_togglingTemp) return;
    setState(() {
      _togglingTemp = true;
      _feedback = null;
    });
    try {
      await widget.authStore.setAllowTempLogin(nextValue);
      HapticFeedback.selectionClick();
      if (mounted) {
        setState(() {
          _feedback = nextValue
              ? 'Temp Login enabled across Web & Android.'
              : 'Temp Login disabled. Existing & new temp logins blocked.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(
            () => _feedback = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _togglingTemp = false);
    }
  }

  Future<void> _verifyAndAddKeysForUser(AllowedUserRecord u) async {
    if (_busyAiEmail != null) return;
    final ctrl = _draftCtrlFor(u.email);
    final parsedNew = parseMultiApiKeyInput(ctrl.text);
    if (parsedNew.isEmpty) {
      setState(() {
        _rowStatusByEmail[u.email] = (
          isError: true,
          message:
              'Paste 1 or more valid API keys (separated by newline or comma).',
        );
      });
      return;
    }

    final existing = sanitizeAiApiKeyList(u.aiApiKeys);
    final existingSet = existing.toSet();
    final uniqueToAdd =
        parsedNew.where((k) => !existingSet.contains(k)).toList();

    if (uniqueToAdd.isEmpty) {
      ctrl.clear();
      setState(() {
        _rowStatusByEmail[u.email] = (
          isError: false,
          message: 'Key(s) already assigned to this user.',
        );
      });
      return;
    }

    if (existing.length + uniqueToAdd.length > 25) {
      setState(() {
        _rowStatusByEmail[u.email] = (
          isError: true,
          message: 'Maximum 25 personal API keys per user reached.',
        );
      });
      return;
    }

    setState(() {
      _busyAiEmail = u.email;
      _rowStatusByEmail.remove(u.email);
    });

    try {
      String? primaryDetectedModel;
      for (final candidate in uniqueToAdd) {
        final check = await verifyAdminAiApiKey(candidate);
        if (!check.valid) {
          if (!mounted) return;
          setState(() {
            _rowStatusByEmail[u.email] = (
              isError: true,
              message:
                  'Key ${maskApiKey(candidate)} failed check: ${check.error ?? 'Invalid key.'}',
            );
          });
          return;
        }
        primaryDetectedModel ??= check.primaryModel;
      }

      final merged = sanitizeAiApiKeyList(<String>[...existing, ...uniqueToAdd]);
      await widget.authStore.setUserAiConfig(
        email: u.email,
        allowAiAuto: true,
        aiApiKeys: merged,
      );
      HapticFeedback.mediumImpact();
      ctrl.clear();
      if (!mounted) return;
      final modelNote = primaryDetectedModel != null
          ? ' ($primaryDetectedModel)'
          : '';
      setState(() {
        _rowStatusByEmail[u.email] = (
          isError: false,
          message:
              'Added ${uniqueToAdd.length} verified key(s)$modelNote. Pool size: ${merged.length}.',
        );
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _rowStatusByEmail[u.email] = (
          isError: true,
          message: e.toString().replaceFirst('Exception: ', ''),
        );
      });
    } finally {
      if (mounted) {
        setState(() => _busyAiEmail = null);
      }
    }
  }

  Future<void> _removeKeyFromUser(
    AllowedUserRecord u,
    String keyToRemove,
  ) async {
    if (_busyAiEmail != null) return;
    final nextKeys = u.aiApiKeys.where((k) => k != keyToRemove).toList();
    setState(() => _busyAiEmail = u.email);
    try {
      await widget.authStore.setUserAiConfig(
        email: u.email,
        aiApiKeys: nextKeys,
      );
      HapticFeedback.selectionClick();
      if (!mounted) return;
      setState(() {
        _rowStatusByEmail[u.email] = (
          isError: false,
          message:
              'Removed ${maskApiKey(keyToRemove)}. Remaining keys: ${nextKeys.length}.',
        );
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _rowStatusByEmail[u.email] = (
          isError: true,
          message: e.toString().replaceFirst('Exception: ', ''),
        );
      });
    } finally {
      if (mounted) {
        setState(() => _busyAiEmail = null);
      }
    }
  }

  String _roleLabel(UserRole r, bool isSuper) {
    if (isSuper) return 'SUPER ADMIN';
    switch (r) {
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.temp:
        return 'TEMP';
      case UserRole.user:
        return 'USER';
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.authStore,
      builder: (context, _) {
        if (!widget.authStore.isAdmin) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock_outline_rounded,
                    color: AppColors.crimson, size: 32),
                SizedBox(height: 12),
                Text(
                  'Administrator privileges required.',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          );
        }

        final users = widget.authStore.allUsers;
        final allowTemp = widget.authStore.allowTempLogin;
        final totalAssignedKeys =
            users.fold<int>(0, (sum, u) => sum + u.aiApiKeys.length);

        return DraggableScrollableSheet(
          initialChildSize: 0.92,
          minChildSize: 0.55,
          maxChildSize: 0.96,
          expand: false,
          builder: (ctx, scrollController) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              child: Column(
                children: [
                  SheetHeader(
                    title: 'Admin Control Center',
                    subtitle:
                        '${users.length} accounts · $totalAssignedKeys personal AI keys synced',
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 4),
                    child: SegmentedToggle<_AdminSection>(
                      selected: _section,
                      onChanged: (next) => setState(() => _section = next),
                      items: [
                        (
                          value: _AdminSection.users,
                          label: 'Users & Roles',
                          icon: Icons.group_rounded,
                        ),
                        (
                          value: _AdminSection.aiKeys,
                          label: 'AI / API Keys ($totalAssignedKeys)',
                          icon: Icons.vpn_key_rounded,
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: _section == _AdminSection.users
                        ? _buildUsersSection(
                            scrollController: scrollController,
                            users: users,
                            allowTemp: allowTemp,
                          )
                        : _buildAiKeysSection(
                            scrollController: scrollController,
                            users: users,
                            totalAssignedKeys: totalAssignedKeys,
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildUsersSection({
    required ScrollController scrollController,
    required List<AllowedUserRecord> users,
    required bool allowTemp,
  }) {
    final query = _searchCtrl.text.trim().toLowerCase();
    final filtered = users.where((u) {
      final matchesQuery = query.isEmpty ||
          u.email.toLowerCase().contains(query) ||
          u.displayName.toLowerCase().contains(query);
      if (!matchesQuery) return false;
      switch (_filter) {
        case _MobileUserFilter.all:
          return true;
        case _MobileUserFilter.admin:
          return u.role == UserRole.admin;
        case _MobileUserFilter.user:
          return u.role == UserRole.user && u.status == UserStatus.active;
        case _MobileUserFilter.disabled:
          return u.status == UserStatus.disabled;
        case _MobileUserFilter.temp:
          return u.role == UserRole.temp;
      }
    }).toList();

    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
      children: [
        // Allow Temp Login Master Switch
        TactileCard(
          padding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 12,
          ),
          borderColor:
              allowTemp ? const Color(0x6638BDF8) : AppColors.borderSubtle,
          backgroundColor:
              allowTemp ? const Color(0x1438BDF8) : AppColors.surface,
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: allowTemp
                      ? const Color(0x2238BDF8)
                      : AppColors.inputFill,
                  borderRadius: BorderRadius.circular(11),
                  border: Border.all(
                    color: allowTemp
                        ? const Color(0x6638BDF8)
                        : AppColors.borderSubtle,
                  ),
                ),
                child: Icon(
                  Icons.schedule_rounded,
                  size: 19,
                  color: allowTemp
                      ? const Color(0xFF38BDF8)
                      : AppColors.textMuted,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Allow Temp Login',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      allowTemp
                          ? 'ON · Anyone can sign in as Temp User'
                          : 'OFF · Temp users blocked across Web & App',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Switch.adaptive(
                value: allowTemp,
                activeThumbColor: const Color(0xFF38BDF8),
                onChanged: _togglingTemp ? null : _toggleTempLogin,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Grant New Email Access Form
        TactileCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Authorize Google Account',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Google Email',
                  hintText: 'organizer@gmail.com',
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Display Name',
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  DropdownButtonHideUnderline(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.inputFill,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: AppColors.borderSubtle,
                        ),
                      ),
                      child: DropdownButton<UserRole>(
                        value: _newRole,
                        dropdownColor: AppColors.surfaceElevated,
                        items: const [
                          DropdownMenuItem(
                            value: UserRole.user,
                            child: Text('User'),
                          ),
                          DropdownMenuItem(
                            value: UserRole.admin,
                            child: Text('Admin'),
                          ),
                          DropdownMenuItem(
                            value: UserRole.temp,
                            child: Text('Temp'),
                          ),
                        ],
                        onChanged: (r) {
                          if (r != null) {
                            setState(() => _newRole = r);
                          }
                        },
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _notesCtrl,
                decoration: const InputDecoration(
                  labelText: 'Notes (Optional)',
                ),
              ),
              if (_newRole != UserRole.admin) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: _newAllowAiAuto
                        ? AppColors.accentSurface
                        : AppColors.inputFill,
                    borderRadius: BorderRadius.circular(13),
                    border: Border.all(
                      color: _newAllowAiAuto
                          ? AppColors.accentBorder
                          : AppColors.borderSubtle,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.document_scanner_rounded,
                        size: 18,
                        color: _newAllowAiAuto
                            ? AppColors.accentBright
                            : AppColors.textMuted,
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Allow AI Auto Standings (Beta)',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              'Unlocks AI screenshot auto-standings (Beta) for this user',
                              style: TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 10.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Switch.adaptive(
                        value: _newAllowAiAuto,
                        activeThumbColor: AppColors.accent,
                        onChanged: (v) {
                          HapticFeedback.selectionClick();
                          setState(() => _newAllowAiAuto = v);
                        },
                      ),
                    ],
                  ),
                ),
              ],
              if (_newRole == UserRole.admin || _newAllowAiAuto) ...[
                const SizedBox(height: 10),
                TextField(
                  controller: _newAiKeysCtrl,
                  autocorrect: false,
                  enableSuggestions: false,
                  decoration: const InputDecoration(
                    labelText: 'Personal API Key(s) (Optional)',
                    hintText: 'Paste 1 or multiple keys (comma/newline)',
                  ),
                ),
              ],
              if (_feedback != null) ...[
                const SizedBox(height: 10),
                Text(
                  _feedback!,
                  style: const TextStyle(
                    color: AppColors.accentBright,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
              const SizedBox(height: 12),
              PrimaryPillButton(
                label: 'Grant Access',
                icon: Icons.person_add_alt_1_rounded,
                isLoading: _saving,
                expand: true,
                onPressed: _addUser,
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        TextField(
          controller: _searchCtrl,
          onChanged: (_) => setState(() {}),
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 12.5,
          ),
          decoration: const InputDecoration(
            hintText: 'Search email/name...',
            prefixIcon: Icon(Icons.search_rounded, size: 17),
            isDense: true,
            contentPadding: EdgeInsets.symmetric(
              horizontal: 10,
              vertical: 10,
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 34,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              for (final tab in const [
                (f: _MobileUserFilter.all, label: 'ALL'),
                (f: _MobileUserFilter.admin, label: 'ADMIN'),
                (f: _MobileUserFilter.user, label: 'USER'),
                (f: _MobileUserFilter.disabled, label: 'DISABLED'),
                (f: _MobileUserFilter.temp, label: 'TEMP'),
              ])
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: GestureDetector(
                    onTap: () => setState(() => _filter = tab.f),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: _filter == tab.f
                            ? AppColors.accent
                            : AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: _filter == tab.f
                              ? AppColors.accent
                              : AppColors.borderSubtle,
                        ),
                      ),
                      child: Text(
                        tab.label,
                        style: TextStyle(
                          color: _filter == tab.f
                              ? AppColors.inkOnAccent
                              : AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        if (filtered.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 28),
            child: Center(
              child: Text(
                'No matching users found.',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 12.5,
                ),
              ),
            ),
          )
        else
          ...filtered.map((u) {
            final isSuper = u.email == AppFirebaseConfig.superAdminEmail;
            final isDisabled = u.status == UserStatus.disabled;
            final isTemp = u.role == UserRole.temp;
            final keyCount = u.aiApiKeys.length;

            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: TactileCard(
                padding: const EdgeInsets.all(14),
                borderColor: isSuper
                    ? AppColors.accentBorder
                    : isTemp
                        ? const Color(0x4438BDF8)
                        : AppColors.borderSubtle,
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  u.displayName,
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
                              StatusPill(
                                label: _roleLabel(u.role, isSuper),
                                backgroundColor: isDisabled
                                    ? AppColors.crimsonSurface
                                    : isTemp
                                        ? const Color(0x1F38BDF8)
                                        : AppColors.accentSurface,
                                borderColor: isDisabled
                                    ? const Color(0x55EF4444)
                                    : isTemp
                                        ? const Color(0x5538BDF8)
                                        : AppColors.accentBorder,
                                textColor: isDisabled
                                    ? AppColors.crimson
                                    : isTemp
                                        ? const Color(0xFF38BDF8)
                                        : AppColors.accentBright,
                              ),
                              if (u.role == UserRole.admin ||
                                  u.allowAiAuto) ...[
                                const SizedBox(width: 6),
                                StatusPill(
                                  label: 'AI · $keyCount KEY${keyCount == 1 ? '' : 'S'}',
                                  backgroundColor: AppColors.emeraldSurface,
                                  borderColor: const Color(0x5510B981),
                                  textColor: AppColors.emerald,
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            u.email,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              if (u.role != UserRole.admin)
                                GestureDetector(
                                  onTap: () async {
                                    await widget.authStore
                                        .toggleUserAiAuto(u, !u.allowAiAuto);
                                    HapticFeedback.selectionClick();
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 9,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: u.allowAiAuto
                                          ? AppColors.accentSurface
                                          : AppColors.inputFill,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: u.allowAiAuto
                                            ? AppColors.accentBorder
                                            : AppColors.borderSubtle,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.document_scanner_rounded,
                                          size: 13,
                                          color: u.allowAiAuto
                                              ? AppColors.accentBright
                                              : AppColors.textMuted,
                                        ),
                                        const SizedBox(width: 5),
                                        Text(
                                          u.allowAiAuto
                                              ? 'AI Beta: ON'
                                              : 'Allow AI Beta',
                                          style: TextStyle(
                                            color: u.allowAiAuto
                                                ? AppColors.accentBright
                                                : AppColors.textSecondary,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              GestureDetector(
                                onTap: () {
                                  HapticFeedback.selectionClick();
                                  setState(() {
                                    _section = _AdminSection.aiKeys;
                                    _aiFilter = _AiKeyFilter.all;
                                    _aiSearchCtrl.text = u.email;
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 9,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.inputFill,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: AppColors.borderStrong,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.vpn_key_rounded,
                                        size: 13,
                                        color: AppColors.accentBright,
                                      ),
                                      const SizedBox(width: 5),
                                      Text(
                                        'Manage Keys ($keyCount)',
                                        style: const TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (isTemp)
                      Padding(
                        padding: const EdgeInsets.only(right: 4),
                        child: TextButton(
                          onPressed: () async {
                            await widget.authStore.promoteTempToUser(u);
                            HapticFeedback.mediumImpact();
                          },
                          style: TextButton.styleFrom(
                            backgroundColor: AppColors.emeraldSurface,
                            foregroundColor: AppColors.emerald,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'Make User',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                    if (!isSuper)
                      PopupMenuButton<String>(
                        color: AppColors.surfaceElevated,
                        icon: const Icon(
                          Icons.more_vert_rounded,
                          color: AppColors.textSecondary,
                        ),
                        onSelected: (v) async {
                          if (v == 'makeUser') {
                            await widget.authStore.promoteTempToUser(u);
                          } else if (v == 'toggleAiAuto') {
                            await widget.authStore
                                .toggleUserAiAuto(u, !u.allowAiAuto);
                          } else if (v == 'manageKeys') {
                            setState(() {
                              _section = _AdminSection.aiKeys;
                              _aiFilter = _AiKeyFilter.all;
                              _aiSearchCtrl.text = u.email;
                            });
                          } else if (v == 'toggleStatus') {
                            await widget.authStore.updateAllowedUser(
                              email: u.email,
                              displayName: u.displayName,
                              role: u.role,
                              status: isDisabled
                                  ? UserStatus.active
                                  : UserStatus.disabled,
                              allowAiAuto: u.allowAiAuto,
                              notes: u.notes,
                            );
                          } else if (v == 'toggleRole') {
                            await widget.authStore.updateAllowedUser(
                              email: u.email,
                              displayName: u.displayName,
                              role: u.role == UserRole.admin
                                  ? UserRole.user
                                  : UserRole.admin,
                              status: u.status,
                              allowAiAuto: u.role == UserRole.admin
                                  ? u.allowAiAuto
                                  : true,
                              notes: u.notes,
                            );
                          } else if (v == 'delete') {
                            await widget.authStore.deleteAllowedUser(u.email);
                          }
                        },
                        itemBuilder: (_) => [
                          if (isTemp)
                            const PopupMenuItem(
                              value: 'makeUser',
                              child: Text('Make User (Permanent)'),
                            ),
                          const PopupMenuItem(
                            value: 'manageKeys',
                            child: Text('Manage Personal API Keys'),
                          ),
                          if (u.role != UserRole.admin)
                            PopupMenuItem(
                              value: 'toggleAiAuto',
                              child: Text(
                                u.allowAiAuto
                                    ? 'Revoke AI Auto Standings'
                                    : 'Allow AI Auto Standings',
                              ),
                            ),
                          PopupMenuItem(
                            value: 'toggleStatus',
                            child: Text(
                              isDisabled ? 'Enable Access' : 'Disable Access',
                            ),
                          ),
                          PopupMenuItem(
                            value: 'toggleRole',
                            child: Text(
                              u.role == UserRole.admin
                                  ? 'Demote to User'
                                  : 'Promote to Admin',
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'delete',
                            child: Text(
                              'Revoke & Delete',
                              style: TextStyle(color: AppColors.crimson),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildAiKeysSection({
    required ScrollController scrollController,
    required List<AllowedUserRecord> users,
    required int totalAssignedKeys,
  }) {
    final query = _aiSearchCtrl.text.trim().toLowerCase();
    final aiEnabledCount = users
        .where((u) => u.role == UserRole.admin || u.allowAiAuto)
        .length;
    final missingCount = users
        .where(
          (u) =>
              (u.role == UserRole.admin || u.allowAiAuto) &&
              u.aiApiKeys.isEmpty,
        )
        .length;

    final filtered = users.where((u) {
      final matchesQuery = query.isEmpty ||
          u.email.toLowerCase().contains(query) ||
          u.displayName.toLowerCase().contains(query);
      if (!matchesQuery) return false;
      final enabled = u.role == UserRole.admin || u.allowAiAuto;
      switch (_aiFilter) {
        case _AiKeyFilter.all:
          return true;
        case _AiKeyFilter.enabled:
          return enabled;
        case _AiKeyFilter.needsKeys:
          return enabled && u.aiApiKeys.isEmpty;
      }
    }).toList();

    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
      children: [
        TactileCard(
          padding: const EdgeInsets.all(14),
          borderColor: AppColors.accentBorder,
          backgroundColor: AppColors.accentSurface,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(
                    Icons.vpn_key_rounded,
                    size: 16,
                    color: AppColors.accentBright,
                  ),
                  SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      'Per-User Multi-Key Failover Pool',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              const Text(
                'Assign 1 or multiple personal API keys per user (each from a separate project for independent daily limits). Users never see API keys or provider names — only AI (Beta). When Key #1 hits its daily limit, Key #2 is used automatically.',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 11.5,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  StatusPill(
                    label: '$aiEnabledCount AI ENABLED',
                    backgroundColor: AppColors.surface,
                    borderColor: AppColors.borderStrong,
                    textColor: AppColors.textPrimary,
                  ),
                  const SizedBox(width: 6),
                  StatusPill(
                    label: '$totalAssignedKeys KEYS ACTIVE',
                    backgroundColor: AppColors.emeraldSurface,
                    borderColor: const Color(0x5510B981),
                    textColor: AppColors.emerald,
                  ),
                  if (missingCount > 0) ...[
                    const SizedBox(width: 6),
                    StatusPill(
                      label: '$missingCount NEED KEYS',
                      backgroundColor: AppColors.accentSurface,
                      borderColor: AppColors.accentBorder,
                      textColor: AppColors.accentBright,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        TextField(
          controller: _aiSearchCtrl,
          onChanged: (_) => setState(() {}),
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 12.5,
          ),
          decoration: InputDecoration(
            hintText: 'Filter user email or name...',
            prefixIcon: const Icon(Icons.search_rounded, size: 17),
            suffixIcon: _aiSearchCtrl.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.close_rounded, size: 16),
                    onPressed: () {
                      _aiSearchCtrl.clear();
                      setState(() {});
                    },
                  )
                : null,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 10,
              vertical: 10,
            ),
          ),
        ),
        const SizedBox(height: 10),

        SizedBox(
          height: 34,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              for (final tab in const [
                (f: _AiKeyFilter.all, label: 'ALL ACCOUNTS'),
                (f: _AiKeyFilter.enabled, label: 'AI ENABLED'),
                (f: _AiKeyFilter.needsKeys, label: 'NEEDS KEYS'),
              ])
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: GestureDetector(
                    onTap: () => setState(() => _aiFilter = tab.f),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: _aiFilter == tab.f
                            ? AppColors.accent
                            : AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: _aiFilter == tab.f
                              ? AppColors.accent
                              : AppColors.borderSubtle,
                        ),
                      ),
                      child: Text(
                        tab.label,
                        style: TextStyle(
                          color: _aiFilter == tab.f
                              ? AppColors.inkOnAccent
                              : AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        if (filtered.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 28),
            child: Center(
              child: Text(
                'No matching accounts found.',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 12.5,
                ),
              ),
            ),
          )
        else
          ...filtered.map((u) {
            final isSuper = u.email == AppFirebaseConfig.superAdminEmail;
            final aiEnabled = u.role == UserRole.admin || u.allowAiAuto;
            final keys = u.aiApiKeys;
            final ctrl = _draftCtrlFor(u.email);
            final isBusy = _busyAiEmail == u.email;
            final rowStatus = _rowStatusByEmail[u.email];

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: TactileCard(
                padding: const EdgeInsets.all(14),
                borderColor: keys.isNotEmpty
                    ? const Color(0x4410B981)
                    : aiEnabled
                        ? AppColors.accentBorder
                        : AppColors.borderSubtle,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      u.displayName,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  StatusPill(
                                    label: _roleLabel(u.role, isSuper),
                                    backgroundColor: AppColors.accentSurface,
                                    borderColor: AppColors.accentBorder,
                                    textColor: AppColors.accentBright,
                                  ),
                                  const SizedBox(width: 6),
                                  StatusPill(
                                    label:
                                        '${keys.length} KEY${keys.length == 1 ? '' : 'S'}',
                                    backgroundColor: keys.isNotEmpty
                                        ? AppColors.emeraldSurface
                                        : AppColors.inputFill,
                                    borderColor: keys.isNotEmpty
                                        ? const Color(0x5510B981)
                                        : AppColors.borderSubtle,
                                    textColor: keys.isNotEmpty
                                        ? AppColors.emerald
                                        : AppColors.textMuted,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                u.email,
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (u.role == UserRole.admin)
                          const StatusPill(
                            label: 'ADMIN ON',
                            backgroundColor: AppColors.accentSurface,
                            borderColor: AppColors.accentBorder,
                            textColor: AppColors.accentBright,
                          )
                        else
                          Switch.adaptive(
                            value: u.allowAiAuto,
                            activeThumbColor: AppColors.accent,
                            onChanged: (next) async {
                              await widget.authStore
                                  .setUserAiConfig(email: u.email, allowAiAuto: next);
                              HapticFeedback.selectionClick();
                            },
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    if (keys.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 11,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.inputFill,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: const Text(
                          'No personal API keys assigned yet. Paste 1 or multiple keys below.',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      )
                    else
                      ...List.generate(keys.length, (idx) {
                        final k = keys[idx];
                        final revealId = '${u.email}::$idx';
                        final revealed = _revealedKeyIds.contains(revealId);
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.inputFill,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppColors.borderSubtle),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.accentSurface,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    idx == 0 ? 'KEY #1' : 'FAILOVER #${idx + 1}',
                                    style: kTabularNumbers.copyWith(
                                      color: AppColors.accentBright,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    revealed ? k : maskApiKey(k),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 11.5,
                                      fontFamily: 'monospace',
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                InkWell(
                                  onTap: () {
                                    setState(() {
                                      if (revealed) {
                                        _revealedKeyIds.remove(revealId);
                                      } else {
                                        _revealedKeyIds.add(revealId);
                                      }
                                    });
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.all(4),
                                    child: Icon(
                                      revealed
                                          ? Icons.visibility_off_rounded
                                          : Icons.visibility_rounded,
                                      size: 16,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                InkWell(
                                  onTap: isBusy
                                      ? null
                                      : () => _removeKeyFromUser(u, k),
                                  child: const Padding(
                                    padding: EdgeInsets.all(4),
                                    child: Icon(
                                      Icons.delete_outline_rounded,
                                      size: 16,
                                      color: AppColors.crimson,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),

                    const SizedBox(height: 8),
                    TextField(
                      controller: ctrl,
                      minLines: 1,
                      maxLines: 3,
                      autocorrect: false,
                      enableSuggestions: false,
                      onChanged: (_) => setState(() {}),
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                      decoration: InputDecoration(
                        hintText:
                            'Paste 1 or multiple API keys (newline/comma)...',
                        isDense: true,
                        suffixIcon: IconButton(
                          tooltip: 'Paste from Clipboard',
                          icon: const Icon(
                            Icons.content_paste_rounded,
                            size: 16,
                            color: AppColors.accentBright,
                          ),
                          onPressed: () async {
                            final data =
                                await Clipboard.getData(Clipboard.kTextPlain);
                            final txt = data?.text?.trim() ?? '';
                            if (txt.isEmpty) return;
                            ctrl.text = ctrl.text.trim().isEmpty
                                ? txt
                                : '${ctrl.text.trim()}\n$txt';
                            if (mounted) setState(() {});
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    PrimaryPillButton(
                      label: isBusy
                          ? 'Verifying Key(s)...'
                          : 'Verify & Add Key(s)',
                      icon: Icons.add_moderator_rounded,
                      isLoading: isBusy,
                      expand: true,
                      onPressed: isBusy || ctrl.text.trim().isEmpty
                          ? null
                          : () => _verifyAndAddKeysForUser(u),
                    ),
                    if (rowStatus != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 7,
                        ),
                        decoration: BoxDecoration(
                          color: rowStatus.isError
                              ? AppColors.crimsonSurface
                              : AppColors.emeraldSurface,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: rowStatus.isError
                                ? const Color(0x55EF4444)
                                : const Color(0x5510B981),
                          ),
                        ),
                        child: Text(
                          rowStatus.message,
                          style: TextStyle(
                            color: rowStatus.isError
                                ? AppColors.crimson
                                : AppColors.emerald,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}
