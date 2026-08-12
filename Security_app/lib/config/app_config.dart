import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  // Live backend server URL
  static const String _defaultPhysicalDeviceUrl =
      'https://smart-vehicle-access-control-system.mccmrfip.in';

  static const String _defaultLocalhostUrl =
      'https://smart-vehicle-access-control-system.mccmrfip.in';

  static const String _urlKey = 'server_base_url';

  static String _currentBaseUrl = _defaultPhysicalDeviceUrl;

  static String get baseUrl {
    var url = _currentBaseUrl.trim();
    // Enforce https:// for live web domains to prevent HTTP 301 redirects
    if (url.startsWith('http://') &&
        !url.contains('192.168.') &&
        !url.contains('10.100.') &&
        !url.contains('10.0.') &&
        !url.contains('localhost') &&
        !url.contains('127.0.0.1')) {
      url = url.replaceFirst('http://', 'https://');
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

        // Automatically migrate old cached local dev IPs to live production server
        if (trimmed.contains('10.100.10.85') ||
            trimmed.contains('192.168.') ||
            trimmed.contains('10.0.2.2')) {
          _currentBaseUrl = defaultUrl;
          await prefs.setString(_urlKey, _currentBaseUrl);
          debugPrint(
            '🔄 Migrated old cached local IP to live server URL: $_currentBaseUrl',
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
