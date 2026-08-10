import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, ImagePlus, ShieldCheck, ArrowLeft, QrCode,
  RefreshCw, Keyboard, AlertTriangle, FlipHorizontal, CheckCircle2,
  VideoOff, Video
} from 'lucide-react';
import jsQR from 'jsqr';

const Scanner = () => {
  const navigate = useNavigate();

  const [mode, setMode]             = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [camStatus, setCamStatus]   = useState('idle');   // 'idle' | 'loading' | 'ready' | 'error'
  const [camErrMsg, setCamErrMsg]   = useState('');
  const [scanned, setScanned]       = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [facingUser, setFacingUser] = useState(false);

  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const mountedRef = useRef(true);
  const busyRef    = useRef(false);   // prevents concurrent startCamera calls

  /* ─── Cleanup helpers ─────────────────────────────────────── */
  const cancelRaf = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  const stopStream = useCallback(() => {
    cancelRaf();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mountedRef.current) setCamStatus('idle');
  }, []);

  /* ─── QR decode loop ──────────────────────────────────────── */
  const handleDetected = useCallback((raw) => {
    setScanned(true);
    stopStream();
    let token = raw.trim();
    if (token.includes('/verify/')) token = token.split('/verify/').pop();
    setTimeout(() => navigate(`/verify/${encodeURIComponent(token)}`), 500);
  }, [stopStream, navigate]);

  const scanLoop = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState < 2 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result  = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'dontInvert'
    });
    if (result?.data) { handleDetected(result.data); return; }
    rafRef.current = requestAnimationFrame(scanLoop);
  }, [handleDetected]);

  /* ─── Start camera ────────────────────────────────────────── */
  const startCamera = useCallback(async (useUser = false) => {
    if (busyRef.current) return;          // block concurrent calls
    busyRef.current = true;

    // Tear down any previous stream first
    cancelRaf();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    if (!mountedRef.current) { busyRef.current = false; return; }

    setCamStatus('loading');
    setCamErrMsg('');
    setScanned(false);

    if (!navigator?.mediaDevices?.getUserMedia) {
      busyRef.current = false;
      if (!mountedRef.current) return;
      const isHttp = window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const msg = isHttp
        ? 'Web Browsers block live camera streams over plain HTTP IP addresses. Please open the website on localhost or HTTPS, or use "Upload QR" / "Manual Token".'
        : 'Web Camera API (getUserMedia) is not supported or blocked on this device browser. Please use "Upload QR" or "Manual Token".';
      setCamErrMsg(msg);
      setCamStatus('error');
      return;
    }

    let stream;
    try {
      // Tier 1: Try ideal environment / user mode
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: useUser ? 'user' : { ideal: 'environment' }
        },
        audio: false
      });
    } catch (err1) {
      console.warn('Camera Tier 1 failed, trying Tier 2 (facingMode string):', err1);
      try {
        // Tier 2: Try simple facingMode string
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: useUser ? 'user' : 'environment' },
          audio: false
        });
      } catch (err2) {
        console.warn('Camera Tier 2 failed, trying Tier 3 (basic video constraint):', err2);
        try {
          // Tier 3: Basic video: true fallback
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (err3) {
          console.error('All Camera Tiers failed:', err3);
          busyRef.current = false;
          if (!mountedRef.current) return;

          const name = err3?.name || err2?.name || err1?.name || '';
          const msg = (name === 'NotAllowedError' || name === 'PermissionDeniedError')
            ? 'Camera permission was denied. Please tap the 🔒 lock / site settings icon in your browser address bar, set Camera to ALLOW, then click Request Permission.'
            : (name === 'NotFoundError' || name === 'DevicesNotFoundError')
              ? 'No camera hardware found on this system. You can use "Upload QR" or "Manual Token" instead.'
              : `Camera initialization error (${name || 'Hardware Error'}). Try switching camera or using Upload QR.`;

          setCamErrMsg(msg);
          setCamStatus('error');
          return;
        }
      }
    }

    if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); busyRef.current = false; return; }

    streamRef.current = stream;
    const video = videoRef.current;

    if (!video) {
      stream.getTracks().forEach(t => t.stop());
      busyRef.current = false;
      return;
    }

    // Assign stream — wait for metadata before calling play()
    video.srcObject = stream;

    const onReady = async () => {
      video.removeEventListener('loadedmetadata', onReady);
      if (!mountedRef.current) { busyRef.current = false; return; }
      try {
        await video.play();
        if (!mountedRef.current) { busyRef.current = false; return; }
        setCamStatus('ready');
        rafRef.current = requestAnimationFrame(scanLoop);
      } catch (playErr) {
        if (playErr.name !== 'AbortError' && mountedRef.current) {
          setCamErrMsg(`Camera playback error: ${playErr.message}`);
          setCamStatus('error');
        }
      }
      busyRef.current = false;
    };

    video.addEventListener('loadedmetadata', onReady);
  }, [scanLoop]);

  /* ─── Lifecycle ───────────────────────────────────────────── */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelRaf();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Start/stop camera when mode changes
  const facingUserRef = useRef(facingUser);
  facingUserRef.current = facingUser;
  useEffect(() => {
    if (mode === 'camera') {
      // Small delay ensures DOM is ready and previous cleanup has finished
      const t = setTimeout(() => startCamera(facingUserRef.current), 100);
      return () => clearTimeout(t);
    } else {
      stopStream();
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flip camera
  const handleFlip = () => {
    const next = !facingUser;
    setFacingUser(next);
    startCamera(next);
  };

  /* ─── File upload ─────────────────────────────────────────── */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadPreview(URL.createObjectURL(file));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const imgData = canvas.getContext('2d').getImageData(0, 0, img.width, img.height);
      const result  = jsQR(imgData.data, imgData.width, imgData.height);
      if (result?.data) handleDetected(result.data);
      else setUploadError('No QR code detected. Try a clearer photo of the QR sticker.');
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  /* ─── Manual token ────────────────────────────────────────── */
  const handleManual = (e) => {
    e.preventDefault();
    const t = manualToken.trim();
    if (t) navigate(`/verify/${encodeURIComponent(t)}`);
  };

  /* ─── UI ──────────────────────────────────────────────────── */
  const isLoading = camStatus === 'loading';
  const isReady   = camStatus === 'ready';
  const hasErr    = camStatus === 'error';

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-[#080C16] flex flex-col items-center justify-center">
      <div className="max-w-xl w-full space-y-4">

        {/* Header */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-white/10 text-slate-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" /> QR Scanner Terminal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Security Guard Real-Time Gate Check</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE
          </div>
        </div>

        {/* Mode tabs */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'camera', label: 'Live Camera', icon: Camera,   from: 'from-cyan-600',   to: 'to-blue-600',   border: 'border-cyan-500' },
            { id: 'upload', label: 'Upload QR',   icon: ImagePlus, from: 'from-amber-600',  to: 'to-orange-600', border: 'border-amber-500' },
            { id: 'manual', label: 'Manual Token',icon: Keyboard,  from: 'from-violet-600', to: 'to-purple-600', border: 'border-violet-500' },
          ].map(({ id, label, icon: Icon, from, to, border }) => (
            <button key={id}
              onClick={() => { setMode(id); setCamErrMsg(''); setUploadError(''); setUploadPreview(null); setScanned(false); }}
              className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border
                ${mode === id ? `bg-gradient-to-r ${from} ${to} text-white ${border}` : 'bg-slate-900/60 text-slate-400 border-white/10 hover:text-white'}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">

          {/* ── Camera ── */}
          {mode === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-3xl border border-white/10 bg-slate-950 overflow-hidden shadow-2xl relative"
              style={{ aspectRatio: '4/3' }}
            >
              <canvas ref={canvasRef} className="hidden" />

              {/* Video element — always mounted when in camera mode */}
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
                playsInline muted autoPlay
              />

              {/* Scan bracket overlay */}
              {isReady && !scanned && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-56 h-56">
                    <span className="absolute top-0 left-0 w-9 h-9 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <span className="absolute top-0 right-0 w-9 h-9 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <span className="absolute bottom-0 left-0 w-9 h-9 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <span className="absolute bottom-0 right-0 w-9 h-9 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                    <motion.span
                      className="absolute left-2 right-2 h-0.5 bg-emerald-400/90 shadow-[0_0_10px_3px_rgba(52,211,153,0.5)]"
                      animate={{ top: ['8%', '90%', '8%'] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>
              )}

              {/* Scanned success flash */}
              {scanned && (
                <div className="absolute inset-0 bg-emerald-500/25 backdrop-blur-sm flex items-center justify-center">
                  <CheckCircle2 className="w-28 h-28 text-emerald-400 drop-shadow-2xl" />
                </div>
              )}

              {/* Loading spinner */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-cyan-400 text-sm font-bold tracking-wide">Starting Camera...</p>
                  <p className="text-slate-500 text-xs">Please allow camera access if prompted</p>
                </div>
              )}

              {/* Error state */}
              {hasErr && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#180305] p-6 text-center overflow-y-auto">
                  <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Camera Access Blocked</h3>
                  <p className="text-red-200/90 text-xs font-medium leading-relaxed max-w-sm">
                    {camErrMsg}
                  </p>

                  {/* Step-by-Step Permission Instruction Box */}
                  <div className="w-full max-w-sm bg-[#240609] border border-[#5C121E] p-3.5 rounded-2xl text-left space-y-2 text-xs">
                    <p className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">How to unblock camera in browser:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>Tap the <span className="font-bold text-white">🔒 Lock / Site Settings</span> icon in address bar.</li>
                      <li>Set <span className="font-bold text-emerald-400">Camera</span> permission to <span className="font-bold text-emerald-400">ALLOW</span>.</li>
                      <li>Click <span className="font-bold text-cyan-400">Retry Camera</span> below to launch stream.</li>
                    </ol>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center pt-1">
                    <button 
                      onClick={() => startCamera(facingUser)}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4" /> Retry Camera
                    </button>
                    <button 
                      onClick={() => startCamera(!facingUser)}
                      className="px-4 py-2.5 bg-[#2E080C] hover:bg-[#3D0A11] text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-[#5C121E]"
                    >
                      <Camera className="w-3.5 h-3.5" /> Switch Camera
                    </button>
                    <button 
                      onClick={() => setMode('upload')}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <ImagePlus className="w-3.5 h-3.5" /> Upload QR
                    </button>
                  </div>
                </div>
              )}

              {/* Idle / Stopped Camera state */}
              {camStatus === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#180305] p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Camera is Stopped</h3>
                  <p className="text-slate-400 text-xs font-medium max-w-xs">
                    Live video stream is paused. Click below to start scanning again.
                  </p>
                  <button 
                    onClick={() => startCamera(facingUser)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    <Video className="w-4 h-4" /> Start Camera
                  </button>
                </div>
              )}

              {/* Controls bar (when ready) */}
              {isReady && (
                <>
                  <div className="absolute top-3 right-3 z-20 flex gap-2">
                    <button 
                      onClick={stopStream}
                      title="Stop Live Camera Stream"
                      className="px-3.5 py-1.5 rounded-full bg-rose-950/90 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-500/40 transition-all shadow-md active:scale-95"
                    >
                      <VideoOff className="w-3.5 h-3.5" /> Stop Camera
                    </button>
                    <button 
                      onClick={handleFlip}
                      className="px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-cyan-500/30 transition-all shadow-md active:scale-95"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" /> Flip
                    </button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur px-4 py-2.5 flex justify-between items-center z-20">
                    <span className="text-xs font-mono text-slate-300">Point camera at the QR code...</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── Upload ── */}
          {mode === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-3xl border border-white/10 bg-slate-950 p-8 flex flex-col items-center gap-5">
              {uploadPreview
                ? <img src={uploadPreview} alt="Preview" className="w-52 h-52 object-contain bg-white rounded-2xl shadow-xl" />
                : <div className="w-28 h-28 rounded-3xl bg-amber-500/10 border-2 border-dashed border-amber-500/40 flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-amber-400" />
                  </div>
              }
              <p className="text-slate-400 text-sm text-center">Upload a photo of the QR sticker to verify access</p>
              {uploadError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-500/30 px-4 py-2.5 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {uploadError}
                </div>
              )}
              <label className="cursor-pointer px-8 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all hover:scale-105">
                Choose QR Image
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
            </motion.div>
          )}

          {/* ── Manual ── */}
          {mode === 'manual' && (
            <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-3xl border border-white/10 bg-slate-950 p-8 flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border-2 border-dashed border-violet-500/40 flex items-center justify-center">
                <Keyboard className="w-10 h-10 text-violet-400" />
              </div>
              <div className="text-center">
                <h3 className="text-white font-black text-lg mb-1">Manual Token Entry</h3>
                <p className="text-slate-400 text-sm">Type the QR token or vehicle plate to verify</p>
              </div>
              <form onSubmit={handleManual} className="w-full space-y-3">
                <input
                  type="text" value={manualToken} onChange={e => setManualToken(e.target.value)} autoFocus
                  placeholder="e.g. BIKE-2026-000001 or TN 14 AE 8495"
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3.5 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button type="submit" disabled={!manualToken.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed">
                  Verify Access Token →
                </button>
              </form>
              <div className="w-full pt-3 border-t border-white/10 space-y-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold text-center">Quick Test</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Valid QR',  token: 'TN-38-CC-5555',   color: 'text-emerald-400 border-emerald-500/30' },
                    { label: 'Expired',   token: 'expired-token',   color: 'text-amber-400  border-amber-500/30' },
                    { label: 'Disabled',  token: 'disabled-token',  color: 'text-red-400    border-red-500/30' },
                  ].map(({ label, token, color }) => (
                    <button key={token} onClick={() => navigate(`/verify/${token}`)}
                      className={`py-2 px-2 bg-slate-900 rounded-xl text-[10px] font-bold border ${color} hover:bg-slate-800 transition-all`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-slate-600 font-mono">
          MRF Innovation Park · Gate Security Verification System · All scans are logged
        </p>
      </div>
    </div>
  );
};

export default Scanner;
