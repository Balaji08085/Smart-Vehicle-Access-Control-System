import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/routes.dart';

class ErrorViewWidget extends StatelessWidget {
  final String errorMessage;
  final VoidCallback onRetry;

  const ErrorViewWidget({
    super.key,
    required this.errorMessage,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, size: 70, color: AppColors.dangerRed),
            const SizedBox(height: 16),
            const Text(
              'Connection or Loading Error',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: [
                ElevatedButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('RETRY CONNECTION'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryRed,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.settings),
                  icon: const Icon(Icons.settings_rounded, size: 18),
                  label: const Text('CONFIGURE SERVER IP'),
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
  }
}
