import 'package:flutter/material.dart';
import '../utils/app_colors.dart';

class AppBarWidget extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;

  const AppBarWidget({
    super.key,
    required this.title,
    this.actions,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(
        title.toUpperCase(),
        style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 16),
      ),
      backgroundColor: AppColors.darkBackground,
      centerTitle: true,
      elevation: 2,
      actions: actions,
    );
  }
}
