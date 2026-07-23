import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, CheckCircle2, XCircle, Camera, Zap, ShieldAlert, ArrowLeft,
  Car, UserCheck, Calendar, Clock, Building, Key, AlertTriangle, RefreshCw, Video, VideoOff, Check, X, Upload, Image as ImageIcon
} from 'lucide-react';
import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';
import { useEntry } from '../context/EntryContext';

const Scanner = () => {
  const { vehicles, verifyQrCode } = useEntry();

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // null, or { status: 'GRANTED'|'DENIED', ... }
  const [manualInput, setManualInput] = useState('');
  const [selectedGate, setSelectedGate] = useState('Main Entrance Gate');

  // Real Camera & Scanner state
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('Initializing scanner...');
  const [usingFrontCamera, setUsingFrontCamera] = useState(false);
  const [cameraStartKey, setCameraStartKey] = useState(0);

  const fileInputRef = useRef(null);

  // Canvas Viewfinder state for fallback animation
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const laserYRef = useRef(0);
  const laserDirRef = useRef(1);

  const html5QrCodeRef = useRef(null);

  // Stop Html5Qrcode scanner safely
  const stopHtml5Scanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping Html5Qrcode scanner:', e);
      }
      html5QrCodeRef.current = null;
    }
  };

  // Primary Html5Qrcode Live Camera Engine Lifecycle
  useEffect(() => {
    if (result || scanning) return;

    let isSubscribed = true;

    const initScanner = async () => {
      await stopHtml5Scanner();

      // Check Secure Context / MediaDevices availability
      if (!navigator.mediaDevices && !window.isSecureContext) {
        if (isSubscribed) {
          setCameraActive(false);
          setCameraStatus('⚠️ HTTPS or localhost required for live camera. Use photo upload or manual entry below.');
        }
        return;
      }

      setCameraStatus('Starting live camera scanner...');

      try {
        const scanner = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = scanner;

        const preferredFacing = usingFrontCamera ? "user" : "environment";

        const config = {
          fps: 10, // slightly lower fps gives more processing time per frame
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.85); // Make qr box larger
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0,
          disableFlip: false, // allow flipping for front camera
        };

        const onScanSuccess = (decodedText) => {
          if (isSubscribed && decodedText && decodedText.trim()) {
            console.log("🟢 Html5Qrcode Decoded QR:", decodedText);
            stopHtml5Scanner().then(() => {
              handleScanTrigger(decodedText.trim());
            });
          }
        };

        // Attempt 1: Explicitly get cameras and pick the right one by label/index
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            let selectedCameraId = cameras[0].id;
            
            if (usingFrontCamera) {
              const front = cameras.find(c => (c.label || '').toLowerCase().includes('front') || (c.label || '').toLowerCase().includes('user'));
              selectedCameraId = front ? front.id : cameras[0].id;
            } else {
              const back = cameras.find(c => (c.label || '').toLowerCase().includes('back') || (c.label || '').toLowerCase().includes('rear') || (c.label || '').toLowerCase().includes('environment'));
              selectedCameraId = back ? back.id : cameras[cameras.length - 1].id;
            }

            await scanner.start(selectedCameraId, config, onScanSuccess, () => {});
            if (isSubscribed) {
              setCameraActive(true);
              setCameraStatus(usingFrontCamera ? 'Front Camera Active — Point at QR Pass' : 'Rear Camera Active — Point at QR Pass');
            }
          } else {
            throw new Error("No cameras detected by browser");
          }
        } catch (cameraErr) {
          console.warn('getCameras attempt failed, falling back to facingMode constraint:', cameraErr);
          if (!isSubscribed) return;

          // Attempt 2: Try preferred facingMode
          try {
            await scanner.start({ facingMode: preferredFacing }, config, onScanSuccess, () => {});
            if (isSubscribed) {
              setCameraActive(true);
              setCameraStatus(usingFrontCamera ? 'Front Camera Active' : 'Rear Camera Active');
            }
          } catch (firstErr) {
            console.warn('Preferred camera facingMode failed, trying fallback:', firstErr);
            if (!isSubscribed) return;

            // Attempt 3: Try alternate facing mode
            const fallbackFacing = usingFrontCamera ? "environment" : "user";
            try {
              await scanner.start({ facingMode: fallbackFacing }, config, onScanSuccess, () => {});
              if (isSubscribed) {
                setCameraActive(true);
                setCameraStatus('Camera Active');
              }
            } catch (secondErr) {
              console.warn('Fallback facingMode failed, trying generic video constraint:', secondErr);
              if (!isSubscribed) return;

              // Attempt 4: Generic video true
              try {
                await scanner.start({ video: true }, config, onScanSuccess, () => {});
                if (isSubscribed) {
                  setCameraActive(true);
                  setCameraStatus('Camera Active');
                }
              } catch (finalErr) {
                console.error('All camera startup attempts failed:', finalErr);
                if (isSubscribed) {
                  setCameraActive(false);
                  if (finalErr?.name === 'NotAllowedError' || finalErr?.message?.includes('Permission') || cameraErr?.name === 'NotAllowedError') {
                    setCameraStatus('⚠️ Camera permission denied — enable camera in browser settings');
                  } else if (finalErr?.name === 'NotReadableError' || cameraErr?.name === 'NotReadableError') {
                    setCameraStatus('⚠️ Camera in use by another app — close it & retry');
                  } else {
                    setCameraStatus('⚠️ Live camera unavailable — use photo upload or manual entry below');
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Html5Qrcode initialization error:', err);
        if (isSubscribed) {
          setCameraActive(false);
          setCameraStatus('⚠️ Camera initialization error — use photo upload or manual entry');
        }
      }
    };

    initScanner();

    return () => {
      isSubscribed = false;
      stopHtml5Scanner();
    };
  }, [usingFrontCamera, result, scanning, cameraStartKey]);

  const toggleCamera = () => {
    setUsingFrontCamera((prev) => !prev);
  };

  const startCamera = () => {
    setResult(null);
    setUsingFrontCamera(false);
    setCameraStartKey((prev) => prev + 1);
  };

  const stopCamera = () => {
    stopHtml5Scanner();
    setCameraActive(false);
    setCameraStatus('Camera Stopped');
  };

  // Snap live camera frame and decode QR
  const handleSnapAndVerify = () => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      const jsQRDecode = typeof jsQR === 'function' ? jsQR : (jsQR && jsQR.default);
      if (typeof jsQRDecode !== 'function') {
        console.error("jsQR library is not resolved as a function:", jsQR);
        setCameraStatus("⚠️ Scanner library load error");
        return;
      }
      const scanCanvas = document.createElement('canvas');
      scanCanvas.width = video.videoWidth;
      scanCanvas.height = video.videoHeight;
      const scanCtx = scanCanvas.getContext('2d');
      scanCtx.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);
      const imageData = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
      const code = jsQRDecode(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (code && code.data && code.data.trim()) {
        handleScanTrigger(code.data.trim());
        return;
      }
      // No QR detected — prompt user
      setCameraStatus('⚠️ No QR code detected — hold steady & try again');
    } else {
      setCameraStatus('⚠️ Camera not ready');
    }
  };

  // Handle image file upload QR decoding with dual-engine fallback
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setCameraStatus('Decoding QR image file...');

      // Attempt 1: html5-qrcode
      try {
        const html5QrCode = new Html5Qrcode("qr-file-reader");
        const decodedText = await html5QrCode.scanFile(file, true);
        if (decodedText) {
          handleScanTrigger(decodedText);
          return;
        }
      } catch (err1) {
        console.warn("html5-qrcode file scan failed, trying jsQR fallback", err1);
      }

      // Attempt 2: jsQR Canvas fallback
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const jsQRDecode = typeof jsQR === 'function' ? jsQR : (jsQR && jsQR.default);
        if (typeof jsQRDecode !== 'function') {
          console.error("jsQR library is not resolved as a function:", jsQR);
          alert("Scanner library load error");
          setCameraStatus('Ready to Scan');
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQRDecode(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data && code.data.trim()) {
          handleScanTrigger(code.data.trim());
        } else {
          alert("Could not detect a QR code in this image. Please upload a clear photo or screenshot of the MCC MRF QR pass.");
          setCameraStatus('Ready to Scan');
        }
      };
    } catch (err) {
      console.error("QR Code file scan error:", err);
      alert("Error reading file. Please try another image.");
      setCameraStatus('Ready to Scan');
    }
  };

  // Animated laser line on canvas when camera is off
  useEffect(() => {
    if (result || cameraActive) return;

    let running = true;
    const draw = () => {
      if (!running) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = '#080C16';
      ctx.fillRect(0, 0, W, H);

      // Grid pattern
      ctx.strokeStyle = 'rgba(59,130,246,0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Target Brackets
      const bx = (W - 180) / 2;
      const by = (H - 180) / 2;
      const bs = 180;
      const cs = 22;

      ctx.strokeStyle = '#16A34A';
      ctx.lineWidth = 4;
      [[bx, by, 1, 1], [bx + bs, by, -1, 1], [bx, by + bs, 1, -1], [bx + bs, by + bs, -1, -1]].forEach(([x, y, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + cs * dy);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cs * dx, y);
        ctx.stroke();
      });

      // Laser sweep
      laserYRef.current += laserDirRef.current * 2.5;
      if (laserYRef.current >= bs) laserDirRef.current = -1;
      if (laserYRef.current <= 0) laserDirRef.current = 1;

      const ly = by + laserYRef.current;
      const grad = ctx.createLinearGradient(bx, ly, bx + bs, ly);
      grad.addColorStop(0, 'rgba(22,163,74,0)');
      grad.addColorStop(0.5, '#16A34A');
      grad.addColorStop(1, 'rgba(22,163,74,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#16A34A';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(bx, ly);
      ctx.lineTo(bx + bs, ly);
      ctx.stroke();
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [result, cameraActive]);

  const handleScanTrigger = async (query) => {
    if (scanning) return;
    setScanning(true);
    stopCamera();

    setTimeout(async () => {
      const res = await verifyQrCode(query, selectedGate);
      setResult(res);
      setScanning(false);
    }, 400);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanTrigger(manualInput.trim());
  };

  const resetScanner = () => {
    setResult(null);
    setManualInput('');
    startCamera();
  };

  const sampleVehicles = [
    { label: 'Valid Student Bike (Allowed)', code: 'TN-38-AB-1234', color: 'emerald' },
    { label: 'Valid Faculty Car (Allowed)', code: 'TN-38-XY-9999', color: 'emerald' },
    { label: 'Expired Sticker (Not Allowed)', code: 'TN-38-EXP-2025', color: 'amber' },
    { label: 'Blacklisted (Not Allowed)', code: 'TN-38-ZZZ-999', color: 'red' },
    { label: 'Unregistered (Not Allowed)', code: 'TN-99-UNKNOWN', color: 'slate' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#080C16] relative flex flex-col items-center justify-center">

      {/* Hidden container for QR file scanning */}
      <div id="qr-file-reader" className="hidden" />

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* 🟢 FULL SCREEN SCREEN 1: VALID QR CODE (GREEN TICK - ALLOWED TO ENTER)        */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {result && result.status === 'GRANTED' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#062013] flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto"
        >
          {/* Glowing Green Background */}
          <div className="absolute inset-0 bg-radial from-emerald-600/40 via-transparent to-transparent animate-pulse pointer-events-none" />

          <div className="max-w-xl w-full relative z-10 flex flex-col items-center text-center">

            {/* Giant Green Checkmark (Tick) Circle */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#16A34A] flex items-center justify-center border-4 border-emerald-300 shadow-[0_0_90px_rgba(22,163,74,0.9)] mb-6"
            >
              <Check className="w-20 h-20 md:w-24 md:h-24 text-white stroke-[4]" />
            </motion.div>

            {/* Status Header: ACCESS GRANTED - ALLOWED TO ENTER */}
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-2">
              ACCESS GRANTED
            </h1>
            <p className="text-emerald-300 font-extrabold text-sm md:text-base tracking-widest uppercase mb-6 bg-emerald-950/90 px-6 py-2 rounded-full border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              ✓ VEHICLE ALLOWED TO ENTER CAMPUS
            </p>

            {/* Vehicle Card with Animated Green Glow */}
            <div className="w-full glass-card bg-slate-900/90 p-6 md:p-8 rounded-3xl border-2 border-[#16A34A] shadow-[0_0_60px_rgba(22,163,74,0.5)] text-left space-y-4 mb-8">
              
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
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Owner Name</span>
                  <span className="text-base font-bold text-white block">{result.ownerName}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student / Staff ID</span>
                  <span className="text-base font-mono font-bold text-emerald-300 block">{result.registerId}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department</span>
                  <span className="text-sm font-semibold text-slate-200 block">{result.department}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Type</span>
                  <span className="text-sm font-semibold text-slate-200 block">{result.vehicleType}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sticker Expiry Date</span>
                  <span className="text-sm font-semibold text-emerald-400 block">{result.expiryDate}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gate Entry Time</span>
                  <span className="text-sm font-mono font-bold text-white block">{result.gateEntryTime} ({result.gate})</span>
                </div>
              </div>

            </div>

            {/* Button: Scan Next Vehicle */}
            <button
              onClick={resetScanner}
              className="w-full py-4 bg-[#16A34A] hover:bg-emerald-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(22,163,74,0.6)] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Scan className="w-5 h-5" /> Scan Next Vehicle
            </button>

          </div>
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* 🔴 FULL SCREEN SCREEN 2: INVALID/EXPIRED QR CODE (RED CROSS - NOT ALLOWED)   */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {result && result.status === 'DENIED' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#200606] flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto"
        >
          {/* Flashing Red Background */}
          <div className="absolute inset-0 bg-radial from-red-600/40 via-transparent to-transparent animate-pulse pointer-events-none" />

          <div className="max-w-xl w-full relative z-10 flex flex-col items-center text-center">

            {/* Giant Red Cross (Wrong) Circle */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#DC2626] flex items-center justify-center border-4 border-red-300 shadow-[0_0_90px_rgba(220,38,38,0.9)] mb-6 animate-bounce"
            >
              <X className="w-20 h-20 md:w-24 md:h-24 text-white stroke-[4]" />
            </motion.div>

            {/* Status Header: ACCESS DENIED - VEHICLE NOT ALLOWED */}
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-2">
              ACCESS DENIED
            </h1>
            <p className="text-red-300 font-extrabold text-sm md:text-base tracking-widest uppercase mb-6 bg-red-950/90 px-6 py-2 rounded-full border-2 border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              ✕ VEHICLE NOT ALLOWED (STOP ENTRY)
            </p>

            {/* Warning Card with Red Glow Animation */}
            <div className="w-full glass-card bg-slate-900/90 p-6 md:p-8 rounded-3xl border-2 border-[#DC2626] shadow-[0_0_60px_rgba(220,38,38,0.6)] text-left space-y-4 mb-8">
              
              <div className="flex items-center justify-between border-b border-red-500/30 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-wider block">Vehicle Plate Number</span>
                  <span className="text-2xl md:text-3xl font-black text-white font-mono tracking-wider">{result.vehicleNumber}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#DC2626] text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> REJECTED
                </div>
              </div>

              {/* Explicit Denial Reason Bullets */}
              <div className="p-4 bg-red-950/50 border border-red-500/50 rounded-2xl space-y-2">
                <span className="text-xs font-black text-red-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Primary Denial Reason:
                </span>
                <p className="text-lg font-black text-white pl-2">
                  • {result.reason}
                </p>
                <div className="text-[11px] text-red-300/90 pt-2 border-t border-red-500/30 font-medium">
                  {result.reason === 'Sticker Expired' && '❌ Sticker Pass Expired. Renewal required before campus access is permitted.'}
                  {result.reason === 'QR Code Not Registered' && '❌ QR Code Not Registered in MCC MRF Security Database.'}
                  {result.reason === 'Blacklisted Vehicle' && '❌ Vehicle Blacklisted by Campus Security Administration.'}
                  {result.reason === 'Sticker Disabled' && '❌ Access Sticker Manually Disabled by Security.'}
                </div>
              </div>

              {/* Show Vehicle details if available */}
              {result.vehicle && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Owner Name</span>
                    <span className="text-sm font-bold text-white block">{result.ownerName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student / Staff ID</span>
                    <span className="text-sm font-mono font-bold text-slate-300 block">{result.registerId}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sticker Expiry</span>
                    <span className="text-sm font-semibold text-red-400 block">{result.expiryDate}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attempt Time</span>
                    <span className="text-sm font-mono font-bold text-white block">{result.gateEntryTime}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Button: Scan Again */}
            <button
              onClick={resetScanner}
              className="w-full py-4 bg-[#DC2626] hover:bg-red-500 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_0_35px_rgba(220,38,38,0.6)] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className="w-5 h-5" /> Scan Again
            </button>

          </div>
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* CAMERA SCANNER TERMINAL MAIN VIEW (When result is empty)                    */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {!result && (
        <div className="max-w-xl w-full space-y-6">

          {/* Terminal Header */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" /> Mobile QR Scanner
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Gate Security Verification Terminal</p>
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

          {/* Real Camera Viewport Container */}
          <div className="glass-card p-2 rounded-3xl border border-white/10 bg-slate-950 overflow-hidden relative shadow-2xl flex flex-col items-center justify-center">
            
            <div className="relative w-full h-64 md:h-72 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
              
              {/* Html5Qrcode Live Scanner Mount Point */}
              <div id="qr-reader" className="absolute inset-0 w-full h-full z-0" />

              {/* Real Mobile Camera Stream Video Fallback */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />

              {/* Canvas Viewfinder Animation fallback when camera is off */}
              {!cameraActive && (
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={280}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* High-Tech Brackets & Sweep Laser Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                <div className="w-48 h-48 border-2 border-emerald-500/40 rounded-2xl relative shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
                  
                  {/* Laser line */}
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-pulse" />
                </div>
              </div>

              {/* Camera Status & Control Pill */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                {/* Switch Rear / Front Camera button */}
                <button
                  onClick={toggleCamera}
                  title={usingFrontCamera ? 'Switch to Rear (Back) Camera' : 'Switch to Front (Selfie) Camera'}
                  className="px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-bold text-[10px] flex items-center gap-1.5 hover:bg-slate-800 shadow-lg transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                  {usingFrontCamera ? '📷 Switch to Rear Cam' : '🤳 Switch to Front Cam'}
                </button>

                <button 
                  onClick={cameraActive ? stopCamera : () => startCamera(false)}
                  className="px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 flex items-center gap-1.5 hover:bg-slate-800 shadow-lg"
                >
                  {cameraActive ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-amber-400" />}
                  {cameraActive ? 'Stop' : 'Start Camera'}
                </button>
              </div>

              {/* Interactive Snap & Verify Button Overlay on camera feed */}
              {cameraActive && (
                <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center pointer-events-auto">
                  <button
                    onClick={handleSnapAndVerify}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-white/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-yellow-300 animate-pulse" /> Snap & Verify QR Pass
                  </button>
                </div>
              )}

            </div>

            {/* Instruction Overlay & File Upload Trigger */}
            <div className="p-3 w-full flex justify-between items-center text-[11px] font-mono text-slate-400 bg-slate-900/60 rounded-b-2xl border-t border-white/5 mt-1">
              <span className="truncate max-w-[240px]">{cameraStatus}</span>

              {/* Upload QR Photo Button */}
              <label className="cursor-pointer text-amber-400 font-bold uppercase flex items-center gap-1 hover:text-amber-300">
                <Upload className="w-3.5 h-3.5" /> Upload QR Photo
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

          {/* Quick-Scan Vehicle Simulation Buttons */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              ⚡ Instant Gate Scan Simulation (Tap to Test Verification)
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

          {/* Manual Input Form */}
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
      )}

    </div>
  );
};

export default Scanner;
