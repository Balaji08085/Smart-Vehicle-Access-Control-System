import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import '../providers/scanner_provider.dart';
import '../utils/app_colors.dart';
import '../utils/routes.dart';
import '../widgets/app_bar_widget.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> with WidgetsBindingObserver {
  late MobileScannerController _cameraController;
  final _manualTokenController = TextEditingController();

  bool _hasCameraPermission = false;
  bool _isPermissionChecked = false;
  bool _isTorchOn = false;
  CameraFacing _currentFacing = CameraFacing.back;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initController();
    _checkPermission();
  }

  void _initController() {
    _cameraController = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: _currentFacing,
      torchEnabled: false,
      returnImage: false,
    );
  }

  Future<void> _checkPermission() async {
    var status = await Permission.camera.status;
    if (status.isDenied || status.isPermanentlyDenied) {
      status = await Permission.camera.request();
    }

    if (mounted) {
      setState(() {
        _hasCameraPermission = status.isGranted;
        _isPermissionChecked = true;
      });

      if (status.isGranted) {
        Provider.of<ScannerProvider>(context, listen: false).resumeScanning();
      }
    }
  }

  Future<void> _restartCamera() async {
    try {
      await _cameraController.stop();
      await _cameraController.dispose();
    } catch (e) {
      debugPrint('⚠️ Error disposing old camera controller: $e');
    }

    _isTorchOn = false;
    _initController();

    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _toggleTorch() async {
    try {
      await _cameraController.toggleTorch();
      if (mounted) {
        setState(() {
          _isTorchOn = !_isTorchOn;
        });
      }
    } catch (e) {
      debugPrint('⚠️ Error toggling torch: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Flashlight is unavailable on this camera mode'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  Future<void> _switchCamera() async {
    try {
      await _cameraController.switchCamera();
      if (mounted) {
        setState(() {
          _currentFacing = _currentFacing == CameraFacing.back ? CameraFacing.front : CameraFacing.back;
        });
      }
    } catch (e) {
      debugPrint('⚠️ Error switching camera: $e');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive || state == AppLifecycleState.paused) {
      try {
        _cameraController.stop();
      } catch (_) {}
    } else if (state == AppLifecycleState.resumed && _hasCameraPermission) {
      try {
        if (!_cameraController.value.isRunning) {
          _cameraController.start();
        }
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraController.dispose();
    _manualTokenController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    final scannerProvider = Provider.of<ScannerProvider>(context, listen: false);
    if (!scannerProvider.isScanning || scannerProvider.isVerifying) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final barcode = barcodes.first;
      final String? rawVal = barcode.rawValue ?? barcode.displayValue;
      if (rawVal != null && rawVal.trim().isNotEmpty) {
        String token = rawVal.trim();
        if (token.contains('/verify/')) {
          token = Uri.decodeFull(token.split('/verify/').last).trim();
        }

        final result = await scannerProvider.verifyToken(token);
        if (mounted && result != null) {
          await Navigator.pushNamed(context, AppRoutes.result, arguments: result);
          if (mounted) {
            scannerProvider.resumeScanning();
            try {
              if (!_cameraController.value.isRunning) {
                _cameraController.start();
              }
            } catch (_) {}
          }
        } else {
          scannerProvider.resumeScanning();
        }
      }
    }
  }

  void _submitManualToken() async {
    String token = _manualTokenController.text.trim();
    if (token.isEmpty) return;
    if (token.contains('/verify/')) {
      token = Uri.decodeFull(token.split('/verify/').last).trim();
    }

    final scannerProvider = Provider.of<ScannerProvider>(context, listen: false);
    final result = await scannerProvider.verifyToken(token);
    if (mounted && result != null) {
      _manualTokenController.clear();
      await Navigator.pushNamed(context, AppRoutes.result, arguments: result);
      if (mounted) {
        scannerProvider.resumeScanning();
        try {
          if (!_cameraController.value.isRunning) {
            _cameraController.start();
          }
        } catch (_) {}
      }
    }
  }

  Widget _buildCameraViewport(ScannerProvider scannerProvider) {
    if (!_isPermissionChecked) {
      return Container(
        color: AppColors.darkBackground,
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: AppColors.accentAmber, strokeWidth: 3),
              SizedBox(height: 16),
              Text(
                'CHECKING CAMERA PERMISSIONS...',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.2),
              ),
            ],
          ),
        ),
      );
    }

    if (!_hasCameraPermission) {
      return Container(
        decoration: const BoxDecoration(
          color: AppColors.darkBackground,
          gradient: AppColors.darkCardGradient,
        ),
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.dangerRed.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.dangerRed.withValues(alpha: 0.4), width: 2),
                ),
                child: const Icon(Icons.no_photography_rounded, size: 60, color: AppColors.dangerRed),
              ),
              const SizedBox(height: 20),
              const Text(
                'Camera Access Required',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20),
              ),
              const SizedBox(height: 10),
              const Text(
                'SVACS Gate QR Scanner requires camera permission to scan vehicle permits.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 28),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                alignment: WrapAlignment.center,
                children: [
                  ElevatedButton.icon(
                    onPressed: _checkPermission,
                    icon: const Icon(Icons.camera_alt_rounded),
                    label: const Text('GRANT CAMERA PERMISSION', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryRed,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 6,
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => openAppSettings(),
                    icon: const Icon(Icons.settings_rounded, size: 18),
                    label: const Text('OPEN APP SETTINGS', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.accentAmber,
                      side: const BorderSide(color: AppColors.accentAmber, width: 1.5),
                      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    return Stack(
      children: [
        // Native MobileScanner Camera Feed
        MobileScanner(
          key: ValueKey(_cameraController.hashCode),
          controller: _cameraController,
          fit: BoxFit.cover,
          onDetect: _onDetect,
          errorBuilder: (context, error) {
            return Container(
              decoration: const BoxDecoration(
                color: AppColors.darkBackground,
                gradient: AppColors.darkCardGradient,
              ),
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppColors.dangerRed.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.dangerRed.withValues(alpha: 0.4), width: 2),
                      ),
                      child: const Icon(Icons.videocam_off_rounded, size: 50, color: AppColors.dangerRed),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Camera Feed Unreachable',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Error: ${error.errorCode}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                    const SizedBox(height: 24),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      alignment: WrapAlignment.center,
                      children: [
                        ElevatedButton.icon(
                          onPressed: _restartCamera,
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('RESTART CAMERA STREAM', style: TextStyle(fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryRed,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 4,
                          ),
                        ),
                        OutlinedButton.icon(
                          onPressed: () => openAppSettings(),
                          icon: const Icon(Icons.settings_rounded, size: 18),
                          label: const Text('APP SETTINGS', style: TextStyle(fontWeight: FontWeight.bold)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.accentAmber,
                            side: const BorderSide(color: AppColors.accentAmber),
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),

        // Live Scanner HUD Overlay Badge
        Positioned(
          top: 16,
          left: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.successGreen.withValues(alpha: 0.6)),
              boxShadow: [
                BoxShadow(
                  color: AppColors.successGreen.withValues(alpha: 0.2),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.successGreen,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: AppColors.successGreen, blurRadius: 6),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _currentFacing == CameraFacing.back ? 'LIVE REAR CAMERA' : 'LIVE FRONT CAMERA',
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2),
                ),
              ],
            ),
          ),
        ),

        // Futuristic Target HUD Box
        Center(
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Main Outer HUD Frame
              Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.accentAmber, width: 2.5),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.accentAmber.withValues(alpha: 0.3),
                      blurRadius: 25,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),

              // Corner Accent Bracket Frame
              Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.accentAmber.withValues(alpha: 0.4), width: 1.5),
                  borderRadius: BorderRadius.circular(30),
                ),
              ),

              // Horizontal Scan Laser Accent
              Container(
                width: 240,
                height: 2,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.accentAmber.withValues(alpha: 0),
                      AppColors.accentAmberGlow,
                      AppColors.accentAmber.withValues(alpha: 0),
                    ],
                  ),
                  boxShadow: const [
                    BoxShadow(color: AppColors.accentAmber, blurRadius: 10, spreadRadius: 1),
                  ],
                ),
              ),

              // Center Crosshair Dot
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: AppColors.accentAmberGlow,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: AppColors.accentAmber, blurRadius: 8),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Verifying Loading Overlay
        if (scannerProvider.isVerifying)
          Container(
            color: Colors.black.withValues(alpha: 0.85),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: AppColors.accentAmber, strokeWidth: 3.5),
                  SizedBox(height: 20),
                  Text(
                    'VERIFYING VEHICLE PASS...',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 1.5),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Authenticating Token with Security Gate Database',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final scannerProvider = Provider.of<ScannerProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBarWidget(
        title: 'SVACS GATE QR SCANNER',
        actions: [
          // Flashlight (Torch) Toggle Button
          IconButton(
            icon: Icon(
              _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
              color: _isTorchOn ? AppColors.accentAmberGlow : Colors.white,
            ),
            tooltip: _isTorchOn ? 'Turn Flash Off' : 'Turn Flash On',
            onPressed: _toggleTorch,
          ),
          // Front / Back Camera Switch Button
          IconButton(
            icon: Icon(
              _currentFacing == CameraFacing.front ? Icons.camera_front_rounded : Icons.camera_rear_rounded,
              color: AppColors.accentAmber,
            ),
            tooltip: _currentFacing == CameraFacing.front ? 'Switch to Rear Camera' : 'Switch to Front Camera',
            onPressed: _switchCamera,
          ),
          // Refresh Camera Stream Button
          IconButton(
            icon: const Icon(Icons.sync_rounded, color: AppColors.infoBlue),
            tooltip: 'Restart Camera Stream',
            onPressed: _restartCamera,
          ),
          IconButton(
            icon: const Icon(Icons.settings_rounded, color: AppColors.accentAmber),
            tooltip: 'Server Config',
            onPressed: () => Navigator.pushNamed(context, AppRoutes.settings),
          ),
        ],
      ),
      body: Column(
        children: [
          // Camera Viewport Section
          Expanded(
            flex: 3,
            child: _buildCameraViewport(scannerProvider),
          ),

          // Manual QR & Vehicle Entry Card Section
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: AppColors.cardBackground,
                border: Border(top: BorderSide(color: AppColors.borderGlass, width: 1.5)),
                boxShadow: [
                  BoxShadow(color: Colors.black54, blurRadius: 15, offset: Offset(0, -4)),
                ],
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: AppColors.accentAmber.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Icon(Icons.verified_user_rounded, size: 14, color: AppColors.accentAmber),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'MANUAL VERIFICATION',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.2),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.infoBlue.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.infoBlue.withValues(alpha: 0.4)),
                          ),
                          child: const Text(
                            'INSTANT SEARCH',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: AppColors.infoBlue, letterSpacing: 0.8),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _manualTokenController,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Enter QR Token or Vehicle No (e.g., TN 14 AF 5570)...',
                        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                        prefixIcon: const Icon(Icons.qr_code_2_rounded, color: AppColors.accentAmber),
                        filled: true,
                        fillColor: AppColors.darkBackground,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.borderGlass),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.borderGlass),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.accentAmber, width: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primaryRed.withValues(alpha: 0.4),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ElevatedButton.icon(
                        onPressed: scannerProvider.isVerifying ? null : _submitManualToken,
                        icon: const Icon(Icons.shield_outlined, color: Colors.white),
                        label: const Text(
                          'VERIFY VEHICLE PASS',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 1.2, color: Colors.white),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
