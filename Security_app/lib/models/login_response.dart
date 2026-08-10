import 'user_model.dart';

class LoginResponse {
  final String message;
  final String token;
  final String role;
  final UserModel user;

  LoginResponse({
    required this.message,
    required this.token,
    required this.role,
    required this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      message: json['message'] ?? 'Login successful',
      token: json['token'] ?? '',
      role: json['role'] ?? 'guard',
      user: UserModel.fromJson(json),
    );
  }
}
