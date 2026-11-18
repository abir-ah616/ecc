enum UserRole { admin, user, temp }

enum UserStatus { active, disabled }

UserRole userRoleFromString(String? raw) {
  switch (raw) {
    case 'admin':
      return UserRole.admin;
    case 'temp':
      return UserRole.temp;
    default:
      return UserRole.user;
  }
}

String userRoleToString(UserRole role) {
  switch (role) {
    case UserRole.admin:
      return 'admin';
    case UserRole.temp:
      return 'temp';
    case UserRole.user:
      return 'user';
  }
}

List<String> sanitizeAiApiKeyList(dynamic raw) {
  if (raw is! List) return const <String>[];
  final unique = <String>{};
  for (final item in raw) {
    if (item is! String) continue;
    final clean = item
        .trim()
        .replaceAll(RegExp(r'''^["']+|["']+$'''), '')
        .replaceAll(RegExp(r'\s+'), '');
    if (clean.length >= 16 && clean.length <= 256) {
      unique.add(clean);
    }
    if (unique.length >= 25) break;
  }
  return unique.toList(growable: false);
}

class AllowedUserRecord {
  final String email;
  final String displayName;
  final UserRole role;
  final UserStatus status;
  final bool allowAiAuto;
  final List<String> aiApiKeys;
  final String notes;
  final String? addedBy;
  final int createdAt;
  final int updatedAt;
  final int? lastLoginAt;
  final String? photoUrl;
  final String? uid;

  const AllowedUserRecord({
    required this.email,
    required this.displayName,
    required this.role,
    required this.status,
    this.allowAiAuto = false,
    this.aiApiKeys = const [],
    this.notes = '',
    this.addedBy,
    required this.createdAt,
    required this.updatedAt,
    this.lastLoginAt,
    this.photoUrl,
    this.uid,
  });

  factory AllowedUserRecord.fromMap(Map<String, dynamic> data) =>
      AllowedUserRecord(
        email: ((data['email'] as String?) ?? '').trim().toLowerCase(),
        displayName: (data['displayName'] as String?) ?? '',
        role: userRoleFromString(data['role'] as String?),
        status: (data['status'] as String?) == 'disabled'
            ? UserStatus.disabled
            : UserStatus.active,
        allowAiAuto: (data['allowAiAuto'] as bool?) ?? false,
        aiApiKeys: sanitizeAiApiKeyList(data['aiApiKeys']),
        notes: (data['notes'] as String?) ?? '',
        addedBy: data['addedBy'] as String?,
        createdAt: (data['createdAt'] as num?)?.toInt() ?? 0,
        updatedAt: (data['updatedAt'] as num?)?.toInt() ?? 0,
        lastLoginAt: (data['lastLoginAt'] as num?)?.toInt(),
        photoUrl: data['photoURL'] as String?,
        uid: data['uid'] as String?,
      );

  Map<String, dynamic> toMap() => {
        'email': email,
        'displayName': displayName,
        'role': userRoleToString(role),
        'status': status == UserStatus.disabled ? 'disabled' : 'active',
        'allowAiAuto': allowAiAuto,
        if (aiApiKeys.isNotEmpty) 'aiApiKeys': aiApiKeys,
        'notes': notes,
        if (addedBy != null) 'addedBy': addedBy,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
        if (lastLoginAt != null) 'lastLoginAt': lastLoginAt,
        if (photoUrl != null) 'photoURL': photoUrl,
        if (uid != null) 'uid': uid,
      };
}
