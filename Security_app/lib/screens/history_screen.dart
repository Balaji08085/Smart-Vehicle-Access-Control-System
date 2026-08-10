import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/history_provider.dart';
import '../utils/app_colors.dart';
import '../utils/date_formatter.dart';
import '../utils/routes.dart';
import '../widgets/app_bar_widget.dart';
import '../widgets/confirmation_dialog.dart';
import '../widgets/empty_state.dart';
import '../widgets/error_view.dart';
import '../widgets/loading_widget.dart';
import '../widgets/status_chip.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final _searchController = TextEditingController();

  final List<String> _months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  final List<String> _weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<HistoryProvider>(context, listen: false).fetchScanHistory();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _pickDate(BuildContext context, HistoryProvider provider) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: provider.selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.accentAmber,
              onPrimary: Colors.black,
              surface: AppColors.cardBackground,
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      provider.setSelectedDate(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HistoryProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBarWidget(
        title: 'SCAN HISTORY & AUDIT',
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_forever_rounded, color: AppColors.dangerRed),
            tooltip: 'Clear All Scan History',
            onPressed: () {
              showDialog(
                context: context,
                builder: (_) => ConfirmationDialog(
                  title: 'Clear All Scan History',
                  content: 'Are you sure you want to delete ALL scan history logs? This will permanently remove all scan records from MongoDB.',
                  confirmText: 'CLEAR ALL HISTORY',
                  confirmColor: AppColors.dangerRed,
                  onConfirm: () async {
                    final success = await provider.clearAllHistoryLogs();
                    if (context.mounted && success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('All scan history logs deleted'),
                          backgroundColor: AppColors.primaryRed,
                        ),
                      );
                    }
                  },
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => provider.fetchScanHistory(),
          ),
          IconButton(
            icon: const Icon(Icons.settings_rounded, color: AppColors.accentAmber),
            tooltip: 'Server Config',
            onPressed: () => Navigator.pushNamed(context, AppRoutes.settings),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter & Search Controls Header
          Container(
            color: AppColors.cardBackground,
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Daily Vehicle Access Summary Card (Refreshed Daily)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.darkBackground,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.borderDark),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildSummaryItem("TODAY'S SCANS", '${provider.todayTotalCount}', AppColors.infoBlue),
                      Container(height: 30, width: 1, color: AppColors.borderDark),
                      _buildSummaryItem('ALLOWED', '${provider.todayAllowedCount}', AppColors.successGreen),
                      Container(height: 30, width: 1, color: AppColors.borderDark),
                      _buildSummaryItem('DENIED', '${provider.todayDeniedCount}', AppColors.dangerRed),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Search Bar
                TextField(
                  controller: _searchController,
                  onChanged: (val) => provider.setSearchQuery(val),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Search by vehicle number or owner name...',
                    hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                    prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
                    filled: true,
                    fillColor: AppColors.darkBackground,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.borderDark),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Date Filter Mode Chips (All, Day, Week, Month, Year)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildModeChip(provider, DateFilterMode.all, 'All Time'),
                      _buildModeChip(provider, DateFilterMode.day, 'Specific Day'),
                      _buildModeChip(provider, DateFilterMode.week, 'This Week'),
                      _buildModeChip(provider, DateFilterMode.month, 'Month'),
                      _buildModeChip(provider, DateFilterMode.year, 'Year'),
                    ],
                  ),
                ),

                // Sub-filter Options depending on selected DateFilterMode
                if (provider.filterMode == DateFilterMode.day) ...[
                  const SizedBox(height: 10),
                  ElevatedButton.icon(
                    onPressed: () => _pickDate(context, provider),
                    icon: const Icon(Icons.calendar_today_rounded, size: 16),
                    label: Text(
                      'Selected Date: ${DateFormatter.formatDateOnly(provider.selectedDate.toIso8601String())}',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.darkBackground,
                      foregroundColor: AppColors.accentAmber,
                      side: const BorderSide(color: AppColors.accentAmber),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],

                if (provider.filterMode == DateFilterMode.week) ...[
                  const SizedBox(height: 10),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(right: 6.0),
                          child: ChoiceChip(
                            label: const Text('All Week', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            selected: provider.selectedWeekDay == null,
                            selectedColor: AppColors.accentAmber,
                            backgroundColor: AppColors.darkBackground,
                            labelStyle: TextStyle(color: provider.selectedWeekDay == null ? Colors.black : Colors.white),
                            onSelected: (_) => provider.setSelectedWeekDay(null),
                          ),
                        ),
                        ...List.generate(7, (index) {
                          final dayNum = index + 1;
                          final isSelected = provider.selectedWeekDay == dayNum;
                          return Padding(
                            padding: const EdgeInsets.only(right: 6.0),
                            child: ChoiceChip(
                              label: Text(_weekDays[index], style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              selected: isSelected,
                              selectedColor: AppColors.accentAmber,
                              backgroundColor: AppColors.darkBackground,
                              labelStyle: TextStyle(color: isSelected ? Colors.black : Colors.white),
                              onSelected: (_) => provider.setSelectedWeekDay(dayNum),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ],

                if (provider.filterMode == DateFilterMode.month) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: AppColors.darkBackground,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.borderDark),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<int>(
                              value: provider.selectedMonth,
                              dropdownColor: AppColors.cardBackground,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                              items: List.generate(12, (index) {
                                return DropdownMenuItem(
                                  value: index + 1,
                                  child: Text(_months[index]),
                                );
                              }),
                              onChanged: (val) {
                                if (val != null) provider.setSelectedMonth(val, provider.selectedYear);
                              },
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: AppColors.darkBackground,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.borderDark),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<int>(
                              value: provider.selectedYear,
                              dropdownColor: AppColors.cardBackground,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                              items: [2024, 2025, 2026, 2027].map((yr) {
                                return DropdownMenuItem(value: yr, child: Text('$yr'));
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) provider.setSelectedMonth(provider.selectedMonth, val);
                              },
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                if (provider.filterMode == DateFilterMode.year) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AppColors.darkBackground,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.borderDark),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<int>(
                        value: provider.selectedYear,
                        dropdownColor: AppColors.cardBackground,
                        isExpanded: true,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        items: [2024, 2025, 2026, 2027].map((yr) {
                          return DropdownMenuItem(value: yr, child: Text('Year $yr'));
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) provider.setSelectedYear(val);
                        },
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: 10),

                // Status Filter Chips (ALL, ALLOWED, DENIED)
                Row(
                  children: ['ALL', 'ALLOWED', 'DENIED'].map((st) {
                    final isSelected = provider.statusFilter == st;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Text(
                          st,
                          style: TextStyle(
                            color: isSelected ? Colors.black : Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        selected: isSelected,
                        selectedColor: AppColors.accentAmber,
                        backgroundColor: AppColors.darkBackground,
                        onSelected: (_) => provider.setStatusFilter(st),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),

          // Scan Logs List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => provider.fetchScanHistory(),
              color: AppColors.accentAmber,
              child: provider.isLoading && provider.historyLogs.isEmpty
                  ? const LoadingWidget(message: 'Loading scanned QR code logs...')
                  : provider.errorMessage != null && provider.historyLogs.isEmpty
                      ? ErrorViewWidget(
                          errorMessage: provider.errorMessage!,
                          onRetry: () => provider.fetchScanHistory(),
                        )
                      : provider.historyLogs.isEmpty
                          ? const EmptyStateWidget(
                              icon: Icons.history_rounded,
                              title: 'No Scanned QR Codes Found',
                              message: 'No QR scan entries match the selected date or filter criteria.',
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: provider.historyLogs.length,
                              itemBuilder: (context, index) {
                                final log = provider.historyLogs[index];
                                final isAllowed = log.isAllowed;

                                return Card(
                                  color: AppColors.cardBackground,
                                  margin: const EdgeInsets.only(bottom: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    side: const BorderSide(color: AppColors.borderDark),
                                  ),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    leading: CircleAvatar(
                                      backgroundColor: isAllowed
                                          ? AppColors.successGreen.withValues(alpha: 0.2)
                                          : AppColors.dangerRed.withValues(alpha: 0.2),
                                      child: Icon(
                                        isAllowed ? Icons.check_circle_rounded : Icons.cancel_rounded,
                                        color: isAllowed ? AppColors.successGreen : AppColors.dangerRed,
                                      ),
                                    ),
                                    title: Text(
                                      log.vehicleNumber,
                                      style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 16),
                                    ),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 4.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          if (log.ownerName != null)
                                            Text(
                                              'Owner: ${log.ownerName}${log.role != null ? " (${log.role})" : ""}',
                                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500),
                                            ),
                                          Text(
                                            DateFormatter.formatDateTime(log.scannedAt),
                                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                                          ),
                                        ],
                                      ),
                                    ),
                                     trailing: Row(
                                       mainAxisSize: MainAxisSize.min,
                                       children: [
                                         StatusChip(status: log.status),
                                         const SizedBox(width: 4),
                                         IconButton(
                                           icon: const Icon(Icons.delete_outline_rounded, color: AppColors.dangerRed, size: 20),
                                           tooltip: 'Delete Log Entry',
                                           onPressed: () {
                                             showDialog(
                                               context: context,
                                               builder: (_) => ConfirmationDialog(
                                                 title: 'Delete Scan Log Entry',
                                                 content: 'Are you sure you want to delete the scan log entry for ${log.vehicleNumber}?',
                                                 confirmText: 'DELETE LOG',
                                                 confirmColor: AppColors.dangerRed,
                                                 onConfirm: () async {
                                                   final success = await provider.deleteHistoryLog(log.id);
                                                   if (context.mounted && success) {
                                                     ScaffoldMessenger.of(context).showSnackBar(
                                                       const SnackBar(
                                                         content: Text('Scan log entry deleted'),
                                                         backgroundColor: AppColors.primaryRed,
                                                       ),
                                                     );
                                                   }
                                                 },
                                               ),
                                             );
                                           },
                                         ),
                                       ],
                                     ),
                                  ),
                                );
                              },
                            ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String title, String count, Color color) {
    return Column(
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSecondary, letterSpacing: 0.8),
        ),
        const SizedBox(height: 4),
        Text(
          count,
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color),
        ),
      ],
    );
  }

  Widget _buildModeChip(HistoryProvider provider, DateFilterMode mode, String label) {
    final isSelected = provider.filterMode == mode;
    return Padding(
      padding: const EdgeInsets.only(right: 6.0),
      child: ChoiceChip(
        label: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
        selected: isSelected,
        selectedColor: AppColors.accentAmber,
        backgroundColor: AppColors.darkBackground,
        labelStyle: TextStyle(color: isSelected ? Colors.black : Colors.white),
        onSelected: (_) => provider.setFilterMode(mode),
      ),
    );
  }
}
