import React, { useState } from 'react';
import { 
  Car, Plus, Edit2, Trash2, Ban, QrCode, Search, 
  CheckCircle2, AlertTriangle, ShieldAlert, X, Download, Printer, Filter, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEntry, formatDateDisplay, getValidityStatus } from '../../context/EntryContext';
import LogoQRCode from '../../components/LogoQRCode';

const VehicleManagement = () => {
  const { 
    vehicles, addVehicle, updateVehicle, deleteVehicle, disableSticker 
  } = useEntry();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [qrModalVehicle, setQrModalVehicle] = useState(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    name: '',
    registerId: '',
    department: 'Computer Science & Engineering',
    vehicleType: 'Scooty (Scooter - Two-Wheeler)',
    issueDate: todayStr,
    expiryDate: '2027-12-31',
    type: 'Student',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  });

  const vehicleList = Object.values(vehicles).sort((a, b) => {
    if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;
    return 0;
  });

  // Filtering
  const filteredVehicles = vehicleList.filter(v => {
    const q = searchTerm.toLowerCase();
    const matchesQuery = (
      (v.vehicleNumber && v.vehicleNumber.toLowerCase().includes(q)) ||
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.registerId && v.registerId.toLowerCase().includes(q)) ||
      (v.department && v.department.toLowerCase().includes(q))
    );

    const status = getValidityStatus(v);
    const matchesStatus = filterStatus === 'All' || status === filterStatus;
    const matchesType = filterType === 'All' || (v.vehicleType && v.vehicleType.toLowerCase().includes(filterType.toLowerCase()));

    return matchesQuery && matchesStatus && matchesType;
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    addVehicle(formData);
    setIsAddModalOpen(false);
    setFormData({
      vehicleNumber: '',
      name: '',
      registerId: '',
      department: 'Computer Science & Engineering',
      vehicleType: 'Bike (Two-Wheeler)',
      expiryDate: '2027-12-31',
      type: 'Student',
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingVehicle) return;
    updateVehicle(editingVehicle.id, editingVehicle);
    setEditingVehicle(null);
  };

  const openEditModal = (v) => {
    setEditingVehicle({ ...v });
  };

  return (
    <div className="min-h-screen pt-28 md:pt-32 pb-16 px-4 md:px-8 bg-[#080C16] relative">
      
      {/* Background Glow */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1 font-mono">
              <ShieldAlert className="w-4 h-4" /> Admin Vehicle Control Center
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Vehicle & QR Sticker Management
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Add, Edit, Delete, and Issue Official College QR Passes with Centered MCC Emblem
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add New Vehicle & Register QR
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-card p-4 rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Vehicle Number, Owner Name, Student/Staff ID..."
              className="w-full bg-black/60 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-slate-300 font-bold focus:outline-none"
            >
              <option value="All">All Vehicle Types</option>
              <option value="Bike">Bike (Motorcycle)</option>
              <option value="Scooty">Scooty (Scooter)</option>
              <option value="Car">Car (Four-Wheeler)</option>
              <option value="EV">Electric Scooter / EV</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-slate-300 font-bold focus:outline-none"
            >
              <option value="All">All Sticker Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Blacklisted">Blacklisted</option>
            </select>
          </div>
        </div>

        {/* Vehicle Table Card */}
        <div className="glass-card rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-black/60 border-b border-white/10 text-slate-400 font-mono uppercase tracking-wider">
                  <th className="p-4 pl-6">Vehicle Number</th>
                  <th className="p-4">Owner & ID</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Vehicle Type</th>
                  <th className="p-4">Sticker Status</th>
                  <th className="p-4">Validity Period</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                {filteredVehicles.map((v) => {
                  const status = getValidityStatus(v);
                  return (
                    <tr key={v.id} className="hover:bg-white/5 transition-colors">
                      
                      {/* Vehicle Number */}
                      <td className="p-4 pl-6 font-mono font-black text-white text-sm">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-amber-400 shrink-0" />
                          {v.vehicleNumber || v.id}
                        </div>
                      </td>

                      {/* Owner Name & Register ID */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={v.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
                            alt={v.name}
                            className="w-9 h-9 rounded-xl object-cover border border-white/20 shrink-0 shadow-md"
                          />
                          <div>
                            <span className="font-bold text-white block">{v.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400">{v.registerId} ({v.type || 'Student'})</span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-4 text-slate-300">{v.department}</td>

                      {/* Vehicle Type */}
                      <td className="p-4 text-slate-300">{v.vehicleType || 'Two-Wheeler'}</td>

                      {/* Sticker Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : status === 'Expired'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {status}
                        </span>
                      </td>

                      {/* Validity Period (Start & Expiry Date) */}
                      <td className="p-4 font-mono text-[11px]">
                        <span className="text-emerald-400 block font-bold">Start: {formatDateDisplay(v.issueDate || v.issueDate)}</span>
                        <span className={`block font-bold ${status === 'Expired' ? 'text-red-400' : 'text-slate-300'}`}>
                          Expiry: {formatDateDisplay(v.expiryDate)}
                        </span>
                      </td>

                      {/* Actions Column (Refresh button removed, Sticker button featured) */}
                      <td className="p-4 pr-6 text-right space-x-1.5">
                        
                        {/* Featured Sticker Badge Button */}
                        <button
                          onClick={() => setQrModalVehicle(v)}
                          title="Generate Printable QR Sticker Badge"
                          className="px-3 py-2 bg-gradient-to-r from-red-600/30 to-amber-600/30 hover:from-red-600/50 hover:to-amber-600/50 text-white rounded-xl border border-amber-500/40 transition-all font-bold text-xs inline-flex items-center gap-1.5 shadow-lg"
                        >
                          <QrCode className="w-4 h-4 text-amber-400" />
                          <span>Sticker Pass</span>
                        </button>

                        {/* Disable / Blacklist Sticker */}
                        <button
                          onClick={() => disableSticker(v.id, status === 'Blacklisted' ? 'Active' : 'Blacklisted')}
                          title={status === 'Blacklisted' ? 'Reactivate Sticker' : 'Disable/Blacklist Sticker'}
                          className={`p-2 rounded-xl border transition-all ${
                            status === 'Blacklisted'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <Ban className="w-4 h-4" />
                        </button>

                        {/* Edit Vehicle */}
                        <button
                          onClick={() => openEditModal(v)}
                          title="Edit Vehicle Details"
                          className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Vehicle */}
                        <button
                          onClick={() => setDeletingId(v.id)}
                          title="Delete Vehicle Record"
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: ADD NEW VEHICLE                                                     */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-white/10 bg-slate-900 space-y-4 max-h-[88vh] overflow-y-auto my-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" /> Register Vehicle & QR Sticker
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
                
                {/* Student / Owner Profile Photo Upload */}
                <div className="flex items-center gap-3 p-3 bg-black/40 rounded-2xl border border-white/10">
                  <img
                    src={formData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
                    alt="Student Preview"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500/50 shadow-md shrink-0"
                  />
                  <div className="space-y-1 overflow-hidden">
                    <label className="text-slate-200 font-bold block text-xs">Student / Owner Photo</label>
                    <p className="text-[10px] text-slate-400">Upload portrait photo for gate QR validation</p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[11px] font-bold cursor-pointer transition-colors border border-white/10">
                      <Upload className="w-3.5 h-3.5" /> Upload Custom Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData(prev => ({ ...prev, photoUrl: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Vehicle Plate Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    placeholder="e.g. TN 38 AB 1234"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Owner Full Name"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Student / Staff ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.registerId}
                      onChange={(e) => setFormData({ ...formData, registerId: e.target.value })}
                      placeholder="e.g. 23BCS045"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">User Category</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                    >
                      <option value="Student">Student</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="Bike (Motorcycle)">Bike (Motorcycle)</option>
                    <option value="Scooty (Scooter - Two-Wheeler)">Scooty (Scooter - Two-Wheeler)</option>
                    <option value="Car (Four-Wheeler)">Car (Four-Wheeler)</option>
                    <option value="Electric Scooter / EV Bike">Electric Scooter / EV Bike</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Sticker Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.issueDate || todayStr}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Sticker Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg"
                >
                  Register Vehicle & Issue QR Pass
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: EDIT VEHICLE DETAILS                                                */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingVehicle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-white/10 bg-slate-900 space-y-4 max-h-[88vh] overflow-y-auto my-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-400" /> Edit Vehicle Details
                </h3>
                <button onClick={() => setEditingVehicle(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
                
                {/* Student / Owner Profile Photo Edit */}
                <div className="flex items-center gap-3 p-3 bg-black/40 rounded-2xl border border-white/10">
                  <img
                    src={editingVehicle.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
                    alt="Student Preview"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-amber-500/50 shadow-md shrink-0"
                  />
                  <div className="space-y-1 overflow-hidden">
                    <label className="text-slate-200 font-bold block text-xs">Student / Owner Photo</label>
                    <p className="text-[10px] text-slate-400">Change photo for gate QR validation</p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[11px] font-bold cursor-pointer transition-colors border border-white/10">
                      <Upload className="w-3.5 h-3.5" /> Upload New Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditingVehicle(prev => ({ ...prev, photoUrl: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Vehicle Plate Number</label>
                  <input
                    type="text"
                    value={editingVehicle.vehicleNumber || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicleNumber: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editingVehicle.name || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Student/Staff ID</label>
                    <input
                      type="text"
                      value={editingVehicle.registerId || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, registerId: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Vehicle Type</label>
                    <select
                      value={editingVehicle.vehicleType || 'Bike (Motorcycle)'}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicleType: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                    >
                      <option value="Bike (Motorcycle)">Bike (Motorcycle)</option>
                      <option value="Scooty (Scooter - Two-Wheeler)">Scooty (Scooter - Two-Wheeler)</option>
                      <option value="Car (Four-Wheeler)">Car (Four-Wheeler)</option>
                      <option value="Electric Scooter / EV Bike">Electric Scooter / EV Bike</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Sticker Start Date</label>
                    <input
                      type="date"
                      value={editingVehicle.issueDate || todayStr}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, issueDate: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Sticker Expiry Date</label>
                    <input
                      type="date"
                      value={editingVehicle.expiryDate || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, expiryDate: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: DELETE CONFIRMATION                                                 */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deletingId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="max-w-sm w-full glass-panel p-6 rounded-3xl border border-red-500/30 bg-slate-900 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Confirm Delete Vehicle?</h3>
              <p className="text-xs text-slate-400">
                This action will revoke the QR sticker access code permanently for this vehicle.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteVehicle(deletingId);
                    setDeletingId(null);
                  }}
                  className="py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: QR CODE PASS / PRINT MODAL                                          */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {qrModalVehicle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="max-w-sm w-full glass-panel p-6 rounded-3xl border border-amber-500/30 bg-slate-900 space-y-4">
              
              {/* Printable QR Code Badge Layout (Header + Badge Card) */}
              <div className="printable-sticker-area space-y-4 text-center">
                
                <div className="text-center pb-1">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 block font-black">
                    MCC MRF INNOVATION PARK SECURITY PASS
                  </span>
                  <h3 className="text-xl font-black text-white tracking-wide">Official Vehicle QR Sticker Badge</h3>
                </div>

                <div className="p-6 bg-slate-950 border-2 border-amber-500 rounded-2xl shadow-2xl space-y-4 text-center">
                  
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-xs font-black text-white tracking-wider">MCC MRF INNOVATION PARK</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">VERIFIED</span>
                  </div>

                  {/* QR Code Matrix with Centered MCC Emblem Badge */}
                  <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl relative">
                    <LogoQRCode
                      value={qrModalVehicle.qrCode || qrModalVehicle.vehicleNumber}
                      size={176}
                      level="H"
                      className="mx-auto"
                    />
                  </div>

                  <div>
                    <span className="text-2xl font-black font-mono text-white tracking-wider block">
                      {qrModalVehicle.vehicleNumber || qrModalVehicle.id}
                    </span>
                    <span className="text-xs font-bold text-amber-300 block mt-0.5">
                      {qrModalVehicle.name} ({qrModalVehicle.registerId})
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      Dept: {qrModalVehicle.department}
                    </span>
                    <div className="flex justify-between items-center text-[11px] font-mono pt-2 text-slate-300 border-t border-white/10 mt-3">
                      <span>Issued: <strong className="text-emerald-400">{formatDateDisplay(qrModalVehicle.issueDate || '2024-01-10')}</strong></span>
                      <span>Valid Till: <strong className="text-amber-400">{formatDateDisplay(qrModalVehicle.expiryDate)}</strong></span>
                    </div>
                  </div>

                </div>

              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 no-print">
                <button
                  onClick={() => window.print()}
                  className="py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-white/10"
                >
                  <Printer className="w-4 h-4" /> Print Sticker
                </button>
                <button
                  onClick={() => setQrModalVehicle(null)}
                  className="py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Close
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default VehicleManagement;
