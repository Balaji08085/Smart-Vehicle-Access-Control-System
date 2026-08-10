import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  static const String _defaultPhysicalDeviceUrl = 'http://10.100.10.85:5000';
  static const String _defaultLocalhostUrl = 'http://localhost:5000';
  static const String _urlKey = 'server_base_url';

  static String _currentBaseUrl = _defaultPhysicalDeviceUrl;

  static String get baseUrl => _currentBaseUrl;
  static String get defaultUrl => kIsWeb ? _defaultLocalhostUrl : _defaultPhysicalDeviceUrl;

  /// Load initial base URL from SharedPreferences or use platform default
  static Future<String> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedUrl = prefs.getString(_urlKey);
      if (savedUrl != null && savedUrl.trim().isNotEmpty) {
        _currentBaseUrl = savedUrl.trim();
        debugPrint('✅ Loaded active base URL: $_currentBaseUrl');
        return _currentBaseUrl;
      }
    } catch (e) {
      debugPrint('⚠️ Error reading base URL from SharedPreferences: $e');
    }

    _currentBaseUrl = kIsWeb ? _defaultLocalhostUrl : _defaultPhysicalDeviceUrl;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_urlKey, _currentBaseUrl);
      debugPrint('✅ Initialized default base URL: $_currentBaseUrl');
    } catch (_) {}
    return _currentBaseUrl;
  }

  /// Update and persist new server URL
  static Future<void> setBaseUrl(String newUrl) async {
    var cleanUrl = newUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
    }
    _currentBaseUrl = cleanUrl;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_urlKey, cleanUrl);
      debugPrint('✅ Server Base URL saved: $cleanUrl');
    } catch (e) {
      debugPrint('❌ Error persisting base URL: $e');
    }
  }
}
