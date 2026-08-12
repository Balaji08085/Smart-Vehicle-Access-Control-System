import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/qr_result.dart';
import '../providers/scanner_provider.dart';
import '../utils/app_colors.dart';
import '../utils/date_formatter.dart';
import '../widgets/app_bar_widget.dart';

class ResultScreen extends StatelessWidget {
  const ResultScreen({super.key});

  Widget _buildVisitorPhoto(QrResult? result, bool isAllowed) {
    final photoUrl = result?.photoUrl;
    final ownerName = result?.ownerName ?? 'Visitor';

    Widget imageWidget;

    if (photoUrl != null && photoUrl.trim().isNotEmpty) {
      final cleanPhoto = photoUrl.trim();

      if (cleanPhoto.startsWith('data:image')) {
        try {
          final base64Str = cleanPhoto.contains(',') ? cleanPhoto.split(',').last : cleanPhoto;
          final bytes = base64Decode(base64Str.replaceAll(RegExp(r'\s+'), ''));
          imageWidget = Image.memory(
            bytes,
            width: 120,
            height: 120,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildPlaceholderAvatar(ownerName, isAllowed),
          );
        } catch (e) {
          imageWidget = _buildPlaceholderAvatar(ownerName, isAllowed);
        }
      } else if (cleanPhoto.startsWith('http://') || cleanPhoto.startsWith('https://')) {
        imageWidget = Image.network(
          cleanPhoto,
          width: 120,
          height: 120,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildPlaceholderAvatar(ownerName, isAllowed),
        );
      } else {
        imageWidget = _buildPlaceholderAvatar(ownerName, isAllowed);
      }
    } else {
      imageWidget = _buildPlaceholderAvatar(ownerName, isAllowed);
    }

    final accentColor = isAllowed ? AppColors.successGreen : AppColors.dangerRed;

    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: accentColor.withValues(alpha: 0.5),
                blurRadius: 20,
                spreadRadius: 3,
              ),
            ],
          ),
          child: ClipOval(
            child: SizedBox(
              width: 120,
              height: 120,
              child: imageWidget,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(6),
          decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(color: Colors.black45, blurRadius: 8),
            ],
          ),
          child: Icon(
            isAllowed ? Icons.check_circle_rounded : Icons.cancel_rounded,
            color: isAllowed ? AppColors.successGreen : AppColors.dangerRed,
            size: 30,
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholderAvatar(String ownerName, bool isAllowed) {
    final initials = ownerName.trim().isNotEmpty
        ? ownerName.trim().split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join().toUpperCase()
        : 'V';

    return Container(
      decoration: BoxDecoration(
        gradient: isAllowed
            ? const LinearGradient(colors: [Color(0xFF065F46), Color(0xFF10B981)])
            : const LinearGradient(colors: [Color(0xFF991B1B), Color(0xFFEF4444)]),
      ),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 42,
            fontWeight: FontWeight.w900,
            shadows: [Shadow(color: Colors.black45, blurRadius: 8)],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final result = ModalRoute.of(context)?.settings.arguments as QrResult?;
    final isAllowed = result?.isAllowed ?? false;

    // Full Screen Theme Gradients
    final bgGradient = isAllowed
        ? const LinearGradient(
            colors: [Color(0xFF022C22), Color(0xFF064E3B), Color(0xFF021C16)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          )
        : const LinearGradient(
            colors: [Color(0xFF450A0A), Color(0xFF7F1D1D), Color(0xFF290505)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          );

    final cardBgColor = isAllowed ? const Color(0xFF065F46) : const Color(0xFF991B1B);
    final reasonBoxColor = isAllowed ? const Color(0xFF022C22) : const Color(0xFF450A0A);
    final reasonText = result?.reason ?? (isAllowed ? 'ACCESS ALLOWED' : 'ACCESS DENIED');

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(gradient: bgGradient),
        child: Column(
          children: [
            AppBarWidget(
              title: isAllowed ? 'GATE ACCESS GRANTED' : 'GATE ACCESS DENIED',
            ),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20.0),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 480),
                    child: Container(
                      decoration: BoxDecoration(
                        color: cardBgColor.withValues(alpha: 0.95),
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(
                          color: isAllowed ? const Color(0x6034D399) : const Color(0x60F87171),
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: (isAllowed ? AppColors.successGreen : AppColors.dangerRed).withValues(alpha: 0.3),
                            blurRadius: 30,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Status Badge Icon
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isAllowed ? Icons.verified_user_rounded : Icons.gpp_bad_rounded,
                                size: 60,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 14),

                            // Main Status Title
                            Text(
                              isAllowed ? 'GATE ACCESS GRANTED' : 'GATE ACCESS DENIED',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 1.5,
                                shadows: [Shadow(color: Colors.black45, blurRadius: 6)],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Prominent REASON Box
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                              decoration: BoxDecoration(
                                color: reasonBoxColor,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isAllowed ? AppColors.successGreen.withValues(alpha: 0.6) : AppColors.dangerRed.withValues(alpha: 0.6),
                                  width: 1.5,
                                ),
                              ),
                              child: Column(
                                children: [
                                  const Text(
                                    'VERIFICATION REASON',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white70,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    reasonText.toUpperCase(),
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.accentAmberGlow,
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Visitor Photo Avatar
                            _buildVisitorPhoto(result, isAllowed),
                            const SizedBox(height: 20),

                            const Divider(color: Colors.white30, height: 1),
                            const SizedBox(height: 16),

                            // Details Section
                            _buildDetailRow('Vehicle Number', result?.vehicleNumber ?? 'N/A', isAccent: true),
                            if (result?.ownerName != null) _buildDetailRow('Visitor / Owner Name', result!.ownerName!),
                            if (result?.role != null) _buildDetailRow('Designation / Role', result!.role!),
                            if (result?.validTill != null) _buildDetailRow('Valid Until', DateFormatter.formatDateOnly(result!.validTill!)),
                            _buildDetailRow('Verification Time', DateFormatter.formatDateTime(result?.scannedAt)),

                            const SizedBox(height: 28),

                            // Action Button
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: const [
                                  BoxShadow(color: Colors.black38, blurRadius: 10, offset: Offset(0, 4)),
                                ],
                              ),
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  Provider.of<ScannerProvider>(context, listen: false).resumeScanning();
                                  Navigator.pop(context);
                                },
                                icon: Icon(
                                  Icons.qr_code_scanner_rounded,
                                  color: isAllowed ? const Color(0xFF065F46) : const Color(0xFF991B1B),
                                ),
                                label: Text(
                                  'SCAN NEXT VEHICLE',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 15,
                                    letterSpacing: 1.0,
                                    color: isAllowed ? const Color(0xFF065F46) : const Color(0xFF991B1B),
                                  ),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  shadowColor: Colors.transparent,
                                  minimumSize: const Size(double.infinity, 54),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isAccent = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                color: isAccent ? AppColors.accentAmberGlow : Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: isAccent ? 17 : 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
