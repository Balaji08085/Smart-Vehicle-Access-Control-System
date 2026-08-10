import 'package:intl/intl.dart';

class DateFormatter {
  static String formatDateTime(String? isoString) {
    if (isoString == null || isoString.isEmpty) return 'N/A';
    try {
      final dateTime = DateTime.parse(isoString).toLocal();
      return DateFormat('dd MMM yyyy, hh:mm a').format(dateTime);
    } catch (_) {
      return isoString;
    }
  }

  static String formatDateOnly(String? isoString) {
    if (isoString == null || isoString.isEmpty) return 'N/A';
    try {
      final dateTime = DateTime.parse(isoString).toLocal();
      return DateFormat('dd MMM yyyy').format(dateTime);
    } catch (_) {
      return isoString;
    }
  }
}
