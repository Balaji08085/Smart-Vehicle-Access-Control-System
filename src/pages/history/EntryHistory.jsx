import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, Filter, Search, Download, Trash2, RefreshCw } from 'lucide-react';

const EntryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history/scans');
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
    } catch (err) {
      console.error('Fetch scan history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id, vehicleLabel) => {
    if (!window.confirm(`Are you sure you want to delete this scan entry (${vehicleLabel})?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/history/scans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item._id !== id));
      } else {
        alert('Failed to delete scan log entry.');
      }
    } catch (err) {
      console.error('Delete scan entry error:', err);
      alert('Error deleting scan log entry.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to CLEAR ALL gate scan history logs? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/history/scans/clear-all', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
      } else {
        alert('Failed to clear scan history.');
      }
    } catch (err) {
      console.error('Clear scan history error:', err);
      alert('Error clearing scan history.');
    }
  };

  const filteredHistory = history.filter(scan => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const name = (scan.ownerName || scan.request?.name || '').toLowerCase();
    const plate = (scan.vehicleNumber || scan.request?.bikeNumber || scan.qrToken || '').toLowerCase();
    const reason = (scan.reason || '').toLowerCase();
    const result = (scan.result || '').toLowerCase();

    return name.includes(q) || plate.includes(q) || reason.includes(q) || result.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#180305] pt-28 p-4 md:p-8 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="p-6 md:p-8 rounded-3xl border border-orange-200/80 dark:border-[#701A1A]/60 bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-white dark:from-[#2E080C] dark:via-[#240609] dark:to-[#180305] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Gate Scan History Log</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Comprehensive audit trail of all vehicle QR code validation scans at gate checkpoints.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchHistory}
              className="bg-white dark:bg-[#2E080C] border border-slate-200 dark:border-[#5C121E] hover:bg-slate-100 dark:hover:bg-[#3D0A11] text-slate-700 dark:text-slate-200 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Refresh
            </button>
            {history.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
              >
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Clear All Logs
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#240609] rounded-3xl border border-slate-200 dark:border-[#5C121E] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-[#5C121E] flex gap-4 bg-slate-50 dark:bg-[#180305]/80">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, vehicle plate, or token..." 
                className="w-full bg-white dark:bg-[#180305] border border-slate-200 dark:border-[#5C121E] rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-sm" 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100/80 dark:bg-[#180305]/90 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold border-b border-slate-200 dark:border-[#5C121E]">
                <tr>
                  <th className="px-6 py-4">Scan Date & Time</th>
                  <th className="px-6 py-4">User Name</th>
                  <th className="px-6 py-4">Vehicle Plate</th>
                  <th className="px-6 py-4">Validation Status</th>
                  <th className="px-6 py-4">Reason / Notes</th>
                  <th className="px-6 py-4">Device Terminal</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-12 text-slate-500 dark:text-slate-400 font-bold">Loading gate verification records...</td></tr>
                ) : filteredHistory.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-12 text-slate-500 dark:text-slate-400 font-bold">No gate scan history records found.</td></tr>
                ) : filteredHistory.map((scan) => {
                  const ownerName = scan.ownerName || scan.request?.name || 'Verified Vehicle';
                  const vehiclePlate = scan.vehicleNumber || scan.request?.bikeNumber || scan.qrToken || 'N/A';

                  return (
                    <tr key={scan._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          {new Date(scan.scanDate).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {ownerName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 rounded-lg px-2.5 py-1 border border-amber-200 dark:border-amber-500/40 inline-block">
                          {vehiclePlate}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          scan.result === 'Granted' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40'
                        }`}>
                          {scan.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{scan.reason}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">{scan.ipAddress || 'SEC-TERMINAL-01'}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[150px] font-mono">{scan.device || scan.browser}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteEntry(scan._id, vehiclePlate)}
                          disabled={deletingId === scan._id}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-500/40 disabled:opacity-50"
                          title="Delete Scan Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryHistory;
