import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan, CheckCircle2, XCircle, Camera, Zap, AlertTriangle, RefreshCw,
  Upload, Check, X, FlipHorizontal, ImagePlus, QrCode, ShieldCheck
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEntry } from '../context/EntryContext';

/* ───────────────────────────────────────────────────────────────
   Synthesized Audio Feedback (Web Audio API)
   ─────────────────────────────────────────────────────────────── */
const playAudioFeedback = (status) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (status === 'GRANTED') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    console.warn('Audio feedback unavailable:', e);
  }
};
/* ───────────────────────────────────────────────────────────────
   Scanner Component
   ─────────────────────────────────────────────────────────────── */
const Scanner = () => {
  const { verifyQrCode } = useEntry();

  /* UI state */
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [selectedGate, setSelectedGate] = useState('Main Entrance Gate');
  const [mode, setMode] = useState('camera'); // 'camera' | 'upload'
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadError, setUploadError] = useState('');

    /* Camera state & Refs */
  const html5QrCodeRef = useRef(null);
  const canvasRef = useRef(null);
  const isMountedRef = useRef(true);
  const startingCamRef = useRef(false);

  const [camReady, setCamReady] = useState(false);
  const [camErr, setCamErr] = useState('');
  const [camLoading, setCamLoading] = useState(false);
  const [front, setFront] = useState(false);

  const triggerRef = useRef(null);

  /* Lifecycle Guard */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopCam();
    };
  }, []); // eslint-disable-line

  /* ──── STOP CAMERA ───────────────────────────────────────────── */
  const stopCam = useCallback(() => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().then(() => {
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.clear();
            html5QrCodeRef.current = null;
          }
        }).catch(() => {
          html5QrCodeRef.current = null;
        });
      } catch (e) {
        html5QrCodeRef.current = null;
      }
    }
    if (isMountedRef.current) setCamReady(false);
  }, []);

  /* ──── SCAN TRIGGER & VERIFICATION WORKFLOW ──────────────────── */
  useEffect(() => {
    triggerRef.current = async (query) => {
      if (scanning) return;
      setScanning(true);
      stopCam();
      await new Promise(r => setTimeout(r, 150));

      const res = await verifyQrCode(query, selectedGate);
      playAudioFeedback(res?.status);
      if (isMountedRef.current) {
        setResult(res);
        setScanning(false);
      }
    };
  }, [scanning, selectedGate, verifyQrCode, stopCam]);

  /* ──── START CAMERA ──────────────────────────────────────────── */
  const startCam = useCallback(async (useFront = false) => {
    if (startingCamRef.current) return;
    startingCamRef.current = true;

    stopCam();
    if (isMountedRef.current) {
      setCamLoading(true);
      setCamErr('');
    }

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;
      
      const config = { 
        fps: 20, // Increase frame rate for faster detection
        // Remove strict qrbox to allow scanning anywhere in the frame
        // Use all formats or specifically QR_CODE
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
      };
      
      const facingMode = useFront ? "user" : { facingMode: "environment" };

      await html5QrCode.start(
        facingMode,
        config,
        (decodedText) => {
          if (triggerRef.current) triggerRef.current(decodedText.trim());
        },
        () => {} // ignore parsing errors
      );
      
      startingCamRef.current = false;
      if (isMountedRef.current) {
        setCamLoading(false);
        setCamReady(true);
      }
    } catch (err) {
      startingCamRef.current = false;
      if (isMountedRef.current) {
        setCamLoading(false);
        if (err?.name === "NotAllowedError" || err?.message?.includes("Permission")) {
          setCamErr('Camera permission denied. Click the lock icon in your address bar and select "Allow".');
        } else {
          setCamErr(err?.message || "Camera access error. Use Upload QR tab instead.");
        }
        html5QrCodeRef.current = null;
      }
    }
  }, [stopCam]);

  /* ──── MODE & STATE LIFECYCLE ────────────────────────────────── */
  useEffect(() => {
    let timeoutId;
    if (mode === 'camera' && !result && !scanning) {
      timeoutId = setTimeout(() => {
        startCam(front);
      }, 50);
    } else {
      stopCam();
    }
    return () => clearTimeout(timeoutId);
  }, [mode, result, scanning, front, startCam, stopCam]);

  const switchCam = () => {
    setFront(!front);
  };

  /* ──── FILE UPLOAD SCANNING ──────────────────────────────────── */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadPreview(null);

    const url = URL.createObjectURL(file);
    setUploadPreview(url);

    Html5Qrcode.scanFile(file, true)
      .then(decodedText => {
        triggerRef.current?.(decodedText.trim());
      })
      .catch(err => {
        setUploadError('No QR code detected in image. Ensure the image is clear and well-lit.');
      });
      
    e.target.value = '';
  };

  /* ──── MANUAL INPUT ──────────────────────────────────────────── */
  const handleManual = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    triggerRef.current?.(manualInput.trim());
  };

  /* ──── RESET SCANNER ─────────────────────────────────────────── */
  const reset = () => {
    setResult(null);
    setManualInput('');
    setUploadPreview(null);
    setUploadError('');
  };

  const samples = [
    { label: 'Valid Student Bike', code: 'TN-38-AB-1234', color: 'emerald' },
    { label: 'Valid Faculty Car', code: 'TN-38-XY-9999', color: 'emerald' },
    { label: 'Expired Sticker', code: 'TN-38-EXP-2025', color: 'amber' },
    { label: 'Blacklisted Vehicle', code: 'TN-38-ZZZ-999', color: 'red' },
    { label: 'Unregistered Vehicle', code: 'TN-99-UNKNOWN', color: 'slate' },
  ];

  /* ═══════════════════════════════════════════════════════════════
     VERIFICATION OVERLAY: ACCESS GRANTED
     ═══════════════════════════════════════════════════════════════ */
  if (result?.status === 'GRANTED') {
    return (
      <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 bg-[#062013] flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="absolute inset-0 bg-radial from-emerald-600/40 via-transparent to-transparent animate-pulse pointer-events-none" />
        <div className="max-w-xl w-full relative z-10 flex flex-col items-center text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#16A34A] flex items-center justify-center border-4 border-emerald-300 shadow-[0_0_90px_rgba(22,163,74,0.9)] mb-6">
            <Check className="w-20 h-20 md:w-24 md:h-24 text-white stroke-[4]" />
          </motion.div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-2">✅ VERIFIED</h1>
          <p className="text-emerald-300 font-extrabold text-sm tracking-widest uppercase mb-6 bg-emerald-950/90 px-6 py-2 rounded-full border-2 border-emerald-400">
            ACCESS ALLOWED
          </p>

          <div className="w-full bg-slate-900/90 p-6 rounded-3xl border-2 border-[#16A34A] shadow-[0_0_60px_rgba(22,163,74,0.5)] text-left space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {[
                ['Staff Name', result.ownerName, 'text-white'],
                ['Employee ID', result.registerId, 'text-emerald-300 font-mono'],
                ['Department', result.department, 'text-slate-200'],
                ['Vehicle Number', result.vehicleNumber, 'text-white font-mono'],
                ['Vehicle Type', result.vehicleType, 'text-slate-200'],
                ['Issue Date', result.issueDate, 'text-slate-200'],
                ['Expiry Date', result.expiryDate, 'text-emerald-400'],
              ].map(([l, v, c]) => (
                <div key={l}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{l}</span>
                  <span className={`text-sm font-bold block ${c}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={reset} className="w-full py-4 bg-[#16A34A] hover:bg-emerald-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(22,163,74,0.6)] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]">
            <Scan className="w-5 h-5" /> Scan Next Vehicle
          </button>
        </div>
      </motion.div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     VERIFICATION OVERLAY: ACCESS DENIED
     ═══════════════════════════════════════════════════════════════ */
  if (result?.status === 'DENIED') {
    return (
      <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 bg-[#200606] flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="absolute inset-0 bg-radial from-red-600/40 via-transparent to-transparent animate-pulse pointer-events-none" />
        <div className="max-w-xl w-full relative z-10 flex flex-col items-center text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#DC2626] flex items-center justify-center border-4 border-red-300 shadow-[0_0_90px_rgba(220,38,38,0.9)] mb-6">
            <X className="w-20 h-20 md:w-24 md:h-24 text-white stroke-[4]" />
          </motion.div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-2">
            {result.reason?.includes('Expired') ? '❌ EXPIRED QR' : 
             result.reason?.includes('Blocked') || result.reason?.includes('Blacklisted') ? '❌ BLOCKED' : 
             '❌ INVALID QR'}
          </h1>
          <p className="text-red-300 font-extrabold text-sm tracking-widest uppercase mb-6 bg-red-950/90 px-6 py-2 rounded-full border-2 border-red-400">
            ACCESS DENIED
          </p>

          <div className="w-full bg-slate-900/90 p-6 rounded-3xl border-2 border-[#DC2626] shadow-[0_0_60px_rgba(220,38,38,0.6)] text-left space-y-4 mb-8">
            <div className="p-4 bg-red-950/50 border border-red-500/50 rounded-2xl text-center">
              <span className="text-xl font-black text-white uppercase tracking-wider">
                {result.reason === 'QR Code Not Registered' ? 'QR Expired / QR Not Found' : result.reason}
              </span>
            </div>
          </div>

          <button onClick={reset} className="w-full py-4 bg-[#DC2626] hover:bg-red-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(220,38,38,0.6)] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]">
            <RefreshCw className="w-5 h-5" /> Scan Again
          </button>
        </div>
      </motion.div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     MAIN TERMINAL VIEW
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#080C16] flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-xl w-full space-y-5">

        {/* ─── Header Terminal Control ──────────────────────────── */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" /> QR Scanner Terminal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-Time Vehicle Access Validation</p>
          </div>
          <select value={selectedGate} onChange={e => setSelectedGate(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500">
            <option value="Main Entrance Gate">Main Gate</option>
            <option value="North Gate">North Gate</option>
            <option value="South Gate">South Gate</option>
            <option value="Hostel Gate">Hostel Gate</option>
          </select>
        </div>

        {/* ─── Mode Selector Toggle ─────────────────────────────── */}
        <div className="flex gap-2">
          <button onClick={() => setMode('camera')}
            className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${mode === 'camera'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/60 text-slate-400 border-white/10 hover:bg-slate-800'
              }`}>
            <Camera className="w-4 h-4" /> Live Camera
          </button>
          <button onClick={() => setMode('upload')}
            className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${mode === 'upload'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'bg-slate-900/60 text-slate-400 border-white/10 hover:bg-slate-800'
              }`}>
            <ImagePlus className="w-4 h-4" /> Upload QR
          </button>
        </div>

        {/* ─── Scanner Content Container ────────────────────────── */}
        <AnimatePresence mode="wait">
          {mode === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass-card rounded-3xl border border-white/10 bg-slate-950 overflow-hidden shadow-2xl">
              <div className="relative w-full bg-slate-950 overflow-hidden rounded-3xl" style={{ aspectRatio: '4/3', maxHeight: '340px' }}>

                {/* Html5Qrcode Target */}
                <div id="qr-reader" className={`absolute inset-0 w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full [&>video]:rounded-3xl transition-opacity duration-300 ${camReady ? 'opacity-100' : 'opacity-0'} ${front ? '[&>video]:scale-x-[-1]' : ''}`} />

                {/* Loading / Camera Error Overlay */}
                {(!camReady || camLoading || camErr) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 gap-4 p-5 z-20">
                    {camLoading ? (
                      <>
                        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-cyan-400 text-sm font-bold">Activating Camera Feed...</p>
                        <div className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-center">
                          <p className="text-slate-300 text-xs">
                            Click <strong className="text-amber-400">"Allow"</strong> if browser asks for camera access.
                          </p>
                        </div>
                      </>
                    ) : camErr ? (
                      <>
                        <Camera className="w-12 h-12 text-red-400 opacity-80" />
                        <p className="text-red-300 text-xs font-semibold text-center max-w-xs leading-relaxed">{camErr}</p>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => startCam(front)}
                            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Retry Camera
                          </button>
                          <button onClick={() => setMode('upload')}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Upload QR Instead
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}

                {/* Reticle Scanner Target Line Overlay */}
                {camReady && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="relative w-64 h-64 border-2 border-emerald-500/40 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />
                      <div className="absolute inset-x-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Camera Flip Toggle */}
                <div className="absolute top-3 right-3 z-30">
                  <button onClick={switchCam} className="px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-800 shadow-lg transition-all active:scale-95">
                    <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                    {front ? 'Front Cam' : 'Rear Cam'}
                  </button>
                </div>

                {/* Status Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-md px-4 py-2.5 flex items-center justify-between z-20 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${camReady ? 'bg-emerald-400 animate-pulse' : camLoading ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-xs font-mono text-slate-300">
                      {camLoading ? 'Starting camera...' : camReady ? 'Auto-scanning for vehicle QR pass...' : 'Camera inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> REAL-TIME VALIDATION
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {mode === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass-card rounded-3xl border border-white/10 bg-slate-950 overflow-hidden shadow-2xl">
              <div className="p-8 flex flex-col items-center justify-center text-center gap-4" style={{ minHeight: '280px' }}>

                {uploadPreview ? (
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-lg">
                    <img src={uploadPreview} alt="QR Preview" className="w-full h-full object-contain bg-white" />
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-dashed border-amber-500/40 flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-base">Upload QR Code Image</p>
                      <p className="text-slate-400 text-xs mt-1">Select a QR pass image or photo from device gallery</p>
                    </div>
                  </>
                )}

                {uploadError && (
                  <div className="px-4 py-2 bg-red-950/60 border border-red-500/50 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-red-300 text-xs font-semibold">{uploadError}</span>
                  </div>
                )}

                <label className="cursor-pointer px-8 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                  <Upload className="w-5 h-5" />
                  {uploadPreview ? 'Select Another Image' : 'Choose QR Image'}
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>

                <p className="text-slate-500 text-[10px]">Supports PNG, JPG, WebP formats</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Verification Progress Bar ────────────────────────── */}
        {scanning && (
          <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-emerald-300 text-sm font-bold">Verifying Vehicle QR Credentials...</span>
          </div>
        )}

        {/* ─── Quick Test Simulation ─────────────────────────────── */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">⚡ Quick Test — Tap to Test Verification</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {samples.map(s => (
              <button key={s.code} onClick={() => triggerRef.current?.(s.code)} disabled={scanning}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] ${s.color === 'emerald' ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40' :
                    s.color === 'amber' ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/40' :
                      s.color === 'red' ? 'bg-red-950/30 border-red-500/40 text-red-300 hover:bg-red-900/40' :
                        'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}>
                <div>
                  <span className="text-xs font-bold block">{s.label}</span>
                  <span className="text-[10px] font-mono opacity-70 block">{s.code}</span>
                </div>
                <Zap className="w-4 h-4 shrink-0 opacity-80" />
              </button>
            ))}
          </div>
        </div>

        {/* ─── Manual Text / Plate Input ────────────────────────── */}
        <form onSubmit={handleManual} className="glass-card p-4 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex gap-2">
          <input type="text" value={manualInput} onChange={e => setManualInput(e.target.value)}
            placeholder="Enter Vehicle Plate or QR Code string..."
            className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-amber-500" />
          <button type="submit" disabled={scanning || !manualInput.trim()}
            className="px-5 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shrink-0">
            {scanning ? 'Verifying...' : 'Verify'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Scanner;
