import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/firebase_config.dart';
import '../../models/auth_models.dart';
import '../../state/auth_state.dart';
import '../../theme/app_theme.dart';
import '../widgets/app_components.dart';

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
  UserRole _newRole = UserRole.user;
  bool _saving = false;
  String? _feedback;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _nameCtrl.dispose();
    _notesCtrl.dispose();
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
        notes: _notesCtrl.text,
      );
      HapticFeedback.mediumImpact();
      _emailCtrl.clear();
      _nameCtrl.clear();
      _notesCtrl.clear();
      if (mounted) {
        setState(() => _feedback = 'User added to Firestore allowlist.');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _feedback = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.authStore,
      builder: (context, _) {
        final users = widget.authStore.allUsers;
        return DraggableScrollableSheet(
          initialChildSize: 0.88,
          minChildSize: 0.55,
          maxChildSize: 0.95,
          expand: false,
          builder: (ctx, scrollController) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              child: Column(
                children: [
                  SheetHeader(
                    title: 'Access Control',
                    subtitle: '${users.length} Google email(s) authorized',
                  ),
                  Expanded(
                    child: ListView(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
                      children: [
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
                                            child: Text('Organizer'),
                                          ),
                                          DropdownMenuItem(
                                            value: UserRole.admin,
                                            child: Text('Admin'),
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
                        const SizedBox(height: 16),

                        ...users.map((u) {
                          final isSuper =
                              u.email == AppFirebaseConfig.superAdminEmail;
                          final isDisabled = u.status == UserStatus.disabled;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: TactileCard(
                              padding: const EdgeInsets.all(14),
                              borderColor: isSuper
                                  ? AppColors.accentBorder
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
                                              label: isSuper
                                                  ? 'SUPER ADMIN'
                                                  : u.role == UserRole.admin
                                                      ? 'ADMIN'
                                                      : 'USER',
                                              backgroundColor: isDisabled
                                                  ? AppColors.crimsonSurface
                                                  : AppColors.accentSurface,
                                              borderColor: isDisabled
                                                  ? const Color(0x55EF4444)
                                                  : AppColors.accentBorder,
                                              textColor: isDisabled
                                                  ? AppColors.crimson
                                                  : AppColors.accentBright,
                                            ),
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
                                      ],
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
                                        if (v == 'toggleStatus') {
                                          await widget.authStore
                                              .updateAllowedUser(
                                            email: u.email,
                                            displayName: u.displayName,
                                            role: u.role,
                                            status: isDisabled
                                                ? UserStatus.active
                                                : UserStatus.disabled,
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
                                            notes: u.notes,
                                          );
                                        } else if (v == 'delete') {
                                          await widget.authStore
                                              .deleteAllowedUser(u.email);
                                        }
                                      },
                                      itemBuilder: (_) => [
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
                                                ? 'Demote to Organizer'
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
