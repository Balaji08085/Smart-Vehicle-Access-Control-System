import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Phone, Mail, Globe, Shield, ExternalLink, Lock, ChevronRight } from 'lucide-react';
import SvacsLogo from './SvacsLogo';

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-[#5C121E] bg-slate-950 text-white relative z-10 text-xs transition-colors duration-300">
      
      {/* Upper Footer Main Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand & Overview Column (2 Span) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <SvacsLogo showText={true} size={42} dark={false} />
            </div>
            
            <p className="text-slate-300 text-xs leading-relaxed max-w-md mt-2 font-medium">
              Official Gate Security Verification & Real-Time Vehicle Access Control System for <strong>MCC MRF Innovation Park</strong> at Madras Christian College. Powered by 2-Tier approval workflow, encrypted QR pass validation, and automatic barrier gate control.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Live Gate Terminal Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-300 border border-red-500/30 rounded-full font-bold">
                <Lock className="w-3 h-3 text-red-400" /> SSL Encrypted Access
              </span>
            </div>
          </div>

          {/* Column 2: System Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-red-400 font-mono border-b border-slate-800 pb-2">
              System Portals
            </h4>
            <ul className="space-y-2 text-slate-300 text-xs">
              <li>
                <Link to="/dashboard" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-red-500" /> Live Security Dashboard
                </Link>
              </li>
              <li>
                <Link to="/superadmin/create" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-red-500" /> Register Vehicle Permit
                </Link>
              </li>
              <li>
                <Link to="/admin/approval" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-red-500" /> Approvals Queue (Tier 2)
                </Link>
              </li>
              <li>
                <Link to="/scanner" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-red-500" /> Gate QR Scanner Terminal
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-red-500" /> Live Gate Scan Logs
                </Link>
              </li>
              <li>
                <Link to="/reports" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-red-500" /> Gate Audit Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Security Terminals */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-red-400 font-mono border-b border-slate-800 pb-2">
              Active Security Gates
            </h4>
            <ul className="space-y-2.5 text-slate-300 text-xs">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Gate 1 — Main Entrance</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">ONLINE</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Gate 2 — North Complex</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">ONLINE</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Gate 3 — South Research</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">ONLINE</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Gate 4 — Innovation Hub</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">ONLINE</span>
              </li>
            </ul>
          </div>

          {/* Column 4: MCC Official Campus Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-red-400 font-mono border-b border-slate-800 pb-2">
              Campus Contact & Location
            </h4>
            <div className="space-y-2.5 text-slate-300 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>MCC MRF Innovation Park, Madras Christian College, Tambaram, Chennai - 600059</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>Security Control: +91 44 2239 0675</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="font-mono text-[11px]">security@mrf-innovationpark.edu</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Globe className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <a href="https://mcc.edu.in" target="_blank" rel="noopener noreferrer" className="hover:text-white underline flex items-center gap-1">
                  www.mcc.edu.in <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar — Copyright & Legal */}
      <div className="border-t border-slate-900 bg-black py-5 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            <span>&copy; {new Date().getFullYear()} <strong>MCC MRF Innovation Park — Madras Christian College</strong>. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
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
