import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, ScanLine, Search, ShieldCheck, XCircle, CheckCircle2, 
  AlertTriangle, Car, MapPin, Calendar, Clock, Play, Square, 
  ShieldAlert, History, Activity, SlidersHorizontal, Loader2, 
  Fingerprint, Sparkles, Volume2, Shield, AlertOctagon, UserCheck, 
  RefreshCw, Users, Trash2, RefreshCcw, Zap, RotateCcw
} from 'lucide-react';
import { useEntry, formatDateDisplay, getDaysRemaining } from '../context/EntryContext';
import MOCK_USERS from '../context/mockData';

const MOCK_QR_KEYS = Object.keys(MOCK_USERS);

// Synthetic sound generator using Web Audio API
const playAlertSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Premium ascending double chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Harsh warning alarm
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("AudioContext blocked or failed:", e);
  }
};

const QrValidation = () => {
  const { users, history, notifications, requestEntry, clearAllData } = useEntry();
  
  const [scanState, setScanState] = useState('idle'); // idle, scanning, valid, invalid
  const [cameraActive, setCameraActive] = useState(false);
  const [flashlight, setFlashlight] = useState(false);
  const [manualQr, setManualQr] = useState('');
  const [scannedUser, setScannedUser] = useState(null);
  const [errorReason, setErrorReason] = useState('');
  const [latestScanResult, setLatestScanResult] = useState(null);
  
  // Local filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const laserYRef = useRef(0);
  const laserDirRef = useRef(1);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [usingRealCamera, setUsingRealCamera] = useState(false);

  // Canvas simulation — runs when cameraActive and no real camera
  useEffect(() => {
    if (!cameraActive || usingRealCamera) {
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
      return;
    }
    let running = true;
    laserYRef.current = 0; laserDirRef.current = 1;
    const draw = () => {
      if (!running) return;
      const canvas = canvasRef.current;
      if (!canvas) { animFrameRef.current = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(59,130,246,0.08)'; ctx.lineWidth=1;
      for (let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for (let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      const bx=(W-160)/2,by=(H-160)/2,bs=160,cs=20;
      ctx.strokeStyle='rgba(59,130,246,0.9)'; ctx.lineWidth=3;
      [[bx,by,1,1],[bx+bs,by,-1,1],[bx,by+bs,1,-1],[bx+bs,by+bs,-1,-1]].forEach(([x,y,dx,dy])=>{
        ctx.beginPath();ctx.moveTo(x,y+cs*dy);ctx.lineTo(x,y);ctx.lineTo(x+cs*dx,y);ctx.stroke();
      });
      laserYRef.current += laserDirRef.current*2;
      if(laserYRef.current>=bs) laserDirRef.current=-1;
      if(laserYRef.current<=0) laserDirRef.current=1;
      const ly=by+laserYRef.current;
      const g=ctx.createLinearGradient(bx,ly,bx+bs,ly);
      g.addColorStop(0,'rgba(59,130,246,0)');g.addColorStop(0.5,'rgba(59,130,246,1)');g.addColorStop(1,'rgba(59,130,246,0)');
      ctx.strokeStyle=g;ctx.lineWidth=2.5;ctx.shadowColor='#3b82f6';ctx.shadowBlur=12;
      ctx.beginPath();ctx.moveTo(bx,ly);ctx.lineTo(bx+bs,ly);ctx.stroke();ctx.shadowBlur=0;
      ctx.fillStyle='rgba(16,185,129,0.9)';ctx.beginPath();ctx.roundRect(W-60,8,52,22,5);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 11px monospace';ctx.fillText('● SIM',W-57,24);
      ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='9px monospace';
      ctx.fillText(new Date().toLocaleTimeString(),8,H-8);
      animFrameRef.current=requestAnimationFrame(draw);
    };
    animFrameRef.current=requestAnimationFrame(draw);
    return ()=>{running=false;if(animFrameRef.current){cancelAnimationFrame(animFrameRef.current);animFrameRef.current=null;}};
  }, [cameraActive, usingRealCamera]);

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setUsingRealCamera(true);
    } catch (err) {
      console.warn('Camera permission denied, using simulation:', err.name);
      setUsingRealCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setUsingRealCamera(false);
    setCameraActive(false);
  };

  // Cleanup on unmount
  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);


  const todayValid = history.filter(h => h.result === 'APPROVED').length;
  const todayInvalid = history.filter(h => h.result === 'REJECTED').length;
  const studentsCount = history.filter(h => h.result === 'APPROVED' && h.type?.toLowerCase().includes('student')).length;
  const facultyCount = history.filter(h => h.result === 'APPROVED' && h.type?.toLowerCase().includes('faculty')).length;
  const employeesCount = history.filter(h => h.result === 'APPROVED' && (h.type?.toLowerCase().includes('staff') || h.type?.toLowerCase().includes('employee'))).length;
  const visitorsCount = history.filter(h => h.result === 'APPROVED' && h.type?.toLowerCase().includes('visitor')).length;
  const hostelCount = history.filter(h => h.result === 'APPROVED' && h.type?.toLowerCase().includes('hostel')).length;
  const expiredQRs = history.filter(h => h.reason?.toLowerCase().includes('expired')).length;
  const pendingRenewals = Object.values(users).filter(u => u.status === 'Renewal Required' || u.status === 'Expired').length;
  const blacklistedUsers = Object.values(users).filter(u => u.status === 'Blacklisted').length;



  const handleVerify = async (qrId) => {
    const trimmed = (qrId || '').trim();
    if (!trimmed || scanState === 'scanning') return;
    setScanState('scanning');
    
    // Simulate premium airport validation loading
    setTimeout(async () => {
      try {
        const result = await requestEntry(trimmed, 'Main Entrance Gate');
        
        if (!result) {
          setScanState('idle');
          return;
        }

        setLatestScanResult(result);
        setScannedUser(result.user);
        
        if (result.status === 'APPROVED') {
          setScanState('valid');
          playAlertSound('success');
        } else {
          setScanState('invalid');
          setErrorReason(result.reason || 'Unknown Error');
          playAlertSound('error');
        }
      } catch (err) {
        console.error('handleVerify error:', err);
        setScanState('idle');
      }
      
      setManualQr('');
    }, 1200);
  };


  const resetScan = () => {
    setScanState('idle');
    setScannedUser(null);
    setErrorReason('');
    setLatestScanResult(null);
  };

  // Simulate a random QR scan (for demo / no-camera environments)
  const simulateScan = () => {
    if (scanState === 'scanning') return;
    const randomKey = MOCK_QR_KEYS[Math.floor(Math.random() * MOCK_QR_KEYS.length)];
    const user = MOCK_USERS[randomKey];
    handleVerify(user.registerId);
  };

  const filteredHistory = history.filter(h => {
    const matchesSearch = 
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      h.registerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.vehicle && h.vehicle.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesFilter = filterStatus === 'All' ? true : h.result === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen pt-24 pb-12 bg-black px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100 font-sans">
      
      {/* Premium Tech Grid Ambient Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none z-0"></div>
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[180px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-6">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-950/60 p-6 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="bg-blue-500/15 p-3 rounded-2xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <Shield className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase">Smart Campus Access Control</h1>
              <p className="text-slate-400 text-xs md:text-sm font-semibold tracking-widest uppercase mt-0.5">Real-Time QR Authentication & Entry Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('Reset all session data and restore default database?')) {
                  clearAllData();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase transition-colors"
              title="Reset all localStorage data and reload mock database"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Session
            </button>
          </div>
        </div>

        {/* Active Notifications Toast — fixed top-right overlay */}
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          <AnimatePresence>
            {notifications.slice(0, 1).map(n => (
              <motion.div 
                key={n.id} 
                initial={{ opacity: 0, x: 80, y: -10 }} 
                animate={{ opacity: 1, x: 0, y: 0 }} 
                exit={{ opacity: 0, x: 80 }} 
                className={`p-3 rounded-xl border flex items-center gap-3 text-xs font-semibold backdrop-blur-md shadow-2xl ${
                  n.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' :
                  n.type === 'error' ? 'bg-red-950/90 border-red-500/40 text-red-300' :
                  'bg-amber-950/90 border-amber-500/40 text-amber-300'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="truncate">{n.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 3-Column Premium System Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column 1: Live QR Scanner Module (4/12 width) */}
          <div className="lg:col-span-4 glass-card bg-zinc-950/40 p-6 rounded-3xl border border-white/5 flex flex-col gap-4 shadow-xl relative">
            
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold text-white tracking-widest uppercase flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" /> Scanner Device
              </h3>
              <div className="flex gap-2 items-center">
                <span className={`w-2 h-2 rounded-full transition-all ${
                  cameraActive ? 'bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse' : 'bg-zinc-600'
                }`} />
                {!cameraActive ? (
                  <button onClick={startCamera} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl border border-blue-500/50 transition-all" title="Start Camera">
                    <Play className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={stopCamera} className="bg-red-600/20 text-red-400 hover:bg-red-600/30 p-2 rounded-xl border border-red-500/30 transition-all" title="Stop Camera">
                    <Square className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status LED */}
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center">
                <div className={`absolute w-14 h-14 rounded-full border-4 transition-all duration-500 ${
                  scanState === 'valid' ? 'border-emerald-500 shadow-[0_0_25px_#10b981] animate-ping' :
                  scanState === 'invalid' ? 'border-red-500 shadow-[0_0_25px_#ef4444] animate-ping' :
                  scanState === 'scanning' ? 'border-blue-500 shadow-[0_0_25px_#3b82f6] animate-pulse' :
                  cameraActive ? 'border-blue-500/30 animate-pulse' : 'border-zinc-800'
                }`} />
                <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center z-10 transition-all ${
                  scanState === 'valid' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' :
                  scanState === 'invalid' ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' :
                  scanState === 'scanning' ? 'bg-blue-500 shadow-[0_0_15px_#3b82f6]' :
                  cameraActive ? 'bg-blue-800' : 'bg-zinc-800'
                }`}>
                  {scanState === 'valid' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  {scanState === 'invalid' && <AlertOctagon className="w-5 h-5 text-white" />}
                  {scanState === 'scanning' && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                  {scanState === 'idle' && <Fingerprint className="w-5 h-5 text-slate-400" />}
                </div>
              </div>
            </div>

            {/* Camera viewport */}
            <div className={`relative bg-black rounded-2xl overflow-hidden border transition-all duration-500 h-52 ${
              scanState === 'valid' ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
              scanState === 'invalid' ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
              cameraActive ? 'border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]' : 'border-white/10'
            }`}>
              {/* Real webcam video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover absolute inset-0"
                style={{ display: usingRealCamera ? 'block' : 'none' }}
              />

              {/* Canvas simulation fallback */}
              <canvas
                ref={canvasRef}
                width={320}
                height={208}
                className="w-full h-full absolute inset-0"
                style={{ display: (cameraActive && !usingRealCamera) ? 'block' : 'none' }}
              />

              {/* QR target brackets (shown on real camera feed) */}
              {usingRealCamera && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="relative w-40 h-40">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-md" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-md" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-md" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-md" />
                    <div className="absolute inset-0 border border-blue-400/20 rounded-sm" />
                  </div>
                  {/* LIVE badge */}
                  <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-black px-2 py-1 rounded-md tracking-wider">● LIVE</div>
                </div>
              )}

              {/* Offline overlay */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-1.5">
                  <Camera className="w-10 h-10 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Feed Offline</p>
                  <p className="text-[9px] opacity-50">Press ▶ to start camera</p>
                </div>
              )}

              {/* Validating overlay */}
              {scanState === 'scanning' && (

                <div className="absolute inset-0 bg-black/85 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                  <p className="text-white font-bold tracking-widest uppercase text-sm">Validating...</p>
                </div>
              )}
            </div>

            {/* ⚡ SIMULATE QR SCAN — always visible */}
            <button
              onClick={simulateScan}
              disabled={scanState === 'scanning'}
              className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/35 active:scale-95 border border-blue-500/40 text-blue-400 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:text-blue-300"
            >
              <Zap className="w-4 h-4" /> Simulate QR Scan
            </button>

            {/* Manual Verification Form */}
            <div>
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-2 block">Security Manual Verification</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="ID or Register No..." 
                  value={manualQr}
                  onChange={(e) => setManualQr(e.target.value)}
                  className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify(manualQr)}
                />
                <button 
                  onClick={() => handleVerify(manualQr)}
                  disabled={!manualQr || scanState === 'scanning'}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 rounded-2xl font-bold transition-all shadow-lg text-sm"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Live Profile Result Pane (5/12 width) */}
          <div className="lg:col-span-5 glass-card bg-zinc-950/40 p-6 rounded-3xl border border-white/5 flex flex-col shadow-xl">
            <h3 className="text-md font-bold text-white tracking-widest uppercase mb-6 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" /> Authentication Result
            </h3>

            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {scanState === 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="text-center p-8 text-slate-500 flex flex-col items-center justify-center h-full"
                  >
                    <div className="w-20 h-20 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center mb-4">
                      <ScanLine className="w-10 h-10 opacity-30 text-blue-400" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-wider">Awaiting Scan Trigger</p>
                    <p className="text-xs opacity-60 mt-1 max-w-xs leading-relaxed">Present a secure QR Code to the camera, or enter the ID manually above for validation.</p>
                  </motion.div>
                )}

                {scanState === 'valid' && scannedUser && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Grant Header */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <div>
                          <p className="text-xs uppercase font-extrabold text-emerald-400 tracking-widest">Entry status</p>
                          <h4 className="text-lg font-black text-white tracking-wider">🟢 ACCESS GRANTED</h4>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase rounded-lg">Approved</span>
                    </div>

                    {/* Bio details card */}
                    <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                      <img src={scannedUser.photo} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border border-emerald-500/30 shadow-md" />
                      <div>
                        <h4 className="text-xl font-bold text-white leading-snug">{scannedUser.name}</h4>
                        <p className="text-emerald-400 font-mono text-xs mt-0.5">{scannedUser.registerId}</p>
                        <span className="inline-block mt-2 px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-extrabold uppercase rounded">{scannedUser.type}</span>
                      </div>
                    </div>

                    {/* Meta Fields Table */}
                    <div className="grid grid-cols-2 gap-4 text-xs bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Department</span>
                        <span className="text-white font-medium">{scannedUser.department || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Hostel Status</span>
                        <span className="text-white font-medium">{scannedUser.hostelOrDay || 'N/A'}</span>
                      </div>
                      {scannedUser.year && (
                        <div>
                          <span className="text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Academic details</span>
                          <span className="text-white font-medium">{scannedUser.year} - {scannedUser.section}</span>
                        </div>
                      )}
                      {scannedUser.designation && (
                        <div>
                          <span className="text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Designation</span>
                          <span className="text-white font-medium">{scannedUser.designation}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Contact Number</span>
                        <span className="text-white font-medium">{scannedUser.mobile}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Registration Date</span>
                        <span className="text-white font-medium">{formatDateDisplay(scannedUser.registrationDate || scannedUser.issueDate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Expiry Date</span>
                        <span className="text-emerald-400 font-medium font-bold">
                          {formatDateDisplay(scannedUser.expiryDate)} ({getDaysRemaining(scannedUser.expiryDate)} Days Left)
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-white/5 pt-3">
                        <span className="text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Security Gate Audit</span>
                        <span className="text-slate-300 font-medium">Main Entrance Gate • Guard Rajesh • {new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Authorized Vehicle */}
                    {scannedUser.vehicleDetails ? (
                      <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Registered Vehicle</p>
                          <p className="text-white font-mono font-bold text-base mt-1">{scannedUser.vehicleDetails.number}</p>
                        </div>
                        <span className="text-[10px] bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-extrabold uppercase">{scannedUser.vehicleDetails.type}</span>
                      </div>
                    ) : (
                      <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4 opacity-50" /> No vehicle registered to this authorization pass
                      </div>
                    )}

                    <button onClick={resetScan} className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-white/10 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2">
                      Clear Result
                    </button>
                  </motion.div>
                )}

                {scanState === 'invalid' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Denied Header */}
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
                        <div>
                          <p className="text-xs uppercase font-extrabold text-red-500 tracking-widest">Entry status</p>
                          <h4 className="text-lg font-black text-white tracking-wider">🔴 ACCESS DENIED</h4>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-extrabold uppercase rounded-lg">Rejected</span>
                    </div>

                    {/* Error Box */}
                    <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Critical Exception Factor</span>
                      <h4 className="text-2xl font-extrabold text-red-500 mt-1">{errorReason}</h4>
                      {errorReason === 'QR Validity Expired' ? (
                        <p className="text-slate-400 text-xs mt-2 leading-relaxed font-bold">Renew Registration immediately to restore access privileges.</p>
                      ) : (
                        <p className="text-slate-400 text-xs mt-2 leading-relaxed">The campus access pass signature has failed validation algorithms. Advise user to visit the Administration Desk for renewal or reactivation.</p>
                      )}
                    </div>

                    {scannedUser && (
                      <div className="flex flex-col gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center gap-4 opacity-50 grayscale">
                          <img src={scannedUser.photo} alt="Profile" className="w-14 h-14 rounded-xl object-cover" />
                          <div>
                            <h4 className="text-md font-bold text-white">{scannedUser.name}</h4>
                            <p className="text-slate-500 font-mono text-xs">{scannedUser.registerId}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-white/5 pt-2">
                          <div>
                            <span className="text-slate-500 font-bold uppercase">Registration Date</span>
                            <span className="text-slate-300 block">{formatDateDisplay(scannedUser.registrationDate || scannedUser.issueDate)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold uppercase">Expiry Date</span>
                            <span className="text-red-400 block font-bold">{formatDateDisplay(scannedUser.expiryDate)} (Expired)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button onClick={resetScan} className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2">
                      Dismiss Exception
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 3: Live Verification Log Side Panel (3/12 width) */}
          <div className="lg:col-span-3 glass-card bg-zinc-950/40 p-5 rounded-3xl border border-white/5 flex flex-col shadow-xl max-h-[500px] overflow-hidden">
            <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> Live Verification Log
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-xs">
                  No scan logs present
                </div>
              ) : (
                history.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                      log.result === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-500/10 hover:bg-emerald-950/30' : 'bg-red-950/20 border-red-500/10 hover:bg-red-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={log.photo} alt="Mini Profile" className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                      <div className="max-w-[120px] truncate">
                        <p className="text-white font-bold truncate">{log.name}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5 truncate">{log.type}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-mono">{log.time}</p>
                      <span className={`inline-block text-[9px] font-extrabold uppercase mt-1 px-1.5 py-0.5 rounded-md ${
                        log.result === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {log.result === 'APPROVED' ? 'VALID' : 'DENIED'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* 10-stat Grid Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
          <div className="glass-card bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:bg-zinc-950/60 transition-colors">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Approved</span>
            <div>
              <h4 className="text-2xl font-black text-white mt-1">{todayValid}</h4>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Success Scans</p>
            </div>
          </div>
          
          <div className="glass-card bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:bg-zinc-950/60 transition-colors">
            <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Denied</span>
            <div>
              <h4 className="text-2xl font-black text-white mt-1">{todayInvalid}</h4>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Failed Scans</p>
            </div>
          </div>

          <div className="glass-card bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:bg-zinc-950/60 transition-colors">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Students</span>
            <div>
              <h4 className="text-2xl font-black text-white mt-1">{studentsCount}</h4>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Entered Today</p>
            </div>
          </div>

          <div className="glass-card bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:bg-zinc-950/60 transition-colors">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Faculty</span>
            <div>
              <h4 className="text-2xl font-black text-white mt-1">{facultyCount}</h4>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Entered Today</p>
            </div>
          </div>

          <div className="glass-card bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:bg-zinc-950/60 transition-colors">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Employees</span>
            <div>
              <h4 className="text-2xl font-black text-white mt-1">{employeesCount}</h4>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Entered Today</p>
            </div>
          </div>

          <div className="glass-card bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:bg-zinc-950/60 transition-colors">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Visitors</span>
            <div>
              <h4 className="text-2xl font-black text-white mt-1">{visitorsCount}</h4>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Entered Today</p>
            </div>
          </div>

          <div className="glass-card bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:bg-zinc-950/60 transition-colors">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Hostel</span>
            <div>
              <h4 className="text-2xl font-black text-white mt-1">{hostelCount}</h4>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Entered Today</p>
            </div>
          </div>

          <div className="glass-card bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:bg-zinc-950/60 transition-colors">
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Expired IDs</span>
            <div>
              <h4 className="text-2xl font-black text-white mt-1">{expiredQRs}</h4>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Scanned Today</p>
            </div>
          </div>

          <div className="glass-card bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:bg-zinc-950/60 transition-colors">
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Renewals</span>
            <div>
              <h4 className="text-2xl font-black text-white mt-1">{pendingRenewals}</h4>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Pending Total</p>
            </div>
          </div>

          <div className="glass-card bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:bg-zinc-950/60 transition-colors">
            <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Blacklisted</span>
            <div>
              <h4 className="text-2xl font-black text-white mt-1">{blacklistedUsers}</h4>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">Database Total</p>
            </div>
          </div>
        </div>

        {/* Validation History Database Table */}
        <div className="glass-card bg-zinc-950/40 rounded-3xl border border-white/5 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><History className="w-5 h-5 text-indigo-400" /> Database Entry Audit Log</h3>
              <p className="text-slate-400 text-xs mt-1">Audit trail of all authenticated personnel matching active safety validation rules.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Filter name, ID, vehicle..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 w-full sm:w-64"
                />
              </div>
              <div className="relative">
                <SlidersHorizontal className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none w-full sm:w-auto cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="REJECTED">Rejected Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white/5 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Credential Holder</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Vehicle Route</th>
                  <th className="px-6 py-4">Security Gate</th>
                  <th className="px-6 py-4">Validation Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-600">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p className="font-semibold">No entry log records matching queries</p>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-white font-semibold">{log.date}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">{log.time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={log.photo} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                          <div>
                            <p className="text-white font-bold">{log.name}</p>
                            <p className="text-blue-400 font-mono text-[10px] mt-0.5">{log.registerId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300 font-medium">{log.type}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {log.vehicle || 'None'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 font-medium">{log.gate}</span>
                      </td>
                      <td className="px-6 py-4">
                        {log.result === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" /> ACCESS GRANTED</span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg"><XCircle className="w-3.5 h-3.5" /> ACCESS DENIED</span>
                            {log.reason && <p className="text-red-400/70 text-[10px] mt-1 font-semibold">{log.reason}</p>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QrValidation;
