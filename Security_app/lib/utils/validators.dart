class Validators {
  static String? requiredField(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  static String? validUrl(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Server URL is required';
    }
    final url = value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'URL must start with http:// or https://';
    }
    return null;
  }
}
