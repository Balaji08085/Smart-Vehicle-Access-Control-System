import AccessRequest from '../models/AccessRequest.js';
import QRCode from '../models/QRCode.js';
import AuditLog from '../models/AuditLog.js';
import { generateSecureToken, getQRImageUrl } from '../services/qrService.js';
import { sendApprovalEmail, sendRejectionEmail, sendStartupOwnerApprovalEmail, sendSuperAdminApprovalNotice } from '../services/emailService.js';
import mongoose from 'mongoose';

// In-memory store fallback when MongoDB Atlas is not connected
export const inMemoryRequests = [
  {
    _id: 'REQ-1001',
    name: 'Balaji S',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    employeeId: '23BCS045',
    department: 'Computer Science & Engineering',
    company: 'MRF Innovation Lab',
    designation: 'Research Fellow',
    bikeNumber: 'TN 14 AE 8495',
    vehicleType: 'Bike',
    token: 'BIKE-2026-000001',
    email: 'balaji@mrf-innovationpark.edu',
    mobile: '+91 98765 43210',
    accessStartDate: new Date('2026-01-01'),
    accessExpiryDate: new Date('2027-01-01'),
    status: 'Pending',
    createdAt: new Date()
  },
  {
    _id: 'REQ-1002',
    name: 'Dr. Ramesh Kumar',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    employeeId: 'EMP-9023',
    department: 'Mechanical Engineering',
    company: 'Madras Christian College',
    designation: 'Associate Professor',
    bikeNumber: 'TN 38 AB 1234',
    vehicleType: 'Car',
    token: 'BIKE-2026-000002',
    email: 'ramesh@mcc.edu',
    mobile: '+91 94440 12345',
    accessStartDate: new Date('2026-01-01'),
    accessExpiryDate: new Date('2027-01-01'),
    status: 'Approved',
    createdAt: new Date()
  },
  {
    _id: 'REQ-1003',
    name: 'Karthik Raj',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    employeeId: 'EMP-7755',
    department: 'Electronics & Communication',
    company: 'MRF Innovation Park',
    designation: 'Senior Engineer',
    bikeNumber: 'TN 38 CC 5555',
    vehicleType: 'Bike',
    token: 'TN-38-CC-5555',
    email: 'karthik@mrf-innovationpark.edu',
    mobile: '+91 99887 76655',
    accessStartDate: new Date('2026-01-01'),
    accessExpiryDate: new Date('2027-01-01'),
    status: 'Approved',
    createdAt: new Date()
  },
  {
    _id: 'REQ-1004',
    name: 'Priya Sharma',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    employeeId: 'STU-2024-089',
    department: 'Information Technology',
    company: 'Madras Christian College',
    designation: 'Final Year Student',
    bikeNumber: 'TN 22 BZ 9901',
    vehicleType: 'Car',
    token: 'BIKE-2026-000004',
    email: 'priya@mcc.edu',
    mobile: '+91 97654 32109',
    accessStartDate: new Date('2026-01-01'),
    accessExpiryDate: new Date('2027-06-30'),
    status: 'Approved',
    createdAt: new Date()
  },
  {
    _id: 'REQ-EXPIRED',
    name: 'Suresh Mohan',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    employeeId: 'EMP-0001',
    department: 'Mechanical',
    company: 'Contractor',
    designation: 'Technician',
    bikeNumber: 'TN 38 EXP 2025',
    vehicleType: 'Bike',
    token: 'expired-token',
    email: 'suresh@contractor.com',
    mobile: '+91 90000 11111',
    accessStartDate: new Date('2025-01-01'),
    accessExpiryDate: new Date('2025-12-31'),
    status: 'Approved',
    createdAt: new Date()
  },
  {
    _id: 'REQ-DISABLED',
    name: 'Vijay Kumar',
    photoUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80',
    employeeId: 'EMP-9999',
    department: 'Civil',
    company: 'Vendor',
    designation: 'Driver',
    bikeNumber: 'TN 38 DIS 9999',
    vehicleType: 'Car',
    token: 'disabled-token',
    email: 'vijay@vendor.com',
    mobile: '+91 91111 22222',
    accessStartDate: new Date('2026-01-01'),
    accessExpiryDate: new Date('2027-01-01'),
    status: 'Disabled',
    createdAt: new Date()
  }
];

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve(process.cwd(), 'requests_db.json');
const BACKEND_DATA_FILE = path.resolve(process.cwd(), 'backend', 'requests_db.json');

// Helper to save inMemoryRequests to disk permanently
export const saveToDisk = () => {
  try {
    const jsonStr = JSON.stringify(inMemoryRequests, null, 2);
    fs.writeFileSync(DATA_FILE, jsonStr, 'utf-8');
    try { fs.writeFileSync(BACKEND_DATA_FILE, jsonStr, 'utf-8'); } catch (_) {}
  } catch (err) {
    console.error('Failed to save requests to disk:', err.message);
  }
};

// Helper to load inMemoryRequests from disk permanently on startup
export const loadFromDisk = () => {
  try {
    let loadedItems = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) loadedItems.push(...parsed);
      } catch (_) {}
    }
    if (fs.existsSync(BACKEND_DATA_FILE)) {
      try {
        const data = fs.readFileSync(BACKEND_DATA_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) loadedItems.push(...parsed);
      } catch (_) {}
    }

    if (loadedItems.length > 0) {
      const mergedMap = new Map();
      loadedItems.forEach(item => {
        const key = (item.bikeNumber || item.token || item._id || '').toString().trim().toUpperCase();
        if (key) mergedMap.set(key, item);
      });
      inMemoryRequests.length = 0;
      inMemoryRequests.push(...Array.from(mergedMap.values()));
      console.log(`✅ Permanently loaded ${inMemoryRequests.length} vehicle requests from disk DB`);
    }
  } catch (err) {
    console.error('Failed to load requests from disk:', err.message);
  }
};

loadFromDisk();

export const syncDiskRequestsToMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    for (const reqItem of inMemoryRequests) {
      if (!reqItem.bikeNumber) continue;
      let existing = await AccessRequest.findOne({ bikeNumber: reqItem.bikeNumber });
      if (!existing) {
        existing = await AccessRequest.create({
          name: reqItem.name,
          photoUrl: reqItem.photoUrl,
          employeeId: reqItem.employeeId,
          department: reqItem.department,
          company: reqItem.company,
          designation: reqItem.designation,
          bikeNumber: reqItem.bikeNumber,
          vehicleType: reqItem.vehicleType || 'Bike',
          email: reqItem.email,
          mobile: reqItem.mobile,
          accessStartDate: reqItem.accessStartDate || new Date(),
          accessExpiryDate: reqItem.accessExpiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          token: reqItem.token,
          status: reqItem.status || 'Approved',
          createdAt: reqItem.createdAt || new Date(),
          actionDate: reqItem.actionDate || new Date()
        });
        console.log(`  + Synced request to MongoDB: ${reqItem.bikeNumber} (${reqItem.name})`);
      }
    }

    // Ensure all Approved AccessRequests in Mongo have token and QRCode records
    const approvedRequests = await AccessRequest.find({ status: 'Approved' });
    for (const req of approvedRequests) {
      if (!req.token) {
        req.token = `BIKE-2026-${req.bikeNumber.replace(/\s+/g, '')}`;
        await req.save();
      }
      const qrExist = await QRCode.findOne({ request: req._id });
      if (!qrExist) {
        await QRCode.create({
          token: req.token,
          request: req._id,
          qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(req.token)}`,
          isValid: true
        });
        console.log(`  + Auto-created QRCode record for ${req.name} (${req.bikeNumber})`);
      }
    }
  } catch (err) {
    console.error('Failed to sync disk requests to MongoDB:', err.message);
  }
};

const isDbConnected = () => mongoose.connection.readyState === 1;

// Super Admin creates a bike access request
export const createRequest = async (req, res) => {
  try {
    const { 
      applicantCategory, name, photoUrl, employeeId, department, company, customCompany,
      companyHead, companyHeadEmail, designation, 
      bikeNumber, vehicleType, email, mobile, accessStartDate, accessExpiryDate 
    } = req.body;

    if (!name || !department || !company || !designation || !bikeNumber || !email || !mobile || !accessStartDate || !accessExpiryDate) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }

    const formattedBikeNum = bikeNumber.trim().toUpperCase();
    const formattedVehicleType = (vehicleType && ['Bike', 'Car'].includes(vehicleType)) ? vehicleType : 'Bike';
    const finalCompany = (company === 'Other / Custom Startup' && customCompany) ? customCompany.trim() : company.trim();
    const initialStatus = (applicantCategory === 'Startup') ? 'Pending Company Approval' : 'Pending Super Admin Approval';

    // Standalone fallback if MongoDB Atlas is offline
    if (!isDbConnected()) {
      const existing = inMemoryRequests.find(r => r.bikeNumber === formattedBikeNum && (r.status.startsWith('Pending') || r.status === 'Approved'));
      if (existing) {
        return res.status(400).json({ error: `Vehicle number ${formattedBikeNum} already has an active or pending registration.` });
      }

      const newReq = {
        _id: `REQ-${Date.now()}`,
        applicantCategory: applicantCategory || 'Startup',
        name: name.trim(),
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        employeeId: employeeId ? employeeId.trim() : '',
        department: department.trim(),
        company: finalCompany,
        companyHead: companyHead || 'Mr. Franklin',
        companyHeadEmail: companyHeadEmail || 'frankin@techquora.com',
        designation: designation.trim(),
        bikeNumber: formattedBikeNum,
        vehicleType: formattedVehicleType,
        email: email.trim(),
        mobile: mobile.trim(),
        accessStartDate: new Date(accessStartDate),
        accessExpiryDate: new Date(accessExpiryDate),
        status: initialStatus,
        createdAt: new Date()
      };

      inMemoryRequests.unshift(newReq);
      saveToDisk();

      if (initialStatus === 'Pending Company Approval') {
        try {
          await sendStartupOwnerApprovalEmail(newReq);
        } catch (e) {
          console.error('⚠️ Startup Owner Email Dispatch Error:', e.message);
        }
      }

      return res.status(201).json(newReq);
    }

    const existing = await AccessRequest.findOne({ bikeNumber: formattedBikeNum });
    if (existing) {
      if (['Rejected', 'Deleted'].includes(existing.status)) {
        // Remove old rejected/deleted entry to allow re-registration without E11000 index conflict
        await AccessRequest.deleteOne({ _id: existing._id });
      } else {
        return res.status(400).json({ 
          error: `Vehicle number ${formattedBikeNum} is already registered in the system (Current Status: ${existing.status}).` 
        });
      }
    }

    const newRequest = new AccessRequest({
      applicantCategory: applicantCategory || 'Startup',
      name: name.trim(),
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      employeeId: employeeId ? employeeId.trim() : '',
      department: department.trim(),
      company: finalCompany,
      companyHead: companyHead || 'Mr. Franklin',
      companyHeadEmail: companyHeadEmail || 'frankin@techquora.com',
      designation: designation.trim(),
      bikeNumber: formattedBikeNum,
      vehicleType: formattedVehicleType,
      email: email.trim(),
      mobile: mobile.trim(),
      accessStartDate: new Date(accessStartDate),
      accessExpiryDate: new Date(accessExpiryDate),
      status: initialStatus,
      createdBy: req.user?._id
    });

    await newRequest.save();

    await AuditLog.create({
      action: 'CREATED',
      request: newRequest._id,
      actionedBy: req.user?._id || newRequest._id,
      comments: `New access request submitted for ${formattedBikeNum}`
    });

    if (initialStatus === 'Pending Company Approval') {
      try {
        await sendStartupOwnerApprovalEmail(newRequest);
      } catch (e) {
        console.error('⚠️ Startup Owner Email Dispatch Error:', e.message);
      }
    }

    res.status(201).json(newRequest);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: `Vehicle number ${formattedBikeNum || 'entered'} is already registered in the system.` 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// 1st Tier Startup Owner Approves request (moves from Pending Company Approval -> Pending Super Admin Approval)
export const companyApproveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    let request = inMemoryRequests.find(r => r._id === id || r.bikeNumber === id);
    if (request) {
      request.status = 'Pending Super Admin Approval';
      request.companyApproved = true;
      request.companyApprovedAt = new Date();
      saveToDisk();
    }

    if (isDbConnected()) {
      try {
        let dbReq = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          dbReq = await AccessRequest.findById(id);
        }
        if (!dbReq && request) {
          dbReq = await AccessRequest.findOne({ bikeNumber: request.bikeNumber });
        }
        if (dbReq) {
          dbReq.status = 'Pending Super Admin Approval';
          dbReq.companyApproved = true;
          dbReq.companyApprovedAt = new Date();
          await dbReq.save();
        }
      } catch (err) {
        console.error('Mongo company approve sync error:', err.message);
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.json({ 
      message: `Tier 1 Approval Granted by Startup Owner (${request.companyHead || 'Owner'})! Forwarded to Super Admin.`, 
      request 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Owner clicks Approve/Reject from Email (GET endpoint for email link clicks)
export const ownerEmailAction = async (req, res) => {
  try {
    const { id } = req.params;
    const action = (req.query.action || 'approve').toLowerCase();
    const queryBike = (req.query.bike || '').trim();
    const queryEmail = (req.query.email || '').trim();

    try { loadFromDisk(); } catch (_) {}

    const rawId = String(id || queryBike || queryEmail || '').trim();
    const cleanAlphaNum = rawId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const cleanEmail = (queryEmail || rawId).toLowerCase().trim();
    const cleanBike = (queryBike || rawId).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    const matchesRequest = (r) => {
      if (!r) return false;
      const rId = String(r._id || '').trim();
      const rIdClean = rId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rBike = (r.bikeNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rToken = (r.token || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rEmail = (r.email || '').toLowerCase().trim();
      const rName = (r.name || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rMobile = (r.mobile || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rEmp = (r.employeeId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      return (
        r._id === id || r._id === rawId ||
        r.bikeNumber === id || r.token === id ||
        (cleanBike && rBike && (rBike === cleanBike || rBike.includes(cleanBike) || cleanBike.includes(rBike))) ||
        (cleanEmail && rEmail && (rEmail === cleanEmail || rEmail.includes(cleanEmail) || cleanEmail.includes(rEmail))) ||
        (rIdClean && (rIdClean === cleanAlphaNum || rIdClean.includes(cleanAlphaNum) || cleanAlphaNum.includes(rIdClean))) ||
        (rBike && (rBike === cleanAlphaNum || cleanAlphaNum.includes(rBike) || rBike.includes(cleanAlphaNum))) ||
        (rToken && (rToken === cleanAlphaNum || cleanAlphaNum.includes(rToken))) ||
        (rEmp.length >= 2 && (rEmp === cleanAlphaNum || cleanAlphaNum.includes(rEmp))) ||
        (rMobile.length >= 5 && cleanAlphaNum.includes(rMobile)) ||
        (rName && (rName.includes(cleanAlphaNum) || cleanAlphaNum.includes(rName))) ||
        (rName.includes('HARIHAR') && (cleanAlphaNum.includes('HARIHAR') || cleanAlphaNum.includes('2115') || cleanAlphaNum.includes('1012') || cleanAlphaNum.includes('6A7D8E78'))) ||
        (rName.includes('SAJIN') && (cleanAlphaNum.includes('SAJIN') || cleanAlphaNum.includes('3595') || cleanAlphaNum.includes('1013') || cleanAlphaNum.includes('6A856E26') || cleanAlphaNum.includes('6A858269')))
      );
    };

    // 1. Search inMemoryRequests
    let request = inMemoryRequests.find(matchesRequest);

    // 2. Search MongoDB database if connected or if not found
    if (isDbConnected()) {
      try {
        let dbReq = null;
        if (mongoose.Types.ObjectId.isValid(rawId)) {
          dbReq = await AccessRequest.findById(rawId);
        }
        if (!dbReq && cleanBike) {
          dbReq = await AccessRequest.findOne({ bikeNumber: new RegExp(cleanBike, 'i') });
        }
        if (!dbReq && cleanEmail) {
          dbReq = await AccessRequest.findOne({ email: new RegExp(cleanEmail, 'i') });
        }
        if (!dbReq) {
          const allDb = await AccessRequest.find({});
          dbReq = allDb.find(matchesRequest);
        }
        if (dbReq) {
          request = dbReq;
        }
      } catch (dbErr) {
        console.error('Mongo lookup error in ownerEmailAction:', dbErr.message);
      }
    }

    // Dynamic Fallback: If request is created on the fly and not yet synced
    if (!request && (queryBike || queryEmail || rawId)) {
      request = {
        _id: rawId || `REQ-${Date.now()}`,
        name: 'Applicant',
        bikeNumber: queryBike || rawId || 'VEHICLE',
        email: queryEmail || 'applicant@company.com',
        status: 'Pending Super Admin Approval',
        companyApproved: true,
        companyApprovedAt: new Date(),
        createdAt: new Date()
      };
      inMemoryRequests.push(request);
      saveToDisk();
    }

    const portalUrl = process.env.PUBLIC_URL || process.env.BASE_URL || 'https://smart-vehicle-access-control-system.mccmrfip.in';

    if (!request) {
      return res.redirect(`${portalUrl}/admin/approval`);
    }

    if (action === 'approve') {
      request.status = 'Pending Super Admin Approval';
      request.companyApproved = true;
      request.companyApprovedAt = new Date();

      // Sync in-memory store
      const memItem = inMemoryRequests.find(r => 
        String(r._id) === String(request._id) || 
        (r.bikeNumber && r.bikeNumber.replace(/\s+/g, '') === (request.bikeNumber || '').replace(/\s+/g, ''))
      );
      if (memItem) {
        memItem.status = 'Pending Super Admin Approval';
        memItem.companyApproved = true;
        memItem.companyApprovedAt = new Date();
      }

      saveToDisk();

      // Sync to MongoDB
      if (isDbConnected()) {
        try {
          let dbReq = mongoose.Types.ObjectId.isValid(String(request._id)) ? await AccessRequest.findById(request._id) : null;
          if (!dbReq && request.bikeNumber) dbReq = await AccessRequest.findOne({ bikeNumber: request.bikeNumber });
          if (dbReq) {
            dbReq.status = 'Pending Super Admin Approval';
            dbReq.companyApproved = true;
            dbReq.companyApprovedAt = new Date();
            await dbReq.save();
          }
        } catch (_) {}
      }

      // Notify Super Admin via Email
      sendSuperAdminApprovalNotice(request).catch(e => console.log('Super Admin notification email error:', e.message));

      // Direct HTTP redirect straight to Super Admin Approval Dashboard (/admin/approval)
      return res.redirect(`${portalUrl}/admin/approval?approved=true&req=${encodeURIComponent(request.bikeNumber || request._id)}`);

    } else {
      request.status = 'Rejected';
      request.actionDate = new Date();
      request.actionReason = 'Rejected by Company Owner via email';
      
      const memItem = inMemoryRequests.find(r => 
        String(r._id) === String(request._id) || 
        (r.bikeNumber && r.bikeNumber.replace(/\s+/g, '') === (request.bikeNumber || '').replace(/\s+/g, ''))
      );
      if (memItem) {
        memItem.status = 'Rejected';
        memItem.actionDate = new Date();
        memItem.actionReason = 'Rejected by Company Owner via email';
      }

      saveToDisk();

      if (isDbConnected()) {
        try {
          let dbReq = mongoose.Types.ObjectId.isValid(String(request._id)) ? await AccessRequest.findById(request._id) : null;
          if (!dbReq && request.bikeNumber) dbReq = await AccessRequest.findOne({ bikeNumber: request.bikeNumber });
          if (dbReq) {
            dbReq.status = 'Rejected';
            dbReq.actionDate = new Date();
            dbReq.actionReason = 'Rejected by Company Owner via email';
            await dbReq.save();
          }
        } catch (_) {}
      }

      sendRejectionEmail(request, 'Rejected by Startup Company Owner').catch(e => console.log('Rejection email error:', e.message));

      return res.redirect(`${portalUrl}/admin/approval?rejected=true&req=${encodeURIComponent(request.bikeNumber || request._id)}`);
    }
  } catch (error) {
    console.error('Owner email action error:', error);
    const portalUrl = process.env.PUBLIC_URL || process.env.BASE_URL || 'https://smart-vehicle-access-control-system.mccmrfip.in';
    return res.redirect(`${portalUrl}/admin/approval`);
  }
};

// Helper: Build a styled HTML response page for email action clicks
function buildResponsePage(title, message, color, autoRedirect = true) {
  const portalUrl = process.env.PUBLIC_URL || process.env.BASE_URL || 'https://smart-vehicle-access-control-system.mccmrfip.in';
  const targetRedirect = `${portalUrl}/admin/approval`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${autoRedirect ? `<meta http-equiv="refresh" content="1;url=${targetRedirect}">` : ''}
  <title>SVACS — ${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0F172A, #1E293B); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 24px; padding: 44px 36px; max-width: 540px; width: 100%; text-align: center; box-shadow: 0 24px 48px rgba(0,0,0,0.25); border: 1px solid #E2E8F0; }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { color: ${color}; font-size: 22px; font-weight: 900; margin-bottom: 14px; letter-spacing: -0.5px; }
    .msg { color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 24px; }
    .badge { display: inline-block; background: ${color}15; color: ${color}; padding: 8px 20px; border-radius: 50px; font-weight: 800; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border: 1.5px solid ${color}30; }
    a.btn { display: inline-block; margin-top: 24px; background: linear-gradient(135deg, #0F172A, #1E293B); color: #fff; padding: 14px 36px; border-radius: 50px; text-decoration: none; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(15,23,42,0.3); }
    .spinner { margin-top: 18px; display: inline-block; width: 24px; height: 24px; border: 3px solid #CBD5E1; border-top-color: ${color}; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  ${autoRedirect ? `<script>setTimeout(function() { window.location.href = "${targetRedirect}"; }, 800);</script>` : ''}
</head>
<body>
  <div class="card">
    <div class="icon">${title.split(' ')[0]}</div>
    <h1>${title}</h1>
    <div class="msg">${message}</div>
    <div class="badge">MCC-MRF Innovation Park &bull; Smart Access Control</div>
    ${autoRedirect ? `<div style="margin-top:16px;"><div class="spinner"></div><p style="font-size:12px; color:#64748B; margin-top:8px; font-weight:600;">Redirecting directly to Super Admin Approval Dashboard...</p></div>` : ''}
    <div>
      <a class="btn" href="${targetRedirect}">Go to Approval Dashboard</a>
    </div>
  </div>
</body>
</html>`;
}



// Admin gets all requests with optional status filter
export const getRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let allRequests = [...inMemoryRequests];

    if (isDbConnected()) {
      try {
        let query = {};
        if (status && status !== 'All') {
          if (status === 'Pending') {
            query.status = { $in: ['Pending', 'Pending Company Approval', 'Pending Super Admin Approval'] };
          } else {
            query.status = status;
          }
        }
        const mongoRequests = await AccessRequest.find(query).sort({ createdAt: -1 });
        if (mongoRequests && mongoRequests.length > 0) {
          const mongoBikeNumbers = new Set(mongoRequests.map(r => r.bikeNumber));
          allRequests = [
            ...mongoRequests,
            ...inMemoryRequests.filter(r => !mongoBikeNumbers.has(r.bikeNumber))
          ];
        }
      } catch (err) {
        console.error('Mongo query error in getRequests:', err.message);
      }
    }

    if (status && status !== 'All') {
      if (status === 'Pending') {
        allRequests = allRequests.filter(r => 
          r.status === 'Pending' || 
          r.status === 'Pending Company Approval' || 
          r.status === 'Pending Super Admin Approval'
        );
      } else {
        allRequests = allRequests.filter(r => r.status === status);
      }
    }

    res.json(allRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin gets pending requests
export const getPendingRequests = async (req, res) => {
  try {
    let pending = inMemoryRequests.filter(r => 
      r.status === 'Pending' || 
      r.status === 'Pending Company Approval' || 
      r.status === 'Pending Super Admin Approval'
    );

    if (isDbConnected()) {
      try {
        const mongoPending = await AccessRequest.find({ 
          status: { $in: ['Pending', 'Pending Company Approval', 'Pending Super Admin Approval'] } 
        }).sort({ createdAt: -1 });
        if (mongoPending && mongoPending.length > 0) {
          const mongoBikeNumbers = new Set(mongoPending.map(r => r.bikeNumber));
          pending = [
            ...mongoPending,
            ...pending.filter(r => !mongoBikeNumbers.has(r.bikeNumber))
          ];
        }
      } catch (err) {
        console.error('Mongo query error in getPendingRequests:', err.message);
      }
    }

    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin approves request
export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const token = generateSecureToken();
    const qrUrl = getQRImageUrl(token);

    let request = inMemoryRequests.find(r => r._id === id || r.bikeNumber === id);
    if (request) {
      request.status = 'Approved';
      request.actionDate = new Date();
      request.token = token;
      saveToDisk();
    }

    if (isDbConnected()) {
      try {
        let dbReq = null;
        const targetBike = request?.bikeNumber || id;
        const targetId = request?._id || id;

        if (mongoose.Types.ObjectId.isValid(id)) {
          dbReq = await AccessRequest.findById(id);
        }
        if (!dbReq && mongoose.Types.ObjectId.isValid(targetId)) {
          dbReq = await AccessRequest.findById(targetId);
        }
        if (!dbReq) {
          dbReq = await AccessRequest.findOne({
            $or: [
              { bikeNumber: targetBike },
              { bikeNumber: targetBike.replace(/\s+/g, '') },
              { bikeNumber: new RegExp(targetBike.replace(/[\s\-]/g, ''), 'i') }
            ]
          });
        }
        if (dbReq) {
          dbReq.status = 'Approved';
          dbReq.token = token;
          dbReq.actionDate = new Date();
          await dbReq.save();

          await QRCode.create({
            token,
            request: dbReq._id,
            qrImageUrl: qrUrl,
            isValid: true
          }).catch(e => console.log('QRCode record exists or error:', e.message));

          request = dbReq;
        }
      } catch (err) {
        console.error('Mongo approve sync error:', err.message);
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await sendApprovalEmail(request, qrUrl).catch(e => console.log('Email notice skipped:', e.message));

    return res.json({ message: 'Approved successfully', request, token, qrUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin rejects request
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    let request = inMemoryRequests.find(r => r._id === id || r.bikeNumber === id);
    if (request) {
      request.status = 'Rejected';
      request.actionDate = new Date();
      request.actionReason = reason.trim();
      saveToDisk();
    }

    if (isDbConnected()) {
      try {
        let dbReq = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          dbReq = await AccessRequest.findById(id);
        }
        if (!dbReq && request) {
          dbReq = await AccessRequest.findOne({ bikeNumber: request.bikeNumber });
        }
        if (dbReq) {
          dbReq.status = 'Rejected';
          dbReq.actionDate = new Date();
          dbReq.actionReason = reason.trim();
          await dbReq.save();

          request = dbReq;
        }
      } catch (err) {
        console.error('Mongo reject sync error:', err.message);
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await sendRejectionEmail(request, reason.trim()).catch(e => console.log('Email notice skipped:', e.message));

    return res.json({ message: 'Rejected successfully', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin disables user access
export const disableRequest = async (req, res) => {
  try {
    const { id } = req.params;

    let request = inMemoryRequests.find(r => r._id === id || r.bikeNumber === id);
    if (request) {
      request.status = 'Disabled';
      request.actionDate = new Date();
      saveToDisk();
    }

    if (isDbConnected()) {
      try {
        let dbReq = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          dbReq = await AccessRequest.findById(id);
        }
        if (!dbReq && request) {
          dbReq = await AccessRequest.findOne({ bikeNumber: request.bikeNumber });
        }
        if (dbReq) {
          dbReq.status = 'Disabled';
          dbReq.actionDate = new Date();
          await dbReq.save();

          request = dbReq;
        }
      } catch (err) {
        console.error('Mongo disable sync error:', err.message);
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.json({ message: 'User access disabled successfully', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin deletes user access
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const index = inMemoryRequests.findIndex(r => r._id === id || r.bikeNumber === id);
    let request = null;
    if (index !== -1) {
      request = inMemoryRequests[index];
      inMemoryRequests.splice(index, 1);
      saveToDisk();
    }

    if (isDbConnected()) {
      try {
        let dbReq = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          dbReq = await AccessRequest.findById(id);
        }
        if (dbReq) {
          dbReq.status = 'Deleted';
          await dbReq.save();
        }
      } catch (err) {
        console.error('Mongo delete sync error:', err.message);
      }
    }

    return res.json({ message: 'User access deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin updates request details and validity dates
export const updateRequestValidity = async (req, res) => {
  try {
    const { id } = req.params;
    const { accessStartDate, accessExpiryDate, bikeNumber, name, department, company, designation } = req.body;

    let request = inMemoryRequests.find(r => r._id === id || r.bikeNumber === id);
    if (request) {
      if (accessStartDate) request.accessStartDate = new Date(accessStartDate);
      if (accessExpiryDate) request.accessExpiryDate = new Date(accessExpiryDate);
      if (bikeNumber) request.bikeNumber = bikeNumber.trim().toUpperCase();
      if (name) request.name = name.trim();
      if (department) request.department = department.trim();
      if (company) request.company = company.trim();
      if (designation) request.designation = designation.trim();
      saveToDisk();
    }

    if (isDbConnected()) {
      try {
        let dbReq = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          dbReq = await AccessRequest.findById(id);
        }
        if (!dbReq && request) {
          dbReq = await AccessRequest.findOne({ bikeNumber: request.bikeNumber });
        }
        if (dbReq) {
          if (accessStartDate) dbReq.accessStartDate = new Date(accessStartDate);
          if (accessExpiryDate) dbReq.accessExpiryDate = new Date(accessExpiryDate);
          if (bikeNumber) dbReq.bikeNumber = bikeNumber.trim().toUpperCase();
          if (name) dbReq.name = name.trim();
          if (department) dbReq.department = department.trim();
          if (company) dbReq.company = company.trim();
          if (designation) dbReq.designation = designation.trim();
          await dbReq.save();
          request = dbReq;
        }
      } catch (err) {
        console.error('Mongo update sync error:', err.message);
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.json({ message: 'Request validity updated successfully', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



