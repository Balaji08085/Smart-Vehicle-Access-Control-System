import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/app_config.dart';
import 'providers/history_provider.dart';
import 'providers/scanner_provider.dart';
import 'screens/main_navigation_screen.dart';
import 'screens/result_screen.dart';
import 'screens/settings_screen.dart';
import 'utils/app_colors.dart';
import 'utils/constants.dart';
import 'utils/routes.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppConfig.init();
  runApp(const SecurityApp());
}

class SecurityApp extends StatelessWidget {
  const SecurityApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ScannerProvider()),
        ChangeNotifierProvider(create: (_) => HistoryProvider()),
      ],
      child: MaterialApp(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppColors.primaryRed,
            primary: AppColors.primaryRed,
            secondary: AppColors.accentAmber,
            brightness: Brightness.dark,
          ),
          scaffoldBackgroundColor: AppColors.darkBackground,
          cardTheme: const CardThemeData(
            color: AppColors.cardBackground,
            elevation: 2,
          ),
        ),
        home: const MainNavigationScreen(),
        routes: {
          AppRoutes.result: (context) => const ResultScreen(),
          AppRoutes.settings: (context) => const SettingsScreen(),
        },
      ),
    );
  }
}
