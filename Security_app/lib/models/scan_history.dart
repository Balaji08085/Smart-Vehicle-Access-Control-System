class ScanHistory {
  final String id;
  final String vehicleNumber;
  final String status;
  final String scannedAt;
  final String? ownerName;
  final String? role;
  final String? reason;

  ScanHistory({
    required this.id,
    required this.vehicleNumber,
    required this.status,
    required this.scannedAt,
    this.ownerName,
    this.role,
    this.reason,
  });

  DateTime get parsedDate {
    try {
      return DateTime.parse(scannedAt);
    } catch (_) {
      return DateTime.now();
    }
  }

  bool get isAllowed {
    final s = status.toUpperCase();
    return s == 'ALLOWED' || s == 'GRANTED' || s == 'APPROVED';
  }

  factory ScanHistory.fromJson(dynamic rawJson) {
    final Map<String, dynamic> json = rawJson is Map ? Map<String, dynamic>.from(rawJson) : {};
    String rawStatus = (json['status'] ?? json['result'] ?? 'ALLOWED').toString().toUpperCase();
    if (rawStatus == 'GRANTED') rawStatus = 'ALLOWED';
    if (rawStatus == 'REJECTED') rawStatus = 'DENIED';

    final req = json['request'] is Map ? Map<String, dynamic>.from(json['request'] as Map) : null;

    final dateStr = json['scanDate'] ?? json['scannedAt'] ?? json['createdAt'] ?? json['timestamp'] ?? json['date'] ?? DateTime.now().toIso8601String();

    return ScanHistory(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      vehicleNumber: (json['vehicleNumber'] ?? json['vehicle_number'] ?? json['qrToken'] ?? req?['bikeNumber'] ?? req?['vehicleNumber'] ?? 'UNKNOWN').toString(),
      status: rawStatus,
      scannedAt: dateStr.toString(),
      ownerName: (json['ownerName'] ?? json['owner_name'] ?? req?['name'])?.toString(),
      role: (json['role'] ?? req?['designation'] ?? req?['department'])?.toString(),
      reason: json['reason']?.toString(),
    );
  }
}
