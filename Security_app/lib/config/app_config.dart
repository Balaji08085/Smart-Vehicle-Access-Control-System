import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  // Primary local PC server URL & Live fallback
  static const String _defaultPhysicalDeviceUrl =
      'http://10.100.10.37:5000';

  static const String _defaultLocalhostUrl =
      'http://localhost:5000';

  static const String _urlKey = 'server_base_url';

  static String _currentBaseUrl = _defaultPhysicalDeviceUrl;

  static String get baseUrl {
    var url = _currentBaseUrl.trim();
    // On physical mobile devices, 'localhost' or '127.0.0.1' refers to the phone itself.
    // Replace with local Wi-Fi IP address 10.100.10.37 for instant local verification.
    if (!kIsWeb && (url.contains('localhost') || url.contains('127.0.0.1'))) {
      url = url.replaceAll('localhost', '10.100.10.37').replaceAll('127.0.0.1', '10.100.10.37');
    }
    return url;
  }

  static String get defaultUrl =>
      kIsWeb ? _defaultLocalhostUrl : _defaultPhysicalDeviceUrl;

  /// Load initial base URL from SharedPreferences
  /// or use the live server URL by default.
  static Future<String> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedUrl = prefs.getString(_urlKey);

      if (savedUrl != null && savedUrl.trim().isNotEmpty) {
        final trimmed = savedUrl.trim();

        // Migrate old cached URLs to current active Wi-Fi IP
        if (trimmed.contains('mccmrfip.in') ||
            trimmed.contains('10.100.10.85') ||
            trimmed.contains('192.168.') ||
            trimmed.contains('10.0.2.2')) {
          _currentBaseUrl = defaultUrl;
          await prefs.setString(_urlKey, _currentBaseUrl);
          debugPrint(
            '🔄 Migrated old cached URL to active Wi-Fi server: $_currentBaseUrl',
          );
          return _currentBaseUrl;
        }

        _currentBaseUrl = trimmed;

        debugPrint(
          '✅ Loaded active base URL: $_currentBaseUrl',
        );

        return _currentBaseUrl;
      }
    } catch (e) {
      debugPrint(
        '⚠️ Error reading base URL from SharedPreferences: $e',
      );
    }

    // Use live server as the default
    _currentBaseUrl = kIsWeb ? _defaultLocalhostUrl : _defaultPhysicalDeviceUrl;

    try {
      final prefs = await SharedPreferences.getInstance();

      await prefs.setString(
        _urlKey,
        _currentBaseUrl,
      );

      debugPrint(
        '✅ Initialized default base URL: $_currentBaseUrl',
      );
    } catch (e) {
      debugPrint(
        '⚠️ Error saving default base URL: $e',
      );
    }

    return _currentBaseUrl;
  }

  /// Update and persist a new server URL
  static Future<void> setBaseUrl(String newUrl) async {
    var cleanUrl = newUrl.trim();

    // Remove trailing slash
    while (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.substring(
        0,
        cleanUrl.length - 1,
      );
    }

    _currentBaseUrl = cleanUrl;

    try {
      final prefs = await SharedPreferences.getInstance();

      await prefs.setString(
        _urlKey,
        cleanUrl,
      );

      debugPrint(
        '✅ Server Base URL saved: $cleanUrl',
      );
    } catch (e) {
      debugPrint(
        '❌ Error persisting base URL: $e',
      );
    }
  }
}
