class QrResult {
  final String status;
  final String vehicleNumber;
  final String? ownerName;
  final String? role;
  final String? validTill;
  final String? reason;
  final String? scannedAt;
  final String? photoUrl;

  QrResult({
    required this.status,
    required this.vehicleNumber,
    this.ownerName,
    this.role,
    this.validTill,
    this.reason,
    this.scannedAt,
    this.photoUrl,
  });

  bool get isAllowed {
    final s = status.toUpperCase();
    return s == 'ALLOWED' || s == 'GRANTED' || s == 'APPROVED';
  }

  factory QrResult.fromJson(dynamic rawJson) {
    final Map<String, dynamic> json = rawJson is Map ? Map<String, dynamic>.from(rawJson) : {};
    final req = json['request'] is Map ? Map<String, dynamic>.from(json['request'] as Map) : null;

    final rawPhoto = json['photoUrl'] ?? json['photo'] ?? req?['photoUrl'] ?? req?['photo'];

    return QrResult(
      status: (json['status'] ?? 'DENIED').toString(),
      vehicleNumber: (json['vehicleNumber'] ?? json['vehicle_number'] ?? req?['bikeNumber'] ?? req?['vehicleNumber'] ?? 'N/A').toString(),
      ownerName: (json['ownerName'] ?? json['owner_name'] ?? req?['name'] ?? req?['ownerName'])?.toString(),
      role: (json['role'] ?? req?['designation'] ?? req?['department'] ?? req?['role'])?.toString(),
      validTill: (json['validTill'] ?? json['valid_till'] ?? req?['accessExpiryDate'])?.toString(),
      reason: (json['reason'] ?? json['message'])?.toString(),
      scannedAt: (json['scannedAt'] ?? json['timestamp'] ?? DateTime.now().toIso8601String()).toString(),
      photoUrl: rawPhoto != null && rawPhoto.toString().trim().isNotEmpty ? rawPhoto.toString().trim() : null,
    );
  }
}
