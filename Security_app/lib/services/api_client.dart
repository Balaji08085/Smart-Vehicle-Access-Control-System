import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/api_response.dart';
import 'auth_service.dart';

class ApiClient {
  static const Duration _timeoutDuration = Duration(seconds: 25);

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<ApiResponse<T>> get<T>(
    String endpoint, {
    T Function(dynamic json)? parser,
  }) async {
    final primaryBase = AppConfig.baseUrl;
    final secondaryBase = primaryBase.contains('10.100.10.27')
        ? 'https://smart-vehicle-access-control-system.mccmrfip.in'
        : 'http://10.100.10.27:5000';

    final urlsToTry = [primaryBase, secondaryBase];

    for (int i = 0; i < urlsToTry.length; i++) {
      final baseUrl = urlsToTry[i];
      final uri = Uri.parse('$baseUrl$endpoint');
      debugPrint('📡 GET Request (Attempt ${i + 1}): $uri');

      try {
        final headers = await _getHeaders();
        final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 8));
        final result = await _processResponse<T>(response, parser, method: 'GET');
        if (result.success || i == urlsToTry.length - 1) {
          return result;
        }
      } catch (e) {
        debugPrint('⚠️ Attempt ${i + 1} GET failed for $uri: $e');
        if (i == urlsToTry.length - 1) {
          return ApiResponse.error('Network Error: $e');
        }
      }
    }
    return ApiResponse.error('GET Request Failed');
  }

  static Future<ApiResponse<T>> post<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic json)? parser,
  }) async {
    final primaryBase = AppConfig.baseUrl;
    final secondaryBase = primaryBase.contains('10.100.10.27')
        ? 'https://smart-vehicle-access-control-system.mccmrfip.in'
        : 'http://10.100.10.27:5000';

    final urlsToTry = [primaryBase, secondaryBase];

    for (int i = 0; i < urlsToTry.length; i++) {
      final baseUrl = urlsToTry[i];
      final uri = Uri.parse('$baseUrl$endpoint');
      debugPrint('📡 POST Request (Attempt ${i + 1}): $uri');

      try {
        final headers = await _getHeaders();
        final response = await http
            .post(uri, headers: headers, body: jsonEncode(body ?? {}))
            .timeout(const Duration(seconds: 8));
        final result = await _processResponse<T>(response, parser, method: 'POST', body: body);
        if (result.success || i == urlsToTry.length - 1) {
          return result;
        }
      } on SocketException catch (e) {
        debugPrint('❌ Attempt ${i + 1} SocketException: $e');
        if (i == urlsToTry.length - 1) {
          return ApiResponse.error('Unable to connect to server ($baseUrl). Check Wi-Fi & IP settings.');
        }
      } on TimeoutException catch (e) {
        debugPrint('⏱️ Attempt ${i + 1} TimeoutException: $e');
        if (i == urlsToTry.length - 1) {
          return ApiResponse.error('Server request timed out. Ensure backend server is running.');
        }
      } catch (e) {
        debugPrint('❌ Attempt ${i + 1} Error: $e');
        if (i == urlsToTry.length - 1) {
          return ApiResponse.error('Network Error: $e');
        }
      }
    }
    return ApiResponse.error('Verification failed');
  }

  static Future<ApiResponse<T>> put<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic json)? parser,
  }) async {
    final uri = Uri.parse('${AppConfig.baseUrl}$endpoint');
    debugPrint('📡 PUT Request: $uri');

    try {
      final headers = await _getHeaders();
      final response = await http
          .put(uri, headers: headers, body: jsonEncode(body ?? {}))
          .timeout(_timeoutDuration);
      return _processResponse<T>(response, parser, method: 'PUT', body: body);
    } on SocketException {
      return ApiResponse.error('Unable to connect to server. Check Wi-Fi & IP settings.');
    } on TimeoutException {
      return ApiResponse.error('Server request timed out.');
    } catch (e) {
      return ApiResponse.error('Network Error: $e');
    }
  }

  static Future<ApiResponse<T>> delete<T>(
    String endpoint, {
    T Function(dynamic json)? parser,
  }) async {
    final uri = Uri.parse('${AppConfig.baseUrl}$endpoint');
    debugPrint('📡 DELETE Request: $uri');

    try {
      final headers = await _getHeaders();
      final response = await http.delete(uri, headers: headers).timeout(_timeoutDuration);
      return _processResponse<T>(response, parser, method: 'DELETE');
    } catch (e) {
      return ApiResponse.error('Network Error: $e');
    }
  }

  static Future<ApiResponse<T>> _processResponse<T>(
    http.Response response,
    T Function(dynamic json)? parser, {
    int redirectCount = 0,
    String method = 'GET',
    Map<String, dynamic>? body,
  }) async {
    debugPrint('📥 Response Code: ${response.statusCode}');

    // Handle HTTP Redirects (301, 302, 307, 308)
    if ([301, 302, 307, 308].contains(response.statusCode) && redirectCount < 5) {
      final redirectUrl = response.headers['location'];
      if (redirectUrl != null && redirectUrl.isNotEmpty) {
        debugPrint('🔀 Following Redirect (${response.statusCode}) -> $redirectUrl');
        final targetUri = Uri.parse(redirectUrl);
        final headers = await _getHeaders();

        http.Response redirectedResponse;
        if (method == 'POST') {
          redirectedResponse = await http
              .post(targetUri, headers: headers, body: jsonEncode(body ?? {}))
              .timeout(_timeoutDuration);
        } else if (method == 'PUT') {
          redirectedResponse = await http
              .put(targetUri, headers: headers, body: jsonEncode(body ?? {}))
              .timeout(_timeoutDuration);
        } else {
          redirectedResponse = await http
              .get(targetUri, headers: headers)
              .timeout(_timeoutDuration);
        }

        return _processResponse<T>(
          redirectedResponse,
          parser,
          redirectCount: redirectCount + 1,
          method: method,
          body: body,
        );
      }
    }

    if (response.statusCode == 200 || response.statusCode == 201) {
      try {
        final decoded = jsonDecode(response.body);
        final data = parser != null ? parser(decoded) : decoded as T;
        return ApiResponse.success(data, statusCode: response.statusCode);
      } catch (e) {
        return ApiResponse.error('Failed to parse response data', statusCode: response.statusCode);
      }
    } else if (response.statusCode == 401) {
      return ApiResponse.error('Unauthorized access. Please login again.', statusCode: 401);
    } else if (response.statusCode == 403) {
      return ApiResponse.error('Forbidden action.', statusCode: 403);
    } else {
      return ApiResponse.error('Server Error (${response.statusCode})', statusCode: response.statusCode);
    }
  }
}
