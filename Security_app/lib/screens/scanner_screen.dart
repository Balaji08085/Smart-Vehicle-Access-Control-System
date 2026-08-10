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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initController();
    _checkPermission();
  }

  void _initController() {
    _cameraController = MobileScannerController(
      detectionSpeed: DetectionSpeed.unrestricted,
      facing: CameraFacing.back,
      torchEnabled: false,
      autoStart: true,
    );
  }

  Future<void> _checkPermission() async {
    var status = await Permission.camera.status;
    if (status.isDenied) {
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
    } catch (_) {}
    await Future.delayed(const Duration(milliseconds: 300));
    try {
      await _cameraController.start();
    } catch (e) {
      debugPrint('⚠️ Restart camera error: $e');
    }
    if (mounted) setState(() {});
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
              CircularProgressIndicator(color: AppColors.accentAmber),
              SizedBox(height: 16),
              Text(
                'INITIALIZING GATE CAMERA...',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.2),
              ),
            ],
          ),
        ),
      );
    }

    if (!_hasCameraPermission) {
      return Container(
        color: AppColors.darkBackground,
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.no_photography_rounded, size: 70, color: AppColors.dangerRed),
              const SizedBox(height: 16),
              const Text(
                'Camera Access Required',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 8),
              const Text(
                'SVACS Gate QR Scanner requires camera permission to validate vehicle passes.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 24),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                alignment: WrapAlignment.center,
                children: [
                  ElevatedButton.icon(
                    onPressed: _checkPermission,
                    icon: const Icon(Icons.camera_alt_rounded),
                    label: const Text('ENABLE CAMERA ACCESS'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryRed,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => openAppSettings(),
                    icon: const Icon(Icons.settings_rounded, size: 18),
                    label: const Text('OPEN APP SETTINGS'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.accentAmber,
                      side: const BorderSide(color: AppColors.accentAmber),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
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
          controller: _cameraController,
          fit: BoxFit.cover,
          onDetect: _onDetect,
          errorBuilder: (context, error, child) {
            return Container(
              color: AppColors.darkBackground,
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.videocam_off_rounded, size: 60, color: AppColors.dangerRed),
                    const SizedBox(height: 12),
                    const Text(
                      'Camera Feed Unreachable',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Error: ${error.errorCode}',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      alignment: WrapAlignment.center,
                      children: [
                        ElevatedButton.icon(
                          onPressed: _restartCamera,
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('RESTART STREAM'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryRed,
                            foregroundColor: Colors.white,
                          ),
                        ),
                        OutlinedButton.icon(
                          onPressed: () => openAppSettings(),
                          icon: const Icon(Icons.settings_rounded, size: 18),
                          label: const Text('APP SETTINGS'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.accentAmber,
                            side: const BorderSide(color: AppColors.accentAmber),
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
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.successGreen.withValues(alpha: 0.5)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.fiber_manual_record_rounded, size: 10, color: AppColors.successGreen),
                const SizedBox(width: 6),
                const Text(
                  'LIVE CAMERA STREAM',
                  style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.0),
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
              Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.accentAmber, width: 2.5),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.accentAmber.withValues(alpha: 0.2),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),

              // Corner Accent Lines
              Container(
                width: 270,
                height: 270,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.accentAmber.withValues(alpha: 0.4), width: 1.5),
                  borderRadius: BorderRadius.circular(28),
                ),
              ),

              // Center Crosshair Dot
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.accentAmber,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
        ),

        // Verifying Loading Overlay
        if (scannerProvider.isVerifying)
          Container(
            color: Colors.black.withValues(alpha: 0.8),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: AppColors.accentAmber, strokeWidth: 3.5),
                  SizedBox(height: 18),
                  Text(
                    'VERIFYING VEHICLE PASS...',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 1.5),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Checking MongoDB & Token Encryption',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
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
          // Torch / Flashlight Button
          ValueListenableBuilder<MobileScannerState>(
            valueListenable: _cameraController,
            builder: (context, state, child) {
              final isFlashOn = state.torchState == TorchState.on;
              final isRunning = state.isRunning;
              return IconButton(
                icon: Icon(
                  isFlashOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                  color: isFlashOn ? AppColors.accentAmber : (isRunning ? Colors.white : Colors.white38),
                ),
                tooltip: isFlashOn ? 'Turn Flash Off' : 'Turn Flash On',
                onPressed: isRunning
                    ? () async {
                        try {
                          await _cameraController.toggleTorch();
                        } catch (e) {
                          debugPrint('⚠️ Torch toggle error: $e');
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Flashlight is unavailable on this camera device'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          }
                        }
                      }
                    : null,
              );
            },
          ),
          // Front / Back Camera Switch Button
          ValueListenableBuilder<MobileScannerState>(
            valueListenable: _cameraController,
            builder: (context, state, child) {
              final isFront = state.cameraDirection == CameraFacing.front;
              final isRunning = state.isRunning;
              return IconButton(
                icon: Icon(
                  isFront ? Icons.camera_front_rounded : Icons.camera_rear_rounded,
                  color: isRunning ? AppColors.accentAmber : Colors.white38,
                ),
                tooltip: isFront ? 'Switch to Rear Camera' : 'Switch to Front Camera',
                onPressed: isRunning
                    ? () async {
                        try {
                          await _cameraController.switchCamera();
                        } catch (e) {
                          debugPrint('⚠️ Camera switch error: $e');
                        }
                      }
                    : null,
              );
            },
          ),
          // Camera Stream Pause / Resume Button
          ValueListenableBuilder<MobileScannerState>(
            valueListenable: _cameraController,
            builder: (context, state, child) {
              final isRunning = state.isRunning;
              return IconButton(
                icon: Icon(
                  isRunning ? Icons.videocam_off_rounded : Icons.videocam_rounded,
                  color: isRunning ? AppColors.dangerRed : AppColors.successGreen,
                ),
                tooltip: isRunning ? 'Pause Camera Stream' : 'Start Camera Stream',
                onPressed: () async {
                  try {
                    if (isRunning) {
                      await _cameraController.stop();
                    } else {
                      await _cameraController.start();
                    }
                    if (mounted) setState(() {});
                  } catch (e) {
                    debugPrint('⚠️ Toggle camera error: $e');
                  }
                },
              );
            },
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
                border: Border(top: BorderSide(color: AppColors.borderDark, width: 1.5)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'MANUAL VERIFICATION',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.textSecondary, letterSpacing: 1.2),
                        ),
                        Text(
                          'INSTANT SEARCH',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.accentAmber),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _manualTokenController,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Enter QR token or Vehicle Number (e.g. TN 14 AE 8495)...',
                        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                        prefixIcon: const Icon(Icons.pin_rounded, color: AppColors.accentAmber),
                        filled: true,
                        fillColor: AppColors.darkBackground,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.borderDark),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.borderDark),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.accentAmber, width: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton.icon(
                      onPressed: scannerProvider.isVerifying ? null : _submitManualToken,
                      icon: const Icon(Icons.verified_user_rounded),
                      label: const Text('VERIFY VEHICLE PASS', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.0)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryRed,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        elevation: 4,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
