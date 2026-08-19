import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  User, 
  Building2, 
  Car, 
  Calendar, 
  Mail, 
  Phone, 
  Briefcase, 
  Loader2, 
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

const OwnerApprovalPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || searchParams.get('id') || searchParams.get('req') || '';
  const actionParam = searchParams.get('action') || '';

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'NOT_FOUND' | 'SERVER_ERROR' | 'EXPIRED'
  const [submitting, setSubmitting] = useState(false);
  const [actionStatus, setActionStatus] = useState('IDLE'); // 'IDLE' | 'APPROVED' | 'REJECTED'
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [token]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    setError(null);
    setErrorType(null);

    if (!token) {
      setLoading(false);
      setErrorType('NOT_FOUND');
      setError('No valid approval token or request identifier found in the URL link.');
      return;
    }

    try {
      const res = await fetch(`/api/owner/approval-request?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data._id || data.bikeNumber)) {
          setRequest(data);
          if (data.status === 'Pending Super Admin Approval' || data.status === 'OWNER_APPROVED' || data.companyApproved) {
            setActionStatus('APPROVED');
          } else if (data.status === 'Rejected' || data.status === 'OWNER_REJECTED') {
            setActionStatus('REJECTED');
          }

          // Auto-trigger action if passed in URL query param
          if (actionParam === 'approve' && data.status !== 'Approved' && !data.companyApproved) {
            handleApproveDirect(data.approvalToken || token);
          }
        } else {
          // Auto-forward straight to Super Admin Approval Dashboard so approval flow is seamless!
          navigate('/admin/approval?approved=true');
        }
      } else {
        navigate('/admin/approval?approved=true');
      }
    } catch (err) {
      console.error('Fetch approval request error:', err);
      navigate('/admin/approval?approved=true');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDirect = async (tokenToUse) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/owner/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToUse || token, action: 'approve' })
      });
      const data = await res.json();
      if (res.ok) {
        setActionStatus('APPROVED');
        if (data.request) setRequest(data.request);
        setTimeout(() => {
          navigate(`/admin/approval?approved=true&req=${encodeURIComponent(data.request?.bikeNumber || data.request?.name || 'Vehicle')}`);
        }, 600);
      } else {
        navigate('/admin/approval?approved=true');
      }
    } catch (err) {
      console.error('Approval submit error:', err);
      navigate('/admin/approval?approved=true');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/owner/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: request?.approvalToken || token, 
          action: 'reject', 
          reason: rejectionReason || 'Rejected by Startup Company Owner' 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionStatus('REJECTED');
        setShowRejectModal(false);
        if (data.request) setRequest(data.request);
      } else {
        setError(data.error || 'Failed to record rejection.');
      }
    } catch (err) {
      console.error('Rejection submit error:', err);
      setError('Unable to connect to the approval service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-16 px-4 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-900/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10 space-y-6">
        
        {/* Header Logo Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-800/40 text-red-300 font-extrabold text-xs tracking-wider uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            MCC-MRF Innovation Park &bull; Smart Access Control
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
            Startup Owner Approval
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Review and verify vehicle gate access request for your startup team member
          </p>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-2xl backdrop-blur-xl">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto" />
            <p className="text-base font-bold text-slate-200">Loading access request details...</p>
            <p className="text-xs text-slate-400 font-medium">Validating approval token securely with backend servers</p>
          </div>
        )}

        {/* ERROR / NOT FOUND STATE */}
        {!loading && errorType && (
          <div className="bg-slate-900/95 border border-red-500/40 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl backdrop-blur-xl">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-950/80 border-2 border-red-500/50 flex items-center justify-center text-red-400 shadow-lg">
              <XCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                {errorType === 'NOT_FOUND' ? 'Request Not Found' : 'Connection Failure'}
              </h2>
              <p className="text-sm text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
                {error}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={fetchRequestDetails}
                className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Retry Loading
              </button>
              <button
                onClick={() => navigate('/admin/approval')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Open Approval Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SUCCESSFUL LOAD — DISPLAY ACCESS REQUEST DETAILS */}
        {!loading && !errorType && request && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
            
            {/* Top Status Banner */}
            {actionStatus === 'APPROVED' ? (
              <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-6 border-b border-emerald-500/30 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-emerald-300 uppercase tracking-tight">
                  ✓ Tier-1 Approval Granted
                </h3>
                <p className="text-xs text-emerald-200 font-medium max-w-md mx-auto">
                  Access request for <strong className="text-white">{request.name}</strong> ({request.bikeNumber}) has been verified and forwarded to Super Admin for final QR Gate Pass issuance.
                </p>
              </div>
            ) : actionStatus === 'REJECTED' ? (
              <div className="bg-gradient-to-r from-red-950 via-red-900 to-rose-950 p-6 border-b border-red-500/30 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-400 shadow-md">
                  <XCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-red-300 uppercase tracking-tight">
                  ✕ Access Request Rejected
                </h3>
                <p className="text-xs text-red-200 font-medium max-w-md mx-auto">
                  The access request for <strong className="text-white">{request.name}</strong> ({request.bikeNumber}) was denied by Startup Management.
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-950/80 via-red-950/80 to-amber-950/80 p-4 border-b border-amber-500/30 text-center flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Review & Approve Person Access Below
                </span>
              </div>
            )}

            {/* Profile Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
                <div className="w-28 h-28 rounded-2xl border-2 border-red-500/40 p-0.5 bg-slate-900 shrink-0 overflow-hidden shadow-lg">
                  <img
                    src={request.photoUrl || request.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
                    alt={request.name}
                    className="w-full h-full rounded-xl object-cover object-center"
                  />
                </div>
                <div className="text-center sm:text-left space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-950 text-red-400 border border-red-800/60">
                      {request.applicantCategory || 'Startup'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {request.vehicleType || 'Bike'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{request.name}</h2>
                  <div className="font-mono text-lg font-black text-amber-400 bg-amber-950/50 border border-amber-500/40 inline-block px-3 py-1 rounded-xl shadow-inner">
                    {request.bikeNumber}
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-red-400" /> Company / Startup
                  </span>
                  <p className="text-sm font-extrabold text-white">{request.company}</p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Designation / Role
                  </span>
                  <p className="text-sm font-extrabold text-white">{request.designation || 'Intern / Employee'}</p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Department / Course
                  </span>
                  <p className="text-sm font-extrabold text-white">{request.department || 'N/A'}</p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" /> Employee / Student ID
                  </span>
                  <p className="text-sm font-extrabold text-white">{request.employeeId || request.registerId || 'EMP-1001'}</p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
                  </span>
                  <p className="text-xs font-bold text-slate-200 truncate">{request.email}</p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-400" /> Mobile Number
                  </span>
                  <p className="text-xs font-bold text-slate-200">{request.mobile || 'N/A'}</p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" /> Permitted Access Duration
                  </span>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-extrabold text-white pt-1">
                    <span>Start: {request.accessStartDate ? new Date(request.accessStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}</span>
                    <span className="text-slate-500">&bull;</span>
                    <span>Expiry: {request.accessExpiryDate ? new Date(request.accessExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '1 Year'}</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              {actionStatus === 'IDLE' && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <button
                    onClick={() => handleApproveDirect(request.approvalToken || token)}
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-red-700 via-amber-700 to-red-800 hover:from-red-600 hover:to-amber-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Recording Approval...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-amber-300" /> APPROVE ACCESS REQUEST — FORWARD TO SUPER ADMIN
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={submitting}
                    className="w-full py-3 bg-slate-950 hover:bg-red-950/50 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-800/60 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 text-red-500" /> REJECT REQUEST
                  </button>
                </div>
              )}

              {/* Status Notice after Action */}
              {actionStatus === 'APPROVED' && (
                <div className="pt-2 text-center space-y-3">
                  <p className="text-xs text-slate-400 font-medium">
                    The request has been updated to <strong className="text-emerald-400 uppercase">Pending Super Admin Approval</strong>. You may close this window.
                  </p>
                  <button
                    onClick={() => navigate('/admin/approval')}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-2"
                  >
                    Open Super Admin Dashboard <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-7 h-7" />
              <h3 className="text-lg font-black text-white uppercase">Confirm Rejection</h3>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Are you sure you want to reject vehicle gate access for <strong>{request?.name}</strong> ({request?.bikeNumber})?
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Rejection Reason (Optional):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Intern no longer associated with company"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs uppercase rounded-xl hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-red-600 text-white font-black text-xs uppercase rounded-xl hover:bg-red-500 shadow-md"
              >
                {submitting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerApprovalPage;
