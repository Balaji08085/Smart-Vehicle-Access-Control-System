import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../utils/constants.dart';

class AuthService {
  static Future<void> saveSession(String token, String role, String username) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.keyAuthToken, token);
      await prefs.setString(AppConstants.keyUserRole, role);
      await prefs.setString(AppConstants.keyUsername, username);
      debugPrint('✅ Auth Session saved for user: $username ($role)');
    } catch (e) {
      debugPrint('❌ Error saving session: $e');
    }
  }

  static Future<String?> getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(AppConstants.keyAuthToken);
    } catch (_) {
      return null;
    }
  }

  static Future<UserModel?> getUserSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(AppConstants.keyAuthToken);
      final role = prefs.getString(AppConstants.keyUserRole) ?? 'guard';
      final username = prefs.getString(AppConstants.keyUsername) ?? 'Guard User';

      if (token != null && token.isNotEmpty) {
        return UserModel(username: username, role: role, token: token);
      }
    } catch (_) {}
    return null;
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  static Future<void> clearSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(AppConstants.keyAuthToken);
      await prefs.remove(AppConstants.keyUserRole);
      await prefs.remove(AppConstants.keyUsername);
      debugPrint('🔒 Session cleared.');
    } catch (e) {
      debugPrint('❌ Error clearing session: $e');
    }
  }
}
