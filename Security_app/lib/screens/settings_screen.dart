import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../utils/app_colors.dart';
import '../utils/constants.dart';
import '../utils/validators.dart';
import '../widgets/app_bar_widget.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_textfield.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _urlController = TextEditingController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final currentUrl = await AppConfig.init();
    setState(() {
      _urlController.text = currentUrl;
      _isLoading = false;
    });
  }

  Future<void> _saveSettings() async {
    if (!_formKey.currentState!.validate()) return;
    await AppConfig.setBaseUrl(_urlController.text.trim());

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Server URL successfully set to: ${AppConfig.baseUrl}'),
          backgroundColor: AppColors.successGreen,
        ),
      );
    }
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: const AppBarWidget(title: 'SERVER CONFIGURATION'),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 500),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Icon(
                          Icons.settings_suggest_rounded,
                          size: 80,
                          color: AppColors.accentAmber,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Configure Server Base URL',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Enter live production server URL (e.g. https://smart-vehicle-access-control-system.mccmrfip.in) or local network IP.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 32),
                        CustomTextField(
                          controller: _urlController,
                          label: 'Server Base URL',
                          hint: 'e.g., https://smart-vehicle-access-control-system.mccmrfip.in',
                          prefixIcon: Icons.link,
                          validator: Validators.validUrl,
                        ),
                        const SizedBox(height: 24),
                        CustomButton(
                          text: 'SAVE CONFIGURATION',
                          backgroundColor: AppColors.primaryRed,
                          onPressed: _saveSettings,
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: () async {
                            final messenger = ScaffoldMessenger.of(context);
                            final defUrl = AppConfig.defaultUrl;
                            _urlController.text = defUrl;
                            await AppConfig.setBaseUrl(defUrl);
                            if (mounted) {
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text('Reset to default URL: $defUrl'),
                                  backgroundColor: AppColors.accentAmber,
                                ),
                              );
                            }
                          },
                          icon: const Icon(Icons.wifi_rounded, size: 18),
                          label: Text('RESET TO DEFAULT SERVER URL (${AppConfig.defaultUrl})'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.accentAmber,
                            side: const BorderSide(color: AppColors.accentAmber),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                        const SizedBox(height: 32),
                        const Text(
                          '${AppConstants.appName} ${AppConstants.appVersion}\n${AppConstants.companyTitle}',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 10, color: AppColors.textMuted, height: 1.5),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}
