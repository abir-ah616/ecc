import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show ChangeNotifier, kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';
import '../core/firebase_config.dart';
import '../models/auth_models.dart';

String normalizeEmail(String email) => email.trim().toLowerCase();

class AuthStore extends ChangeNotifier {
  User? _firebaseUser;
  AllowedUserRecord? _allowedRecord;
  List<AllowedUserRecord> _allUsers = [];
  bool _isLoading = true;
  bool _isFirebaseReady = false;
  bool _isAllowed = false;
  bool _isAdmin = false;
  String? _authError;

  StreamSubscription<User?>? _authSub;
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _userDocSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _allUsersSub;

  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: const ['email']);

  User? get firebaseUser => _firebaseUser;
  AllowedUserRecord? get allowedRecord => _allowedRecord;
  List<AllowedUserRecord> get allUsers => _allUsers;
  bool get isLoading => _isLoading;
  bool get isFirebaseReady => _isFirebaseReady;
  bool get isAllowed => _isAllowed;
  bool get isAdmin => _isAdmin;
  String? get authError => _authError;

  Future<void> initialize() async {
    final ready = await AppFirebaseConfig.ensureInitialized();
    _isFirebaseReady = ready;

    if (!ready) {
      _isLoading = false;
      _authError =
          'Firebase Android configuration missing. Add android/app/google-services.json from Firebase Console.';
      notifyListeners();
      return;
    }

    _authSub?.cancel();
    _authSub = FirebaseAuth.instance.authStateChanges().listen(_onAuthChanged);
  }

  Future<void> _onAuthChanged(User? user) async {
    await _userDocSub?.cancel();
    await _allUsersSub?.cancel();
    _userDocSub = null;
    _allUsersSub = null;

    if (user == null || user.email == null) {
      _firebaseUser = null;
      _allowedRecord = null;
      _allUsers = [];
      _isAllowed = false;
      _isAdmin = false;
      _isLoading = false;
      notifyListeners();
      return;
    }

    final emailLower = normalizeEmail(user.email!);
    final isSuperAdmin = emailLower == AppFirebaseConfig.superAdminEmail;
    final db = FirebaseFirestore.instance;
    final userDocRef = db.collection('allowed_users').doc(emailLower);

    if (isSuperAdmin) {
      try {
        final now = DateTime.now().millisecondsSinceEpoch;
        await userDocRef.set({
          'email': emailLower,
          'displayName': user.displayName ?? 'MR. OPPY (SUPER ADMIN)',
          'role': 'admin',
          'status': 'active',
          'notes': 'Primary System Administrator',
          'addedBy': 'system',
          'createdAt': now,
          'updatedAt': now,
          'lastLoginAt': now,
          'photoURL': user.photoURL ?? '',
          'uid': user.uid,
        }, SetOptions(merge: true));
      } catch (_) {
        // Ignore bootstrap error if network offline
      }
    }

    _userDocSub = userDocRef.snapshots().listen(
      (docSnap) async {
        if (docSnap.exists && docSnap.data() != null) {
          final record = AllowedUserRecord.fromMap(docSnap.data()!);
          final active = isSuperAdmin || record.status == UserStatus.active;
          final admin =
              isSuperAdmin || (active && record.role == UserRole.admin);

          _firebaseUser = user;
          _allowedRecord = record;
          _isAllowed = active;
          _isAdmin = admin;
          _isLoading = false;
          notifyListeners();

          if (active && (record.uid == null || record.uid != user.uid)) {
            try {
              await userDocRef.update({
                'lastLoginAt': DateTime.now().millisecondsSinceEpoch,
                'updatedAt': DateTime.now().millisecondsSinceEpoch,
                'uid': user.uid,
                'photoURL': user.photoURL ?? record.photoUrl ?? '',
                'displayName': record.displayName.isNotEmpty
                    ? record.displayName
                    : (user.displayName ??
                        emailLower.split('@').first.toUpperCase()),
              });
            } catch (_) {
              // Ignore metadata sync error if restricted
            }
          }

          if (admin) {
            _startAllUsersSubscription();
          } else {
            await _allUsersSub?.cancel();
            _allUsersSub = null;
          }
        } else if (isSuperAdmin) {
          final now = DateTime.now().millisecondsSinceEpoch;
          _firebaseUser = user;
          _allowedRecord = AllowedUserRecord(
            email: emailLower,
            displayName: user.displayName ?? 'MR. OPPY (SUPER ADMIN)',
            role: UserRole.admin,
            status: UserStatus.active,
            notes: 'Primary System Administrator',
            createdAt: now,
            updatedAt: now,
          );
          _isAllowed = true;
          _isAdmin = true;
          _isLoading = false;
          notifyListeners();
          _startAllUsersSubscription();
        } else {
          _firebaseUser = user;
          _allowedRecord = null;
          _isAllowed = false;
          _isAdmin = false;
          _isLoading = false;
          notifyListeners();
        }
      },
      onError: (_) {
        if (isSuperAdmin) {
          _firebaseUser = user;
          _isAllowed = true;
          _isAdmin = true;
          _isLoading = false;
          notifyListeners();
          _startAllUsersSubscription();
        } else {
          _firebaseUser = user;
          _allowedRecord = null;
          _isAllowed = false;
          _isAdmin = false;
          _isLoading = false;
          notifyListeners();
        }
      },
    );
  }

  void _startAllUsersSubscription() {
    _allUsersSub?.cancel();
    _allUsersSub = FirebaseFirestore.instance
        .collection('allowed_users')
        .snapshots()
        .listen((snapshot) {
      final list = snapshot.docs
          .map((d) => AllowedUserRecord.fromMap(d.data()))
          .toList()
        ..sort((a, b) {
          if (a.email == AppFirebaseConfig.superAdminEmail) return -1;
          if (b.email == AppFirebaseConfig.superAdminEmail) return 1;
          if (a.role != b.role) return a.role == UserRole.admin ? -1 : 1;
          return b.createdAt.compareTo(a.createdAt);
        });
      _allUsers = list;
      notifyListeners();
    });
  }

  void clearAuthError() {
    _authError = null;
    notifyListeners();
  }

  Future<void> signInWithGoogle() async {
    _authError = null;
    _isLoading = true;
    notifyListeners();

    try {
      if (!_isFirebaseReady) {
        final ready = await AppFirebaseConfig.ensureInitialized();
        _isFirebaseReady = ready;
        if (!ready) {
          _isLoading = false;
          _authError =
              'Firebase is not initialized yet. Add android/app/google-services.json first.';
          notifyListeners();
          return;
        }
      }

      if (kIsWeb) {
        final provider = GoogleAuthProvider()
          ..setCustomParameters({'prompt': 'select_account'});
        await FirebaseAuth.instance.signInWithPopup(provider);
        return;
      }

      // Sign out first to always prompt Google account chooser like web flow
      try {
        await _googleSignIn.signOut();
      } catch (_) {}

      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        _isLoading = false;
        _authError = 'Google sign-in was cancelled.';
        notifyListeners();
        return;
      }

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      await FirebaseAuth.instance.signInWithCredential(credential);
    } on FirebaseAuthException catch (e) {
      _isLoading = false;
      _authError = e.message ?? 'Google sign-in failed (${e.code}).';
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _authError =
          'Google Sign-In setup incomplete or interrupted: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _userDocSub?.cancel();
    await _allUsersSub?.cancel();
    _userDocSub = null;
    _allUsersSub = null;

    if (!kIsWeb) {
      try {
        await _googleSignIn.signOut();
      } catch (_) {}
    }

    if (_isFirebaseReady) {
      await FirebaseAuth.instance.signOut();
    }

    _firebaseUser = null;
    _allowedRecord = null;
    _allUsers = [];
    _isAllowed = false;
    _isAdmin = false;
    _isLoading = false;
    _authError = null;
    notifyListeners();
  }

  Future<void> addAllowedUser({
    required String email,
    required String displayName,
    required UserRole role,
    UserStatus status = UserStatus.active,
    String notes = '',
  }) async {
    final cleanEmail = normalizeEmail(email);
    if (cleanEmail.isEmpty || !cleanEmail.contains('@')) {
      throw Exception('Please enter a valid Google email address.');
    }

    final currentEmail = normalizeEmail(_firebaseUser?.email ?? '');
    final now = DateTime.now().millisecondsSinceEpoch;
    final ref =
        FirebaseFirestore.instance.collection('allowed_users').doc(cleanEmail);
    final existing = await ref.get();

    final isSuper = cleanEmail == AppFirebaseConfig.superAdminEmail;
    final data = existing.data();

    await ref.set({
      'email': cleanEmail,
      'displayName': displayName.trim().isNotEmpty
          ? displayName.trim()
          : cleanEmail.split('@').first.toUpperCase(),
      'role': isSuper ? 'admin' : (role == UserRole.admin ? 'admin' : 'user'),
      'status': isSuper
          ? 'active'
          : (status == UserStatus.disabled ? 'disabled' : 'active'),
      'notes': notes.trim(),
      'addedBy': (data?['addedBy'] as String?) ?? currentEmail,
      'createdAt': (data?['createdAt'] as num?)?.toInt() ?? now,
      'updatedAt': now,
    }, SetOptions(merge: true));
  }

  Future<void> updateAllowedUser({
    required String email,
    required String displayName,
    required UserRole role,
    required UserStatus status,
    String notes = '',
  }) async {
    final cleanEmail = normalizeEmail(email);
    final isSuper = cleanEmail == AppFirebaseConfig.superAdminEmail;
    final ref =
        FirebaseFirestore.instance.collection('allowed_users').doc(cleanEmail);

    await ref.update({
      'displayName': displayName.trim().isNotEmpty
          ? displayName.trim()
          : cleanEmail.split('@').first.toUpperCase(),
      'role': isSuper ? 'admin' : (role == UserRole.admin ? 'admin' : 'user'),
      'status': isSuper
          ? 'active'
          : (status == UserStatus.disabled ? 'disabled' : 'active'),
      'notes': notes.trim(),
      'updatedAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<void> deleteAllowedUser(String email) async {
    final cleanEmail = normalizeEmail(email);
    if (cleanEmail == AppFirebaseConfig.superAdminEmail) {
      throw Exception('Cannot remove the primary Super Admin account.');
    }
    await FirebaseFirestore.instance
        .collection('allowed_users')
        .doc(cleanEmail)
        .delete();
  }

  @override
  void dispose() {
    _authSub?.cancel();
    _userDocSub?.cancel();
    _allUsersSub?.cancel();
    super.dispose();
  }
}
