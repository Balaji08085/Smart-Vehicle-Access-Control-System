import '../models/api_response.dart';
import '../models/dashboard_stats.dart';
import '../models/login_response.dart';
import '../models/qr_result.dart';
import '../models/scan_history.dart';
import '../models/vehicle_request.dart';
import 'api_client.dart';

class ApiService {
  /// Authenticate guard/admin login
  static Future<ApiResponse<LoginResponse>> login(String username, String password, String role) async {
    return ApiClient.post<LoginResponse>(
      '/api/auth/login',
      body: {
        'username': username,
        'password': password,
        'role': role,
      },
      parser: (json) => LoginResponse.fromJson(json),
    );
  }

  /// Get live dashboard metrics
  static Future<ApiResponse<DashboardStats>> getDashboardStats() async {
    return ApiClient.get<DashboardStats>(
      '/api/dashboard',
      parser: (json) => DashboardStats.fromJson(json),
    );
  }

  /// Verify QR Token
  static Future<ApiResponse<QrResult>> verifyQrToken(String token) async {
    return ApiClient.post<QrResult>(
      '/api/verify',
      body: {'qrToken': token},
      parser: (json) => QrResult.fromJson(json),
    );
  }

  /// Get pending vehicle access requests
  static Future<ApiResponse<List<VehicleRequest>>> getPendingRequests() async {
    return ApiClient.get<List<VehicleRequest>>(
      '/api/requests/pending',
      parser: (json) {
        if (json is List) {
          return json.map((i) => VehicleRequest.fromJson(i)).toList();
        }
        if (json is Map && json['requests'] != null) {
          return (json['requests'] as List).map((i) => VehicleRequest.fromJson(i)).toList();
        }
        return [];
      },
    );
  }

  /// Get all vehicle access requests
  static Future<ApiResponse<List<VehicleRequest>>> getAllRequests() async {
    return ApiClient.get<List<VehicleRequest>>(
      '/api/requests',
      parser: (json) {
        if (json is List) {
          return json.map((i) => VehicleRequest.fromJson(i)).toList();
        }
        if (json is Map && json['requests'] != null) {
          return (json['requests'] as List).map((i) => VehicleRequest.fromJson(i)).toList();
        }
        return [];
      },
    );
  }

  /// Approve access request
  static Future<ApiResponse<dynamic>> approveRequest(String requestId) async {
    return ApiClient.put('/api/requests/$requestId/approve');
  }

  /// Reject access request
  static Future<ApiResponse<dynamic>> rejectRequest(String requestId) async {
    return ApiClient.put('/api/requests/$requestId/reject');
  }

  /// Disable access request
  static Future<ApiResponse<dynamic>> disableRequest(String requestId) async {
    return ApiClient.put('/api/requests/$requestId/disable');
  }

  /// Fetch scan audit logs
  static Future<ApiResponse<List<ScanHistory>>> getScanHistory() async {
    return ApiClient.get<List<ScanHistory>>(
      '/api/history/scans',
      parser: (json) {
        if (json is List) {
          return json.map((i) => ScanHistory.fromJson(i)).toList();
        }
        if (json is Map && json['logs'] != null) {
          return (json['logs'] as List).map((i) => ScanHistory.fromJson(i)).toList();
        }
        return [];
      },
    );
  }

  /// Delete a scan history log
  static Future<ApiResponse<dynamic>> deleteScanHistory(String id) async {
    return ApiClient.delete('/api/history/scans/$id');
  }

  /// Clear all scan history logs
  static Future<ApiResponse<dynamic>> clearAllScanHistory() async {
    return ApiClient.delete('/api/history/scans/clear-all');
  }
}
