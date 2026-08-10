class UserModel {
  final String username;
  final String role;
  final String? token;

  UserModel({
    required this.username,
    required this.role,
    this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      username: json['username'] ?? json['user']?['username'] ?? 'Guard User',
      role: json['role'] ?? json['user']?['role'] ?? 'guard',
      token: json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'role': role,
      'token': token,
    };
  }
}
