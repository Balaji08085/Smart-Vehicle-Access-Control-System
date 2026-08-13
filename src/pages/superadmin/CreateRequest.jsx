import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Upload, User, Building, Briefcase, Mail, Phone, Calendar, Hash, Image as ImageIcon, ShieldCheck, AlertCircle, ChevronDown, UserCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEntry } from '../../context/EntryContext';

const MCC_COMPANIES = [
  { name: 'GREEN ERA', head: 'Prasanth', email: 'prasanth@greenera.in' },
  { name: 'LEXPOSH', head: 'Harishankar Ethiraj', email: 'harishankar@lexposh.com' },
  { name: 'ANMYWILL', head: 'Arun', email: 'arun@anmywill.com' },
  { name: 'CLOUDLU', head: 'Arun', email: 'arun@cloudlu.com' },
  { name: 'TMS MEDIA', head: 'Jeeva', email: 'jeeva@tmsmedia.in' },
  { name: 'Papodos', head: 'Lee', email: 'lee@papodos.com' },
  { name: 'FIVE AMSTRONG', head: 'Abraham', email: 'abraham@fiveamstrong.com' },
  { name: 'DSRI', head: 'Franklin', email: 'franklin@dsri.in' },
  { name: 'PENTAGON', head: 'Mathew', email: 'mathew@pentagon.io' },
  { name: 'FAB LAB', head: 'Prince', email: 'prince@fablab.org' },
  { name: 'INNOVEITY', head: 'Tittus', email: 'tittus@innoveity.com' },
  { name: 'SHE LEADS', head: 'Aishwarya', email: 'aishwarya@sheleads.org' },
  { name: 'Other / Custom Startup', head: 'Custom Company Owner', email: '' }
];

const CreateRequest = () => {
  const navigate = useNavigate();
  const { addNotification } = useEntry();
  const [formData, setFormData] = useState({
    applicantCategory: '', // Initialized empty so user selects first
    name: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    employeeId: '',
    department: '',
    company: 'GREEN ERA',
    customCompany: '',
    companyHead: 'Prasanth',
    companyHeadEmail: 'prasanth@greenera.in',
    designation: '',
    bikeNumber: '',
    vehicleType: 'Bike',
    email: '',
    mobile: '',
    accessStartDate: new Date().toISOString().split('T')[0],
    accessExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [step, setStep] = useState(1); // Wizard step state
  const [imagePreview, setImagePreview] = useState(formData.photoUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'bikeNumber' ? value.toUpperCase() : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Employee / Student Name is required.';
    if (!formData.department.trim()) return 'Department is required.';
    if (!formData.company.trim()) return 'Company / Startup Name is required.';
    if (!formData.designation.trim()) return 'Designation / Role is required.';
    if (!formData.bikeNumber.trim()) return 'Bike Registration Number is required.';
    if (!formData.email.trim()) return 'Email Address is required.';
    if (!formData.mobile.trim()) return 'Mobile Phone Number is required.';
    if (!formData.accessStartDate || !formData.accessExpiryDate) return 'Access Start and Expiry Dates are required.';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) return 'Please enter a valid email address.';

    const mobileRegex = /^[0-9+\s()\-#]{7,15}$/;
    if (!mobileRegex.test(formData.mobile.trim())) return 'Please enter a valid mobile number (7–15 digits).';

    if (new Date(formData.accessStartDate) > new Date(formData.accessExpiryDate)) {
      return 'Access Start Date cannot be greater than Access Expiry Date.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Guard: handle non-JSON error responses (e.g. HTML 502/404 pages)
      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text.slice(0, 200) || `Server error: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit access request');
      }

      setSuccessMsg(`Access request for ${formData.bikeNumber} created successfully! Status: Pending Approval.`);
      addNotification(`New request for ${formData.bikeNumber} added to Approval Queue`, 'success');

      setTimeout(() => {
        navigate('/admin/approval');
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#180305] text-slate-900 dark:text-slate-100 p-4 md:p-8 pt-28 md:pt-32 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {step === 1 ? (
          <>
            {/* Header Banner */}
            <div className="p-6 md:p-8 rounded-3xl border border-orange-200/80 dark:border-[#701A1A]/60 bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-white dark:from-[#2E080C] dark:via-[#240609] dark:to-[#180305] shadow-sm flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-red-950/60 text-orange-800 dark:text-amber-300 border border-orange-200 dark:border-[#701A1A] rounded-full text-xs font-black uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" /> Admin Registration Portal
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Register Bike & Car Access Pass</h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm mt-1">Submit new vehicle access details into the 2-Tier or Super Admin Approval Queue.</p>
              </div>
            </div>

            {/* Registration Category Cards (Admin vs Startup) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Building className="w-4 h-4 text-orange-600 dark:text-orange-400" /> Select Applicant Access Category *
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Admin */}
                <div
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      applicantCategory: 'Admin',
                      company: 'Madras Christian College',
                      companyHead: 'Dr. Ramesh Kumar',
                      companyHeadEmail: 'ramesh@mcc.edu'
                    }));
                    setStep(2); // Go to next page
                  }}
                  className={`cursor-pointer p-5 rounded-3xl border-2 transition-all flex items-start gap-4 shadow-sm border-slate-200 dark:border-[#5C121E] bg-white dark:bg-[#240609] hover:border-orange-500 dark:hover:border-red-500/60 hover:bg-slate-50/80 dark:hover:bg-[#2E080C]`}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 font-extrabold bg-slate-100 dark:bg-[#2E080C] text-slate-600 dark:text-slate-300 shadow-sm">
                    🏛️
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">Admin</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                      For Madras Christian College faculty, department heads, institutional staff & college students.
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" /> Direct 1-Tier Super Admin Approval
                    </div>
                  </div>
                </div>

                {/* Card 2: Startup */}
                <div
                  onClick={() => {
                    const defaultCompany = MCC_COMPANIES[0];
                    setFormData(prev => ({ 
                      ...prev, 
                      applicantCategory: 'Startup',
                      company: defaultCompany.name,
                      companyHead: defaultCompany.head,
                      companyHeadEmail: defaultCompany.email
                    }));
                    setStep(2); // Go to next page
                  }}
                  className={`cursor-pointer p-5 rounded-3xl border-2 transition-all flex items-start gap-4 shadow-sm border-slate-200 dark:border-[#5C121E] bg-white dark:bg-[#240609] hover:border-orange-500 dark:hover:border-red-500/60 hover:bg-slate-50/80 dark:hover:bg-[#2E080C]`}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 font-extrabold bg-slate-100 dark:bg-[#2E080C] text-slate-600 dark:text-slate-300 shadow-sm">
                    🚀
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">Startup</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                      For MCC MRF Innovation Park startups (GREEN ERA, LEXPOSH, DSRI, INNOVEITY, etc.) interns & employees.
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] font-extrabold text-orange-700 dark:text-amber-400">
                      <UserCheck className="w-4 h-4 text-orange-600 dark:text-amber-400 shrink-0" /> 2-Tier Approval (Company Owner + Super Admin)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Step 2 Back & Selected Badge Header */}
            <div className="flex justify-between items-center bg-white dark:bg-[#240609] border border-slate-200 dark:border-[#5C121E] p-4 rounded-2xl shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFormData(prev => ({ ...prev, applicantCategory: '' }));
                }}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-amber-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-orange-600 dark:text-amber-400" /> Back to Selection
              </button>
              <span className="text-xs font-black text-orange-700 dark:text-amber-300 bg-orange-100 dark:bg-red-950/60 border border-orange-200 dark:border-[#701A1A] px-3.5 py-1.5 rounded-full shadow-xs">
                Selected: {formData.applicantCategory === 'Admin' ? '🏛️ Admin' : '🚀 Startup'}
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#240609] rounded-3xl border border-slate-200 dark:border-[#5C121E] shadow-sm p-6 md:p-8"
            >
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl mb-6 flex items-center gap-3 text-sm font-semibold">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl mb-6 flex items-center gap-3 text-sm font-semibold">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Photo Upload Header Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-orange-50/60 rounded-2xl border border-orange-200/80">
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Applicant Preview"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-orange-500/50 shadow-md"
                />
                <label className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-bold">
                  <Upload className="w-5 h-5 mb-1" />
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-base font-bold text-slate-900">Applicant Profile Photo</h3>
                <p className="text-xs text-slate-600">Upload high quality portrait photo for gate verification screen.</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-orange-600 rounded-xl text-xs font-bold cursor-pointer transition-colors mt-2 border border-slate-200 shadow-sm">
                  <ImageIcon className="w-4 h-4" /> Upload Custom Photo
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-orange-600 uppercase tracking-wider border-b border-slate-200 pb-2">
                  1. Personal & Contact Info
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Employee / Student Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Dr. Balaji S"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="balaji@mrf-innovationpark.edu"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Work Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-orange-600 uppercase tracking-wider border-b border-slate-200 pb-2">
                  2. Organization & Role
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Employee ID (Optional)</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        placeholder="EMP-9082"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Department *</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="Computer Science"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                {formData.applicantCategory === 'Startup' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Company / Startup Name *</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        name="company"
                        value={formData.company}
                        onChange={(e) => {
                          const selectedVal = e.target.value;
                          const match = MCC_COMPANIES.find(c => c.name === selectedVal);
                          setFormData(prev => ({
                            ...prev,
                            company: selectedVal,
                            companyHead: match ? match.head : '',
                            companyHeadEmail: match ? match.email : ''
                          }));
                        }}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm font-semibold appearance-none cursor-pointer"
                      >
                        {MCC_COMPANIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} {c.head ? `(${c.head})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Institution / Organization *</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Madras Christian College"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}

                {formData.applicantCategory === 'Startup' && (
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 space-y-3">
                    <div className="flex items-center gap-2 text-orange-800 font-black text-xs uppercase tracking-wider">
                      <UserCheck className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      1st Tier Approver — Startup Owner / Head
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Owner / Head Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-400 pointer-events-none" />
                          <input
                            type="text"
                            name="companyHead"
                            value={formData.companyHead}
                            onChange={handleChange}
                            placeholder="e.g. Mr. Franklin"
                            required
                            className="w-full bg-white border border-orange-200 rounded-lg py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Owner Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-400 pointer-events-none" />
                          <input
                            type="email"
                            name="companyHeadEmail"
                            value={formData.companyHeadEmail}
                            onChange={handleChange}
                            placeholder="e.g. frankin@techquora.com"
                            required
                            className="w-full bg-white border border-orange-200 rounded-lg py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-orange-700 flex items-center gap-1.5 pt-1">
                      <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                      Approval will be routed to <strong>{formData.companyHead || 'Owner'}</strong> ({formData.companyHeadEmail || 'email'}) first, then forwarded to Super Admin.
                    </p>
                  </div>
                )}


                {formData.company === 'Other / Custom Startup' && (
                  <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Custom Company Name *</label>
                      <input
                        type="text"
                        name="customCompany"
                        value={formData.customCompany}
                        onChange={handleChange}
                        placeholder="e.g. Decora Innovations"
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Owner / Head Email Address *</label>
                      <input
                        type="email"
                        name="companyHeadEmail"
                        value={formData.companyHeadEmail}
                        onChange={handleChange}
                        placeholder="frankin@decora.com"
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Designation / Role *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="Senior Research Fellow"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle & Access Details */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-black text-orange-600 uppercase tracking-wider border-b border-slate-200 pb-2">
                3. Vehicle Details & Access Validity Period
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Vehicle Type *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, vehicleType: 'Bike' }))}
                      className={`flex-1 py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                        formData.vehicleType === 'Bike'
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏍️ Bike
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, vehicleType: 'Car' }))}
                      className={`flex-1 py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                        formData.vehicleType === 'Car'
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🚗 Car
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Vehicle Reg Number *</label>
                  <input
                    type="text"
                    name="bikeNumber"
                    value={formData.bikeNumber}
                    onChange={handleChange}
                    required
                    placeholder="TN 14 AE 8495"
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl py-3 px-4 text-amber-900 font-mono text-base font-black tracking-widest uppercase focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Access Start Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      name="accessStartDate"
                      value={formData.accessStartDate}
                      onChange={handleChange}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Access Expiry Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      name="accessExpiryDate"
                      value={formData.accessExpiryDate}
                      onChange={handleChange}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Save Record & Send to Approval Queue
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateRequest;
