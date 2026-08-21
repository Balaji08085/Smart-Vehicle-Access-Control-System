import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, ShieldCheck, CheckCircle2, AlertTriangle, Scan, History, 
  Activity, ArrowUpRight, Bike, Users, Clock, Filter, AlertOctagon, Sparkles,
  Radio, Shield, FileText, Lock, ChevronRight, BarChart2, CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEntry, getValidityStatus } from '../../context/EntryContext';

const SecurityDashboard = () => {
  const { vehicles, history, userRole, theme } = useEntry();

  const [dbStats, setDbStats] = useState(null);
  const [dbRequests, setDbRequests] = useState([]);
  const [dbScans, setDbScans] = useState([]);

  useEffect(() => {
    const fetchLiveDatabaseMetrics = async () => {
      try {
        const [dashRes, reqRes, scanRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/requests'),
          fetch('/api/history/scans')
        ]);
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setDbStats(dashData);
        }
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setDbRequests(Array.isArray(reqData) ? reqData : (reqData.requests || []));
        }
        if (scanRes.ok) {
          const scanData = await scanRes.json();
          setDbScans(Array.isArray(scanData) ? scanData : (scanData.logs || scanData.scans || []));
        }
      } catch (err) {
        console.warn('Backend metrics offline, using context fallbacks:', err);
      }
    };

    fetchLiveDatabaseMetrics();
  }, []);

  const vehicleList = Object.values(vehicles);
  const allVehicleRecords = dbRequests.length > 0 ? dbRequests : vehicleList;
  const allScanLogs = dbScans.length > 0 ? dbScans : history;

  // Dynamic Metrics Calculation from Database
  const totalRegistered = dbStats?.totalUsers ?? allVehicleRecords.length;

  const activeStickers = dbStats?.activeUsers ?? allVehicleRecords.filter(r => {
    if (r.status === 'Approved') {
      if (!r.accessExpiryDate && !r.expiryDate) return true;
      const exp = new Date(r.accessExpiryDate || r.expiryDate);
      return exp >= new Date();
    }
    return getValidityStatus(r) === 'Active';
  }).length;

  const expiredStickers = dbStats?.expiredUsers ?? allVehicleRecords.filter(r => {
    if (r.status === 'Approved' || r.status === 'Expired') {
      if (!r.accessExpiryDate && !r.expiryDate) return false;
      const exp = new Date(r.accessExpiryDate || r.expiryDate);
      return exp < new Date();
    }
    return getValidityStatus(r) === 'Expired';
  }).length;

  const todayEntries = dbStats?.todaysAllowed ?? allScanLogs.filter(h => h.status === 'Granted' || h.result === 'Granted').length;
  const invalidScanAttempts = dbStats?.todaysDenied ?? allScanLogs.filter(h => h.status === 'Denied' || h.result === 'Denied').length;

  const twoWheelers = vehicleList.filter(v => v.vehicleType?.toLowerCase().includes('bike') || v.vehicleType?.toLowerCase().includes('two')).length;
  const fourWheelers = vehicleList.filter(v => v.vehicleType?.toLowerCase().includes('car') || v.vehicleType?.toLowerCase().includes('four')).length;

  const gates = [
    { name: 'Gate 1 (Main Entrance)', status: 'ONLINE', officer: 'M. Kumar (SEC-102)', activeCount: 42, color: 'emerald' },
    { name: 'Gate 2 (North Complex)', status: 'ONLINE', officer: 'S. Rajan (SEC-105)', activeCount: 38, color: 'emerald' },
    { name: 'Gate 3 (South Research)', status: 'ONLINE', officer: 'P. Vignesh (SEC-109)', activeCount: 26, color: 'emerald' },
    { name: 'Gate 4 (Innovation Hub)', status: 'ONLINE', officer: 'R. Anthony (SEC-112)', activeCount: 15, color: 'emerald' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 relative overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-[#180305]">
      
      {/* Ambient background glow */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-red-900/10 dark:bg-red-900/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Dashboard Banner Header */}
        <div className="p-6 md:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden bg-gradient-to-r from-[#701A1A]/10 via-[#701A1A]/5 to-white dark:from-[#2A0A0F] dark:via-[#1E0609] dark:to-[#120305] border-[#701A1A]/20 dark:border-[#701A1A]/60">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#701A1A]/10 to-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-black text-[#701A1A] dark:text-red-400 uppercase tracking-widest mb-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#701A1A] dark:bg-red-400 animate-ping" /> Security Operations Command Center
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Smart Vehicle Access Control System
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm mt-1.5">
              Live Campus Access Monitoring, Sticker Validation & Real-time Barrier Terminal System
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto relative z-10">
            {userRole === 'admin' && (
              <Link
                to="/superadmin/create"
                className="flex-1 md:flex-none px-5 py-3.5 bg-gradient-to-r from-[#701A1A] to-[#8C1823] hover:from-[#5C121E] hover:to-[#701A1A] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" /> Register Bike Access
              </Link>
            )}

            {userRole === 'superadmin' && (
              <Link
                to="/admin/approval"
                className="flex-1 md:flex-none px-5 py-3.5 bg-white dark:bg-[#2A0A0F] text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all border border-slate-200 dark:border-[#5C121E] shadow-sm hover:bg-slate-50 dark:hover:bg-[#3D0A11] flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <CheckSquare className="w-4 h-4 text-[#701A1A] dark:text-red-400" /> Approvals Queue
              </Link>
            )}

            <Link
              to="/scanner"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <Scan className="w-4 h-4 animate-pulse" /> Launch Scanner
            </Link>
          </div>
        </div>


        {/* 5 Core Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Total Registered Vehicles */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between bg-white dark:bg-[#240609] border-slate-200/90 dark:border-[#5C121E]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Registered</span>
              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                <Car className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 dark:text-white block">{totalRegistered}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">Park Authorized Vehicles</span>
            </div>
          </motion.div>

          {/* Card 2: Active Stickers */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Active Stickers</span>
              <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 block">{activeStickers}</span>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-300/70 font-medium mt-1 block">Valid QR Passes</span>
            </div>
          </motion.div>

          {/* Card 3: Expired Stickers */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">Expired Stickers</span>
              <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-amber-700 dark:text-amber-400 block">{expiredStickers}</span>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-300/70 font-medium mt-1 block">Requires Renewal</span>
            </div>
          </motion.div>

          {/* Card 4: Today's Entries */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between bg-white dark:bg-slate-950/80 border-slate-200/90 dark:border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">Today's Entries</span>
              <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 dark:text-white block">{todayEntries}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">Access Granted Scans</span>
            </div>
          </motion.div>

          {/* Card 5: Invalid Scan Attempts */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400">Invalid Scans</span>
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40">
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-rose-700 dark:text-rose-400 block">{invalidScanAttempts}</span>
              <span className="text-[10px] text-rose-600/80 dark:text-rose-300/70 font-medium mt-1 block">Access Denied Alerts</span>
            </div>
          </motion.div>

        </div>

        {/* Live Gate Security Terminals Section */}
        <div className="p-6 rounded-3xl border shadow-sm space-y-4 bg-white dark:bg-slate-950/80 border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 font-mono text-slate-900 dark:text-white">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" /> Campus Security Gate Live Terminals
            </h3>
            <span className="text-xs font-mono font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" /> 4 Gate Terminals Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gates.map((g, idx) => (
              <div key={idx} className="p-4 rounded-2xl border flex flex-col justify-between transition-all bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 hover:border-emerald-500/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{g.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black border bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/40">
                    {g.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Officer: {g.officer}</span>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                  <span>Today's Volume</span>
                  <span className="text-slate-900 dark:text-white font-bold">{g.activeCount} scans</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Section: Fleet Breakdown + Security Roster & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Column 1: Fleet Category & Security Officer Duty Roster */}
          <div className="space-y-6">
            
            {/* Fleet Breakdown Card */}
            <div className="p-6 rounded-3xl border shadow-sm space-y-4 bg-white dark:bg-slate-950/80 border-slate-200 dark:border-white/10">
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center justify-between text-slate-900 dark:text-white">
                <span>Campus Vehicle Categories</span>
                <Car className="w-4 h-4 text-[#701A1A] dark:text-red-400" />
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl border flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-900 dark:text-white">Two-Wheelers (Bikes)</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Students & Staff Two-Wheelers</span>
                    </div>
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{twoWheelers}</span>
                </div>

                <div className="p-3.5 rounded-2xl border flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-900 dark:text-white">Four-Wheelers (Cars)</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Faculty & VIP Four-Wheelers</span>
                    </div>
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{fourWheelers}</span>
                </div>
              </div>
            </div>

            {/* On-Duty Command Roster */}
            <div className="p-6 rounded-3xl border shadow-sm space-y-4 bg-white dark:bg-slate-950/80 border-slate-200 dark:border-white/10">
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Security Duty Shift Roster
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl border flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/5">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono block">Chief Security Controller</span>
                    <span className="text-slate-900 dark:text-white font-bold block">S. Ramanathan (ID: SEC-8801)</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] bg-[#701A1A]/10 dark:bg-[#701A1A]/30 text-[#701A1A] dark:text-red-300 border border-[#701A1A]/20 dark:border-red-500/30">On Duty</span>
                </div>

                <div className="p-3 rounded-2xl border flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/5">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono block">Active Shift</span>
                    <span className="text-slate-900 dark:text-white font-bold block">Morning Shift Alpha (06:00 AM - 02:00 PM)</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">Active</span>
                </div>
              </div>
            </div>

          </div>

          {/* Column 2 & 3: Live Gate Activity Stream & Verification Logs */}
          <div className="lg:col-span-2 p-6 rounded-3xl border shadow-sm flex flex-col justify-between space-y-6 bg-white dark:bg-slate-950/80 border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
                    <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Live Gate Validation Feed
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">Real-time gate scan verification logs</p>
                </div>
                <Link to="/history" className="text-xs font-bold text-[#701A1A] dark:text-red-400 hover:underline flex items-center gap-1">
                  View Full History Log <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {allScanLogs.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                    <Activity className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 mb-2 opacity-50" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No gate validation scans recorded yet.</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Perform a live QR code scan to see real-time gate entry events here.</p>
                  </div>
                ) : (
                  allScanLogs.slice(0, 6).map((log, idx) => {
                    const statusVal = log.status || log.result || 'Granted';
                    const isGranted = statusVal === 'Granted' || statusVal === 'ALLOWED';
                    const plateNo = log.vehicleNumber || log.qrToken || 'UNKNOWN';
                    const owner = log.ownerName || log.request?.name || 'Verified User';
                    const gateName = log.gate || log.device || 'Main Entrance Gate';
                    const timeVal = log.time || (log.scanDate ? new Date(log.scanDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

                    return (
                      <div 
                        key={log._id || log.id || idx}
                        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                          isGranted
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl text-white font-bold ${
                            isGranted ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}>
                            {isGranted ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-black text-slate-900 dark:text-white">{plateNo}</span>
                              <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">({owner})</span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono mt-0.5">
                              {gateName} {timeVal ? `• ${timeVal}` : ''}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isGranted
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                          }`}>
                            {isGranted ? 'ACCESS GRANTED' : `DENIED: ${log.reason || 'INVALID'}`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Control Footer Panel */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Security Barrier Status: Locked & Secured
              </span>
              
              <div className="flex items-center gap-3">
                <Link to="/reports" className="px-3.5 py-2 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl font-bold flex items-center gap-1.5 border border-slate-200 dark:border-white/10 shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-[#701A1A] dark:text-red-400" /> Gate Audit Reports
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SecurityDashboard;
