import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb, kReleaseMode;
import 'package:flutter/services.dart';

class AppIntegrityResult {
  final bool trusted;
  final String reason;

  const AppIntegrityResult({
    required this.trusted,
    required this.reason,
  });
}

/// Verifies Android release package identity, signing certificate SHA-256,
/// debuggable flags, and runtime instrumentation hooks over a native MethodChannel.
class AppIntegrityService {
  static const MethodChannel _channel =
      MethodChannel('com.esports.espcalc/security');

  static Future<AppIntegrityResult> verify() async {
    if (!kReleaseMode ||
        kIsWeb ||
        defaultTargetPlatform != TargetPlatform.android) {
      return const AppIntegrityResult(trusted: true, reason: 'non-release');
    }

    try {
      final raw = await _channel
          .invokeMapMethod<dynamic, dynamic>('verifyAppIntegrity');
      final trusted = raw?['trusted'] == true;
      final reason = (raw?['reason'] as String?) ?? 'unknown';
      return AppIntegrityResult(trusted: trusted, reason: reason);
    } on MissingPluginException {
      // Fail closed in Android release builds if native channel is stripped.
      return const AppIntegrityResult(
        trusted: false,
        reason: 'security-channel-missing',
      );
    } on PlatformException {
      return const AppIntegrityResult(
        trusted: false,
        reason: 'security-check-error',
      );
    } catch (_) {
      return const AppIntegrityResult(
        trusted: false,
        reason: 'security-check-failed',
      );
    }
  }
}
