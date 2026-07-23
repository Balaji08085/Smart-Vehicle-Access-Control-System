import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Scan, CheckCircle2, XCircle, Camera, Zap, AlertTriangle, RefreshCw,
  Upload, Check, X, FlipHorizontal
} from 'lucide-react';
import jsQR from 'jsqr';
import { useEntry } from '../context/EntryContext';

const Scanner = () => {
  const { verifyQrCode } = useEntry();

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [selectedGate, setSelectedGate] = useState('Main Entrance Gate');

  // Camera state
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanLoopRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = rear, 'user' = front
  const [cameraLoading, setCameraLoading] = useState(false);
  const [qrDetected, setQrDetected] = useState(false);

  // --- QR Scan Loop ---
  const startScanLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const tick = () => {
      if (!video || video.paused || video.ended || video.readyState < 2) {
        scanLoopRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data && code.data.trim()) {
        setQrDetected(true);
        stopCamera();
        handleScanTrigger(code.data.trim());
        return;
      }

      scanLoopRef.current = requestAnimationFrame(tick);
    };

    scanLoopRef.current = requestAnimationFrame(tick);
  }, []); // eslint-disable-line

  // --- Stop Camera ---
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // --- Start Camera ---
  const startCamera = useCallback(async (facing = facingMode) => {
    stopCamera();
    setCameraLoading(true);
    setCameraError('');
    setQrDetected(false);

    const constraints = [
      // Try exact facingMode first
      { video: { facingMode: { exact: facing }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      // Then ideal facingMode
      { video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } },
      // Then any video
      { video: true },
    ];

    let stream = null;
    for (const c of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(c);
        break;
      } catch (e) {
        console.warn('Camera constraint failed, trying next:', e.name, c);
      }
    }

    setCameraLoading(false);

    if (!stream) {
      setCameraError('Camera access denied or unavailable. Please allow camera permission and try again.');
      return;
    }

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', true);
      videoRef.current.muted = true;

      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().then(() => {
          setCameraActive(true);
          startScanLoop();
        }).catch(e => {
          console.error('Video play error:', e);
          setCameraError('Could not start video playback. Try refreshing.');
        });
      };
    }
  }, [facingMode, stopCamera, startScanLoop]);

  // --- Switch Camera ---
  const switchCamera = useCallback(() => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  // Auto-start camera on mount
  useEffect(() => {
    if (!result && !scanning) {
      startCamera(facingMode);
    }
    return () => stopCamera();
  }, []); // eslint-disable-line

  // Restart camera when result is cleared
  useEffect(() => {
    if (!result && !scanning) {
      startCamera(facingMode);
    }
  }, [result]); // eslint-disable-line

  // --- Handle QR Scan Trigger ---
  const handleScanTrigger = async (query) => {
    if (scanning) return;
    setScanning(true);
    stopCamera();

    await new Promise(r => setTimeout(r, 300));
    const res = await verifyQrCode(query, selectedGate);
    setResult(res);
    setScanning(false);
  };

  // --- File Upload Decode ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (code && code.data && code.data.trim()) {
        handleScanTrigger(code.data.trim());
      } else {
        alert('No QR code detected in this image. Please use a clear photo of the QR pass.');
      }
      URL.revokeObjectURL(img.src);
    };
    // reset input
    e.target.value = '';
  };

  // --- Manual Submit ---
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanTrigger(manualInput.trim());
  };

  // --- Reset ---
  const resetScanner = () => {
    setResult(null);
    setManualInput('');
    setQrDetected(false);
  };

  const sampleVehicles = [
    { label: 'Valid Student Bike', code: 'TN-38-AB-1234', color: 'emerald' },
    { label: 'Valid Faculty Car', code: 'TN-38-XY-9999', color: 'emerald' },
    { label: 'Expired Sticker', code: 'TN-38-EXP-2025', color: 'amber' },
    { label: 'Blacklisted Vehicle', code: 'TN-38-ZZZ-999', color: 'red' },
    { label: 'Unregistered Vehicle', code: 'TN-99-UNKNOWN', color: 'slate' },
  ];

  // ─── ACCESS GRANTED SCREEN ──────────────────────────────────────────────────
  if (result && result.status === 'GRANTED') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 bg-[#062013] flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto"
      >
        <div className="absolute inset-0 bg-radial from-emerald-600/40 via-transparent to-transparent animate-pulse pointer-events-none" />
        <div className="max-w-xl w-full relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#16A34A] flex items-center justify-center border-4 border-emerald-300 shadow-[0_0_90px_rgba(22,163,74,0.9)] mb-6"
          >
            <Check className="w-20 h-20 md:w-24 md:h-24 text-white stroke-[4]" />
          </motion.div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-2">ACCESS GRANTED</h1>
          <p className="text-emerald-300 font-extrabold text-sm md:text-base tracking-widest uppercase mb-6 bg-emerald-950/90 px-6 py-2 rounded-full border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            ✓ VEHICLE ALLOWED TO ENTER CAMPUS
          </p>

          <div className="w-full bg-slate-900/90 p-6 md:p-8 rounded-3xl border-2 border-[#16A34A] shadow-[0_0_60px_rgba(22,163,74,0.5)] text-left space-y-4 mb-8">
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
              {[
                ['Owner Name', result.ownerName, 'text-white'],
                ['Student / Staff ID', result.registerId, 'text-emerald-300 font-mono'],
                ['Department', result.department, 'text-slate-200'],
                ['Vehicle Type', result.vehicleType, 'text-slate-200'],
                ['Sticker Expiry', result.expiryDate, 'text-emerald-400'],
                ['Gate Entry Time', `${result.gateEntryTime} (${result.gate})`, 'text-white font-mono'],
              ].map(([label, val, cls]) => (
                <div key={label}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
                  <span className={`text-sm font-bold block ${cls}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={resetScanner}
            className="w-full py-4 bg-[#16A34A] hover:bg-emerald-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(22,163,74,0.6)] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Scan className="w-5 h-5" /> Scan Next Vehicle
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── ACCESS DENIED SCREEN ───────────────────────────────────────────────────
  if (result && result.status === 'DENIED') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 bg-[#200606] flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto"
      >
        <div className="absolute inset-0 bg-radial from-red-600/40 via-transparent to-transparent animate-pulse pointer-events-none" />
        <div className="max-w-xl w-full relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#DC2626] flex items-center justify-center border-4 border-red-300 shadow-[0_0_90px_rgba(220,38,38,0.9)] mb-6"
          >
            <X className="w-20 h-20 md:w-24 md:h-24 text-white stroke-[4]" />
          </motion.div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-2">ACCESS DENIED</h1>
          <p className="text-red-300 font-extrabold text-sm md:text-base tracking-widest uppercase mb-6 bg-red-950/90 px-6 py-2 rounded-full border-2 border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            ✕ VEHICLE NOT ALLOWED (STOP ENTRY)
          </p>

          <div className="w-full bg-slate-900/90 p-6 md:p-8 rounded-3xl border-2 border-[#DC2626] shadow-[0_0_60px_rgba(220,38,38,0.6)] text-left space-y-4 mb-8">
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
              <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Denial Reason:
              </span>
              <p className="text-lg font-black text-white pl-2">• {result.reason}</p>
            </div>

            {result.vehicle && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  ['Owner Name', result.ownerName, 'text-white'],
                  ['Student / Staff ID', result.registerId, 'text-slate-300 font-mono'],
                  ['Sticker Expiry', result.expiryDate, 'text-red-400'],
                  ['Attempt Time', result.gateEntryTime, 'text-white font-mono'],
                ].map(([label, val, cls]) => (
                  <div key={label}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
                    <span className={`text-sm font-bold block ${cls}`}>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={resetScanner}
            className="w-full py-4 bg-[#DC2626] hover:bg-red-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(220,38,38,0.6)] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="w-5 h-5" /> Scan Again
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── MAIN SCANNER VIEW ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#080C16] flex flex-col items-center justify-center">
      {/* Hidden canvas for QR decode */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-xl w-full space-y-6">

        {/* Header */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" /> QR Scanner Terminal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Gate Security Verification</p>
          </div>
          <select
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none"
          >
            <option value="Main Entrance Gate">Main Gate</option>
            <option value="North Gate">North Gate</option>
            <option value="South Gate">South Gate</option>
            <option value="Hostel Gate">Hostel Gate</option>
          </select>
        </div>

        {/* Camera Viewport */}
        <div className="glass-card rounded-3xl border border-white/10 bg-slate-950 overflow-hidden shadow-2xl">
          <div className="relative w-full" style={{ aspectRatio: '4/3', maxHeight: '340px' }}>

            {/* Live Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />

            {/* Loading / Error State */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-3">
                {cameraLoading ? (
                  <>
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-emerald-400 text-xs font-bold">Starting camera...</span>
                  </>
                ) : cameraError ? (
                  <>
                    <Camera className="w-12 h-12 text-red-400 opacity-60" />
                    <p className="text-red-400 text-xs font-bold text-center px-4 max-w-xs">{cameraError}</p>
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl transition-all"
                    >
                      Retry Camera
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-400 text-xs">Initializing...</span>
                  </>
                )}
              </div>
            )}

            {/* QR Viewfinder Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-xl" />
                  {/* Corner Brackets */}
                  <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                  {/* Laser Line */}
                  <div className="absolute inset-x-2 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981] animate-pulse" />
                </div>
              </div>
            )}

            {/* Camera Controls (top-right) */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 items-end">
              <button
                onClick={switchCamera}
                title={facingMode === 'environment' ? 'Switch to Front Camera' : 'Switch to Rear Camera'}
                className="px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-bold text-[10px] flex items-center gap-1.5 hover:bg-slate-800 shadow-lg transition-all active:scale-95"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                {facingMode === 'environment' ? 'Front Cam' : 'Rear Cam'}
              </button>

              {!cameraActive && !cameraLoading && (
                <button
                  onClick={() => startCamera(facingMode)}
                  className="px-3 py-1.5 rounded-full bg-emerald-700/90 text-white font-bold text-[10px] flex items-center gap-1.5 hover:bg-emerald-600 shadow-lg transition-all active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" /> Start Camera
                </button>
              )}
            </div>

            {/* Status Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-[10px] font-mono text-slate-300">
                  {cameraLoading ? 'Starting camera...' :
                    cameraActive ? (facingMode === 'environment' ? 'Rear Camera • Auto-scanning' : 'Front Camera • Auto-scanning') :
                    cameraError ? 'Camera unavailable' : 'Camera off'}
                </span>
              </div>
              <label className="cursor-pointer text-amber-400 font-bold text-[10px] uppercase flex items-center gap-1 hover:text-amber-300">
                <Upload className="w-3.5 h-3.5" /> Upload QR
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Processing indicator */}
        {scanning && (
          <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-emerald-300 text-sm font-bold">Verifying QR Pass...</span>
          </div>
        )}

        {/* Quick Test Buttons */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
            ⚡ Quick Test — Tap to Simulate Scan
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sampleVehicles.map((sample) => (
              <button
                key={sample.code}
                onClick={() => handleScanTrigger(sample.code)}
                disabled={scanning}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] ${
                  sample.color === 'emerald'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                    : sample.color === 'amber'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                    : sample.color === 'red'
                    ? 'bg-red-950/30 border-red-500/40 text-red-300 hover:bg-red-900/40'
                    : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">{sample.label}</span>
                  <span className="text-[10px] font-mono opacity-70 block">{sample.code}</span>
                </div>
                <Zap className="w-4 h-4 shrink-0 opacity-80" />
              </button>
            ))}
          </div>
        </div>

        {/* Manual Input */}
        <form onSubmit={handleManualSubmit} className="glass-card p-4 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Enter Vehicle Plate or QR Code..."
            className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={scanning || !manualInput.trim()}
            className="px-5 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shrink-0"
          >
            {scanning ? 'Verifying...' : 'Verify'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Scanner;
