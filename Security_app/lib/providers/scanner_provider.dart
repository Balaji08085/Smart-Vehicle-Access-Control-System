import 'package:flutter/material.dart';
import '../models/qr_result.dart';
import '../services/api_service.dart';

class ScannerProvider with ChangeNotifier {
  bool _isScanning = true;
  bool _isVerifying = false;
  bool _isFlashOn = false;
  QrResult? _lastResult;
  String? _errorMessage;

  bool get isScanning => _isScanning;
  bool get isVerifying => _isVerifying;
  bool get isFlashOn => _isFlashOn;
  QrResult? get lastResult => _lastResult;
  String? get errorMessage => _errorMessage;

  void toggleFlash() {
    _isFlashOn = !_isFlashOn;
    notifyListeners();
  }

  void resumeScanning() {
    _isScanning = true;
    _isVerifying = false;
    _lastResult = null;
    _errorMessage = null;
    notifyListeners();
  }

  Future<QrResult?> verifyToken(String token) async {
    if (!_isScanning || _isVerifying) return null;

    _isScanning = false;
    _isVerifying = true;
    _errorMessage = null;
    notifyListeners();

    final response = await ApiService.verifyQrToken(token);

    _isVerifying = false;

    if (response.success && response.data != null) {
      _lastResult = response.data!;
      notifyListeners();
      return _lastResult;
    } else {
      _errorMessage = response.message ?? 'Verification Error';
      _lastResult = QrResult(
        status: 'DENIED',
        vehicleNumber: token,
        reason: _errorMessage,
      );
      notifyListeners();
      return _lastResult;
    }
  }
}
