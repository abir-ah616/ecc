import java.io.File
import java.io.FileInputStream
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
val hasReleaseKeystore = keystorePropertiesFile.exists()
if (hasReleaseKeystore) {
    FileInputStream(keystorePropertiesFile).use { keystoreProperties.load(it) }
}

fun extractKeystoreCertSha256(
    storeFile: File?,
    storePassword: String?,
    keyAlias: String?
): ByteArray? {
    if (storeFile == null || !storeFile.exists() || storePassword == null || keyAlias == null) {
        return null
    }
    return try {
        val ks = KeyStore.getInstance(KeyStore.getDefaultType())
        FileInputStream(storeFile).use { ks.load(it, storePassword.toCharArray()) }
        val cert = ks.getCertificate(keyAlias) ?: return null
        MessageDigest.getInstance("SHA-256").digest(cert.encoded)
    } catch (_: Exception) {
        null
    }
}

android {
    namespace = "com.mroppy.espcalc"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.mroppy.espcalc"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
    }

    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
                storeFile = rootProject.file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
            }
        }
    }

    val activeReleaseSigning = if (hasReleaseKeystore) {
        signingConfigs.getByName("release")
    } else {
        signingConfigs.getByName("debug")
    }

    val certDigest = extractKeystoreCertSha256(
        activeReleaseSigning.storeFile,
        activeReleaseSigning.storePassword,
        activeReleaseSigning.keyAlias
    )
    val maskBytes = ByteArray(32).also { SecureRandom().nextBytes(it) }
    val maskHex = maskBytes.joinToString("") { "%02x".format(it) }
    val digestHex = if (certDigest != null && certDigest.size == 32) {
        certDigest.mapIndexed { idx, b ->
            "%02x".format((b.toInt() xor maskBytes[idx].toInt()) and 0xff)
        }.joinToString("")
    } else {
        ""
    }

    buildTypes {
        debug {
            buildConfigField("String", "SIG_MASK", "\"$maskHex\"")
            buildConfigField("String", "SIG_DIGEST", "\"$digestHex\"")
        }
        release {
            signingConfig = activeReleaseSigning
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            buildConfigField("String", "SIG_MASK", "\"$maskHex\"")
            buildConfigField("String", "SIG_DIGEST", "\"$digestHex\"")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}
