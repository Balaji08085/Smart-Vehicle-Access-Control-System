import React, { useState } from 'react';
import { useEntry, formatDateDisplay, getValidityStatus } from '../../context/EntryContext';

const ReportsPage = () => {
  const { vehicles, history } = useEntry();
  const [activeTab, setActiveTab] = useState('daily'); // daily, weekly, monthly, expired, invalid

  const vehicleList = Object.values(vehicles || {});

  // Helper to filter history based on the active report tab
  const getFilteredHistory = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (activeTab === 'expired' || activeTab === 'invalid') {
      return history || [];
    }
    
    return (history || []).filter(h => {
      const dateStr = h.scanDate || h.createdAt || h.date;
      if (!dateStr) return true;

      const itemDate = new Date(dateStr);
      if (isNaN(itemDate.getTime())) return true;
      
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
  const grantedCount = filteredHistory.filter(h => (h.status === 'Granted' || h.result === 'Granted')).length;
  const deniedCount = filteredHistory.filter(h => (h.status === 'Denied' || h.result === 'Denied')).length;
  
  // Calculate expired vehicles from live vehicle registry
  const expiredVehicles = vehicleList.filter(v => {
    const status = getValidityStatus(v);
    if (status === 'Expired') return true;
    const expDateStr = v.expiryDate || v.accessExpiryDate;
    if (expDateStr) {
      const expDate = new Date(expDateStr);
      if (!isNaN(expDate.getTime()) && expDate < new Date()) {
        return true;
      }
    }
    return false;
  });

  const invalidAttempts = (history || []).filter(h => (h.status === 'Denied' || h.result === 'Denied'));

  // Group gate access stats dynamically by gate name
  const getGateSummaries = () => {
    const gateMap = {};

    filteredHistory.forEach(h => {
      const gateName = h.gate || h.ipAddress || 'Main Entrance Gate';
      if (!gateMap[gateName]) {
        gateMap[gateName] = { gateName, totalScans: 0, granted: 0, denied: 0 };
      }
      gateMap[gateName].totalScans += 1;
      if (h.status === 'Granted' || h.result === 'Granted') {
        gateMap[gateName].granted += 1;
      } else {
        gateMap[gateName].denied += 1;
      }
    });

    const list = Object.values(gateMap);
    if (list.length === 0) {
      return [{ gateName: 'Main Entrance Gate', totalScans: 0, granted: 0, denied: 0, passRate: '0%' }];
    }

    return list.map(g => ({
      ...g,
      passRate: g.totalScans ? `${Math.round((g.granted / g.totalScans) * 100)}%` : '0%'
    }));
  };

  const gateSummaries = getGateSummaries();

  const exportReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 bg-slate-50 dark:bg-[#180305] relative text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Background Glow */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#701A1A]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#701A1A]/60 bg-white dark:bg-[#2E080C] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="text-xs font-black text-[#701A1A] dark:text-red-400 uppercase tracking-widest mb-1 font-mono">
              Campus Access Analytics & Reports
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Vehicle Security Intelligence Reports
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm mt-1 font-medium">
              Audit summaries, scan success rates, expired sticker alerts, and security logs
            </p>
          </div>

          <button
            onClick={exportReport}
            className="w-full md:w-auto px-6 py-3.5 bg-[#701A1A] hover:bg-[#5C121E] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-102 active:scale-98"
          >
            Print / Export Report
          </button>
        </div>

        {/* Report Timeframe / Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl border border-slate-200 dark:border-[#5C121E] bg-white dark:bg-[#240609] shadow-sm">
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
              className={`py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'bg-[#701A1A] text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#3D0A11]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#240609] p-5 rounded-3xl border border-slate-200 dark:border-[#5C121E] shadow-sm text-left">
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Total Scan Logs</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">{totalScans}</span>
          </div>

          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm text-left">
            <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">Access Granted (Green)</span>
            <span className="text-3xl font-black text-emerald-800 dark:text-emerald-300 block mt-1">{grantedCount}</span>
          </div>

          <div className="bg-rose-50/80 dark:bg-rose-950/40 p-5 rounded-3xl border border-rose-200 dark:border-rose-500/30 shadow-sm text-left">
            <span className="text-[11px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-wider block">Access Denied (Red)</span>
            <span className="text-3xl font-black text-rose-800 dark:text-rose-300 block mt-1">{deniedCount}</span>
          </div>

          <div className="bg-amber-50/80 dark:bg-amber-950/40 p-5 rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm text-left">
            <span className="text-[11px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-wider block">Expired Stickers</span>
            <span className="text-3xl font-black text-amber-900 dark:text-amber-300 block mt-1">{expiredVehicles.length}</span>
          </div>
        </div>

        {/* TAB 1, 2, 3: DAILY / WEEKLY / MONTHLY REPORTS */}
        {(activeTab === 'daily' || activeTab === 'weekly' || activeTab === 'monthly') && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#240609] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#5C121E] shadow-sm space-y-6">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {activeTab.toUpperCase()} GATE ACCESS VERIFICATION SUMMARY
              </h3>

              {/* Progress Visual Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-emerald-800 dark:text-emerald-400">
                    Granted: {grantedCount} ({totalScans ? Math.round((grantedCount / totalScans) * 100) : 0}%)
                  </span>
                  <span className="text-rose-800 dark:text-rose-400">
                    Denied: {deniedCount} ({totalScans ? Math.round((deniedCount / totalScans) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-[#120305] rounded-full overflow-hidden flex border border-slate-200 dark:border-[#5C121E]">
                  <div 
                    style={{ width: `${totalScans ? (grantedCount / totalScans) * 100 : 0}%` }} 
                    className="bg-emerald-600 h-full transition-all"
                  />
                  <div 
                    style={{ width: `${totalScans ? (deniedCount / totalScans) * 100 : 0}%` }} 
                    className="bg-rose-600 h-full transition-all"
                  />
                </div>
              </div>

              {/* Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-[#180305] text-slate-700 dark:text-slate-300 font-mono uppercase border-b border-slate-200 dark:border-[#5C121E]">
                      <th className="p-3.5">Gate Name</th>
                      <th className="p-3.5">Total Scans</th>
                      <th className="p-3.5">Granted</th>
                      <th className="p-3.5">Denied</th>
                      <th className="p-3.5">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {gateSummaries.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{g.gateName}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{g.totalScans}</td>
                        <td className="p-3.5 font-mono text-emerald-800 dark:text-emerald-400 font-bold">{g.granted}</td>
                        <td className="p-3.5 font-mono text-rose-800 dark:text-rose-400 font-bold">{g.denied}</td>
                        <td className="p-3.5 font-mono text-emerald-800 dark:text-emerald-400 font-bold">{g.passRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXPIRED STICKERS */}
        {activeTab === 'expired' && (
          <div className="bg-white dark:bg-[#240609] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#5C121E] shadow-sm space-y-4">
            <h3 className="text-base font-black text-amber-900 dark:text-amber-400 uppercase tracking-wider">
              Expired Vehicle Stickers Report
            </h3>

            {expiredVehicles.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No expired vehicle stickers found in live system registry.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">All registered vehicle stickers are currently valid and up-to-date.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-[#180305] text-slate-700 dark:text-slate-300 font-mono uppercase border-b border-slate-200 dark:border-[#5C121E]">
                      <th className="p-3.5">Vehicle Number</th>
                      <th className="p-3.5">Owner Name</th>
                      <th className="p-3.5">Student/Staff ID</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Expiry Date</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {expiredVehicles.map(v => (
                      <tr key={v.id || v._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3.5">
                          <span className="font-mono font-black text-slate-900 dark:text-slate-900 bg-amber-100 dark:bg-amber-100 rounded-lg px-2.5 py-1 border border-amber-300 inline-block shadow-2xs">
                            {v.vehicleNumber || v.bikeNumber}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{v.name || v.ownerName}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{v.registerId || v.employeeId}</td>
                        <td className="p-3.5">{v.department}</td>
                        <td className="p-3.5 font-mono text-rose-700 dark:text-rose-400 font-bold">{formatDateDisplay(v.expiryDate || v.accessExpiryDate)}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-black uppercase text-[10px] border border-rose-200 dark:border-rose-500/40">
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
          <div className="bg-white dark:bg-[#240609] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#5C121E] shadow-sm space-y-4">
            <h3 className="text-base font-black text-rose-800 dark:text-rose-400 uppercase tracking-wider">
              Invalid Gate Scan Attempts Report
            </h3>

            {invalidAttempts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No invalid scan attempts recorded in live system logs.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">All processed gate scans have been successfully validated.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-[#180305] text-slate-700 dark:text-slate-300 font-mono uppercase border-b border-slate-200 dark:border-[#5C121E]">
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Vehicle Number</th>
                      <th className="p-3.5">Owner / ID</th>
                      <th className="p-3.5">Gate</th>
                      <th className="p-3.5">Denial Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {invalidAttempts.map((item, idx) => (
                      <tr key={item.id || item._id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {item.scanDate ? (isNaN(new Date(item.scanDate).getTime()) ? item.scanDate : new Date(item.scanDate).toLocaleString()) : `${item.date || ''} ${item.time || ''}`}
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-black text-slate-900 dark:text-slate-900 bg-amber-100 dark:bg-amber-100 rounded-lg px-2.5 py-1 border border-amber-300 inline-block shadow-2xs">
                            {item.vehicleNumber || item.bikeNumber || item.qrToken}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          {item.ownerName || item.request?.name || 'Verified Vehicle'} ({item.registerId || item.employeeId || 'N/A'})
                        </td>
                        <td className="p-3.5 font-mono">{item.gate || item.ipAddress || 'Main Gate'}</td>
                        <td className="p-3.5 font-bold text-rose-800 dark:text-rose-400">{item.reason || 'Invalid QR Code'}</td>
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
