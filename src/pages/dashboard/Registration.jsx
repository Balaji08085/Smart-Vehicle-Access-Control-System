import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, QrCode, CheckCircle2, Search, Trash2, Ban, Building,
  Calendar, Eye, Clock, Download, Printer, Share2, User, Mail,
  Phone, Briefcase, Hash, AlertTriangle, X, Users, Zap,
  RefreshCw, ChevronDown, Star, ToggleLeft, BadgeCheck,
  Sparkles, Upload, Copy, Check, AlertCircle, ShieldAlert,
  Activity, TrendingUp, BarChart3, Lock
} from 'lucide-react';
import { useEntry, getDaysRemaining, getValidityStatus, formatDateDisplay } from '../../context/EntryContext';

// ─────────────────────────────────────────────
// Utility: Generate unique Employee ID
// ─────────────────────────────────────────────
const generateEmployeeId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EMP-${year}-${rand}`;
};

// ─────────────────────────────────────────────
// Utility: Calculate expiry from issue + type
// ─────────────────────────────────────────────
const calcExpiry = (issueDate, validityType, customDate) => {
  if (validityType === 'Custom Date') return customDate || '';
  if (validityType === 'Permanent') return '2099-12-31';
  const d = new Date(issueDate);
  if (isNaN(d.getTime())) return '';
  switch (validityType) {
    case '1 Month':  d.setMonth(d.getMonth() + 1); break;
    case '3 Months': d.setMonth(d.getMonth() + 3); break;
    case '6 Months': d.setMonth(d.getMonth() + 6); break;
    case '1 Year':   d.setFullYear(d.getFullYear() + 1); break;
    default: break;
  }
  return d.toISOString().split('T')[0];
};

// ─────────────────────────────────────────────
// Status badge helper
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    Active:         { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
    'Expiring Soon':{ cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',    dot: 'bg-amber-400 animate-pulse' },
    Expired:        { cls: 'bg-red-500/15 text-red-400 border-red-500/30',           dot: 'bg-red-400' },
    Suspended:      { cls: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30',        dot: 'bg-zinc-400' },
    Blacklisted:    { cls: 'bg-red-900/30 text-red-300 border-red-700/30',           dot: 'bg-red-300' },
  }[status] || { cls: 'bg-zinc-700/50 text-zinc-400 border-zinc-600', dot: 'bg-zinc-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────
// Input Field
// ─────────────────────────────────────────────
const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full bg-zinc-900/80 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:bg-zinc-900 transition-all duration-200";
const selectCls = "w-full bg-zinc-900/80 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all duration-200 appearance-none cursor-pointer";

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const StaffRegistration = () => {
  const {
    users, registerUser, deleteUser,
    suspendQR, reactivateQR, renewQR, changeExpiryDate, clearAllData
  } = useEntry();

  const today = new Date().toISOString().split('T')[0];

  // ── Form State ──────────────────────────────
  const [form, setForm] = useState({
    staffName: '',
    employeeId: generateEmployeeId(),
    department: '',
    designation: '',
    mobile: '',
    email: '',
    photo: '',
    validityType: '1 Year',
    customExpiry: '',
    issueDate: today,
  });
  const [expiryDate, setExpiryDate] = useState('');
  const [autoId, setAutoId] = useState(true);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedStaff, setGeneratedStaff] = useState(null);
  const [copied, setCopied] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // ── Directory State ──────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [customExtendDate, setCustomExtendDate] = useState('');
  const [showExtendCustom, setShowExtendCustom] = useState(false);
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'directory'

  // ── Compute expiry live ──────────────────────
  useEffect(() => {
    setExpiryDate(calcExpiry(form.issueDate, form.validityType, form.customExpiry));
  }, [form.issueDate, form.validityType, form.customExpiry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: '' }));
  };

  const regenerateId = () => {
    setForm(p => ({ ...p, employeeId: generateEmployeeId() }));
  };

  const handlePhotoUrl = (e) => {
    const url = e.target.value;
    setForm(p => ({ ...p, photo: url }));
    setPhotoPreview(url);
  };

  // ── Validate ─────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.staffName.trim()) errs.staffName = 'Staff name is required';
    if (!form.employeeId.trim()) errs.employeeId = 'Employee ID is required';
    if (!form.department) errs.department = 'Department is required';
    if (!form.designation.trim()) errs.designation = 'Designation is required';
    if (!form.mobile.trim()) errs.mobile = 'Mobile number is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (form.validityType === 'Custom Date' && !form.customExpiry) errs.customExpiry = 'Please select a custom date';

    // Check duplicate employee ID
    const duplicate = Object.values(users).find(
      u => u.registerId && u.registerId.toLowerCase() === form.employeeId.toLowerCase()
    );
    if (duplicate) errs.employeeId = 'This Employee ID already exists';

    return errs;
  };

  // ── Submit ────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200)); // Premium loading feel

    const qrId = `STAFF-${form.employeeId}-${Date.now().toString().slice(-6)}`;
    const computed = calcExpiry(form.issueDate, form.validityType, form.customExpiry);

    const newStaff = {
      id: qrId,
      type: 'Staff',
      name: form.staffName,
      registerId: form.employeeId,
      department: form.department,
      designation: form.designation,
      mobile: form.mobile,
      email: form.email,
      photo: form.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.staffName)}&size=400&background=6366f1&color=fff&bold=true`,
      status: 'Active',
      hostelOrDay: 'N/A',
      vehicleDetails: null,
      qrId: qrId,
      issueDate: form.issueDate,
      registrationDate: form.issueDate,
      expiryDate: computed,
      // QR encodes the employeeId as plain text for reliable scanner lookup
      qrImage: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(form.employeeId)}&format=png&margin=10&color=000000`,
    };

    registerUser(newStaff);
    setGeneratedStaff(newStaff);
    setSubmitting(false);
    setActiveTab('directory');
  };

  const resetForm = () => {
    setForm({
      staffName: '',
      employeeId: generateEmployeeId(),
      department: '',
      designation: '',
      mobile: '',
      email: '',
      photo: '',
      validityType: '1 Year',
      customExpiry: '',
      issueDate: today,
    });
    setPhotoPreview('');
    setFormErrors({});
    setGeneratedStaff(null);
    setAutoId(true);
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ── Directory filter ──────────────────────────
  const allStaff = Object.values(users);
  const filteredStaff = allStaff.filter(s => {
    const matchSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    const vs = getValidityStatus(s);
    const matchFilter = filterStatus === 'All' ? true : vs === filterStatus;
    return matchSearch && matchFilter;
  });

  // ── Stats ─────────────────────────────────────
  const totalStaff = allStaff.length;
  const activeCount = allStaff.filter(s => getValidityStatus(s) === 'Active').length;
  const expiredCount = allStaff.filter(s => getValidityStatus(s) === 'Expired').length;
  const expiringCount = allStaff.filter(s => getValidityStatus(s) === 'Expiring Soon').length;
  const suspendedCount = allStaff.filter(s => getValidityStatus(s) === 'Suspended').length;

  const departments = [
    'Computer Science & Engineering', 'Information Technology', 'Electronics & Communication',
    'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Management Studies', 'Administration', 'Finance & Accounts',
    'Human Resources', 'Library', 'Sports & Physical Education',
    'Security', 'Facilities Management', 'Research & Development',
  ];

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#080810] px-4 sm:px-6 lg:px-8 relative overflow-x-hidden text-slate-100 font-sans">

      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[700px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-violet-600/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/4 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">

        {/* ── Page Header ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-950/70 backdrop-blur-2xl p-6 rounded-2xl border border-white/6 shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-lg" />
              <div className="relative bg-gradient-to-br from-indigo-600/30 to-violet-600/20 p-3.5 rounded-2xl border border-indigo-500/30">
                <Shield className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase">
                  Staff Registration
                </h1>
                <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-md text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Admin</span>
              </div>
              <p className="text-slate-500 text-xs font-medium mt-0.5">
                Register new staff members and generate secure QR codes for campus access
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'Total', value: totalStaff, color: 'text-white' },
              { label: 'Active', value: activeCount, color: 'text-emerald-400' },
              { label: 'Expiring', value: expiringCount, color: 'text-amber-400' },
              { label: 'Expired', value: expiredCount, color: 'text-red-400' },
              { label: 'Suspended', value: suspendedCount, color: 'text-zinc-400' },
            ].map(s => (
              <div key={s.label} className="text-center bg-white/[0.03] border border-white/6 rounded-xl px-3 py-2 min-w-[56px]">
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] font-bold uppercase text-slate-600 tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Tab Navigation ──────────────────────────────── */}
        <div className="flex gap-2">
          {[
            { id: 'register', label: 'Register Staff', icon: User },
            { id: 'directory', label: `Staff Directory (${totalStaff})`, icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                activeTab === tab.id
                  ? 'bg-indigo-600 border-indigo-500/60 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                  : 'bg-zinc-900/60 border-white/6 text-slate-400 hover:text-white hover:border-white/15'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ════════════════════════════════════════════
              TAB 1: REGISTRATION FORM
          ════════════════════════════════════════════ */}
          {activeTab === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >

              {/* Left: Form Panel */}
              <div className="lg:col-span-7 bg-zinc-950/60 backdrop-blur-2xl rounded-3xl border border-white/6 shadow-2xl overflow-hidden">

                {/* Form Header */}
                <div className="bg-white/[0.02] border-b border-white/5 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                      <User className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-widest">New Staff Registration</h2>
                      <p className="text-[10px] text-slate-500 mt-0.5">Fill in the details to issue a secure QR pass</p>
                    </div>
                  </div>
                  <button onClick={resetForm} className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 uppercase font-bold tracking-wider transition-colors">
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <form onSubmit={handleRegister} className="p-8 space-y-8">

                  {/* ── Section 1: Identity ── */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-4 h-px bg-indigo-500/50" /> Staff Identity
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Full Name *" className="md:col-span-2">
                        <input
                          name="staffName"
                          value={form.staffName}
                          onChange={handleChange}
                          placeholder="e.g. Dr. Ramesh Kumar"
                          className={inputCls + (formErrors.staffName ? ' border-red-500/50' : '')}
                        />
                        {formErrors.staffName && <p className="text-red-400 text-[10px] mt-1">{formErrors.staffName}</p>}
                      </Field>

                      <Field label="Employee ID *">
                        <div className="relative flex gap-2">
                          <input
                            name="employeeId"
                            value={form.employeeId}
                            onChange={handleChange}
                            disabled={autoId}
                            placeholder="Auto-generated"
                            className={inputCls + (formErrors.employeeId ? ' border-red-500/50' : '') + (autoId ? ' opacity-60 cursor-not-allowed' : '')}
                          />
                          <button
                            type="button"
                            onClick={regenerateId}
                            className="flex-shrink-0 p-2.5 bg-zinc-800 hover:bg-zinc-700 border border-white/8 rounded-xl transition-colors"
                            title="Generate new ID"
                          >
                            <RefreshCw className="w-4 h-4 text-indigo-400" />
                          </button>
                        </div>
                        {formErrors.employeeId && <p className="text-red-400 text-[10px] mt-1">{formErrors.employeeId}</p>}
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input type="checkbox" checked={autoId} onChange={e => setAutoId(e.target.checked)} className="w-3 h-3 accent-indigo-500" />
                          <span className="text-[10px] text-slate-500">Auto-generate ID</span>
                        </label>
                      </Field>

                      <Field label="Department *">
                        <select name="department" value={form.department} onChange={handleChange} className={selectCls + (formErrors.department ? ' border-red-500/50' : '')}>
                          <option value="">Select Department...</option>
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {formErrors.department && <p className="text-red-400 text-[10px] mt-1">{formErrors.department}</p>}
                      </Field>

                      <Field label="Designation *">
                        <input
                          name="designation"
                          value={form.designation}
                          onChange={handleChange}
                          placeholder="e.g. Senior Lecturer"
                          className={inputCls + (formErrors.designation ? ' border-red-500/50' : '')}
                        />
                        {formErrors.designation && <p className="text-red-400 text-[10px] mt-1">{formErrors.designation}</p>}
                      </Field>

                      <Field label="Mobile Number *">
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                          <input
                            name="mobile"
                            type="tel"
                            value={form.mobile}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className={inputCls + ' pl-9' + (formErrors.mobile ? ' border-red-500/50' : '')}
                          />
                        </div>
                        {formErrors.mobile && <p className="text-red-400 text-[10px] mt-1">{formErrors.mobile}</p>}
                      </Field>

                      <Field label="Email Address *">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                          <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="name@college.edu"
                            className={inputCls + ' pl-9' + (formErrors.email ? ' border-red-500/50' : '')}
                          />
                        </div>
                        {formErrors.email && <p className="text-red-400 text-[10px] mt-1">{formErrors.email}</p>}
                      </Field>
                    </div>
                  </div>

                  {/* ── Section 2: Photo ── */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-4 h-px bg-violet-500/50" /> Staff Photo
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        {photoPreview ? (
                          <img src={photoPreview} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg" onError={() => setPhotoPreview('')} />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border-2 border-dashed border-white/10 flex flex-col items-center justify-center">
                            <User className="w-7 h-7 text-zinc-600" />
                          </div>
                        )}
                        {photoPreview && (
                          <button type="button" onClick={() => { setPhotoPreview(''); setForm(p => ({ ...p, photo: '' })); }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-400 transition-colors">
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          name="photo"
                          value={form.photo}
                          onChange={handlePhotoUrl}
                          placeholder="Paste photo URL (https://...)"
                          className={inputCls + ' text-xs'}
                        />
                        <p className="text-[10px] text-slate-600 mt-1.5">
                          Paste any direct image URL. Leave blank to use auto-generated avatar.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Section 3: Access Validity ── */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-4 h-px bg-emerald-500/50" /> Access Validity
                    </p>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {['1 Month', '3 Months', '6 Months', '1 Year', 'Permanent', 'Custom Date'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, validityType: opt }))}
                          className={`py-2.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 text-center ${
                            form.validityType === opt
                              ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                              : 'bg-zinc-900/60 border-white/6 text-slate-500 hover:border-white/15 hover:text-slate-300'
                          }`}
                        >
                          {opt === 'Permanent' ? '♾ Perm' : opt === 'Custom Date' ? '📅 Custom' : opt}
                        </button>
                      ))}
                    </div>

                    {form.validityType === 'Custom Date' && (
                      <Field label="Custom Expiry Date *">
                        <input
                          name="customExpiry"
                          type="date"
                          value={form.customExpiry}
                          onChange={handleChange}
                          min={today}
                          className={inputCls + (formErrors.customExpiry ? ' border-red-500/50' : '')}
                        />
                        {formErrors.customExpiry && <p className="text-red-400 text-[10px] mt-1">{formErrors.customExpiry}</p>}
                      </Field>
                    )}

                    {/* Validity Summary */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Issue Date', value: formatDateDisplay(form.issueDate), color: 'text-white' },
                        { label: 'Expiry Date', value: expiryDate ? formatDateDisplay(expiryDate) : '—', color: form.validityType === 'Permanent' ? 'text-violet-400' : 'text-emerald-400' },
                        { label: 'Days Remaining', value: expiryDate && form.validityType !== 'Permanent' ? `${getDaysRemaining(expiryDate)} Days` : form.validityType === 'Permanent' ? '∞ Permanent' : '—', color: 'text-indigo-400' },
                      ].map(item => (
                        <div key={item.label} className="bg-black/30 border border-white/5 rounded-xl p-3 text-center">
                          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">{item.label}</p>
                          <p className={`text-xs font-bold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Submit Button ── */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] flex items-center justify-center gap-3 text-sm"
                  >
                    {submitting ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          <RefreshCw className="w-4 h-4" />
                        </motion.div>
                        Generating Secure QR Pass...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        Register Staff & Generate QR
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right: Preview + Info Panel */}
              <div className="lg:col-span-5 flex flex-col gap-5">

                {/* QR Preview Card */}
                <div className="bg-zinc-950/60 backdrop-blur-2xl rounded-3xl border border-white/6 shadow-2xl p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">QR Pass Preview</h3>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    {/* Staff Photo Preview */}
                    {photoPreview ? (
                      <img src={photoPreview} alt="" className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-xl" onError={() => setPhotoPreview('')} />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border-2 border-indigo-500/20 flex items-center justify-center">
                        <User className="w-10 h-10 text-indigo-400/50" />
                      </div>
                    )}

                    <div className="text-center">
                      <p className="text-white font-bold text-base">{form.staffName || 'Staff Name'}</p>
                      <p className="text-indigo-400 font-mono text-xs mt-0.5">{form.employeeId}</p>
                      <p className="text-slate-500 text-[11px] mt-1">{form.department || 'Department'} • {form.designation || 'Designation'}</p>
                    </div>

                    {/* Mock QR display */}
                    <div className="bg-white p-3 rounded-2xl shadow-2xl">
                      {form.employeeId ? (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(form.employeeId)}&format=png&margin=4`}
                          alt="QR Preview"
                          className="w-32 h-32"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-zinc-100 rounded-lg flex items-center justify-center">
                          <QrCode className="w-10 h-10 text-zinc-400" />
                        </div>
                      )}
                    </div>

                    <div className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">QR encodes</p>
                      <p className="text-indigo-400 font-mono text-xs font-bold mt-0.5">{form.employeeId}</p>
                    </div>
                  </div>
                </div>

                {/* How It Works Info */}
                <div className="bg-zinc-950/60 backdrop-blur-xl rounded-3xl border border-white/6 p-5 space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">How QR Works</p>
                  {[
                    { icon: User, color: 'text-blue-400', text: 'Fill staff details and select validity' },
                    { icon: QrCode, color: 'text-indigo-400', text: 'Click Register → QR is auto-generated' },
                    { icon: Shield, color: 'text-emerald-400', text: 'Security scans QR at the gate' },
                    { icon: CheckCircle2, color: 'text-green-400', text: 'System validates and grants/denies access' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      </div>
                      <p className="text-slate-500 text-xs">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              TAB 2: STAFF DIRECTORY
          ════════════════════════════════════════════ */}
          {activeTab === 'directory' && (
            <motion.div
              key="directory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Success Banner (if just registered) */}
              <AnimatePresence>
                {generatedStaff && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                  >
                    {/* Staff photo */}
                    <img
                      src={generatedStaff.photo}
                      alt=""
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/40 flex-shrink-0 shadow-xl"
                    />

                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 text-sm font-black uppercase tracking-widest">Registration Successful</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{generatedStaff.name}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{generatedStaff.designation} • {generatedStaff.department}</p>
                      <div className="flex flex-wrap gap-3 mt-2 justify-center md:justify-start text-xs text-slate-500">
                        <span>ID: <span className="text-indigo-400 font-mono">{generatedStaff.registerId}</span></span>
                        <span>QR ID: <span className="font-mono text-violet-400">{generatedStaff.qrId?.slice(0, 20)}…</span></span>
                        <span>Expiry: <span className="text-emerald-400">{formatDateDisplay(generatedStaff.expiryDate)}</span></span>
                      </div>
                    </div>

                    {/* Generated QR */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-white p-3 rounded-2xl shadow-2xl">
                        <img src={generatedStaff.qrImage} alt="QR" className="w-28 h-28" />
                      </div>
                      <div className="flex gap-2">
                        <a href={generatedStaff.qrImage} download={`${generatedStaff.registerId}-QR.png`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-600/30 transition-colors">
                          <Download className="w-3 h-3" /> Download
                        </a>
                        <button onClick={() => window.print()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-white/8 text-slate-300 rounded-lg text-[10px] font-bold uppercase hover:bg-zinc-700 transition-colors">
                          <Printer className="w-3 h-3" /> Print
                        </button>
                        <button
                          onClick={() => copyId(generatedStaff.registerId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-white/8 text-slate-300 rounded-lg text-[10px] font-bold uppercase hover:bg-zinc-700 transition-colors">
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copied ? 'Copied!' : 'Copy ID'}
                        </button>
                      </div>
                    </div>

                    <button onClick={() => setGeneratedStaff(null)} className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, department, designation..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-white/6 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-zinc-950/60 border border-white/6 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                >
                  {['All', 'Active', 'Expiring Soon', 'Expired', 'Suspended', 'Blacklisted'].map(s => (
                    <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                  ))}
                </select>
                <button
                  onClick={() => setActiveTab('register')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
                >
                  <User className="w-3.5 h-3.5" /> + Register New
                </button>
              </div>

              {/* Staff Grid */}
              {filteredStaff.length === 0 ? (
                <div className="bg-zinc-950/40 border border-white/5 rounded-3xl py-20 text-center">
                  <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold">No staff members found</p>
                  <p className="text-slate-600 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredStaff.map(staff => {
                    const vs = getValidityStatus(staff);
                    const days = getDaysRemaining(staff.expiryDate);
                    const isPermanent = staff.expiryDate === '2099-12-31';

                    return (
                      <motion.div
                        key={staff.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-950/60 border border-white/6 rounded-2xl overflow-hidden hover:border-white/12 transition-all duration-300 group"
                      >
                        {/* Card Top Band */}
                        <div className={`h-1 w-full ${
                          vs === 'Active' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                          vs === 'Expiring Soon' ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                          vs === 'Expired' ? 'bg-gradient-to-r from-red-700 to-red-500' :
                          'bg-gradient-to-r from-zinc-700 to-zinc-600'
                        }`} />

                        <div className="p-5">
                          {/* Header row */}
                          <div className="flex items-start gap-3 mb-4">
                            <img
                              src={staff.photo}
                              alt=""
                              className="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0"
                              onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&size=120&background=6366f1&color=fff&bold=true`; }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-bold text-sm truncate">{staff.name}</p>
                              <p className="text-indigo-400 font-mono text-[10px] mt-0.5">{staff.registerId}</p>
                              <p className="text-slate-500 text-[10px] truncate mt-0.5">{staff.designation}</p>
                            </div>
                            <StatusBadge status={vs} />
                          </div>

                          {/* Meta info */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] mb-4">
                            <div className="bg-black/20 rounded-lg px-2.5 py-1.5">
                              <p className="text-slate-600 font-bold uppercase tracking-wider">Department</p>
                              <p className="text-slate-300 font-medium truncate mt-0.5">{staff.department || 'N/A'}</p>
                            </div>
                            <div className="bg-black/20 rounded-lg px-2.5 py-1.5">
                              <p className="text-slate-600 font-bold uppercase tracking-wider">Validity</p>
                              <p className={`font-bold mt-0.5 ${
                                vs === 'Active' ? 'text-emerald-400' :
                                vs === 'Expiring Soon' ? 'text-amber-400' :
                                vs === 'Expired' ? 'text-red-400' : 'text-zinc-400'
                              }`}>
                                {isPermanent ? '∞ Permanent' : days > 0 ? `${days}d left` : 'Expired'}
                              </p>
                            </div>
                            <div className="bg-black/20 rounded-lg px-2.5 py-1.5">
                              <p className="text-slate-600 font-bold uppercase tracking-wider">Issue Date</p>
                              <p className="text-slate-300 font-medium mt-0.5">{formatDateDisplay(staff.issueDate || staff.registrationDate)}</p>
                            </div>
                            <div className="bg-black/20 rounded-lg px-2.5 py-1.5">
                              <p className="text-slate-600 font-bold uppercase tracking-wider">Expiry</p>
                              <p className={`font-medium mt-0.5 ${isPermanent ? 'text-violet-400' : 'text-slate-300'}`}>
                                {isPermanent ? '∞ Never' : formatDateDisplay(staff.expiryDate)}
                              </p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => setSelectedProfile(staff)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 border border-white/6 text-slate-300 rounded-lg text-[9px] font-bold uppercase transition-colors"
                            >
                              <Eye className="w-3 h-3" /> Profile
                            </button>

                            <a
                              href={staff.qrImage}
                              download={`${staff.registerId}-QR.png`}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/20 text-indigo-400 rounded-lg text-[9px] font-bold uppercase transition-colors"
                            >
                              <Download className="w-3 h-3" /> QR
                            </a>

                            <button
                              onClick={() => { setExtendTarget(staff); setShowExtendCustom(false); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-bold uppercase transition-colors"
                            >
                              <Clock className="w-3 h-3" /> Extend
                            </button>

                            <button
                              onClick={() => vs === 'Suspended' ? reactivateQR(staff.registerId) : suspendQR(staff.registerId)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors border ${
                                vs === 'Suspended'
                                  ? 'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-600/10 hover:bg-amber-600/20 border-amber-500/20 text-amber-400'
                              }`}
                            >
                              <Ban className="w-3 h-3" />
                              {vs === 'Suspended' ? 'Activate' : 'Suspend'}
                            </button>

                            <button
                              onClick={() => { if (window.confirm(`Delete ${staff.name}? This cannot be undone.`)) deleteUser(staff.registerId); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-lg text-[9px] font-bold uppercase transition-colors ml-auto"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════════
          MODAL: View Profile
      ════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-950 border border-white/10 rounded-3xl p-7 max-w-lg w-full shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Staff Profile</h3>
                </div>
                <button onClick={() => setSelectedProfile(null)} className="p-1.5 rounded-xl bg-zinc-900 border border-white/8 text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile header */}
              <div className="flex items-center gap-5 bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-5">
                <img src={selectedProfile.photo} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-xl"
                  onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.name)}&size=120&background=6366f1&color=fff&bold=true`; }} />
                <div>
                  <h4 className="text-xl font-bold text-white">{selectedProfile.name}</h4>
                  <p className="text-indigo-400 font-mono text-xs mt-0.5">{selectedProfile.registerId}</p>
                  <p className="text-slate-400 text-xs mt-1">{selectedProfile.designation}</p>
                  <div className="mt-2">
                    <StatusBadge status={getValidityStatus(selectedProfile)} />
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-5">
                {[
                  { label: 'Department', value: selectedProfile.department },
                  { label: 'Employee ID', value: selectedProfile.registerId, mono: true },
                  { label: 'Mobile', value: selectedProfile.mobile },
                  { label: 'Email', value: selectedProfile.email },
                  { label: 'Issue Date', value: formatDateDisplay(selectedProfile.issueDate || selectedProfile.registrationDate) },
                  {
                    label: 'Expiry Date',
                    value: selectedProfile.expiryDate === '2099-12-31' ? '∞ Permanent' : formatDateDisplay(selectedProfile.expiryDate),
                    color: 'text-emerald-400'
                  },
                  {
                    label: 'Days Remaining',
                    value: selectedProfile.expiryDate === '2099-12-31' ? '∞ Permanent' : `${getDaysRemaining(selectedProfile.expiryDate)} Days`,
                    color: 'text-indigo-400'
                  },
                  { label: 'QR Status', value: selectedProfile.status },
                ].map(f => (
                  <div key={f.label} className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5">
                    <p className="text-slate-600 font-bold uppercase tracking-wider text-[9px]">{f.label}</p>
                    <p className={`font-semibold mt-0.5 truncate ${f.color || 'text-white'} ${f.mono ? 'font-mono text-indigo-400' : ''}`}>{f.value || 'N/A'}</p>
                  </div>
                ))}
              </div>

              {/* QR Code */}
              {selectedProfile.qrImage && (
                <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-2xl p-4">
                  <div>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-1">Generated QR Code</p>
                    <p className="text-indigo-400 font-mono text-[10px]">{selectedProfile.qrId?.slice(0, 30)}…</p>
                    <a href={selectedProfile.qrImage} download className="inline-flex items-center gap-1.5 mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase">
                      <Download className="w-3 h-3" /> Download QR
                    </a>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl shadow-xl">
                    <img src={selectedProfile.qrImage} alt="QR" className="w-20 h-20" />
                  </div>
                </div>
              )}

              <button onClick={() => setSelectedProfile(null)}
                className="mt-5 w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/8 text-slate-300 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider">
                Close Profile
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          MODAL: Extend Validity
      ════════════════════════════════════════════ */}
      <AnimatePresence>
        {extendTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setExtendTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-950 border border-white/10 rounded-3xl p-7 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Extend Validity</h3>
                    <p className="text-slate-500 text-[10px] mt-0.5">{extendTarget.name} • {extendTarget.registerId}</p>
                  </div>
                </div>
                <button onClick={() => setExtendTarget(null)} className="p-1.5 rounded-xl bg-zinc-900 border border-white/8 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Quick Extend</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['+1 Month', '+3 Months', '+6 Months', '+1 Year'].map(dur => (
                  <button
                    key={dur}
                    onClick={() => { renewQR(extendTarget.registerId, dur); setExtendTarget(null); }}
                    className="py-3 bg-zinc-900 hover:bg-emerald-600/20 border border-white/6 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    {dur}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowExtendCustom(p => !p)}
                className="w-full py-2.5 bg-zinc-900/50 border border-dashed border-white/10 text-slate-500 hover:text-slate-300 rounded-xl text-xs font-bold uppercase transition-colors mb-3 flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                {showExtendCustom ? 'Hide' : 'Set Custom Date'}
              </button>

              <AnimatePresence>
                {showExtendCustom && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex gap-2">
                      <input
                        type="date"
                        min={today}
                        value={customExtendDate}
                        onChange={e => setCustomExtendDate(e.target.value)}
                        className={inputCls + ' flex-1'}
                      />
                      <button
                        onClick={() => { if (customExtendDate) { changeExpiryDate(extendTarget.registerId, customExtendDate); setExtendTarget(null); } }}
                        disabled={!customExtendDate}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs uppercase"
                      >
                        Save
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={() => setExtendTarget(null)}
                className="mt-4 w-full py-2.5 bg-zinc-900/50 border border-white/6 hover:bg-zinc-800 text-slate-400 rounded-xl text-xs font-bold uppercase">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffRegistration;
