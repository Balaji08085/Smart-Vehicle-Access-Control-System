import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { QrCode, Car, ShieldAlert, CheckCircle2, ArrowRight, ShieldCheck, Lock, Zap, Map, BrainCircuit } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="p-8 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-all duration-300"
  >
    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 border border-white/5">
      <Icon className="w-6 h-6 text-slate-300" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen pt-20">
      
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
        
        {/* Glow behind hero text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 mb-8">
            <span className="flex w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">System V2.0 Active</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-[1.1] mb-8">
            Enterprise-Grade <br/>
            <span className="text-gradient">Vehicle Access Security.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
            An advanced ecosystem combining encrypted QR validation, AI number plate recognition, and real-time geofencing to protect your campus infrastructure.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login/admin" className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
              Deploy System <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/scanner" className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center">
              <QrCode className="w-4 h-4" /> Try Live Scanner
            </Link>
          </div>
        </motion.div>

        {/* Hero Mockup Graphic */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mt-24 relative max-w-5xl mx-auto perspective-1000"
        >
          {/* A sleek, dark UI dashboard representation */}
          <div className="rounded-2xl md:rounded-[2rem] border border-white/10 bg-black p-2 md:p-4 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none"></div>
            
            <div className="bg-zinc-950 rounded-xl md:rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[400px]">
              
              {/* Fake Window Header */}
              <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-zinc-900/50">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                <div className="mx-auto text-xs font-medium text-slate-500 tracking-wider">SECUREGATE.LOCAL</div>
              </div>

              {/* Fake UI Content */}
              <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                
                {/* Simulated ANPR Feed */}
                <div className="col-span-1 md:col-span-2 border border-white/5 rounded-xl bg-black relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-16 border border-emerald-500/50 bg-emerald-500/10 rounded flex items-end justify-center pb-1">
                     <span className="text-emerald-400 font-mono text-xs font-bold tracking-widest bg-black px-2 py-0.5 rounded">TN-22-DX-1234</span>
                  </div>
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-xs font-medium text-slate-300">LIVE / GATE 1</span>
                  </div>
                </div>

                {/* Simulated Validation Card */}
                <div className="border border-white/5 rounded-xl bg-zinc-900 p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full"></div>
                  <div>
                    <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-1">Access Granted</h4>
                    <p className="text-slate-400 text-xs">Identity and Vehicle Verified</p>
                  </div>
                  
                  <div className="space-y-4 mt-8">
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Match Confidence</p>
                      <div className="flex items-end justify-between">
                        <span className="text-xl text-white font-medium">99.8%</span>
                        <span className="text-xs text-emerald-400">High</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-800 mt-2 rounded-full overflow-hidden">
                        <div className="w-[99.8%] h-full bg-emerald-500"></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trust Badges / Stats */}
      <div className="border-y border-white/5 bg-zinc-900/30 backdrop-blur-sm py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
            <div>
              <div className="text-3xl font-bold text-white mb-1">0.2s</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-medium">Validation Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">AES-256</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-medium">Token Encryption</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-medium">System Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">AI</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-medium">Powered Engine</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">Ultimate Innovation Built-In.</h2>
            <p className="text-slate-400 text-lg">We went beyond standard QR codes. Our platform seamlessly integrates cutting-edge technologies for unparalleled security.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={BrainCircuit}
              title="ANPR integration"
              description="Automatic Number Plate Recognition utilizing OpenCV & OCR to instantly match scanned QR codes against physical license plates."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Encrypted Dynamic QR"
              description="QR tokens are cryptographically secured. Duplicate, copied, or expired stickers are mathematically rejected at the gate."
            />
            <FeatureCard 
              icon={Map}
              title="GPS Geofencing"
              description="Scanners and mobile applications are locked to strict campus coordinates, rendering off-campus scanning attempts invalid."
            />
            <FeatureCard 
              icon={Zap}
              title="Real-Time Analytics"
              description="Monitor vehicle flow, peak hours, parking capacity, and invalid entry attempts through a powerful, responsive dashboard."
            />
            <FeatureCard 
              icon={Lock}
              title="Emergency Lockdown"
              description="A single-click global override that instantly revokes all access permissions across all campus gates during security events."
            />
            <FeatureCard 
              icon={Car}
              title="Hybrid RFID Support"
              description="Designed to work harmoniously with existing boom barriers, RFID tags, and automated gate hardware systems."
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default LandingPage;
