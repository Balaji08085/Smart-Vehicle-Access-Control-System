import React, { useState } from 'react';
import { User, QrCode, Clock, Download, CheckCircle2, AlertCircle, Edit, ShieldAlert, Settings, FileText, ChevronRight, LogOut, MapPin, Car, Lock, ArrowRight, Building, Phone, Calendar, History } from 'lucide-react';
import MOCK_USERS from '../../context/mockData';

import { motion, AnimatePresence } from 'framer-motion';

const StudentPortal = () => {
  const [activeTab, setActiveTab] = useState('pass');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (regNo && password) {
      // Find user by registerId or default to the first student for demo
      const foundUser = Object.values(MOCK_USERS).find(u => u.registerId.toLowerCase() === regNo.toLowerCase());
      setUser(foundUser || MOCK_USERS['QR-STUDENT-01']);
      setIsAuthenticated(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-emerald-500 opacity-5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full blur-[150px] opacity-20 animate-pulse"></div>

        <div className="max-w-md w-full glass-card p-8 md:p-10 border-t-4 border-blue-500 relative z-10 shadow-2xl backdrop-blur-xl bg-zinc-900/80">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Member Portal</h2>
            <p className="text-slate-400">Access your digital pass and history</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">ID Number (e.g., 23BCS045)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter ID Number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 focus:outline-none transition-all hover:scale-[1.02]"
            >
              Sign In <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isExpired = user.status === 'Expired';
  const isBlacklisted = user.status === 'Blacklisted';

  return (
    <div className="min-h-screen pt-24 pb-12 bg-black px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-72 space-y-6 flex-shrink-0">
          
          <div className="glass-card p-6 bg-zinc-900/60 border-white/5 rounded-2xl flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 mb-4 shadow-xl">
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-white font-bold text-lg">{user.name}</h3>
            <p className="text-blue-400 font-mono text-sm">{user.registerId}</p>
            <div className="mt-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-slate-300 uppercase tracking-wider">
              {user.type}
            </div>
          </div>

          <div className="space-y-2 glass-card p-2 bg-zinc-900/60 border-white/5 rounded-2xl">
            <button onClick={() => setActiveTab('pass')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'pass' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><QrCode className="w-5 h-5" /> Digital QR Pass</button>
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><FileText className="w-5 h-5" /> Comprehensive Profile</button>
            <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><History className="w-5 h-5" /> Entry History</button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-white/5"><Settings className="w-5 h-5" /> Settings</button>
          </div>

          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-white hover:bg-red-500/20 bg-red-500/10 border border-red-500/20 py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <LogOut className="w-4 h-4" /> Secure Sign Out
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          
          <AnimatePresence mode="wait">
            {/* Tab: Digital Pass */}
            {activeTab === 'pass' && (
              <motion.div key="pass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Active Security Pass</h2>
                <div className="glass-card p-8 border border-white/5 bg-zinc-900/60 flex flex-col md:flex-row gap-10 items-center md:items-start relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-20 ${isExpired || isBlacklisted ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                  
                  <div className="bg-white p-4 rounded-2xl shadow-2xl relative z-10 shrink-0">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${user.id}`} alt="QR" className={`w-48 h-48 md:w-56 md:h-56 ${isBlacklisted ? 'opacity-20' : ''}`} />
                    {isBlacklisted && <div className="absolute inset-0 flex items-center justify-center"><Ban className="w-24 h-24 text-red-600" /></div>}
                  </div>
                  
                  <div className="flex-1 w-full relative z-10">
                    <div className={`inline-flex px-4 py-2 rounded-lg border text-sm font-bold flex items-center gap-2 mb-6 ${
                      user.status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                      user.status === 'Expired' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]' :
                      'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    }`}>
                      {user.status === 'Active' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />} 
                      Status: {user.status.toUpperCase()}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                      {user.vehicleDetails && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Vehicle Linked</p>
                          <p className="text-white font-mono font-medium text-lg flex items-center gap-2 bg-white/5 inline-block px-2 py-0.5 rounded border border-white/10"><Car className="w-4 h-4 text-purple-400 inline" /> {user.vehicleDetails.number}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Pass Expiry</p>
                        <p className={`font-medium text-lg ${isExpired ? 'text-red-400' : 'text-white'}`}>{user.expiryDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Pass ID</p>
                        <p className="text-white font-mono text-sm">{user.id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Date Issued</p>
                        <p className="text-white text-sm">{user.issueDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                      {user.status === 'Active' && (
                        <button className="btn-primary flex items-center gap-2 text-sm px-6 py-3 font-bold"><Download className="w-4 h-4" /> Save QR Code</button>
                      )}
                      {(isExpired || user.status === 'Active') && (
                        <button className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 flex items-center gap-2 text-sm px-6 py-3 rounded-xl font-bold transition-all"><Clock className="w-4 h-4" /> Request Renewal</button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab: Full Profile */}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
                  <h2 className="text-2xl font-bold text-white">Comprehensive Profile</h2>
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-bold flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-lg"><Edit className="w-4 h-4" /> Edit Details</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Personal Block */}
                  <div className="glass-card p-6 border border-white/5 bg-zinc-900/60 rounded-2xl">
                    <h3 className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-6 flex items-center gap-2"><User className="w-4 h-4" /> Personal Details</h3>
                    <div className="space-y-5">
                      <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Full Name</p><p className="text-white font-medium text-lg">{user.name}</p></div>
                      <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">ID Number</p><p className="text-white font-mono">{user.registerId}</p></div>
                      <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Email</p><p className="text-white">{user.email || 'N/A'}</p></div>
                      <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Mobile</p><p className="text-white">{user.mobile || 'N/A'}</p></div>
                    </div>
                  </div>

                  {/* Academic / Office Block */}
                  <div className="glass-card p-6 border border-white/5 bg-zinc-900/60 rounded-2xl">
                    <h3 className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-6 flex items-center gap-2"><Building className="w-4 h-4" /> Organization Details</h3>
                    <div className="space-y-5">
                      <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Department</p><p className="text-white font-medium text-lg">{user.department}</p></div>
                      {user.year && <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Year & Section</p><p className="text-white">{user.year} - {user.section}</p></div>}
                      {user.designation && <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Designation</p><p className="text-white">{user.designation}</p></div>}
                      {user.hostelOrDay && <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Accommodation</p><p className="text-white bg-white/10 inline-block px-3 py-1 rounded font-bold text-sm mt-1">{user.hostelOrDay}</p></div>}
                    </div>
                  </div>

                  {/* Vehicle Block */}
                  {user.vehicleDetails && (
                    <div className="glass-card p-6 border border-white/5 bg-zinc-900/60 rounded-2xl md:col-span-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5"><Car className="w-32 h-32" /></div>
                      <h3 className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-6 flex items-center gap-2"><Car className="w-4 h-4" /> Registered Vehicle</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">License Plate</p><p className="text-white font-mono font-bold text-lg bg-black/50 px-2 py-1 rounded border border-white/10 inline-block mt-1">{user.vehicleDetails.number}</p></div>
                        <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Type</p><p className="text-white font-medium mt-2">{user.vehicleDetails.type}</p></div>
                        <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Brand/Model</p><p className="text-white font-medium mt-2">{user.vehicleDetails.brand}</p></div>
                        <div><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Status</p><p className="text-emerald-400 font-bold mt-2">Verified & Active</p></div>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
                  <h2 className="text-2xl font-bold text-white">Entry & Exit Log</h2>
                </div>
                
                <div className="glass-card bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-8 text-center">
                    <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-white font-bold text-lg">No recent logs</h3>
                    <p className="text-slate-400 text-sm mt-1">Your scans at the gates will appear here.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
