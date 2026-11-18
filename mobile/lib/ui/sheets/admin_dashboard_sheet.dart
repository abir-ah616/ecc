import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/firebase_config.dart';
import '../../models/auth_models.dart';
import '../../state/auth_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

enum _MobileUserFilter { all, admin, user, disabled, temp }

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
  final _searchCtrl = TextEditingController();
  UserRole _newRole = UserRole.user;
  bool _newAllowAiAuto = false;
  _MobileUserFilter _filter = _MobileUserFilter.all;
  bool _saving = false;
  bool _togglingTemp = false;
  String? _feedback;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _nameCtrl.dispose();
    _notesCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _addUser() async {
    if (_saving) return;
    setState(() {
      _saving = true;
      _feedback = null;
    });
    try {
      await widget.authStore.addAllowedUser(
        email: _emailCtrl.text,
        displayName: _nameCtrl.text,
        role: _newRole,
        allowAiAuto: _newRole == UserRole.admin ? true : _newAllowAiAuto,
        notes: _notesCtrl.text,
      );
      HapticFeedback.mediumImpact();
      _emailCtrl.clear();
      _nameCtrl.clear();
      _notesCtrl.clear();
      _newAllowAiAuto = false;
      if (mounted) {
        setState(() => _feedback = 'User added to Firestore allowlist.');
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

        return DraggableScrollableSheet(
          initialChildSize: 0.9,
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
                    title: 'Team Access Control',
                    subtitle: '${users.length} account(s) synced with Web',
                  ),
                  Expanded(
                    child: ListView(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
                      children: [
                        // Allow Temp Login Master Switch (Synced Across Web & App)
                        TactileCard(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                          borderColor: allowTemp
                              ? const Color(0x6638BDF8)
                              : AppColors.borderSubtle,
                          backgroundColor: allowTemp
                              ? const Color(0x1438BDF8)
                              : AppColors.surface,
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
                                onChanged:
                                    _togglingTemp ? null : _toggleTempLogin,
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
                                        dropdownColor:
                                            AppColors.surfaceElevated,
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
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Allow AI Auto Standings',
                                              style: TextStyle(
                                                color: AppColors.textPrimary,
                                                fontSize: 12.5,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                            Text(
                                              'Lets user add Gemini API key in profile & scan results',
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

                        // Compact Search & Role/Status Filter Row (ALL, ADMIN, USER, DISABLED, TEMP)
                        Row(
                          children: [
                            Expanded(
                              flex: 5,
                              child: TextField(
                                controller: _searchCtrl,
                                onChanged: (_) => setState(() {}),
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 12.5,
                                ),
                                decoration: const InputDecoration(
                                  hintText: 'Search email/name...',
                                  prefixIcon:
                                      Icon(Icons.search_rounded, size: 17),
                                  isDense: true,
                                  contentPadding: EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 10,
                                  ),
                                ),
                              ),
                            ),
                          ],
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
                                (
                                  f: _MobileUserFilter.disabled,
                                  label: 'DISABLED'
                                ),
                                (f: _MobileUserFilter.temp, label: 'TEMP'),
                              ])
                                Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: GestureDetector(
                                    onTap: () =>
                                        setState(() => _filter = tab.f),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                      ),
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        color: _filter == tab.f
                                            ? AppColors.accent
                                            : AppColors.surfaceElevated,
                                        borderRadius:
                                            BorderRadius.circular(999),
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
                            final isSuper =
                                u.email == AppFirebaseConfig.superAdminEmail;
                            final isDisabled = u.status == UserStatus.disabled;
                            final isTemp = u.role == UserRole.temp;

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
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Flexible(
                                                child: Text(
                                                  u.displayName,
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    color:
                                                        AppColors.textPrimary,
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w800,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              StatusPill(
                                                label:
                                                    _roleLabel(u.role, isSuper),
                                                backgroundColor: isDisabled
                                                    ? AppColors.crimsonSurface
                                                    : isTemp
                                                        ? const Color(
                                                            0x1F38BDF8)
                                                        : AppColors
                                                            .accentSurface,
                                                borderColor: isDisabled
                                                    ? const Color(0x55EF4444)
                                                    : isTemp
                                                        ? const Color(
                                                            0x5538BDF8)
                                                        : AppColors
                                                            .accentBorder,
                                                textColor: isDisabled
                                                    ? AppColors.crimson
                                                    : isTemp
                                                        ? const Color(
                                                            0xFF38BDF8)
                                                        : AppColors
                                                            .accentBright,
                                              ),
                                              if (u.role == UserRole.admin ||
                                                  u.allowAiAuto) ...[
                                                const SizedBox(width: 6),
                                                const StatusPill(
                                                  label: 'AI AUTO',
                                                  backgroundColor:
                                                      AppColors.emeraldSurface,
                                                  borderColor:
                                                      Color(0x5510B981),
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
                                          if (u.role != UserRole.admin) ...[
                                            const SizedBox(height: 6),
                                            GestureDetector(
                                              onTap: () async {
                                                await widget.authStore
                                                    .toggleUserAiAuto(
                                                        u, !u.allowAiAuto);
                                                HapticFeedback.selectionClick();
                                              },
                                              child: Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                  horizontal: 9,
                                                  vertical: 4,
                                                ),
                                                decoration: BoxDecoration(
                                                  color: u.allowAiAuto
                                                      ? AppColors.accentSurface
                                                      : AppColors.inputFill,
                                                  borderRadius:
                                                      BorderRadius.circular(8),
                                                  border: Border.all(
                                                    color: u.allowAiAuto
                                                        ? AppColors.accentBorder
                                                        : AppColors
                                                            .borderSubtle,
                                                  ),
                                                ),
                                                child: Row(
                                                  mainAxisSize:
                                                      MainAxisSize.min,
                                                  children: [
                                                    Icon(
                                                      Icons
                                                          .document_scanner_rounded,
                                                      size: 13,
                                                      color: u.allowAiAuto
                                                          ? AppColors
                                                              .accentBright
                                                          : AppColors.textMuted,
                                                    ),
                                                    const SizedBox(width: 5),
                                                    Text(
                                                      u.allowAiAuto
                                                          ? 'AI Auto: Allowed (Tap to revoke)'
                                                          : 'Allow AI Auto',
                                                      style: TextStyle(
                                                        color: u.allowAiAuto
                                                            ? AppColors
                                                                .accentBright
                                                            : AppColors
                                                                .textSecondary,
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w700,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    if (isTemp)
                                      Padding(
                                        padding:
                                            const EdgeInsets.only(right: 4),
                                        child: TextButton(
                                          onPressed: () async {
                                            await widget.authStore
                                                .promoteTempToUser(u);
                                            HapticFeedback.mediumImpact();
                                          },
                                          style: TextButton.styleFrom(
                                            backgroundColor:
                                                AppColors.emeraldSurface,
                                            foregroundColor: AppColors.emerald,
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 6,
                                            ),
                                            minimumSize: Size.zero,
                                            tapTargetSize: MaterialTapTargetSize
                                                .shrinkWrap,
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
                                            await widget.authStore
                                                .promoteTempToUser(u);
                                          } else if (v == 'toggleAiAuto') {
                                            await widget.authStore
                                                .toggleUserAiAuto(
                                                    u, !u.allowAiAuto);
                                          } else if (v == 'toggleStatus') {
                                            await widget.authStore
                                                .updateAllowedUser(
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
                                            await widget.authStore
                                                .updateAllowedUser(
                                              email: u.email,
                                              displayName: u.displayName,
                                              role: u.role == UserRole.admin
                                                  ? UserRole.user
                                                  : UserRole.admin,
                                              status: u.status,
                                              allowAiAuto:
                                                  u.role == UserRole.admin
                                                      ? u.allowAiAuto
                                                      : true,
                                              notes: u.notes,
                                            );
                                          } else if (v == 'delete') {
                                            await widget.authStore
                                                .deleteAllowedUser(u.email);
                                          }
                                        },
                                        itemBuilder: (_) => [
                                          if (isTemp)
                                            const PopupMenuItem(
                                              value: 'makeUser',
                                              child: Text('Make User (Permanent)'),
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
                                              isDisabled
                                                  ? 'Enable Access'
                                                  : 'Disable Access',
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
                                              style: TextStyle(
                                                color: AppColors.crimson,
                                              ),
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
}
