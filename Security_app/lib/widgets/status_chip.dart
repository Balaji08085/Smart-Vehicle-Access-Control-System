import 'package:flutter/material.dart';
import '../utils/app_colors.dart';

class StatusChip extends StatelessWidget {
  final String status;

  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color text;
    String label = status.toUpperCase();

    switch (label) {
      case 'ALLOWED':
      case 'APPROVED':
        bg = AppColors.successGreen.withValues(alpha: 0.2);
        text = AppColors.successGreen;
        break;
      case 'DENIED':
      case 'REJECTED':
        bg = AppColors.dangerRed.withValues(alpha: 0.2);
        text = AppColors.dangerRed;
        break;
      case 'PENDING':
        bg = AppColors.accentAmber.withValues(alpha: 0.2);
        text = AppColors.accentAmber;
        break;
      case 'DISABLED':
      case 'EXPIRED':
        bg = AppColors.textMuted.withValues(alpha: 0.2);
        text = AppColors.textSecondary;
        break;
      default:
        bg = AppColors.infoBlue.withValues(alpha: 0.2);
        text = AppColors.infoBlue;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: text.withValues(alpha: 0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: text,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.0,
        ),
      ),
    );
  }
}
