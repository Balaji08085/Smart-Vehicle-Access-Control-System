class VehicleRequest {
  final String id;
  final String ownerName;
  final String registerNumber;
  final String vehicleNumber;
  final String role;
  final String status;
  final String qrToken;
  final String? companyName;
  final String? validTill;
  final String? createdAt;

  VehicleRequest({
    required this.id,
    required this.ownerName,
    required this.registerNumber,
    required this.vehicleNumber,
    required this.role,
    required this.status,
    required this.qrToken,
    this.companyName,
    this.validTill,
    this.createdAt,
  });

  factory VehicleRequest.fromJson(Map<String, dynamic> json) {
    return VehicleRequest(
      id: json['id'] ?? json['_id'] ?? '',
      ownerName: json['ownerName'] ?? json['owner_name'] ?? 'N/A',
      registerNumber: json['registerNumber'] ?? json['register_number'] ?? 'N/A',
      vehicleNumber: json['vehicleNumber'] ?? json['vehicle_number'] ?? 'N/A',
      role: json['role'] ?? 'Student',
      status: json['status'] ?? 'PENDING',
      qrToken: json['qrToken'] ?? json['qr_token'] ?? '',
      companyName: json['companyName'] ?? json['company_name'],
      validTill: json['validTill'] ?? json['valid_till'],
      createdAt: json['createdAt'] ?? json['created_at'],
    );
  }
}
