import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Phone, Mail, Globe, Shield, ExternalLink, Lock, ChevronRight } from 'lucide-react';
import SvacsLogo from './SvacsLogo';
import { useEntry } from '../context/EntryContext';

const Footer = () => {
  const { theme } = useEntry();
  
  return (
    <footer className="border-t border-[#701A1A]/20 dark:border-[#5C121E] bg-white dark:bg-[#120305] text-slate-900 dark:text-slate-100 relative z-10 text-xs transition-colors duration-300">
      
      {/* Upper Footer Main Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand & Overview Column (2 Span) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <SvacsLogo showText={true} size={42} dark={theme !== 'dark'} />
            </div>
            
            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed max-w-md mt-2 font-medium">
              Official Gate Security Verification & Real-Time Vehicle Access Control System for <strong className="text-slate-900 dark:text-white font-extrabold">MCC MRF Innovation Park</strong> at Madras Christian College. Powered by 2-Tier approval workflow, encrypted QR pass validation, and automatic barrier gate control.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-full font-bold shadow-2xs">
                <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-ping" /> Live Gate Terminal Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#701A1A]/10 text-[#701A1A] dark:bg-red-950/60 dark:text-red-300 border border-[#701A1A]/20 dark:border-[#701A1A] rounded-full font-bold shadow-2xs">
                <Lock className="w-3 h-3 text-[#701A1A] dark:text-red-400" /> SSL Encrypted Access
              </span>
            </div>
          </div>

          {/* Column 2: System Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#701A1A] dark:text-red-400 font-mono border-b border-[#701A1A]/20 dark:border-[#5C121E] pb-2">
              System Portals
            </h4>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              <li>
                <Link to="/dashboard" className="hover:text-[#701A1A] dark:hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#701A1A] dark:text-red-400" /> Live Security Dashboard
                </Link>
              </li>
              <li>
                <Link to="/superadmin/create" className="hover:text-[#701A1A] dark:hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#701A1A] dark:text-red-400" /> Register Vehicle Permit
                </Link>
              </li>
              <li>
                <Link to="/admin/approval" className="hover:text-[#701A1A] dark:hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#701A1A] dark:text-red-400" /> Approvals Queue (Tier 2)
                </Link>
              </li>
              <li>
                <Link to="/scanner" target="_blank" rel="noopener noreferrer" className="hover:text-[#701A1A] dark:hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#701A1A] dark:text-red-400" /> Gate QR Scanner Terminal
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-[#701A1A] dark:hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#701A1A] dark:text-red-400" /> Live Gate Scan Logs
                </Link>
              </li>
              <li>
                <Link to="/reports" className="hover:text-[#701A1A] dark:hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#701A1A] dark:text-red-400" /> Gate Audit Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Security Terminals */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#701A1A] dark:text-red-400 font-mono border-b border-[#701A1A]/20 dark:border-[#5C121E] pb-2">
              Active Security Gates
            </h4>
            <ul className="space-y-2.5 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#701A1A] dark:text-emerald-400" /> Gate 1 — Main Entrance</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-1.5 py-0.5 rounded font-extrabold">ONLINE</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#701A1A] dark:text-emerald-400" /> Gate 2 — North Complex</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-1.5 py-0.5 rounded font-extrabold">ONLINE</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#701A1A] dark:text-emerald-400" /> Gate 3 — South Research</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-1.5 py-0.5 rounded font-extrabold">ONLINE</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#701A1A] dark:text-emerald-400" /> Gate 4 — Innovation Hub</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-1.5 py-0.5 rounded font-extrabold">ONLINE</span>
              </li>
            </ul>
          </div>

          {/* Column 4: MCC Official Campus Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#701A1A] dark:text-red-400 font-mono border-b border-[#701A1A]/20 dark:border-[#5C121E] pb-2">
              Campus Contact & Location
            </h4>
            <div className="space-y-2.5 text-slate-700 dark:text-slate-300 text-xs font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#701A1A] dark:text-red-400 shrink-0 mt-0.5" />
                <span className="text-slate-800 dark:text-slate-200">MCC MRF Innovation Park, Madras Christian College, Tambaram, Chennai - 600059</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#701A1A] dark:text-red-400 shrink-0" />
                <span>Security Control: <strong>+91 44 2239 0675</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#701A1A] dark:text-red-400 shrink-0" />
                <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">security@mrf-innovationpark.edu</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Globe className="w-3.5 h-3.5 text-[#701A1A] dark:text-red-400 shrink-0" />
                <a href="https://mcc.edu.in" target="_blank" rel="noopener noreferrer" className="text-[#701A1A] dark:text-red-300 hover:underline font-bold flex items-center gap-1">
                  www.mcc.edu.in <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar — Copyright & Legal */}
      <div className="border-t border-slate-200 dark:border-slate-900 bg-slate-100 dark:bg-black py-5 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#701A1A] dark:text-red-400" />
            <span>&copy; {new Date().getFullYear()} <strong className="text-slate-900 dark:text-white font-bold">MCC MRF Innovation Park — Madras Christian College</strong>. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-semibold">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Security Guidelines</span>
            <span>•</span>
            <span>Gate Access Rules</span>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
