import React, { useState } from 'react';
import { 
  BarChart3, Calendar, CheckCircle2, AlertTriangle, AlertOctagon, 
  Download, Printer, FileText, Car, ShieldAlert 
} from 'lucide-react';
import { useEntry, formatDateDisplay, getValidityStatus } from '../../context/EntryContext';

const ReportsPage = () => {
  const { vehicles, history } = useEntry();
  const [activeTab, setActiveTab] = useState('daily'); // daily, weekly, monthly, expired, invalid

  const vehicleList = Object.values(vehicles);

  // Helper to filter history based on the active report tab
  const getFilteredHistory = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (activeTab === 'expired' || activeTab === 'invalid') {
      return history; // Show overall stats for expired/invalid tabs
    }
    
    return history.filter(h => {
      // Parse history item date (could be MM/DD/YYYY or DD/MM/YYYY)
      const parts = h.date.split('/');
      let itemDate;
      if (parts.length === 3) {
        // Try parsing assuming standard locale formats
        itemDate = new Date(h.date);
        if (isNaN(itemDate.getTime())) {
          // Fallback parsing
          itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        itemDate = new Date(h.date);
      }
      
      if (isNaN(itemDate.getTime())) return true; // Fail-safe fallback
      
      const itemDayStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      
      if (activeTab === 'daily') {
        return itemDayStart.getTime() === startOfToday.getTime();
      }
      if (activeTab === 'weekly') {
        const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDayStart >= sevenDaysAgo;
      }
      if (activeTab === 'monthly') {
        const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDayStart >= thirtyDaysAgo;
      }
      return true;
    });
  };

  const filteredHistory = getFilteredHistory();
  const totalScans = filteredHistory.length;
  const grantedCount = filteredHistory.filter(h => h.status === 'Granted').length;
  const deniedCount = filteredHistory.filter(h => h.status === 'Denied').length;
  const expiredVehicles = vehicleList.filter(v => getValidityStatus(v) === 'Expired');
  const invalidAttempts = history.filter(h => h.status === 'Denied');

  const exportReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 md:px-8 bg-slate-50 dark:bg-[#180305] relative text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Background Glow */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-red-900/10 dark:bg-red-900/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div className="p-6 md:p-8 rounded-3xl border border-orange-200/80 dark:border-[#701A1A]/60 bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-white dark:from-[#2E080C] dark:via-[#240609] dark:to-[#180305] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-amber-400 uppercase tracking-widest mb-1 font-mono">
              <BarChart3 className="w-4 h-4" /> Campus Access Analytics & Reports
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Vehicle Security Intelligence Reports
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm mt-1">
              Audit summaries, scan success rates, expired sticker alerts, and security logs
            </p>
          </div>

          <button
            onClick={exportReport}
            className="w-full md:w-auto px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
          >
            <Printer className="w-4 h-4" /> Print / Export Report
          </button>
        </div>

        {/* Report Timeframe / Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl border border-slate-200 dark:border-[#5C121E] bg-slate-100 dark:bg-[#240609] shadow-sm">
          {[
            { id: 'daily', label: 'Daily Report' },
            { id: 'weekly', label: 'Weekly Report' },
            { id: 'monthly', label: 'Monthly Report' },
            { id: 'expired', label: 'Expired Stickers' },
            { id: 'invalid', label: 'Invalid Scans' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#3D0A11]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#240609] p-5 rounded-3xl border border-slate-200 dark:border-[#5C121E] shadow-sm text-left">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Scan Logs</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">{totalScans}</span>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm text-left">
            <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Access Granted (Green)</span>
            <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300 block mt-1">{grantedCount}</span>
          </div>

          <div className="bg-rose-50/60 dark:bg-rose-950/40 p-5 rounded-3xl border border-rose-200 dark:border-rose-500/30 shadow-sm text-left">
            <span className="text-[11px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">Access Denied (Red)</span>
            <span className="text-3xl font-black text-rose-700 dark:text-rose-300 block mt-1">{deniedCount}</span>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/40 p-5 rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm text-left">
            <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">Expired Stickers</span>
            <span className="text-3xl font-black text-amber-800 dark:text-amber-300 block mt-1">{expiredVehicles.length}</span>
          </div>
        </div>

        {/* TAB 1, 2, 3: DAILY / WEEKLY / MONTHLY REPORTS */}
        {(activeTab === 'daily' || activeTab === 'weekly' || activeTab === 'monthly') && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                {activeTab.toUpperCase()} GATE ACCESS VERIFICATION SUMMARY
              </h3>

              {/* Progress Visual Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-emerald-700 dark:text-emerald-400">Granted: {grantedCount} ({totalScans ? Math.round((grantedCount/totalScans)*100) : 0}%)</span>
                  <span className="text-rose-700 dark:text-rose-400">Denied: {deniedCount} ({totalScans ? Math.round((deniedCount/totalScans)*100) : 0}%)</span>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
                  <div 
                    style={{ width: `${totalScans ? (grantedCount/totalScans)*100 : 50}%` }} 
                    className="bg-emerald-500 h-full transition-all"
                  />
                  <div 
                    style={{ width: `${totalScans ? (deniedCount/totalScans)*100 : 50}%` }} 
                    className="bg-rose-500 h-full transition-all"
                  />
                </div>
              </div>

              {/* Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono uppercase border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">Gate Name</th>
                      <th className="p-3">Total Scans</th>
                      <th className="p-3">Granted</th>
                      <th className="p-3">Denied</th>
                      <th className="p-3">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Main Entrance Gate</td>
                      <td className="p-3 font-mono">{totalScans}</td>
                      <td className="p-3 font-mono text-emerald-700 dark:text-emerald-400 font-bold">{grantedCount}</td>
                      <td className="p-3 font-mono text-rose-700 dark:text-rose-400 font-bold">{deniedCount}</td>
                      <td className="p-3 font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        {totalScans ? `${Math.round((grantedCount/totalScans)*100)}%` : '100%'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXPIRED STICKERS */}
        {activeTab === 'expired' && (
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-amber-800 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Expired Vehicle Stickers Report
            </h3>

            {expiredVehicles.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No expired stickers currently registered.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-amber-50 text-amber-900 font-mono uppercase border-b border-amber-200">
                      <th className="p-3">Vehicle Number</th>
                      <th className="p-3">Owner Name</th>
                      <th className="p-3">Student/Staff ID</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Expiry Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {expiredVehicles.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{v.vehicleNumber}</td>
                        <td className="p-3 font-bold text-slate-900">{v.name}</td>
                        <td className="p-3 font-mono text-amber-800">{v.registerId}</td>
                        <td className="p-3">{v.department}</td>
                        <td className="p-3 font-mono text-rose-700 font-bold">{formatDateDisplay(v.expiryDate)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-black uppercase text-[10px] border border-rose-200">
                            EXPIRED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: INVALID SCAN ATTEMPTS */}
        {activeTab === 'invalid' && (
          <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-rose-700 uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" /> Invalid Gate Scan Attempts Report
            </h3>

            {invalidAttempts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No invalid scan attempts recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-rose-50 text-rose-900 font-mono uppercase border-b border-rose-200">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Vehicle Number</th>
                      <th className="p-3">Owner / ID</th>
                      <th className="p-3">Gate</th>
                      <th className="p-3">Denial Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {invalidAttempts.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-500">{item.date} {item.time}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{item.vehicleNumber}</td>
                        <td className="p-3 font-bold text-slate-900">{item.ownerName} ({item.registerId || 'N/A'})</td>
                        <td className="p-3 font-mono">{item.gate}</td>
                        <td className="p-3 font-bold text-rose-700">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportsPage;
