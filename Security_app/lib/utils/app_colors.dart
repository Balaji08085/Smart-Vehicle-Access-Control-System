import 'package:flutter/material.dart';

class AppColors {
  static const Color darkBackground = Color(0xFF070A12);
  static const Color cardBackground = Color(0xFF0F172A);
  static const Color cardElevated = Color(0xFF1E293B);
  static const Color primaryRed = Color(0xFF881337);
  static const Color primaryRedHover = Color(0xFF9F1239);
  static const Color accentAmber = Color(0xFFF59E0B);
  static const Color accentAmberGlow = Color(0xFFFBBF24);
  static const Color successGreen = Color(0xFF10B981);
  static const Color dangerRed = Color(0xFFEF4444);
  static const Color infoBlue = Color(0xFF3B82F6);
  static const Color cyanAccent = Color(0xFF06B6D4);

  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  static const Color borderDark = Color(0xFF1E293B);
  static const Color borderGlass = Color(0xFF334155);

  // Gradient Presets
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF881337), Color(0xFFBE123C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient amberGradient = LinearGradient(
    colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient successGradient = LinearGradient(
    colors: [Color(0xFF059669), Color(0xFF10B981)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkCardGradient = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
