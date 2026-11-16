package com.esports.espcalc.esp_calc_mobile

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.pm.Signature
import android.os.Build
import android.os.Debug
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.security.MessageDigest

class MainActivity : FlutterActivity() {
    companion object {
        private const val SECURITY_CHANNEL = "com.esports.espcalc/security"
        private const val EXPECTED_PACKAGE = "com.esports.espcalc.esp_calc_mobile"
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            SECURITY_CHANNEL
        ).setMethodCallHandler { call, result ->
            if (call.method == "verifyAppIntegrity") {
                result.success(evaluateAppIntegrity())
            } else {
                result.notImplemented()
            }
        }
    }

    private fun evaluateAppIntegrity(): Map<String, Any> {
        if (BuildConfig.DEBUG) {
            return mapOf("trusted" to true, "reason" to "debug-build")
        }

        if (packageName != EXPECTED_PACKAGE) {
            return mapOf("trusted" to false, "reason" to "package-mismatch")
        }

        val isDebuggableFlag = (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
        if (isDebuggableFlag) {
            return mapOf("trusted" to false, "reason" to "debuggable-release")
        }

        if (Debug.isDebuggerConnected() || Debug.waitingForDebugger()) {
            return mapOf("trusted" to false, "reason" to "debugger-attached")
        }

        if (hasTracerPid()) {
            return mapOf("trusted" to false, "reason" to "ptrace-attached")
        }

        if (hasInstrumentationHook()) {
            return mapOf("trusted" to false, "reason" to "runtime-hook-detected")
        }

        if (!verifySigningCertificate()) {
            return mapOf("trusted" to false, "reason" to "signature-mismatch")
        }

        return mapOf("trusted" to true, "reason" to "verified")
    }

    private fun hasTracerPid(): Boolean {
        return try {
            val statusLines = File("/proc/self/status").readLines()
            for (line in statusLines) {
                if (line.startsWith("TracerPid:")) {
                    val pid = line.substringAfter("TracerPid:").trim().toIntOrNull() ?: 0
                    if (pid > 0) return true
                }
            }
            false
        } catch (_: Exception) {
            false
        }
    }

    private fun hasInstrumentationHook(): Boolean {
        val suspiciousTokens = listOf(
            "frida",
            "re.frida.server",
            "xposed",
            "lsposed",
            "edxposed",
            "substrate"
        )
        return try {
            val maps = File("/proc/self/maps")
            maps.bufferedReader().useLines { lines ->
                lines.any { line ->
                    val lower = line.lowercase()
                    suspiciousTokens.any { token -> lower.contains(token) }
                }
            }
        } catch (_: Exception) {
            false
        }
    }

    private fun verifySigningCertificate(): Boolean {
        val maskHex = BuildConfig.SIG_MASK
        val digestHex = BuildConfig.SIG_DIGEST
        if (maskHex.length != 64 || digestHex.length != 64) {
            return false
        }

        val expected = decodeXorSha256(maskHex, digestHex) ?: return false
        val actualSigners = getCurrentApkSignatures()
        if (actualSigners.isEmpty()) return false

        val md = MessageDigest.getInstance("SHA-256")
        return actualSigners.any { sig ->
            val sha256 = md.digest(sig.toByteArray())
            constantTimeEquals(sha256, expected)
        }
    }

    private fun decodeXorSha256(maskHex: String, digestHex: String): ByteArray? {
        return try {
            ByteArray(32) { idx ->
                val m = maskHex.substring(idx * 2, idx * 2 + 2).toInt(16)
                val d = digestHex.substring(idx * 2, idx * 2 + 2).toInt(16)
                ((m xor d) and 0xff).toByte()
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun constantTimeEquals(a: ByteArray, b: ByteArray): Boolean {
        if (a.size != b.size) return false
        var diff = 0
        for (i in a.indices) {
            diff = diff or (a[i].toInt() xor b[i].toInt())
        }
        return diff == 0
    }

    @Suppress("DEPRECATION")
    private fun getCurrentApkSignatures(): Array<Signature> {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val info = packageManager.getPackageInfo(
                    packageName,
                    PackageManager.GET_SIGNING_CERTIFICATES
                )
                val signingInfo = info.signingInfo
                if (signingInfo == null) {
                    emptyArray()
                } else if (signingInfo.hasMultipleSigners()) {
                    signingInfo.apkContentsSigners ?: emptyArray()
                } else {
                    signingInfo.signingCertificateHistory ?: emptyArray()
                }
            } else {
                val info = packageManager.getPackageInfo(
                    packageName,
                    PackageManager.GET_SIGNATURES
                )
                info.signatures ?: emptyArray()
            }
        } catch (_: Exception) {
            emptyArray()
        }
    }
}
