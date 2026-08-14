import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Scan, Car, Search, History, BarChart3, LogIn, Menu, X, GraduationCap, Shield, Sparkles, CheckSquare, Sun, Moon } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useEntry } from '../context/EntryContext';
import SvacsLogo from './SvacsLogo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, theme, toggleTheme } = useEntry();

  const allLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: ShieldCheck, roles: ['guard', 'admin', 'superadmin'] },
    { name: 'Register Bike Access', path: '/superadmin/create', icon: Sparkles, roles: ['admin'] },
    { name: 'Approvals Queue', path: '/admin/approval', icon: CheckSquare, roles: ['superadmin'] },
    { name: 'QR Scanner', path: '/scanner', icon: Scan, roles: ['guard', 'admin', 'superadmin'] },
    { name: 'Entry History', path: '/history', icon: History, roles: ['guard', 'admin', 'superadmin'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['guard', 'admin', 'superadmin'] },
  ];

  const links = allLinks.filter(link => link.roles.includes(userRole));

  return (
    <nav className={`fixed w-full z-50 top-0 transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-[#120305]/95 backdrop-blur-xl border-b border-[#701A1A]/40 shadow-[0_4px_25px_rgba(0,0,0,0.8)]' 
        : 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_15px_rgba(0,0,0,0.03)]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* SVACS Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <SvacsLogo showText={true} size={40} dark={theme !== 'dark'} />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1.5 ml-auto mr-4">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  target={link.path === '/scanner' ? "_blank" : undefined}
                  rel={link.path === '/scanner' ? "noopener noreferrer" : undefined}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black tracking-wide transition-all duration-200 ${
                    isActive
                      ? theme === 'dark'
                        ? 'text-white bg-gradient-to-r from-[#701A1A] to-[#8C1823] border border-red-500/40 shadow-md shadow-[#701A1A]/40 scale-[1.02]'
                        : 'text-white bg-[#701A1A] shadow-md shadow-[#701A1A]/20 scale-[1.02]'
                      : theme === 'dark'
                        ? 'text-slate-300 hover:text-white hover:bg-white/10'
                        : 'text-slate-700 hover:text-[#701A1A] hover:bg-slate-100/90'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive 
                      ? 'text-white' 
                      : theme === 'dark' 
                        ? 'text-slate-400 group-hover:text-white' 
                        : 'text-slate-400 group-hover:text-[#701A1A]'
                  }`} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Role Status & Auth Actions */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            
            {/* 🌙 Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title="Toggle Light / Dark Mode (Shortcut: Press Alt + T)"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-[#1E0609] text-red-300 border-[#5C121E] hover:bg-[#2A0A0F]'
                  : 'bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200/80 shadow-xs'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-red-400" />
                  <span className="hidden xl:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#701A1A]" />
                  <span className="hidden xl:inline">Dark</span>
                </>
              )}
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#701A1A]/10 text-[#701A1A] dark:bg-red-950/60 dark:text-red-300 border border-[#701A1A]/20 dark:border-[#701A1A] font-bold">
                Alt+T
              </span>
            </button>

            {/* Current Active Role Badge */}
            <div className={`px-3.5 py-2 rounded-xl border text-[11px] font-black uppercase tracking-wider flex items-center gap-2 ${
              theme === 'dark'
                ? userRole === 'admin'
                  ? 'bg-[#701A1A]/30 text-red-300 border-red-500/40'
                  : userRole === 'superadmin'
                  ? 'bg-red-950/80 text-red-300 border-red-500/50'
                  : userRole === 'guard'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : userRole === 'admin'
                  ? 'bg-[#701A1A]/10 text-[#701A1A] border-[#701A1A]/25 shadow-xs'
                  : userRole === 'superadmin'
                  ? 'bg-[#701A1A]/10 text-[#701A1A] border-[#701A1A]/25 shadow-xs'
                  : userRole === 'guard'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                  : 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-ping ${
                userRole === 'admin' ? 'bg-[#701A1A]' : userRole === 'superadmin' ? 'bg-[#701A1A]' : userRole === 'guard' ? 'bg-emerald-500' : 'bg-blue-500'
              }`} />
              {userRole === 'admin' ? 'Admin' : userRole === 'superadmin' ? 'Super Admin (Approvals)' : 'Gate Guard'}
            </div>

            {/* Switch Role Button */}
            <Link
              to="/login"
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
                theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-slate-300" />
              Switch Role
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl text-xs font-bold border ${
                theme === 'dark' ? 'bg-slate-900 text-amber-400 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`focus:outline-none p-2 border rounded-xl ${
                theme === 'dark' ? 'text-slate-300 bg-white/5 border-white/10' : 'text-slate-700 bg-slate-100 border-slate-200'
              }`}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 border-t border-slate-200 px-4 pt-3 pb-6 space-y-2 backdrop-blur-xl shadow-lg"
          >
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  target={link.path === '/scanner' ? "_blank" : undefined}
                  rel={link.path === '/scanner' ? "noopener noreferrer" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                    isActive
                      ? 'text-[#701A1A] bg-[#701A1A]/10 border border-[#701A1A]/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#701A1A]' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}

            <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                Current Access Role: <span className="text-slate-900">{userRole.toUpperCase()}</span>
              </div>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 bg-gradient-to-r from-[#701A1A] to-[#8C1823] text-white font-bold rounded-xl text-xs tracking-wider uppercase shadow-md"
              >
                Change Role / Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
