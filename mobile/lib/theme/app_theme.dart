import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/tournament_models.dart';

class BroadcastThemePalette {
  final ThemePreset preset;
  final String label;
  final Color primary;
  final Color secondary;

  const BroadcastThemePalette({
    required this.preset,
    required this.label,
    required this.primary,
    required this.secondary,
  });
}

const List<BroadcastThemePalette> broadcastThemePalettes = [
  BroadcastThemePalette(
    preset: ThemePreset.v2,
    label: 'FF Yellow',
    primary: Color(0xFFFF9800),
    secondary: Color(0xFFB45309),
  ),
  BroadcastThemePalette(
    preset: ThemePreset.scarlet,
    label: 'Scarlet Strike',
    primary: Color(0xFFE11D2E),
    secondary: Color(0xFF7F1D1D),
  ),
  BroadcastThemePalette(
    preset: ThemePreset.volt,
    label: 'Apex Volt',
    primary: Color(0xFF00EA87),
    secondary: Color(0xFF059669),
  ),
  BroadcastThemePalette(
    preset: ThemePreset.whiteout,
    label: 'Whiteout Pro',
    primary: Color(0xFFF1F5F9),
    secondary: Color(0xFFDC142C),
  ),
  BroadcastThemePalette(
    preset: ThemePreset.blue,
    label: 'Arctic Cyan',
    primary: Color(0xFF38BDF8),
    secondary: Color(0xFF1D4ED8),
  ),
  BroadcastThemePalette(
    preset: ThemePreset.gold,
    label: 'Cyber Rose',
    primary: Color(0xFFFF2A6D),
    secondary: Color(0xFF9D174D),
  ),
  BroadcastThemePalette(
    preset: ThemePreset.eclipse,
    label: 'Imperial Gold',
    primary: Color(0xFFEAB308),
    secondary: Color(0xFF854D0E),
  ),
];

BroadcastThemePalette themePaletteFor(ThemePreset preset) {
  for (final p in broadcastThemePalettes) {
    if (p.preset == preset) return p;
  }
  return broadcastThemePalettes.first;
}

class AppColors {
  static const canvas = Color(0xFF090B0F);
  static const surface = Color(0xFF12151C);
  static const surfaceTop = Color(0xFF161A24);
  static const surfaceElevated = Color(0xFF181C26);
  static const inputFill = Color(0xFF0D1017);
  static const sheet = Color(0xFF141821);

  static const borderSubtle = Color(0xFF1F2430);
  static const borderStrong = Color(0xFF2B3242);
  static const specularHighlight = Color(0x16FFFFFF);

  static const accent = Color(0xFFF59E0B);
  static const accentBright = Color(0xFFFBBF24);
  static const accentSurface = Color(0x1FF59E0B);
  static const accentBorder = Color(0x55F59E0B);

  static const emerald = Color(0xFF22C55E);
  static const emeraldSurface = Color(0x1E22C55E);
  static const crimson = Color(0xFFEF4444);
  static const crimsonSurface = Color(0x22EF4444);

  static const textPrimary = Color(0xFFF8FAFC);
  static const textSecondary = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF64748B);
  static const inkOnAccent = Color(0xFF090A0D);
}

class AppTheme {
  static ThemeData dark() {
    final baseTextTheme = GoogleFonts.plusJakartaSansTextTheme(
      ThemeData.dark().textTheme,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.canvas,
      canvasColor: AppColors.canvas,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.accent,
        onPrimary: AppColors.inkOnAccent,
        secondary: AppColors.emerald,
        onSecondary: Colors.white,
        surface: AppColors.surface,
        onSurface: AppColors.textPrimary,
        error: AppColors.crimson,
        onError: Colors.white,
      ),
      textTheme: baseTextTheme.copyWith(
        headlineMedium: baseTextTheme.headlineMedium?.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.6,
        ),
        titleLarge: baseTextTheme.titleLarge?.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
        titleMedium: baseTextTheme.titleMedium?.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w700,
        ),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(
          color: AppColors.textSecondary,
        ),
        bodySmall: baseTextTheme.bodySmall?.copyWith(
          color: AppColors.textMuted,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.canvas,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
          statusBarBrightness: Brightness.dark,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.borderSubtle),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.inputFill,
        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.accent, width: 1.4),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.sheet,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.borderSubtle,
        thickness: 1,
        space: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.surfaceElevated,
        contentTextStyle: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppColors.borderStrong),
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

const TextStyle kTabularNumbers = TextStyle(
  fontFeatures: [FontFeature.tabularFigures()],
);
