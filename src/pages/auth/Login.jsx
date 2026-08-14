import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Lock, ShieldAlert, ArrowRight, KeyRound, Sparkles, GraduationCap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEntry } from '../../context/EntryContext';
import MccLogo from '../../components/MccLogo';

const Login = () => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin', 'superadmin', 'guard', 'student'
  const [guardId, setGuardId] = useState('SEC-GATE-01');
  const [guardPin, setGuardPin] = useState('1234');
  const [adminEmail, setAdminEmail] = useState('admin@svacs.edu');
  const [adminPassword, setAdminPassword] = useState('••••••••');
  const [superAdminEmail, setSuperAdminEmail] = useState('superadmin@svacs.edu');
  const [superAdminPassword, setSuperAdminPassword] = useState('••••••••');
  const [studentRegisterNo, setStudentRegisterNo] = useState('23BCS045');

  const navigate = useNavigate();
  const { login } = useEntry();

  const handleLogin = async (e) => {
    e.preventDefault();
    let credentials = {};
    let role = activeTab;
    if (activeTab === 'guard') {
      credentials = { guardId, guardPin };
    } else if (activeTab === 'admin') {
      credentials = { adminEmail, adminPassword };
    } else if (activeTab === 'superadmin') {
      credentials = { adminEmail: superAdminEmail, adminPassword: superAdminPassword };
    }
    const success = await login(role, credentials);
    if (success) {
      if (role === 'admin') {
        navigate('/superadmin/create');
      } else if (role === 'superadmin') {
        navigate('/admin/approval');
      } else if (role === 'guard') {
        navigate('/scanner');
      } else {
        navigate('/search');
      }
    }
  };

  const quickDemoLogin = async (role) => {
    const success = await login(role);
    if (success) {
      if (role === 'admin') navigate('/superadmin/create');
      else if (role === 'superadmin') navigate('/admin/approval');
      else if (role === 'guard') navigate('/scanner');
      else navigate('/search');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-slate-50 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#701A1A]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-8 rounded-3xl border border-slate-200 shadow-xl bg-white relative z-10"
      >
        <div className="flex justify-center mb-6">
          <MccLogo showText={false} size={64} />
        </div>

        <div className="text-center mb-8">
          <span className="text-[11px] font-black tracking-widest text-[#701A1A] uppercase font-mono block mb-1">
            MCC MRF INNOVATION PARK SECURITY
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            Smart Vehicle Access Portal
          </h1>
          <p className="text-slate-500 text-xs tracking-wide">
            Official Gate Authorization & Security Clearance System
          </p>
        </div>

        {/* 3-Role Tab Switcher */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 mb-6 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`py-2 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
              activeTab === 'admin'
                ? 'bg-[#701A1A] text-white shadow-sm border border-[#5C121E]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Admin (Register)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('superadmin')}
            className={`py-2 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
              activeTab === 'superadmin'
                ? 'bg-[#701A1A] text-white shadow-sm border border-[#5C121E]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Super Admin
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guard')}
            className={`py-2 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
              activeTab === 'guard'
                ? 'bg-emerald-600 text-white shadow-sm border border-emerald-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Guard Portal
          </button>
        </div>

        {/* Access Notice Badge */}
        {activeTab === 'admin' ? (
          <div className="p-3 bg-[#701A1A]/10 border border-[#701A1A]/20 rounded-2xl mb-5 text-[11px] text-[#701A1A] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#701A1A] shrink-0" />
            <span><strong>Admin Portal</strong>: Register bike/car access passes for campus users. Restricted from Approvals Queue.</span>
          </div>
        ) : activeTab === 'superadmin' ? (
          <div className="p-3 bg-[#701A1A]/10 border border-[#701A1A]/20 rounded-2xl mb-5 text-[11px] text-[#701A1A] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#701A1A] shrink-0" />
            <span><strong>Super Admin Portal</strong>: Exclusive authority to Review & Approve/Reject pending access requests.</span>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl mb-5 text-[11px] text-emerald-800 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Authorized Security Officers. Grants access to Gate QR Scanner & Real-Time Entry Terminal.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          )}

          {activeTab === 'admin' && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
                Admin Access Passcode
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 text-sm focus:outline-none focus:border-[#701A1A] transition-colors"
                  placeholder="Enter Admin Passcode (admin123)"
                />
              </div>
            </div>
          )}

          {activeTab === 'guard' && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
                Gate Security Guard Passcode
              </label>
              <div className="relative">
                <ShieldCheck className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={guardPassword}
                  onChange={(e) => setGuardPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Enter Guard Passcode (guard123)"
                />
              </div>
            </div>
          )}

          {activeTab === 'superadmin' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
                  Super Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={superAdminEmail}
                    onChange={(e) => setSuperAdminEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 text-sm focus:outline-none focus:border-[#701A1A] transition-colors"
                    placeholder="superadmin@svacs.edu"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
                  Super Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={superAdminPassword}
                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 text-sm focus:outline-none focus:border-[#701A1A] transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-[#701A1A] to-[#8C1823] hover:from-[#5C121E] hover:to-[#701A1A] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Authenticate Security Access</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Logins */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-center mb-3">
            ⚡ 1-Click Instant Quick Login
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickDemoLogin('admin')}
              className="py-2.5 px-1.5 bg-[#701A1A]/10 hover:bg-[#701A1A]/20 text-[#701A1A] font-bold rounded-xl text-[10px] border border-[#701A1A]/30 transition-all text-center"
            >
              Admin (Create)
            </button>
            <button
              onClick={() => quickDemoLogin('superadmin')}
              className="py-2.5 px-1.5 bg-[#701A1A] hover:bg-[#5C121E] text-white font-bold rounded-xl text-[10px] shadow-sm transition-all text-center"
            >
              Super Admin
            </button>
            <button
              onClick={() => quickDemoLogin('guard')}
              className="py-2.5 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[10px] border border-emerald-200 transition-all text-center"
            >
              Guard Portal
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;
