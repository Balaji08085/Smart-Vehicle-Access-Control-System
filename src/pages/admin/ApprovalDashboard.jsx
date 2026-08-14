import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Eye, Clock, Building, Briefcase, Mail, Phone, Calendar, Hash, ShieldAlert, Printer, Ban, Trash2, Filter, Edit2, CalendarRange, Save } from 'lucide-react';
import QrSticker from '../../components/QrSticker';
import { useEntry } from '../../context/EntryContext';

const ApprovalDashboard = () => {
  const { addNotification } = useEntry();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [stickerRequest, setStickerRequest] = useState(null);
  const [rejectModalRequest, setRejectModalRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Edit Validity Modal State
  const [editModalRequest, setEditModalRequest] = useState(null);
  const [editForm, setEditForm] = useState({
    accessStartDate: '',
    accessExpiryDate: '',
    bikeNumber: '',
    name: '',
    department: '',
    designation: ''
  });

  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending', 'Approved', 'Rejected', 'Disabled', 'All'
  const [portalRole, setPortalRole] = useState('SuperAdmin'); // 'SuperAdmin' or 'CompanyOwner'

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  const fetchRequests = async (tab = 'Pending') => {
    setLoading(true);
    try {
      const url = tab === 'All' ? '/api/requests' : `/api/requests?status=${tab}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyApprove = async (id) => {
    try {
      const res = await fetch(`/api/requests/${id}/company-approve`, { method: 'PUT' });
      const data = await res.json();

      if (res.ok) {
        addNotification(`🏢 Tier-1 Approval Granted by Startup Owner (${data.request?.companyHead || 'Mr. Franklin'})! Forwarded to Super Admin.`, 'success');
        fetchRequests(activeTab);
        setSelectedRequest(null);
      } else {
        alert(`Approval Error: ${data.error || 'Failed to approve request'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error approving request');
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`/api/requests/${id}/approve`, { method: 'PUT' });
      const data = await res.json();

      if (res.ok) {
        const approvedReq = data.request;
        const qrToken = data.token || approvedReq?.token;

        addNotification(`🎉 Access Approved for ${approvedReq?.bikeNumber || 'Vehicle'}! QR Code Generated & Stored Permanently.`, 'success');
        
        fetchRequests(activeTab);
        setSelectedRequest(null);
        
        if (approvedReq) {
          setStickerRequest({ ...approvedReq, token: qrToken });
        }
      } else {
        alert(`Approval Error: ${data.error || 'Failed to approve request'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error approving request');
    }
  };

  const handleOpenRejectModal = (req) => {
    setRejectModalRequest(req);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalRequest) return;
    if (!rejectReason.trim()) {
      alert('Please enter a clear reason for rejection.');
      return;
    }

    try {
      const res = await fetch(`/api/requests/${rejectModalRequest._id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        addNotification(`Rejected request for ${rejectModalRequest.bikeNumber}. Rejection email dispatched.`, 'warning');
        fetchRequests(activeTab);
        setRejectModalRequest(null);
        setSelectedRequest(null);
        setRejectReason('');
      } else {
        alert(`Rejection error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error rejecting request');
    }
  };

  const handleDisable = async (id, bikeNumber) => {
    try {
      const res = await fetch(`/api/requests/${id}/disable`, { method: 'PUT' });
      if (res.ok) {
        addNotification(`🚫 Access disabled for ${bikeNumber || 'vehicle'}`, 'error');
        fetchRequests(activeTab);
        setSelectedRequest(null);
      } else {
        alert('Failed to disable access');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, bikeNumber) => {
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addNotification(`🗑️ Record deleted for ${bikeNumber || 'vehicle'}`, 'error');
        fetchRequests(activeTab);
        setSelectedRequest(null);
      } else {
        alert('Failed to delete record');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit Validity Modal
  const handleOpenEditModal = (req) => {
    const startStr = req.accessStartDate ? new Date(req.accessStartDate).toISOString().split('T')[0] : '';
    const expiryStr = req.accessExpiryDate ? new Date(req.accessExpiryDate).toISOString().split('T')[0] : '';

    setEditForm({
      accessStartDate: startStr,
      accessExpiryDate: expiryStr,
      bikeNumber: req.bikeNumber || '',
      name: req.name || '',
      department: req.department || '',
      designation: req.designation || ''
    });
    setEditModalRequest(req);
  };

  // Submit Edit Validity Form
  const handleSaveEditValidity = async (e) => {
    e.preventDefault();
    if (!editModalRequest) return;

    try {
      const res = await fetch(`/api/requests/${editModalRequest._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessStartDate: editForm.accessStartDate,
          accessExpiryDate: editForm.accessExpiryDate,
          bikeNumber: editForm.bikeNumber,
          name: editForm.name,
          department: editForm.department,
          designation: editForm.designation
        })
      });

      const data = await res.json();
      if (res.ok) {
        addNotification(`📅 Validity updated for ${editForm.bikeNumber || editModalRequest.bikeNumber}`, 'success');
        fetchRequests(activeTab);
        setEditModalRequest(null);
        if (selectedRequest && selectedRequest._id === editModalRequest._id) {
          setSelectedRequest(data.request || { ...selectedRequest, ...editForm });
        }
      } else {
        alert(`Update Error: ${data.error || 'Failed to update validity'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating validity');
    }
  };

  const tabs = ['Pending', 'Approved', 'Rejected', 'Disabled', 'All'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#120305] text-slate-900 dark:text-slate-100 p-4 md:p-8 pt-28 md:pt-32 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="p-6 md:p-8 rounded-3xl border border-[#701A1A]/20 dark:border-[#701A1A]/60 bg-gradient-to-r from-[#701A1A]/10 via-[#701A1A]/5 to-white dark:from-[#2A0A0F] dark:via-[#1E0609] dark:to-[#120305] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#701A1A]/10 dark:bg-red-950/60 text-[#701A1A] dark:text-red-300 border border-[#701A1A]/20 dark:border-[#701A1A] rounded-full text-xs font-black uppercase tracking-wider mb-2 shadow-sm">
              <Clock className="w-4 h-4 text-[#701A1A] dark:text-red-400" /> Admin Workflow Queue
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Vehicle Access Approvals</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 font-medium">Review requests, edit validity dates, approve permits, generate QR stickers, or issue rejection notices.</p>
          </div>

          {/* Tab Filters */}
          <div className="flex bg-slate-100 dark:bg-[#1E0609] p-1.5 rounded-2xl border border-slate-200 dark:border-[#5C121E] shrink-0 overflow-x-auto gap-1.5 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[#701A1A] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#2A0A0F]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <div className="w-10 h-10 border-4 border-[#701A1A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold uppercase tracking-wider">Fetching access requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#1E0609] rounded-3xl border border-slate-200 dark:border-[#5C121E] p-8 shadow-sm">
            <Check className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No requests found in '{activeTab}' queue</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Use the tabs above to filter by Pending, Approved, Rejected, or Disabled status.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-[#1E0609] rounded-3xl border border-slate-200 dark:border-[#5C121E] overflow-hidden hover:border-[#701A1A]/40 dark:hover:border-red-500/50 transition-all flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div className="p-6">
                  
                  {/* Top Row: User & Badge + Edit Button */}
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl border-2 border-[#701A1A]/30 dark:border-red-500/40 p-0.5 bg-slate-100 dark:bg-[#120305] shadow-xs shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={req.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
                          alt={req.name}
                          className="w-full h-full rounded-xl object-contain"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug truncate">{req.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{req.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                        req.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40' :
                        req.status === 'Pending Company Approval' ? 'bg-[#701A1A]/10 text-[#701A1A] border-[#701A1A]/30 dark:bg-[#701A1A]/30 dark:text-red-300' :
                        req.status === 'Pending Super Admin Approval' ? 'bg-[#701A1A]/10 text-[#701A1A] border-[#701A1A]/30 dark:bg-[#701A1A]/30 dark:text-red-300' :
                        req.status === 'Pending' ? 'bg-[#701A1A]/10 text-[#701A1A] border-[#701A1A]/30 dark:bg-[#701A1A]/30 dark:text-red-300' :
                        req.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/40' :
                        'bg-slate-100 dark:bg-[#2E080C] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#5C121E]'
                      }`}>
                        {req.status === 'Pending Company Approval' ? 'Tier 1 Pending' :
                         req.status === 'Pending Super Admin Approval' ? 'Tier 2 Pending' :
                         req.status}
                      </span>

                      {/* EDIT BADGE BUTTON NEXT TO APPROVED BADGE */}
                      <button
                        onClick={() => handleOpenEditModal(req)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all shadow-2xs"
                        title="Edit Validity Dates & Permit"
                      >
                        <Edit2 className="w-3 h-3 text-[#701A1A] dark:text-red-400" /> Edit Validity
                      </button>
                    </div>
                  </div>

                  {/* Bike Plate Number Highlight */}
                  <div className="bg-slate-100 dark:bg-slate-100 border-2 border-slate-300/80 rounded-2xl py-2.5 px-3 text-center mb-4 shadow-2xs relative flex items-center justify-center">
                    <div className="absolute left-3 flex items-center gap-1 font-mono text-[9px] font-black text-blue-900 border-r border-slate-300 pr-2 select-none">
                      <span className="text-[11px]">🇮🇳</span>
                      <span className="tracking-tight">IND</span>
                    </div>
                    <span className="font-mono text-lg md:text-xl font-black text-slate-900 dark:text-slate-900 tracking-[0.16em] uppercase pl-12">
                      {req.bikeNumber}
                    </span>
                  </div>

                  {/* Details summary */}
                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 mb-5 bg-slate-50 dark:bg-[#120305]/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-[#5C121E]">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                      <Building className="w-4 h-4 text-[#701A1A] dark:text-red-400 flex-shrink-0" />
                      <span className="truncate">{req.company} • {req.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                      <Briefcase className="w-4 h-4 text-[#701A1A] dark:text-red-400 flex-shrink-0" />
                      <span>{req.designation}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Calendar className="w-4 h-4 text-[#701A1A] dark:text-red-400 flex-shrink-0" />
                        <span className="truncate font-medium">
                          Valid: {new Date(req.accessStartDate).toLocaleDateString()} — {new Date(req.accessExpiryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenEditModal(req)}
                        className="text-[#701A1A] dark:text-red-400 hover:underline text-[10px] font-bold shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-slate-50 dark:bg-[#120305]/80 border-t border-slate-200 dark:border-[#5C121E] flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="flex-1 py-2.5 bg-white dark:bg-[#2A0A0F] hover:bg-slate-100 dark:hover:bg-[#3D0A11] text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-[#5C121E] shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" /> Details
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(req)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-slate-200 dark:border-white/10 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
                    title="Edit Validity Dates"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>

                  {(req.status === 'Pending Company Approval' || req.status === 'Pending') && (
                    <>
                      <button
                        onClick={() => handleOpenRejectModal(req)}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => handleCompanyApprove(req._id)}
                        className="py-2.5 px-3 bg-[#701A1A] hover:bg-[#5C121E] text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 shadow-sm transition-transform hover:scale-102"
                      >
                        Owner Approve
                      </button>
                    </>
                  )}

                  {req.status === 'Pending Super Admin Approval' && (
                    <>
                      <button
                        onClick={() => handleOpenRejectModal(req)}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req._id)}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 shadow-sm transition-transform hover:scale-102"
                      >
                        <Check className="w-3.5 h-3.5" /> Pass & Issue QR
                      </button>
                    </>
                  )}

                  {req.status === 'Approved' && (
                    <>
                      <button
                        onClick={() => setStickerRequest(req)}
                        className="py-2.5 px-3.5 bg-[#701A1A] hover:bg-[#5C121E] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        title="Print QR Sticker"
                      >
                        <Printer className="w-3.5 h-3.5" /> Sticker
                      </button>
                      <button
                        onClick={() => handleDisable(req._id, req.bikeNumber)}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-slate-200 dark:border-white/10 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
                        title="Disable Access"
                      >
                        <Ban className="w-3.5 h-3.5" /> Disable
                      </button>
                      <button
                        onClick={() => handleDelete(req._id, req.bikeNumber)}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-50/95 dark:bg-[#180305]/95 backdrop-blur-md z-50 overflow-y-auto p-4 pt-24 md:pt-28 pb-12 flex flex-col items-center justify-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1E0609] border border-slate-200 dark:border-[#5C121E] rounded-3xl w-full max-w-4xl p-6 md:p-10 relative shadow-2xl space-y-6"
          >
            {/* Top Modal Bar */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#5C121E] pb-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Request Details</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">ID: {selectedRequest._id}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="px-4 py-2 bg-[#701A1A] hover:bg-[#5C121E] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>

            {/* Profile Highlight Card */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 dark:bg-[#2A0A0F] p-6 rounded-2xl border border-slate-200 dark:border-[#5C121E]">
              <div className="w-28 h-28 rounded-2xl border-2 border-[#701A1A] p-0.5 bg-white shrink-0 overflow-hidden shadow-xs">
                <img
                  src={selectedRequest.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
                  alt={selectedRequest.name}
                  className="w-full h-full rounded-xl object-contain"
                />
              </div>
              <div className="text-center sm:text-left space-y-2 flex-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{selectedRequest.name}</h3>
                <div className="font-mono text-xl font-black text-slate-900 dark:text-slate-900 bg-amber-100 dark:bg-amber-100 inline-block px-4 py-1 rounded-xl border border-amber-300 shadow-2xs">
                  {selectedRequest.bikeNumber}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  {selectedRequest.designation} • {selectedRequest.company}
                </p>
              </div>
            </div>

            {/* Field Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-[#2A0A0F] p-4 rounded-xl border border-slate-200 dark:border-[#5C121E]">
                <span className="text-[11px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block mb-1">Employee / Student ID</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">{selectedRequest.employeeId || 'N/A'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#2A0A0F] p-4 rounded-xl border border-slate-200 dark:border-[#5C121E]">
                <span className="text-[11px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block mb-1">Department</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">{selectedRequest.department}</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#2A0A0F] p-4 rounded-xl border border-slate-200 dark:border-[#5C121E]">
                <span className="text-[11px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block mb-1">Email Address</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">{selectedRequest.email}</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#2A0A0F] p-4 rounded-xl border border-slate-200 dark:border-[#5C121E]">
                <span className="text-[11px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block mb-1">Mobile Phone</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">{selectedRequest.mobile}</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#2A0A0F] p-4 rounded-xl border border-slate-200 dark:border-[#5C121E]">
                <span className="text-[11px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block mb-1">Access Start Date</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">{new Date(selectedRequest.accessStartDate).toLocaleDateString()}</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#2A0A0F] p-4 rounded-xl border border-slate-200 dark:border-[#5C121E]">
                <span className="text-[11px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block mb-1">Access Expiry Date</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-base">{new Date(selectedRequest.accessExpiryDate).toLocaleDateString()}</span>
              </div>
            </div>

            {selectedRequest.actionReason && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 p-4 rounded-2xl">
                <span className="text-[11px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-1">Rejection Reason</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedRequest.actionReason}</p>
              </div>
            )}

            {/* Action Bar inside Modal */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => {
                  handleOpenEditModal(selectedRequest);
                  setSelectedRequest(null);
                }}
                className="flex-1 py-3.5 bg-[#701A1A] hover:bg-[#5C121E] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit Validity & Info
              </button>

              {selectedRequest.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleOpenRejectModal(selectedRequest)}
                    className="flex-1 py-3.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-900 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest._id)}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-102"
                  >
                    Approve & Generate QR
                  </button>
                </>
              )}

              {selectedRequest.status === 'Approved' && (
                <>
                  <button
                    onClick={() => setStickerRequest(selectedRequest)}
                    className="flex-1 py-3.5 bg-[#701A1A] hover:bg-[#5C121E] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Print QR Sticker
                  </button>
                  <button
                    onClick={() => handleDisable(selectedRequest._id, selectedRequest.bikeNumber)}
                    className="py-3.5 px-5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-900 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Disable
                  </button>
                  <button
                    onClick={() => handleDelete(selectedRequest._id, selectedRequest.bikeNumber)}
                    className="py-3.5 px-5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-700 dark:hover:text-rose-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* EDIT VALIDITY & REQUEST DETAILS MODAL */}
      {editModalRequest && (
        <div className="fixed inset-0 bg-slate-50/90 dark:bg-[#180305]/90 backdrop-blur-md flex flex-col items-center justify-start z-50 p-4 pt-24 md:pt-28 pb-12 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white dark:bg-[#1E0609] border border-slate-200 dark:border-[#5C121E] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 text-slate-900 dark:text-slate-100"
          >
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#5C121E] pb-3">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Edit Permit Validity Dates
              </h3>
              <button 
                onClick={() => setEditModalRequest(null)} 
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-[#2A0A0F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditValidity} className="space-y-4 text-xs">
              
              <div className="bg-slate-50 dark:bg-[#2A0A0F] p-4 rounded-2xl border border-slate-200 dark:border-[#5C121E]">
                <p className="text-[11px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider mb-1.5">Vehicle License Plate</p>
                <input
                  type="text"
                  required
                  value={editForm.bikeNumber}
                  onChange={(e) => setEditForm({ ...editForm, bikeNumber: e.target.value })}
                  placeholder="e.g. TN 07 AF 6432"
                  className="w-full bg-white dark:bg-[#120305] border border-slate-200 dark:border-[#5C121E] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono text-sm font-black uppercase shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#2A0A0F] border border-slate-200 dark:border-[#5C121E] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-extrabold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#2A0A0F] border border-slate-200 dark:border-[#5C121E] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-extrabold text-xs"
                  />
                </div>
              </div>

              {/* DATE PICKERS SECTION FOR VALIDITY */}
              <div className="bg-slate-50 dark:bg-[#2A0A0F] p-4 rounded-2xl border border-slate-200 dark:border-[#5C121E] space-y-3">
                <span className="text-[11px] font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider block">
                  Sticker Validity Period (Start — Expiry)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={editForm.accessStartDate}
                      onChange={(e) => setEditForm({ ...editForm, accessStartDate: e.target.value })}
                      className="w-full bg-white dark:bg-[#120305] border border-slate-200 dark:border-[#5C121E] rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-mono font-bold text-xs shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={editForm.accessExpiryDate}
                      onChange={(e) => setEditForm({ ...editForm, accessExpiryDate: e.target.value })}
                      className="w-full bg-white dark:bg-[#120305] border border-slate-200 dark:border-[#5C121E] rounded-xl px-3 py-2.5 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalRequest(null)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#701A1A] hover:bg-[#5C121E] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-transform hover:scale-102"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalRequest && (
        <div className="fixed inset-0 bg-slate-50/90 dark:bg-[#180305]/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E0609] border border-rose-200 dark:border-rose-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#5C121E] pb-3">
              <h3 className="text-xl font-black text-rose-700 dark:text-rose-400">
                Confirm Rejection
              </h3>
              <button onClick={() => setRejectModalRequest(null)} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-[#2A0A0F]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Rejecting access for <strong className="text-slate-900 dark:text-white font-mono">{rejectModalRequest.bikeNumber}</strong> ({rejectModalRequest.name}). A formal rejection email will be dispatched automatically.
            </p>

            <div>
              <label className="block text-xs font-black text-[#701A1A] dark:text-red-400 uppercase tracking-wider mb-2">
                Reason for Rejection (Required) *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid insurance documents provided / Duplicate vehicle record..."
                rows="4"
                className="w-full bg-slate-50 dark:bg-[#2A0A0F] border border-slate-200 dark:border-[#5C121E] rounded-xl p-3 text-slate-900 dark:text-white text-xs font-medium outline-none focus:border-[#701A1A] transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRejectModalRequest(null)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-transform hover:scale-102"
              >
                Confirm & Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable QR Sticker Modal */}
      {stickerRequest && (
        <QrSticker
          request={stickerRequest}
          token={stickerRequest.token}
          onClose={() => setStickerRequest(null)}
        />
      )}

    </div>
  );
};

export default ApprovalDashboard;
