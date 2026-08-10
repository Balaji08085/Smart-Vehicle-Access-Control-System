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
        ? 'bg-[#180305]/95 backdrop-blur-2xl border-b border-[#5C121E]/60 shadow-[0_10px_35px_rgba(0,0,0,0.8)]' 
        : 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* SVACS Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <SvacsLogo showText={true} size={40} dark={theme !== 'dark'} />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2 ml-auto mr-6">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  target={link.path === '/scanner' ? "_blank" : undefined}
                  rel={link.path === '/scanner' ? "noopener noreferrer" : undefined}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? theme === 'dark'
                        ? 'text-white bg-gradient-to-r from-red-900/60 to-orange-900/60 border border-orange-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : 'text-orange-600 bg-orange-50 border border-orange-200/80 shadow-sm'
                      : theme === 'dark'
                        ? 'text-red-200/80 hover:text-white hover:bg-white/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : theme === 'dark' ? 'text-red-300/60' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Role Status & Auth Actions */}
          <div className="hidden sm:flex items-center gap-3">
            
            {/* 🌙 Theme Toggle Button (Key Switcher) */}
            <button
              onClick={toggleTheme}
              title="Toggle Light / Dark Mode (Shortcut: Press Alt + T)"
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-[#2E080C] text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:bg-[#3D0A11]'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80 shadow-sm'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden xl:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden xl:inline">Dark Mode</span>
                </>
              )}
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-orange-500/10 text-orange-600 border border-orange-500/20 font-bold">
                Alt+T
              </span>
            </button>

            <div className={`px-3.5 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
              theme === 'dark'
                ? userRole === 'admin'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : userRole === 'superadmin'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : userRole === 'guard'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : userRole === 'admin'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                  : userRole === 'superadmin'
                  ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm'
                  : userRole === 'guard'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                  : 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-ping ${
                userRole === 'admin' ? 'bg-amber-500' : userRole === 'superadmin' ? 'bg-orange-500' : userRole === 'guard' ? 'bg-emerald-500' : 'bg-blue-500'
              }`} />
              {userRole === 'admin' ? 'Admin (Registration)' : userRole === 'superadmin' ? 'Super Admin (Approvals)' : 'Gate Security Guard'}
            </div>

            <Link
              to="/login"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200 shadow-sm'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
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
                      ? 'text-orange-600 bg-orange-50 border border-orange-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
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
                className="w-full text-center py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl text-xs tracking-wider uppercase shadow-md"
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
