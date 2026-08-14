import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
        console.warn('Camera Tier 2 failed, trying Tier 3 (any video device):', err2);
        try {
          // Tier 3: Any video device
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (err3) {
          console.error('All camera tiers failed:', err3);
          busyRef.current = false;
          if (!mountedRef.current) return;
          let msg = 'Unable to access camera.';
          if (err3.name === 'NotAllowedError' || err3.name === 'PermissionDeniedError') {
            msg = 'Camera permission was denied. Please tap the Lock / Site Settings icon in your browser address bar, set Camera to ALLOW, then click Request Permission.';
          } else if (err3.name === 'NotFoundError' || err3.name === 'DevicesNotFoundError') {
            msg = 'No camera found on this device. Please use "Upload QR" or "Manual Token".';
          } else if (err3.name === 'NotReadableError' || err3.name === 'TrackStartError') {
            msg = 'Camera is in use by another application. Please close other camera apps and retry.';
          }
          setCamErrMsg(msg);
          setCamStatus('error');
          return;
        }
      }
    }

    if (!mountedRef.current) {
      stream.getTracks().forEach(t => t.stop());
      busyRef.current = false;
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) { busyRef.current = false; return; }

    video.srcObject = stream;

    const onReady = () => {
      video.removeEventListener('loadedmetadata', onReady);
      video.play()
        .then(() => {
          if (!mountedRef.current) return;
          setCamStatus('ready');
          busyRef.current = false;
          scanLoop();
        })
        .catch(err => {
          console.error('video.play() failed:', err);
          busyRef.current = false;
          if (mountedRef.current) {
            setCamErrMsg('Could not start video preview.');
            setCamStatus('error');
          }
        });
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
    <div className="min-h-screen pt-20 pb-12 px-4 bg-slate-50 dark:bg-[#180305] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#701A1A]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-xl w-full space-y-4 relative z-10">

        {/* Header */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-[#5C121E] bg-white dark:bg-[#1E0609] shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="px-4 py-2.5 bg-[#701A1A] hover:bg-[#5C121E] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm hover:scale-102 active:scale-98"
            >
              Back to Dashboard
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                QR Scanner Terminal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Security Guard Real-Time Gate Check</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-[#701A1A]/10 border border-[#701A1A]/30 dark:bg-[#701A1A]/30 dark:border-red-500/40 text-[#701A1A] dark:text-red-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#701A1A] dark:bg-red-400 animate-ping" />
            LIVE
          </div>
        </div>

        {/* Mode tabs */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'camera', label: 'Live Camera' },
            { id: 'upload', label: 'Upload QR' },
            { id: 'manual', label: 'Manual Token' },
          ].map(({ id, label }) => (
            <button key={id}
              onClick={() => { setMode(id); setCamErrMsg(''); setUploadError(''); setUploadPreview(null); setScanned(false); }}
              className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center transition-all border
                ${mode === id 
                  ? 'bg-gradient-to-r from-[#701A1A] to-[#8C1823] text-white border-[#5C121E] shadow-md' 
                  : 'bg-white dark:bg-[#1E0609] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#5C121E] hover:bg-slate-100 dark:hover:bg-[#2A0A0F]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">

          {/* ── Camera ── */}
          {mode === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-3xl border border-slate-200 dark:border-[#5C121E] bg-white dark:bg-[#1E0609] overflow-hidden shadow-2xl relative"
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
                <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <span className="px-4 py-2 bg-emerald-600 text-white text-sm font-black rounded-full uppercase tracking-wider shadow-lg">
                    SCAN SUCCESSFUL
                  </span>
                  <p className="text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold">Redirecting to Gate Verification...</p>
                </div>
              )}

              {/* Loading spinner */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#1E0609]">
                  <div className="w-12 h-12 border-4 border-[#701A1A] border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-900 dark:text-white text-sm font-bold tracking-wide">Starting Camera Stream...</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Please allow camera access if prompted</p>
                </div>
              )}

              {/* Error state */}
              {hasErr && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#1E0609] p-6 text-center overflow-y-auto">
                  <div className="px-4 py-1.5 rounded-full bg-[#701A1A]/10 dark:bg-[#701A1A]/30 border border-[#701A1A]/30 dark:border-red-500/40 text-[#701A1A] dark:text-red-300 text-[11px] font-black uppercase tracking-widest">
                    Camera Access Blocked
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-relaxed max-w-sm">
                    {camErrMsg}
                  </p>

                  {/* Step-by-Step Permission Instruction Box */}
                  <div className="w-full max-w-sm bg-white dark:bg-[#2A0A0F] border border-slate-200 dark:border-[#5C121E] p-4 rounded-2xl text-left space-y-2 text-xs shadow-sm">
                    <p className="font-extrabold text-[#701A1A] dark:text-amber-400 uppercase tracking-wider text-[10px]">How to unblock camera in browser:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                      <li>Tap the <span className="font-bold text-slate-900 dark:text-white">Lock / Site Settings</span> option in your browser address bar.</li>
                      <li>Set <span className="font-bold text-emerald-700 dark:text-emerald-400">Camera</span> permission to <span className="font-bold text-emerald-700 dark:text-emerald-400">ALLOW</span>.</li>
                      <li>Click <span className="font-bold text-[#701A1A] dark:text-red-400">Retry Camera</span> below to launch stream.</li>
                    </ol>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center pt-1">
                    <button 
                      onClick={() => startCamera(facingUser)}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#701A1A] to-[#8C1823] hover:from-[#5C121E] hover:to-[#701A1A] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                    >
                      Retry Camera
                    </button>
                    <button 
                      onClick={() => startCamera(!facingUser)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#2E080C] dark:hover:bg-[#3D0A11] text-slate-800 dark:text-slate-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200 dark:border-[#5C121E]"
                    >
                      Switch Camera
                    </button>
                    <button 
                      onClick={() => setMode('upload')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#2E080C] dark:hover:bg-[#3D0A11] text-slate-800 dark:text-slate-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200 dark:border-[#5C121E]"
                    >
                      Upload QR
                    </button>
                  </div>
                </div>
              )}

              {/* Idle / Stopped Camera state */}
              {camStatus === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#180305] p-6 text-center">
                  <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-[#2A0A0F] border border-slate-200 dark:border-[#5C121E] text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest">
                    Camera Stream Paused
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium max-w-xs">
                    Live video stream is paused. Click below to start scanning again.
                  </p>
                  <button 
                    onClick={() => startCamera(facingUser)}
                    className="px-6 py-3 bg-gradient-to-r from-[#701A1A] to-[#8C1823] hover:from-[#5C121E] hover:to-[#701A1A] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    Start Camera
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
                      className="px-3.5 py-1.5 rounded-full bg-rose-950/90 hover:bg-rose-900 text-rose-300 font-extrabold text-xs uppercase tracking-wider border border-rose-500/40 transition-all shadow-md active:scale-95"
                    >
                      Stop Camera
                    </button>
                    <button 
                      onClick={handleFlip}
                      className="px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider border border-white/20 transition-all shadow-md active:scale-95"
                    >
                      Flip Camera
                    </button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur px-4 py-2.5 flex justify-between items-center z-20">
                    <span className="text-xs font-mono text-slate-300">Point camera at the QR code...</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">ACTIVE</span>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── Upload ── */}
          {mode === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-3xl border border-slate-200 dark:border-[#5C121E] bg-white dark:bg-[#1E0609] p-8 flex flex-col items-center gap-5 shadow-xl">
              {uploadPreview
                ? <img src={uploadPreview} alt="Preview" className="w-52 h-52 object-contain bg-white rounded-2xl shadow-xl border border-slate-200" />
                : <div className="w-28 h-28 rounded-3xl bg-[#701A1A]/10 border-2 border-dashed border-[#701A1A]/40 flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-xs font-bold text-[#701A1A] dark:text-red-400 uppercase font-mono">Select Image</span>
                  </div>
              }
              <p className="text-slate-600 dark:text-slate-300 text-sm text-center font-medium">Upload a photo of the QR sticker to verify access</p>
              {uploadError && (
                <div className="text-rose-700 dark:text-rose-300 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 px-4 py-2.5 rounded-2xl">
                  {uploadError}
                </div>
              )}
              <label className="cursor-pointer px-8 py-3.5 bg-gradient-to-r from-[#701A1A] to-[#8C1823] hover:from-[#5C121E] hover:to-[#701A1A] text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all hover:scale-105">
                Choose QR Image
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
            </motion.div>
          )}

          {/* ── Manual ── */}
          {mode === 'manual' && (
            <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-3xl border border-slate-200 dark:border-[#5C121E] bg-white dark:bg-[#1E0609] p-8 flex flex-col items-center gap-5 shadow-xl">
              <div className="w-20 h-20 rounded-3xl bg-[#701A1A]/10 border-2 border-dashed border-[#701A1A]/40 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-[#701A1A] dark:text-red-400 uppercase">TOKEN</span>
              </div>
              <div className="text-center">
                <h3 className="text-slate-900 dark:text-white font-black text-lg mb-1">Manual Token Entry</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Type the QR token or vehicle plate to verify</p>
              </div>
              <form onSubmit={handleManual} className="w-full space-y-3">
                <input
                  type="text" value={manualToken} onChange={e => setManualToken(e.target.value)} autoFocus
                  placeholder="e.g. BIKE-2026-000001 or TN 14 AE 8495"
                  className="w-full bg-slate-50 dark:bg-[#120305] border border-slate-200 dark:border-[#5C121E] rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white font-mono text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#701A1A] transition-colors"
                />
                <button type="submit" disabled={!manualToken.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-[#701A1A] to-[#8C1823] hover:from-[#5C121E] hover:to-[#701A1A] text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                  Verify Access Token →
                </button>
              </form>
              <div className="w-full pt-3 border-t border-slate-200 dark:border-[#5C121E] space-y-2">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold text-center">Quick Test</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Valid QR',  token: 'TN-38-CC-5555',   color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30' },
                    { label: 'Expired',   token: 'expired-token',   color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30' },
                    { label: 'Disabled',  token: 'disabled-token',  color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30' },
                  ].map(({ label, token, color }) => (
                    <button key={token} onClick={() => navigate(`/verify/${token}`)}
                      className={`py-2 px-2 rounded-xl text-[10px] font-bold border ${color} hover:opacity-80 transition-all`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          MRF Innovation Park · Gate Security Verification System · All scans are logged
        </p>
      </div>
    </div>
  );
};

export default Scanner;
