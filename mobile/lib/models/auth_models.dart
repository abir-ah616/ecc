enum UserRole { admin, user }

enum UserStatus { active, disabled }

class AllowedUserRecord {
  final String email;
  final String displayName;
  final UserRole role;
  final UserStatus status;
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
        role: (data['role'] as String?) == 'admin'
            ? UserRole.admin
            : UserRole.user,
        status: (data['status'] as String?) == 'disabled'
            ? UserStatus.disabled
            : UserStatus.active,
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
        'role': role == UserRole.admin ? 'admin' : 'user',
        'status': status == UserStatus.disabled ? 'disabled' : 'active',
        'notes': notes,
        if (addedBy != null) 'addedBy': addedBy,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
        if (lastLoginAt != null) 'lastLoginAt': lastLoginAt,
        if (photoUrl != null) 'photoURL': photoUrl,
        if (uid != null) 'uid': uid,
      };
}
