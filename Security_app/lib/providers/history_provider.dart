import 'package:flutter/material.dart';
import '../models/scan_history.dart';
import '../services/api_service.dart';

enum DateFilterMode { all, day, week, month, year }

class HistoryProvider with ChangeNotifier {
  List<ScanHistory> _allLogs = [];
  bool _isLoading = false;
  String? _errorMessage;

  DateFilterMode _filterMode = DateFilterMode.all;
  DateTime _selectedDate = DateTime.now();
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;
  int? _selectedWeekDay; // 1 (Mon) to 7 (Sun)

  String _statusFilter = 'ALL';
  String _searchQuery = '';

  List<ScanHistory> get _filteredLogs {
    return _allLogs.where((log) {
      final logDate = log.parsedDate;

      // Status Filter
      if (_statusFilter != 'ALL') {
        if (_statusFilter == 'ALLOWED' && !log.isAllowed) return false;
        if (_statusFilter == 'DENIED' && log.isAllowed) return false;
      }

      // Search Query
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchVehicle = log.vehicleNumber.toLowerCase().contains(query);
        final matchOwner = log.ownerName != null && log.ownerName!.toLowerCase().contains(query);
        if (!matchVehicle && !matchOwner) return false;
      }

      // Date Filtering
      switch (_filterMode) {
        case DateFilterMode.all:
          return true;
        case DateFilterMode.day:
          return logDate.year == _selectedDate.year &&
              logDate.month == _selectedDate.month &&
              logDate.day == _selectedDate.day;
        case DateFilterMode.week:
          final now = DateTime.now();
          final startOfWeek = now.subtract(Duration(days: now.weekday - 1));
          final endOfWeek = startOfWeek.add(const Duration(days: 6, hours: 23, minutes: 59));
          
          final inWeek = logDate.isAfter(startOfWeek.subtract(const Duration(seconds: 1))) &&
              logDate.isBefore(endOfWeek);
          if (!inWeek) return false;
          if (_selectedWeekDay != null) {
            return logDate.weekday == _selectedWeekDay;
          }
          return true;
        case DateFilterMode.month:
          return logDate.year == _selectedYear && logDate.month == _selectedMonth;
        case DateFilterMode.year:
          return logDate.year == _selectedYear;
      }
    }).toList();
  }

  List<ScanHistory> get historyLogs => _filteredLogs;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  DateFilterMode get filterMode => _filterMode;
  DateTime get selectedDate => _selectedDate;
  int get selectedMonth => _selectedMonth;
  int get selectedYear => _selectedYear;
  int? get selectedWeekDay => _selectedWeekDay;

  String get statusFilter => _statusFilter;
  String get searchQuery => _searchQuery;

  int get allowedCount => _filteredLogs.where((l) => l.isAllowed).length;
  int get deniedCount => _filteredLogs.where((l) => !l.isAllowed).length;
  int get totalCount => _filteredLogs.length;

  /// Daily Refreshed Metrics for TODAY specifically
  List<ScanHistory> get todayLogs {
    final now = DateTime.now();
    return _allLogs.where((log) {
      final date = log.parsedDate;
      return date.year == now.year && date.month == now.month && date.day == now.day;
    }).toList();
  }

  int get todayTotalCount => todayLogs.length;
  int get todayAllowedCount => todayLogs.where((l) => l.isAllowed).length;
  int get todayDeniedCount => todayLogs.where((l) => !l.isAllowed).length;

  Future<bool> clearAllHistoryLogs() async {
    final response = await ApiService.clearAllScanHistory();
    if (response.success) {
      _allLogs.clear();
      notifyListeners();
      return true;
    }
    return false;
  }

  void setFilterMode(DateFilterMode mode) {
    _filterMode = mode;
    _selectedWeekDay = null;
    notifyListeners();
  }

  void setSelectedDate(DateTime date) {
    _selectedDate = date;
    _filterMode = DateFilterMode.day;
    notifyListeners();
  }

  void setSelectedMonth(int month, int year) {
    _selectedMonth = month;
    _selectedYear = year;
    _filterMode = DateFilterMode.month;
    notifyListeners();
  }

  void setSelectedYear(int year) {
    _selectedYear = year;
    _filterMode = DateFilterMode.year;
    notifyListeners();
  }

  void setSelectedWeekDay(int? dayIndex) {
    _selectedWeekDay = dayIndex;
    _filterMode = DateFilterMode.week;
    notifyListeners();
  }

  void setStatusFilter(String status) {
    _statusFilter = status;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<bool> deleteHistoryLog(String id) async {
    final response = await ApiService.deleteScanHistory(id);
    if (response.success) {
      _allLogs.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<void> fetchScanHistory() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await ApiService.getScanHistory();

    if (response.success && response.data != null) {
      _allLogs = response.data!;
    } else {
      _errorMessage = response.message ?? 'Failed to load scan history logs';
    }

    _isLoading = false;
    notifyListeners();
  }
}
