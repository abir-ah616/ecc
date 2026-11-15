import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb;

class AppFirebaseConfig {
  static const String superAdminEmail = 'johncenahzoppy@gmail.com';
  static const String projectId = 'esp-calc-oppy-2026';

  // Web/shared Firebase project options (Android native builds automatically
  // read google-services.json once placed at android/app/google-services.json).
  static const FirebaseOptions webOptions = FirebaseOptions(
    apiKey: 'AIzaSyDBAVt23kOG8EzzwOVcQ1sTJlce_wqovxo',
    appId: '1:497488916740:web:7e359f0f9cabd656dae051',
    messagingSenderId: '497488916740',
    projectId: 'esp-calc-oppy-2026',
    authDomain: 'esp-calc-oppy-2026.firebaseapp.com',
    storageBucket: 'esp-calc-oppy-2026.firebasestorage.app',
  );

  static Future<bool> ensureInitialized() async {
    if (Firebase.apps.isNotEmpty) return true;
    try {
      if (kIsWeb) {
        await Firebase.initializeApp(options: webOptions);
        return true;
      }
      if (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS) {
        await Firebase.initializeApp();
        return true;
      }
      await Firebase.initializeApp(options: webOptions);
      return true;
    } catch (_) {
      return false;
    }
  }
}
