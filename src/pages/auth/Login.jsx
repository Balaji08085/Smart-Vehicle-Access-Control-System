import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Lock, ShieldAlert, ArrowRight, KeyRound, Sparkles, CheckCircle2, GraduationCap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEntry } from '../../context/EntryContext';
import MccLogo from '../../components/MccLogo';

const Login = () => {
  const [activeTab, setActiveTab] = useState('guard'); // 'guard', 'admin', 'student'
  const [guardId, setGuardId] = useState('SEC-GATE-01');
  const [guardPin, setGuardPin] = useState('1234');
  const [adminEmail, setAdminEmail] = useState('admin@college.edu');
  const [adminPassword, setAdminPassword] = useState('••••••••');
  const [studentRegisterNo, setStudentRegisterNo] = useState('23BCS045');

  const navigate = useNavigate();
  const { login } = useEntry();

  const handleLogin = async (e) => {
    e.preventDefault();
    let credentials = {};
    if (activeTab === 'guard') {
      credentials = { guardId, guardPin };
    } else if (activeTab === 'admin') {
      credentials = { adminEmail, adminPassword };
    }
    const success = await login(activeTab, credentials);
    if (success) {
      if (activeTab === 'guard') {
        navigate('/scanner');
      } else if (activeTab === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/search');
      }
    }
  };

  const quickDemoLogin = async (role) => {
    const success = await login(role);
    if (success) {
      if (role === 'guard') {
        navigate('/scanner');
      } else if (role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/search');
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-[#080C16] relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-slate-950/80 backdrop-blur-2xl relative z-10"
      >
        {/* Header Official MCC Logo Emblem */}
        <div className="flex justify-center mb-6">
          <MccLogo showText={false} size={64} />
        </div>

        <div className="text-center mb-8">
          <span className="text-[11px] font-black tracking-widest text-amber-400 uppercase font-mono block mb-1">
            MCC MRF INNOVATION PARK SECURITY
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">
            Smart Vehicle Access Portal
          </h1>
          <p className="text-slate-400 text-xs tracking-wide">
            Official Gate Authorization & Security Clearance System
          </p>
        </div>

        {/* 3-Role Tab Switcher */}
        <div className="grid grid-cols-3 p-1.5 bg-black/60 rounded-2xl border border-white/10 mb-6 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('guard')}
            className={`py-2 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center gap-1 ${
              activeTab === 'guard'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg border border-amber-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Security Guard
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`py-2 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center gap-1 ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white shadow-lg border border-amber-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Admin Portal
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('student')}
            className={`py-2 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center gap-1 ${
              activeTab === 'student'
                ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Student Pass
          </button>
        </div>

        {/* Access Notice Badge */}
        {activeTab === 'student' ? (
          <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl mb-5 text-[11px] text-blue-300 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Students can view their vehicle pass & QR sticker status. Security QR Scanner is restricted to Gate Guards & Admin.</span>
          </div>
        ) : (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-2xl mb-5 text-[11px] text-red-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400 shrink-0" />
            <span>Authorized Security Personnel Only. Grants full access to Mobile QR Scanner & Gate Operations.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {activeTab === 'guard' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Security Guard ID / Badge No
                </label>
                <div className="relative">
                  <UserCheck className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={guardId}
                    onChange={(e) => setGuardId(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white font-mono text-sm focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="e.g. SEC-GATE-01"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Gate Security Passcode PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={guardPin}
                    onChange={(e) => setGuardPin(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white font-mono text-sm focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="••••"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'admin' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Administrator Email
                </label>
                <div className="relative">
                  <UserCheck className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="admin@college.edu"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'student' && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Student Register Number / College Roll ID
              </label>
              <div className="relative">
                <GraduationCap className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentRegisterNo}
                  onChange={(e) => setStudentRegisterNo(e.target.value)}
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. 23BCS045"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{activeTab === 'student' ? 'View Student Pass' : 'Authenticate Security Access'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Logins */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block text-center mb-3">
            ⚡ 1-Click Instant Quick Login
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickDemoLogin('guard')}
              className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold rounded-xl text-[10px] border border-emerald-500/30 transition-all text-center"
            >
              Guard Portal
            </button>
            <button
              onClick={() => quickDemoLogin('admin')}
              className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-[10px] border border-amber-500/30 transition-all text-center"
            >
              Admin Portal
            </button>
            <button
              onClick={() => quickDemoLogin('student')}
              className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-blue-400 font-bold rounded-xl text-[10px] border border-blue-500/30 transition-all text-center"
            >
              Student Portal
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;
