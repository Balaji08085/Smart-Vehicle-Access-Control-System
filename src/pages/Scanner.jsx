import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan, CheckCircle2, XCircle, Camera, Zap, AlertTriangle, RefreshCw,
  Upload, Check, X, FlipHorizontal, ImagePlus, QrCode
} from 'lucide-react';
import jsQR from 'jsqr';
import { useEntry } from '../context/EntryContext';

/* ───────────────────────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────────────────────── */
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const getMedia = (constraints, ms = 5000) =>
  Promise.race([
    navigator.mediaDevices.getUserMedia(constraints),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);

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
  const [mode, setMode] = useState('upload'); // 'upload' | 'camera'
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadError, setUploadError] = useState('');

  /* Camera state */
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanLoopRef = useRef(null);
  const [camReady, setCamReady] = useState(false);
  const [camErr, setCamErr] = useState('');
  const [camLoading, setCamLoading] = useState(false);
  const [front, setFront] = useState(false);

  const triggerRef = useRef(null);

  /* ──── SCAN TRIGGER ──────────────────────────────────────────── */
  useEffect(() => {
    triggerRef.current = async (query) => {
      if (scanning) return;
      setScanning(true);
      stopCam();
      await new Promise(r => setTimeout(r, 200));
      const res = await verifyQrCode(query, selectedGate);
      setResult(res);
      setScanning(false);
    };
  }, [scanning, selectedGate, verifyQrCode]);

  /* ──── CAMERA: stop ──────────────────────────────────────────── */
  const stopCam = useCallback(() => {
    if (scanLoopRef.current) { cancelAnimationFrame(scanLoopRef.current); scanLoopRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamReady(false);
  }, []);

  /* ──── CAMERA: scan loop ─────────────────────────────────────── */
  const runLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const tick = () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      if (videoRef.current.readyState < 2) { scanLoopRef.current = requestAnimationFrame(tick); return; }

      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });

      if (code?.data?.trim() && triggerRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
        scanLoopRef.current = null;
        triggerRef.current(code.data.trim());
        return;
      }
      scanLoopRef.current = requestAnimationFrame(tick);
    };
    scanLoopRef.current = requestAnimationFrame(tick);
  }, []);

  /* ──── CAMERA: start ─────────────────────────────────────────── */
  const startCam = useCallback(async (useFront = false) => {
    stopCam();
    setCamLoading(true);
    setCamErr('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamLoading(false);
      setCamErr('Camera API unavailable. Use HTTPS or localhost.');
      return;
    }

    const constraints = [];
    if (isMobile()) {
      const fm = useFront ? 'user' : 'environment';
      constraints.push({ video: { facingMode: fm, width: { ideal: 1280 }, height: { ideal: 720 } } });
      constraints.push({ video: { facingMode: fm } });
    }
    constraints.push({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
    constraints.push({ video: true });

    let stream = null, lastErr = null;
    for (const c of constraints) {
      try {
        stream = await getMedia(c, 5000);
        break;
      } catch (e) { lastErr = e; }
    }

    if (!stream) {
      setCamLoading(false);
      if (lastErr?.name === 'NotAllowedError') setCamErr('Camera permission denied. Allow camera in browser settings.');
      else if (lastErr?.name === 'NotFoundError') setCamErr('No camera found. Use Upload QR instead.');
      else setCamErr('Camera unavailable. Use Upload QR to scan.');
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) { stream.getTracks().forEach(t => t.stop()); setCamLoading(false); return; }

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    const play = () => video.play().then(() => {
      setCamLoading(false);
      setCamReady(true);
      runLoop();
    }).catch(() => {
      setCamLoading(false);
      setCamErr('Video play blocked. Tap the screen to retry.');
    });

    if (video.readyState >= 1) play();
    else {
      video.addEventListener('loadedmetadata', play, { once: true });
      setTimeout(() => { if (!camReady) play(); }, 3000);
    }
  }, [stopCam, runLoop, camReady]);

  /* ──── MODE SWITCH ───────────────────────────────────────────── */
  useEffect(() => {
    if (mode === 'camera' && !result) startCam(front);
    else stopCam();
    return () => stopCam();
  }, [mode]); // eslint-disable-line

  useEffect(() => {
    if (result === null && !scanning && mode === 'camera') startCam(front);
  }, [result]); // eslint-disable-line

  const switchCam = () => { const f = !front; setFront(f); startCam(f); };

  /* ──── FILE UPLOAD (PRIMARY METHOD) ──────────────────────────── */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadPreview(null);

    const url = URL.createObjectURL(file);
    setUploadPreview(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Try multiple sizes for better detection
      const tryDecode = (w, h) => {
        const sc = document.createElement('canvas');
        sc.width = w; sc.height = h;
        const sctx = sc.getContext('2d');
        sctx.drawImage(img, 0, 0, w, h);
        const data = sctx.getImageData(0, 0, w, h);
        return jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' });
      };

      // Try original size first, then scaled versions
      let code = tryDecode(img.width, img.height);
      if (!code && (img.width > 800 || img.height > 800)) {
        code = tryDecode(800, Math.round(800 * img.height / img.width));
      }
      if (!code) {
        code = tryDecode(400, Math.round(400 * img.height / img.width));
      }

      if (code?.data?.trim()) {
        if (triggerRef.current) triggerRef.current(code.data.trim());
      } else {
        setUploadError('No QR code detected. Make sure the image is clear and well-lit.');
      }
    };
    img.onerror = () => setUploadError('Failed to load image.');
    e.target.value = '';
  };

  /* ──── MANUAL ────────────────────────────────────────────────── */
  const handleManual = (e) => {
    e.preventDefault();
    if (!manualInput.trim() || !triggerRef.current) return;
    triggerRef.current(manualInput.trim());
  };

  /* ──── RESET ─────────────────────────────────────────────────── */
  const reset = () => { setResult(null); setManualInput(''); setUploadPreview(null); setUploadError(''); };

  const samples = [
    { label: 'Valid Student Bike', code: 'TN-38-AB-1234', color: 'emerald' },
    { label: 'Valid Faculty Car', code: 'TN-38-XY-9999', color: 'emerald' },
    { label: 'Expired Sticker', code: 'TN-38-EXP-2025', color: 'amber' },
    { label: 'Blacklisted Vehicle', code: 'TN-38-ZZZ-999', color: 'red' },
    { label: 'Unregistered Vehicle', code: 'TN-99-UNKNOWN', color: 'slate' },
  ];

  /* ═══════════════════════════════════════════════════════════════
     RESULT: ACCESS GRANTED
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
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-2">ACCESS GRANTED</h1>
          <p className="text-emerald-300 font-extrabold text-sm tracking-widest uppercase mb-6 bg-emerald-950/90 px-6 py-2 rounded-full border-2 border-emerald-400">
            ✓ VEHICLE ALLOWED TO ENTER CAMPUS
          </p>
          <div className="w-full bg-slate-900/90 p-6 rounded-3xl border-2 border-[#16A34A] shadow-[0_0_60px_rgba(22,163,74,0.5)] text-left space-y-4 mb-8">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Vehicle Plate Number</span>
                <span className="text-2xl md:text-3xl font-black text-white font-mono tracking-wider">{result.vehicleNumber}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#16A34A] text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> APPROVED
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {[['Owner Name', result.ownerName, 'text-white'], ['Student / Staff ID', result.registerId, 'text-emerald-300 font-mono'],
                ['Department', result.department, 'text-slate-200'], ['Vehicle Type', result.vehicleType, 'text-slate-200'],
                ['Sticker Expiry', result.expiryDate, 'text-emerald-400'], ['Gate Entry Time', `${result.gateEntryTime} (${result.gate})`, 'text-white font-mono'],
              ].map(([l, v, c]) => <div key={l}><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{l}</span><span className={`text-sm font-bold block ${c}`}>{v}</span></div>)}
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
     RESULT: ACCESS DENIED
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
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-2">ACCESS DENIED</h1>
          <p className="text-red-300 font-extrabold text-sm tracking-widest uppercase mb-6 bg-red-950/90 px-6 py-2 rounded-full border-2 border-red-400">
            ✕ VEHICLE NOT ALLOWED (STOP ENTRY)
          </p>
          <div className="w-full bg-slate-900/90 p-6 rounded-3xl border-2 border-[#DC2626] shadow-[0_0_60px_rgba(220,38,38,0.6)] text-left space-y-4 mb-8">
            <div className="flex items-center justify-between border-b border-red-500/30 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-red-400 tracking-wider block">Vehicle Plate Number</span>
                <span className="text-2xl md:text-3xl font-black text-white font-mono tracking-wider">{result.vehicleNumber}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#DC2626] text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> REJECTED
              </div>
            </div>
            <div className="p-4 bg-red-950/50 border border-red-500/50 rounded-2xl space-y-2">
              <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Denial Reason:</span>
              <p className="text-lg font-black text-white pl-2">• {result.reason}</p>
            </div>
            {result.vehicle && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[['Owner Name', result.ownerName, 'text-white'], ['Student / Staff ID', result.registerId, 'text-slate-300 font-mono'],
                  ['Sticker Expiry', result.expiryDate, 'text-red-400'], ['Attempt Time', result.gateEntryTime, 'text-white font-mono'],
                ].map(([l, v, c]) => <div key={l}><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{l}</span><span className={`text-sm font-bold block ${c}`}>{v}</span></div>)}
              </div>
            )}
          </div>
          <button onClick={reset} className="w-full py-4 bg-[#DC2626] hover:bg-red-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(220,38,38,0.6)] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]">
            <RefreshCw className="w-5 h-5" /> Scan Again
          </button>
        </div>
      </motion.div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     MAIN SCANNER VIEW
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#080C16] flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-xl w-full space-y-5">

        {/* ─── Header ──────────────────────────────────────────── */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" /> QR Scanner Terminal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Gate Security Verification</p>
          </div>
          <select value={selectedGate} onChange={e => setSelectedGate(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none">
            <option value="Main Entrance Gate">Main Gate</option>
            <option value="North Gate">North Gate</option>
            <option value="South Gate">South Gate</option>
            <option value="Hostel Gate">Hostel Gate</option>
          </select>
        </div>

        {/* ─── Mode Toggle ─────────────────────────────────────── */}
        <div className="flex gap-2">
          <button onClick={() => setMode('upload')}
            className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
              mode === 'upload'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'bg-slate-900/60 text-slate-400 border-white/10 hover:bg-slate-800'
            }`}>
            <ImagePlus className="w-4 h-4" /> Upload QR
          </button>
          <button onClick={() => setMode('camera')}
            className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
              mode === 'camera'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/60 text-slate-400 border-white/10 hover:bg-slate-800'
            }`}>
            <Camera className="w-4 h-4" /> Live Camera
          </button>
        </div>

        {/* ─── Upload QR Mode ──────────────────────────────────── */}
        <AnimatePresence mode="wait">
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
                      <p className="text-slate-400 text-xs mt-1">Take a photo of the vehicle QR pass or choose from gallery</p>
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
                  {uploadPreview ? 'Choose Another Image' : 'Select QR Image'}
                  <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
                </label>

                <p className="text-slate-500 text-[10px]">Supports JPG, PNG, WebP • Camera capture on mobile</p>
              </div>
            </motion.div>
          )}

          {/* ─── Live Camera Mode ────────────────────────────────── */}
          {mode === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass-card rounded-3xl border border-white/10 bg-slate-950 overflow-hidden shadow-2xl">
              <div className="relative w-full bg-slate-950" style={{ aspectRatio: '4/3', maxHeight: '340px' }}>

                <video ref={videoRef} autoPlay playsInline muted
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${camReady ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transform: front ? 'scaleX(-1)' : 'none' }} />

                {!camReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-4 p-4">
                    {camLoading ? (
                      <>
                        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-cyan-400 text-sm font-bold">Starting camera...</p>
                        <p className="text-slate-500 text-[11px] text-center max-w-xs">
                          Click <strong className="text-white">"Allow"</strong> if your browser asks for camera permission
                        </p>
                      </>
                    ) : camErr ? (
                      <>
                        <Camera className="w-12 h-12 text-red-400 opacity-60" />
                        <p className="text-red-300 text-xs font-semibold text-center max-w-xs leading-relaxed">{camErr}</p>
                        <div className="flex gap-2">
                          <button onClick={() => startCam(front)}
                            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Retry
                          </button>
                          <button onClick={() => setMode('upload')}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Upload Instead
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}

                {camReady && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-52 h-52">
                      <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-xl" />
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                      <div className="absolute inset-x-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981] animate-pulse" />
                    </div>
                  </div>
                )}

                <div className="absolute top-3 right-3 z-20">
                  <button onClick={switchCam} className="px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-bold text-[10px] flex items-center gap-1.5 hover:bg-slate-800 shadow-lg transition-all active:scale-95">
                    <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                    {front ? 'Rear Cam' : 'Front Cam'}
                  </button>
                </div>

                <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${camReady ? 'bg-emerald-400 animate-pulse' : camLoading ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-[10px] font-mono text-slate-300 truncate max-w-[200px]">
                      {camLoading ? 'Starting...' : camReady ? 'Auto-scanning for QR' : 'Camera off'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Processing indicator ────────────────────────────── */}
        {scanning && (
          <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-emerald-300 text-sm font-bold">Verifying QR Pass...</span>
          </div>
        )}

        {/* ─── Quick Test ──────────────────────────────────────── */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">⚡ Quick Test — Tap to Simulate Scan</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {samples.map(s => (
              <button key={s.code} onClick={() => triggerRef.current?.(s.code)} disabled={scanning}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] ${
                  s.color === 'emerald' ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40' :
                  s.color === 'amber' ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/40' :
                  s.color === 'red' ? 'bg-red-950/30 border-red-500/40 text-red-300 hover:bg-red-900/40' :
                  'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
                }`}>
                <div><span className="text-xs font-bold block">{s.label}</span><span className="text-[10px] font-mono opacity-70 block">{s.code}</span></div>
                <Zap className="w-4 h-4 shrink-0 opacity-80" />
              </button>
            ))}
          </div>
        </div>

        {/* ─── Manual Input ────────────────────────────────────── */}
        <form onSubmit={handleManual} className="glass-card p-4 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex gap-2">
          <input type="text" value={manualInput} onChange={e => setManualInput(e.target.value)}
            placeholder="Enter Vehicle Plate or QR Code..."
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
