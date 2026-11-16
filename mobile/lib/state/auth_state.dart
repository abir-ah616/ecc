import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show ChangeNotifier, kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';
import '../core/app_integrity.dart';
import '../core/firebase_config.dart';
import '../models/auth_models.dart';

String normalizeEmail(String email) => email.trim().toLowerCase();

class AuthStore extends ChangeNotifier {
  User? _firebaseUser;
  AllowedUserRecord? _allowedRecord;
  List<AllowedUserRecord> _allUsers = [];
  bool _allowTempLogin = false;
  bool _isLoading = true;
  bool _isFirebaseReady = false;
  bool _isAllowed = false;
  bool _isAdmin = false;
  bool _integrityTrusted = true;
  String? _integrityError;
  String? _authError;
  DateTime? _lastServerRefreshAt;
  Future<void> Function()? _activeServerRefresh;

  StreamSubscription<User?>? _authSub;
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _userDocSub;
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _settingsSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _allUsersSub;

  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: const ['email']);

  User? get firebaseUser => _firebaseUser;
  AllowedUserRecord? get allowedRecord => _allowedRecord;
  List<AllowedUserRecord> get allUsers => _allUsers;
  bool get allowTempLogin => _allowTempLogin;
  bool get isLoading => _isLoading;
  bool get isFirebaseReady => _isFirebaseReady;
  bool get isAllowed => _isAllowed;
  bool get isAdmin => _isAdmin;
  bool get integrityTrusted => _integrityTrusted;
  String? get integrityError => _integrityError;
  String? get authError => _authError;

  Future<bool> _verifyAppIntegrity() async {
    final res = await AppIntegrityService.verify();
    if (!res.trusted) {
      _integrityTrusted = false;
      _integrityError =
          'Security verification failed (${res.reason}). Modified or untrusted app builds are blocked.';
      _authError = _integrityError;
      _isAllowed = false;
      _isAdmin = false;
      _isLoading = false;
      _allowedRecord = null;
      _allUsers = [];
      try {
        if (_isFirebaseReady) {
          await FirebaseAuth.instance.signOut();
        }
      } catch (_) {}
      notifyListeners();
      return false;
    }
    _integrityTrusted = true;
    _integrityError = null;
    return true;
  }

  Future<void> initialize() async {
    final trusted = await _verifyAppIntegrity();
    if (!trusted) return;

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

  Future<void> onAppResumed() async {
    final trusted = await _verifyAppIntegrity();
    if (!trusted) return;
    final refresh = _activeServerRefresh;
    if (refresh != null) {
      await refresh();
    }
  }

  Future<void> _onAuthChanged(User? user) async {
    await _userDocSub?.cancel();
    await _settingsSub?.cancel();
    await _allUsersSub?.cancel();
    _userDocSub = null;
    _settingsSub = null;
    _allUsersSub = null;
    _activeServerRefresh = null;

    if (!await _verifyAppIntegrity()) {
      return;
    }

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

    if (!user.emailVerified) {
      _firebaseUser = user;
      _allowedRecord = null;
      _allUsers = [];
      _isAllowed = false;
      _isAdmin = false;
      _authError =
          'A verified Google account email is required to access this workspace.';
      _isLoading = false;
      notifyListeners();
      return;
    }

    final emailLower = normalizeEmail(user.email!);
    final isSuperAdmin = emailLower == AppFirebaseConfig.superAdminEmail;
    final db = FirebaseFirestore.instance;
    final userDocRef = db.collection('allowed_users').doc(emailLower);
    final settingsRef = db.collection('app_settings').doc('auth');

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

    AllowedUserRecord? latestRecord;
    bool recordLoaded = false;
    bool settingsLoaded = false;
    bool serverVerified = false;
    bool latestAllowTemp = false;
    bool attemptedTempOnboarding = false;

    Future<void> evaluateSession() async {
      if (!_integrityTrusted || !serverVerified || !recordLoaded || !settingsLoaded) {
        return;
      }

      if (latestRecord != null) {
        final rec = latestRecord!;
        final active = rec.status == UserStatus.active;
        final isTemp = rec.role == UserRole.temp;
        final allowed = isSuperAdmin || (active && (!isTemp || latestAllowTemp));
        final admin = isSuperAdmin || (active && rec.role == UserRole.admin);

        _firebaseUser = user;
        _allowedRecord = rec;
        _allowTempLogin = latestAllowTemp;
        _isAllowed = allowed;
        _isAdmin = admin;
        _authError = (isTemp && active && !latestAllowTemp)
            ? 'Temporary login is currently disabled. Ask an administrator to re-enable Temp Login or upgrade your account to a permanent User.'
            : null;
        _isLoading = false;
        notifyListeners();

        if (allowed && (rec.uid == null || rec.uid != user.uid)) {
          try {
            await userDocRef.update({
              'lastLoginAt': DateTime.now().millisecondsSinceEpoch,
              'updatedAt': DateTime.now().millisecondsSinceEpoch,
              'uid': user.uid,
              'photoURL': user.photoURL ?? rec.photoUrl ?? '',
              'displayName': rec.displayName.isNotEmpty
                  ? rec.displayName
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
        return;
      }

      if (isSuperAdmin) {
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
        _allowTempLogin = latestAllowTemp;
        _isAllowed = true;
        _isAdmin = true;
        _authError = null;
        _isLoading = false;
        notifyListeners();
        _startAllUsersSubscription();
        return;
      }

      // Auto-register as temporary user when allowTempLogin is turned ON
      if (latestAllowTemp && !attemptedTempOnboarding) {
        attemptedTempOnboarding = true;
        try {
          final now = DateTime.now().millisecondsSinceEpoch;
          final rawName = (user.displayName ?? '').trim();
          await userDocRef.set({
            'email': emailLower,
            'displayName': rawName.isNotEmpty
                ? rawName.substring(0, rawName.length > 120 ? 120 : rawName.length)
                : emailLower.split('@').first.toUpperCase(),
            'role': 'temp',
            'status': 'active',
            'notes': 'Temporary login session',
            'addedBy': 'temp-login',
            'createdAt': now,
            'updatedAt': now,
            'lastLoginAt': now,
            'photoURL': user.photoURL ?? '',
            'uid': user.uid,
          });
          return;
        } catch (_) {
          // Fall through to blocked state if creation denied
        }
      }

      _firebaseUser = user;
      _allowedRecord = null;
      _allowTempLogin = latestAllowTemp;
      _isAllowed = false;
      _isAdmin = false;
      _isLoading = false;
      notifyListeners();
    }

    Future<void> verifyFromServer({bool forceRefresh = false}) async {
      final now = DateTime.now();
      if (!forceRefresh &&
          _lastServerRefreshAt != null &&
          now.difference(_lastServerRefreshAt!).inSeconds < 20) {
        return;
      }
      _lastServerRefreshAt = now;

      try {
        await user.getIdToken(forceRefresh);
        final results = await Future.wait([
          settingsRef.get(const GetOptions(source: Source.server)),
          userDocRef.get(const GetOptions(source: Source.server)),
        ]);
        final settingsSnap = results[0];
        final userSnap = results[1];
        latestAllowTemp = settingsSnap.exists &&
            (settingsSnap.data()?['allowTempLogin'] as bool? ?? false);
        latestRecord = userSnap.exists && userSnap.data() != null
            ? AllowedUserRecord.fromMap(userSnap.data()!)
            : null;
        settingsLoaded = true;
        recordLoaded = true;
        serverVerified = true;
        _allowTempLogin = latestAllowTemp;
        await evaluateSession();
      } on FirebaseAuthException catch (e) {
        if (e.code == 'user-disabled' ||
            e.code == 'user-token-expired' ||
            e.code == 'user-not-found' ||
            e.code == 'invalid-user-token') {
          await logout();
          _authError = 'Your session has been revoked or disabled.';
          notifyListeners();
          return;
        }
        if (!serverVerified) {
          _firebaseUser = user;
          _allowedRecord = null;
          _isAllowed = false;
          _isAdmin = false;
          _authError =
              'Online server verification is required to sign in. Connect to the internet and retry.';
          _isLoading = false;
          notifyListeners();
        }
      } catch (_) {
        if (!serverVerified) {
          _firebaseUser = user;
          _allowedRecord = null;
          _isAllowed = false;
          _isAdmin = false;
          _authError =
              'Online server verification is required to sign in. Connect to the internet and retry.';
          _isLoading = false;
          notifyListeners();
        }
      }
    }

    _activeServerRefresh = () => verifyFromServer(forceRefresh: false);

    // Require live server verification before honoring cached snapshots
    await verifyFromServer(forceRefresh: true);

    _settingsSub = settingsRef.snapshots(includeMetadataChanges: true).listen(
      (snap) {
        if (!serverVerified && snap.metadata.isFromCache) return;
        if (!snap.metadata.isFromCache) serverVerified = true;
        latestAllowTemp =
            snap.exists && (snap.data()?['allowTempLogin'] as bool? ?? false);
        settingsLoaded = true;
        _allowTempLogin = latestAllowTemp;
        evaluateSession();
      },
      onError: (_) {
        latestAllowTemp = false;
        settingsLoaded = true;
        evaluateSession();
      },
    );

    _userDocSub = userDocRef.snapshots(includeMetadataChanges: true).listen(
      (docSnap) {
        if (!serverVerified && docSnap.metadata.isFromCache) return;
        if (!docSnap.metadata.isFromCache) serverVerified = true;
        latestRecord = docSnap.exists && docSnap.data() != null
            ? AllowedUserRecord.fromMap(docSnap.data()!)
            : null;
        recordLoaded = true;
        evaluateSession();
      },
      onError: (_) {
        recordLoaded = true;
        if (isSuperAdmin && serverVerified) {
          _firebaseUser = user;
          _isAllowed = true;
          _isAdmin = true;
          _isLoading = false;
          notifyListeners();
          _startAllUsersSubscription();
        } else {
          evaluateSession();
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
      int roleRank(UserRole r) {
        switch (r) {
          case UserRole.admin:
            return 0;
          case UserRole.user:
            return 1;
          case UserRole.temp:
            return 2;
        }
      }

      final list = snapshot.docs
          .map((d) => AllowedUserRecord.fromMap(d.data()))
          .toList()
        ..sort((a, b) {
          if (a.email == AppFirebaseConfig.superAdminEmail) return -1;
          if (b.email == AppFirebaseConfig.superAdminEmail) return 1;
          final rDiff = roleRank(a.role) - roleRank(b.role);
          if (rDiff != 0) return rDiff;
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

  Future<void> setAllowTempLogin(bool enabled) async {
    final currentEmail = normalizeEmail(_firebaseUser?.email ?? '');
    if (currentEmail.isEmpty || !_isAdmin) {
      throw Exception('Admin authentication required.');
    }
    await FirebaseFirestore.instance.collection('app_settings').doc('auth').set({
      'allowTempLogin': enabled,
      'updatedAt': DateTime.now().millisecondsSinceEpoch,
      'updatedBy': currentEmail,
    }, SetOptions(merge: true));
    _allowTempLogin = enabled;
    notifyListeners();
  }

  Future<void> promoteTempToUser(AllowedUserRecord u) async {
    await updateAllowedUser(
      email: u.email,
      displayName: u.displayName,
      role: UserRole.user,
      status: UserStatus.active,
      notes: u.notes,
    );
  }

  Future<void> signInWithGoogle() async {
    if (!await _verifyAppIntegrity()) {
      return;
    }
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
    await _settingsSub?.cancel();
    await _allUsersSub?.cancel();
    _userDocSub = null;
    _settingsSub = null;
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
    if (!_isAdmin) {
      throw Exception('Admin authentication required.');
    }
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
      'role': isSuper ? 'admin' : userRoleToString(role),
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
    if (!_isAdmin) {
      throw Exception('Admin authentication required.');
    }
    final cleanEmail = normalizeEmail(email);
    final isSuper = cleanEmail == AppFirebaseConfig.superAdminEmail;
    final ref =
        FirebaseFirestore.instance.collection('allowed_users').doc(cleanEmail);

    await ref.update({
      'displayName': displayName.trim().isNotEmpty
          ? displayName.trim()
          : cleanEmail.split('@').first.toUpperCase(),
      'role': isSuper ? 'admin' : userRoleToString(role),
      'status': isSuper
          ? 'active'
          : (status == UserStatus.disabled ? 'disabled' : 'active'),
      'notes': notes.trim(),
      'updatedAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<void> deleteAllowedUser(String email) async {
    if (!_isAdmin) {
      throw Exception('Admin authentication required.');
    }
    final cleanEmail = normalizeEmail(email);
    if (cleanEmail == AppFirebaseConfig.superAdminEmail) {
      throw Exception('Cannot delete the primary Super Admin account.');
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
    _settingsSub?.cancel();
    _allUsersSub?.cancel();
    super.dispose();
  }
}
