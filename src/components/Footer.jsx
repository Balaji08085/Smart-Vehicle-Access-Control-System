import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Phone, Mail, Globe, Shield, ExternalLink, Lock, ChevronRight } from 'lucide-react';
import SvacsLogo from './SvacsLogo';

const Footer = () => {
  return (
    <footer className="bg-[#701A1A] text-white relative z-10 text-xs transition-colors duration-300">
      
      {/* Upper Footer Main Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand & Overview Column (2 Span) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <SvacsLogo showText={true} size={42} variant="footer" />
            </div>
            
            <p className="text-white/90 text-xs leading-relaxed max-w-md mt-2 font-medium">
              Official Gate Security Verification & Real-Time Vehicle Access Control System for <strong className="text-white font-extrabold">MCC MRF Innovation Park</strong> at Madras Christian College. Powered by 2-Tier approval workflow, encrypted QR pass validation, and automatic barrier gate control.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white border border-white/20 rounded-full font-bold shadow-2xs">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Live Gate Terminal Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white border border-white/20 rounded-full font-bold shadow-2xs">
                <Lock className="w-3 h-3 text-white" /> SSL Encrypted Access
              </span>
            </div>
          </div>

          {/* Column 2: System Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono border-b border-white/20 pb-2">
              System Portals
            </h4>
            <ul className="space-y-2 text-white/90 text-xs font-semibold">
              <li>
                <Link to="/dashboard" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-white/80" /> Live Security Dashboard
                </Link>
              </li>
              <li>
                <Link to="/superadmin/create" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-white/80" /> Register Vehicle Permit
                </Link>
              </li>
              <li>
                <Link to="/admin/approval" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-white/80" /> Approvals Queue (Tier 2)
                </Link>
              </li>
              <li>
                <Link to="/scanner" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-white/80" /> Gate QR Scanner Terminal
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-white/80" /> Live Gate Scan Logs
                </Link>
              </li>
              <li>
                <Link to="/reports" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-white/80" /> Gate Audit Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Security Terminals */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono border-b border-white/20 pb-2">
              Active Security Gates
            </h4>
            <ul className="space-y-2.5 text-white/90 text-xs font-semibold">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-white/80" /> Gate 1 — Main Entrance</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-extrabold">ONLINE</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-white/80" /> Gate 2 — North Complex</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-extrabold">ONLINE</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-white/80" /> Gate 3 — South Research</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-extrabold">ONLINE</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-white/80" /> Gate 4 — Innovation Hub</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-extrabold">ONLINE</span>
              </li>
            </ul>
          </div>

          {/* Column 4: MCC Official Campus Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono border-b border-white/20 pb-2">
              Campus Contact & Location
            </h4>
            <div className="space-y-2.5 text-white/90 text-xs font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span className="text-white">MCC MRF Innovation Park, Madras Christian College, Tambaram, Chennai - 600059</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Security Control: <strong>+91 44 2239 0675</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="font-mono text-[11px] text-white">security@mrf-innovationpark.edu</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Globe className="w-3.5 h-3.5 text-white shrink-0" />
                <a href="https://mcc.edu.in" target="_blank" rel="noopener noreferrer" className="text-white hover:underline font-bold flex items-center gap-1">
                  www.mcc.edu.in <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar — Copyright & Legal */}
      <div className="border-t border-black/20 bg-[#521212] py-5 text-[11px] text-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>&copy; {new Date().getFullYear()} <strong className="text-white font-bold">MCC MRF Innovation Park — Madras Christian College</strong>. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-white/80 font-mono text-[10px] font-semibold">
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
