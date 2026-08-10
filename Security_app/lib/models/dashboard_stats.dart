class DashboardStats {
  final int totalUsers;
  final int pendingApprovals;
  final int approvedUsers;
  final int rejectedUsers;
  final int activeUsers;
  final int expiredUsers;
  final int disabledUsers;
  final int totalQRGenerated;
  final int todaysScans;
  final int todaysAllowed;
  final int todaysDenied;

  DashboardStats({
    required this.totalUsers,
    required this.pendingApprovals,
    required this.approvedUsers,
    required this.rejectedUsers,
    required this.activeUsers,
    required this.expiredUsers,
    required this.disabledUsers,
    required this.totalQRGenerated,
    required this.todaysScans,
    required this.todaysAllowed,
    required this.todaysDenied,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalUsers: json['totalUsers'] ?? 0,
      pendingApprovals: json['pendingApprovals'] ?? 0,
      approvedUsers: json['approvedUsers'] ?? 0,
      rejectedUsers: json['rejectedUsers'] ?? 0,
      activeUsers: json['activeUsers'] ?? 0,
      expiredUsers: json['expiredUsers'] ?? 0,
      disabledUsers: json['disabledUsers'] ?? 0,
      totalQRGenerated: json['totalQRGenerated'] ?? 0,
      todaysScans: json['todaysScans'] ?? 0,
      todaysAllowed: json['todaysAllowed'] ?? 0,
      todaysDenied: json['todaysDenied'] ?? 0,
    );
  }

  factory DashboardStats.empty() {
    return DashboardStats(
      totalUsers: 0,
      pendingApprovals: 0,
      approvedUsers: 0,
      rejectedUsers: 0,
      activeUsers: 0,
      expiredUsers: 0,
      disabledUsers: 0,
      totalQRGenerated: 0,
      todaysScans: 0,
      todaysAllowed: 0,
      todaysDenied: 0,
    );
  }
}
