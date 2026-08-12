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
    final uri = Uri.parse('${AppConfig.baseUrl}$endpoint');
    debugPrint('📡 GET Request: $uri');

    try {
      final headers = await _getHeaders();
      final response = await http.get(uri, headers: headers).timeout(_timeoutDuration);
      return _processResponse<T>(response, parser, method: 'GET');
    } on SocketException catch (e) {
      debugPrint('❌ SocketException: $e');
      return ApiResponse.error('Unable to connect to server at ${AppConfig.baseUrl}. Check Wi-Fi & IP settings.');
    } on TimeoutException catch (e) {
      debugPrint('⏱️ TimeoutException: $e');
      return ApiResponse.error('Server request timed out (10s). Ensure backend is running.');
    } on FormatException catch (e) {
      debugPrint('❌ FormatException: $e');
      return ApiResponse.error('Invalid server response format.');
    } catch (e) {
      debugPrint('❌ Network Error: $e');
      return ApiResponse.error('Network Error: $e');
    }
  }

  static Future<ApiResponse<T>> post<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic json)? parser,
  }) async {
    final uri = Uri.parse('${AppConfig.baseUrl}$endpoint');
    debugPrint('📡 POST Request: $uri');

    try {
      final headers = await _getHeaders();
      final response = await http
          .post(uri, headers: headers, body: jsonEncode(body ?? {}))
          .timeout(_timeoutDuration);
      return _processResponse<T>(response, parser, method: 'POST', body: body);
    } on SocketException catch (e) {
      debugPrint('❌ SocketException: $e');
      return ApiResponse.error('Unable to connect to server at ${AppConfig.baseUrl}. Check Wi-Fi & IP settings.');
    } on TimeoutException catch (e) {
      debugPrint('⏱️ TimeoutException: $e');
      return ApiResponse.error('Server request timed out (10s). Ensure backend is running.');
    } on FormatException catch (e) {
      debugPrint('❌ FormatException: $e');
      return ApiResponse.error('Invalid server response format.');
    } catch (e) {
      debugPrint('❌ Network Error: $e');
      return ApiResponse.error('Network Error: $e');
    }
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
