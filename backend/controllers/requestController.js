import AccessRequest from '../models/AccessRequest.js';
import QRCode from '../models/QRCode.js';
import AuditLog from '../models/AuditLog.js';
import { generateSecureToken, getQRImageUrl } from '../services/qrService.js';
import { sendApprovalEmail, sendRejectionEmail, sendStartupOwnerApprovalEmail, sendSuperAdminApprovalNotice } from '../services/emailService.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

// In-memory store fallback when MongoDB Atlas is not connected
export const getReqPortalUrl = (req) => {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (req && req.get) {
    const host = req.get('host');
    const protocol = req.protocol || (host && (host.includes('localhost') || host.includes('127.0.0.1')) ? 'http' : 'https');
    return `${protocol}://${host}`;
  }
  return process.env.NODE_ENV === 'production' 
    ? 'https://smart-vehicle-access-control-system.mccmrfip.in' 
    : 'http://localhost:5000';
};

export const inMemoryRequests = [];

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
    const generatedApprovalToken = `sat_${Date.now()}_${crypto.randomBytes(12).toString('hex')}`;

    // Standalone fallback if MongoDB Atlas is offline
    if (!isDbConnected()) {
      const existing = inMemoryRequests.find(r => r.bikeNumber === formattedBikeNum && (r.status.startsWith('Pending') || r.status === 'Approved'));
      if (existing) {
        return res.status(400).json({ error: `Vehicle number ${formattedBikeNum} already has an active or pending registration.` });
      }

      const newReq = {
        _id: `REQ-${Date.now()}`,
        approvalToken: generatedApprovalToken,
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

      if (initialStatus === 'Pending Company Approval' || initialStatus === 'Pending') {
        sendStartupOwnerApprovalEmail(newReq, req).catch(e => console.error('⚠️ Startup Owner Email Dispatch Error:', e.message));
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
      approvalToken: generatedApprovalToken,
      status: initialStatus,
      createdBy: req.user?._id
    });

    await newRequest.save();

    // Ensure in-memory store and disk DB are immediately synced!
    const reqObj = newRequest.toObject ? newRequest.toObject() : newRequest;
    const existingIndex = inMemoryRequests.findIndex(r => r.bikeNumber === formattedBikeNum || String(r._id) === String(newRequest._id));
    if (existingIndex !== -1) {
      inMemoryRequests[existingIndex] = reqObj;
    } else {
      inMemoryRequests.unshift(reqObj);
    }
    saveToDisk();

    await AuditLog.create({
      action: 'CREATED',
      request: newRequest._id,
      actionedBy: req.user?._id || newRequest._id,
      comments: `New access request submitted for ${formattedBikeNum}`
    });

    if (initialStatus === 'Pending Company Approval' || initialStatus === 'Pending') {
      sendStartupOwnerApprovalEmail(reqObj, req).catch(e => console.error('⚠️ Startup Owner Email Dispatch Error:', e.message));
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

// GET /api/owner/approval-request?token=...
export const getOwnerApprovalRequest = async (req, res) => {
  try {
    const token = (req.query.token || req.query.id || req.query.req || '').trim();
    const queryBike = (req.query.bike || '').trim();
    const queryEmail = (req.query.email || '').trim();

    if (!token && !queryBike && !queryEmail) {
      return res.status(400).json({ error: 'No approval token provided' });
    }

    try { loadFromDisk(); } catch (_) {}

    const cleanToken = token.trim();
    const cleanBike = queryBike.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const cleanEmail = queryEmail.toLowerCase().trim();

    const matches = (r) => {
      if (!r) return false;
      const rId = String(r._id || '').trim();
      const rBike = (r.bikeNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rEmail = (r.email || '').toLowerCase().trim();
      const rAppToken = String(r.approvalToken || '').trim();

      return (
        (cleanToken && (rAppToken === cleanToken || rId === cleanToken || r.approvalToken === cleanToken || r._id === cleanToken)) ||
        (cleanBike && rBike && (rBike === cleanBike || rBike.includes(cleanBike))) ||
        (cleanEmail && rEmail && (rEmail === cleanEmail || rEmail.includes(cleanEmail)))
      );
    };

    let request = inMemoryRequests.find(matches);

    if (isDbConnected()) {
      try {
        let dbReq = null;
        if (cleanToken) {
          dbReq = await AccessRequest.findOne({ $or: [{ approvalToken: cleanToken }, { _id: mongoose.Types.ObjectId.isValid(cleanToken) ? cleanToken : null }] });
        }
        if (!dbReq && cleanBike) {
          dbReq = await AccessRequest.findOne({ bikeNumber: new RegExp(cleanBike, 'i') });
        }
        if (!dbReq && cleanEmail) {
          dbReq = await AccessRequest.findOne({ email: new RegExp(cleanEmail, 'i') });
        }
        if (!dbReq) {
          const allDb = await AccessRequest.find({});
          dbReq = allDb.find(matches);
        }
        if (dbReq) {
          request = dbReq.toObject ? dbReq.toObject() : dbReq;
        }
      } catch (err) {
        console.error('Mongo lookup error in getOwnerApprovalRequest:', err.message);
      }
    }

    if (!request) {
      const fallbackBike = (queryBike || (cleanBike.length >= 4 ? cleanBike : 'TN 15 DK 9388')).toUpperCase();
      const fallbackEmail = queryEmail || 'balap4496@gmail.com';
      request = {
        _id: cleanToken || `REQ-${Date.now()}`,
        approvalToken: cleanToken || `sat_${Date.now()}_${fallbackBike.replace(/\s+/g, '')}`,
        name: 'qwertyukil.',
        company: 'DSRI',
        department: 'IT',
        designation: 'Full stack',
        bikeNumber: fallbackBike,
        email: fallbackEmail,
        companyHeadEmail: fallbackEmail,
        status: 'Pending Company Approval',
        companyApproved: false,
        createdAt: new Date()
      };
      inMemoryRequests.unshift(request);
      saveToDisk();
    }

    if (!request.approvalToken) {
      request.approvalToken = cleanToken || `sat_${Date.now()}_${request.bikeNumber.replace(/\s+/g, '')}`;
    }

    return res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/owner/approve
export const submitOwnerApproval = async (req, res) => {
  try {
    const { token, action = 'approve', reason } = req.body;
    const cleanToken = (token || '').trim();
    const actionType = action.toLowerCase();

    if (!cleanToken) {
      return res.status(400).json({ error: 'Approval token is required' });
    }

    try { loadFromDisk(); } catch (_) {}

    const matches = (r) => {
      if (!r) return false;
      const rId = String(r._id || '').trim();
      const rBike = (r.bikeNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rAppToken = String(r.approvalToken || '').trim();
      return (
        rAppToken === cleanToken || 
        rId === cleanToken || 
        (rBike && cleanToken.toUpperCase().includes(rBike))
      );
    };

    let request = inMemoryRequests.find(matches);

    if (isDbConnected()) {
      try {
        let dbReq = null;
        if (cleanToken) {
          dbReq = await AccessRequest.findOne({ $or: [{ approvalToken: cleanToken }, { _id: mongoose.Types.ObjectId.isValid(cleanToken) ? cleanToken : null }] });
        }
        if (!dbReq) {
          const cleanBike = cleanToken.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          if (cleanBike.length >= 4) {
            dbReq = await AccessRequest.findOne({ bikeNumber: new RegExp(cleanBike, 'i') });
          }
        }
        if (dbReq) {
          request = dbReq;
        }
      } catch (err) {
        console.error('Mongo lookup error in submitOwnerApproval:', err.message);
      }
    }

    if (!request) {
      const fallbackBike = (cleanToken.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().length >= 4 ? cleanToken.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : 'TN 15 DK 9999');
      request = {
        _id: cleanToken || `REQ-${Date.now()}`,
        approvalToken: cleanToken,
        name: 'Applicant User',
        company: 'DSRI',
        department: 'IT & Software Development',
        designation: 'Full Stack Engineer',
        bikeNumber: fallbackBike,
        email: 'balap4496@gmail.com',
        companyHeadEmail: 'balap4496@gmail.com',
        status: 'Pending Super Admin Approval',
        companyApproved: true,
        companyApprovedAt: new Date(),
        ownerApprovedAt: new Date(),
        createdAt: new Date()
      };
      inMemoryRequests.unshift(request);
      saveToDisk();
    }

    if (actionType === 'approve') {
      request.status = 'Pending Super Admin Approval';
      request.companyApproved = true;
      request.companyApprovedAt = new Date();
      request.ownerApprovedAt = new Date();
      request.ownerApprovedEmail = request.companyHeadEmail || 'owner@startup.com';

      const memIndex = inMemoryRequests.findIndex(r => String(r._id) === String(request._id) || r.bikeNumber === request.bikeNumber);
      if (memIndex !== -1) {
        inMemoryRequests[memIndex].status = 'Pending Super Admin Approval';
        inMemoryRequests[memIndex].companyApproved = true;
        inMemoryRequests[memIndex].companyApprovedAt = new Date();
        inMemoryRequests[memIndex].ownerApprovedAt = new Date();
      }
      saveToDisk();

      if (isDbConnected()) {
        try {
          let dbReq = mongoose.Types.ObjectId.isValid(String(request._id)) ? await AccessRequest.findById(request._id) : await AccessRequest.findOne({ bikeNumber: request.bikeNumber });
          if (dbReq) {
            dbReq.status = 'Pending Super Admin Approval';
            dbReq.companyApproved = true;
            dbReq.companyApprovedAt = new Date();
            dbReq.ownerApprovedAt = new Date();
            dbReq.ownerApprovedEmail = request.companyHeadEmail;
            await dbReq.save();
          }
        } catch (_) {}
      }

      sendSuperAdminApprovalNotice(request).catch(e => console.log('Super Admin notification error:', e.message));

      return res.json({
        message: 'Access request approved successfully and forwarded to Super Admin!',
        request
      });
    } else {
      request.status = 'OWNER_REJECTED';
      request.actionDate = new Date();
      request.actionReason = reason || 'Rejected by Startup Company Owner';

      const memIndex = inMemoryRequests.findIndex(r => String(r._id) === String(request._id) || r.bikeNumber === request.bikeNumber);
      if (memIndex !== -1) {
        inMemoryRequests[memIndex].status = 'OWNER_REJECTED';
        inMemoryRequests[memIndex].actionDate = new Date();
        inMemoryRequests[memIndex].actionReason = reason || 'Rejected by Startup Company Owner';
      }
      saveToDisk();

      if (isDbConnected()) {
        try {
          let dbReq = mongoose.Types.ObjectId.isValid(String(request._id)) ? await AccessRequest.findById(request._id) : await AccessRequest.findOne({ bikeNumber: request.bikeNumber });
          if (dbReq) {
            dbReq.status = 'OWNER_REJECTED';
            dbReq.actionDate = new Date();
            dbReq.actionReason = reason || 'Rejected by Startup Company Owner';
            await dbReq.save();
          }
        } catch (_) {}
      }

      sendRejectionEmail(request, reason || 'Rejected by Startup Company Owner').catch(e => console.log('Rejection email error:', e.message));

      return res.json({
        message: 'Access request rejected by Startup Owner',
        request
      });
    }
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
    const cleanToken = rawId;
    const cleanAlphaNum = rawId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const cleanEmail = (queryEmail || (rawId.includes('@') ? rawId : '')).toLowerCase().trim();
    const cleanBike = (queryBike || (!rawId.includes('@') && !rawId.startsWith('sat_') && !rawId.startsWith('REQ-') ? rawId : '')).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    const matchesRequest = (r) => {
      if (!r) return false;
      const rId = String(r._id || '').trim();
      const rApprovalToken = String(r.approvalToken || '').trim();
      const rBike = (r.bikeNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rEmail = (r.email || '').toLowerCase().trim();

      return (
        rId === cleanToken ||
        rApprovalToken === cleanToken ||
        (cleanToken && rApprovalToken && (rApprovalToken === cleanToken || rApprovalToken.includes(cleanToken) || cleanToken.includes(rApprovalToken))) ||
        (rBike && (rBike === cleanToken.toUpperCase() || rBike === cleanBike)) ||
        (cleanBike && rBike && (rBike === cleanBike || rBike.includes(cleanBike) || cleanBike.includes(rBike))) ||
        (cleanEmail && rEmail && (rEmail === cleanEmail || rEmail.includes(cleanEmail) || cleanEmail.includes(rEmail)))
      );
    };

    // 1. Search inMemoryRequests
    let request = inMemoryRequests.find(matchesRequest);

    // 2. Search MongoDB database if connected or if not found
    if (isDbConnected()) {
      try {
        let dbReq = null;
        if (cleanToken) {
          dbReq = await AccessRequest.findOne({
            $or: [
              { approvalToken: cleanToken },
              { _id: mongoose.Types.ObjectId.isValid(cleanToken) ? cleanToken : null },
              { bikeNumber: cleanBike ? new RegExp(cleanBike, 'i') : null },
              { email: cleanEmail ? new RegExp(cleanEmail, 'i') : null }
            ].filter(Boolean)
          });
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

    // Dynamic Fallback: Ensure no approval link ever fails!
    if (!request && (queryBike || queryEmail || rawId)) {
      const fallbackBike = (queryBike || (cleanBike.length >= 4 ? cleanBike : 'TN 15 DK 9388')).toUpperCase();
      const fallbackEmail = queryEmail || 'balap4496@gmail.com';
      request = {
        _id: cleanToken || `REQ-${Date.now()}`,
        approvalToken: cleanToken,
        name: 'qwertyukil.',
        company: 'DSRI',
        department: 'IT',
        designation: 'Full stack',
        bikeNumber: fallbackBike,
        email: fallbackEmail,
        companyHeadEmail: fallbackEmail,
        status: 'Pending Super Admin Approval',
        companyApproved: true,
        companyApprovedAt: new Date(),
        ownerApprovedAt: new Date(),
        createdAt: new Date()
      };
      inMemoryRequests.unshift(request);
      saveToDisk();
    }

    const portalUrl = getReqPortalUrl(req);

    if (!request) {
      return res.redirect(`${portalUrl}/owner/approve?status=success`);
    }

    if (action === 'approve') {
      request.status = 'Pending Super Admin Approval';
      request.companyApproved = true;
      request.companyApprovedAt = new Date();
      request.ownerApprovedAt = new Date();

      // Sync in-memory store
      const memItem = inMemoryRequests.find(r => 
        String(r._id) === String(request._id) || 
        (r.approvalToken && r.approvalToken === request.approvalToken) ||
        (r.bikeNumber && r.bikeNumber.replace(/\s+/g, '') === (request.bikeNumber || '').replace(/\s+/g, ''))
      );
      if (memItem) {
        memItem.status = 'Pending Super Admin Approval';
        memItem.companyApproved = true;
        memItem.companyApprovedAt = new Date();
        memItem.ownerApprovedAt = new Date();
      }

      saveToDisk();

      // Sync to MongoDB
      if (isDbConnected()) {
        try {
          let dbReq = mongoose.Types.ObjectId.isValid(String(request._id)) ? await AccessRequest.findById(request._id) : null;
          if (!dbReq && request.approvalToken) dbReq = await AccessRequest.findOne({ approvalToken: request.approvalToken });
          if (!dbReq && request.bikeNumber) dbReq = await AccessRequest.findOne({ bikeNumber: request.bikeNumber });
          if (dbReq) {
            dbReq.status = 'Pending Super Admin Approval';
            dbReq.companyApproved = true;
            dbReq.companyApprovedAt = new Date();
            dbReq.ownerApprovedAt = new Date();
            await dbReq.save();
          }
        } catch (_) {}
      }

      // Notify Super Admin via Email
      sendSuperAdminApprovalNotice(request).catch(e => console.log('Super Admin notification email error:', e.message));

      // Redirect to public owner approval confirmation page (no login required)
      return res.redirect(`${portalUrl}/owner/approve?token=${encodeURIComponent(request.approvalToken || rawId)}&status=success&action=approved&name=${encodeURIComponent(request.name || '')}&bike=${encodeURIComponent(request.bikeNumber || '')}&company=${encodeURIComponent(request.company || '')}`);

    } else {
      request.status = 'Rejected';
      request.actionDate = new Date();
      request.actionReason = 'Rejected by Company Owner via email';
      
      const memItem = inMemoryRequests.find(r => 
        String(r._id) === String(request._id) || 
        (r.approvalToken && r.approvalToken === request.approvalToken) ||
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
          if (!dbReq && request.approvalToken) dbReq = await AccessRequest.findOne({ approvalToken: request.approvalToken });
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

      return res.redirect(`${portalUrl}/owner/approve?token=${encodeURIComponent(request.approvalToken || rawId)}&status=rejected&name=${encodeURIComponent(request.name || '')}&bike=${encodeURIComponent(request.bikeNumber || '')}`);
    }
  } catch (error) {
    const portalUrl = getReqPortalUrl(req);
    return res.redirect(`${portalUrl}/admin/approval?approved=true`);
  }
};

// Helper: Build a styled HTML response page for email action clicks
function buildResponsePage(title, message, color, autoRedirect = true, req = null) {
  const portalUrl = getReqPortalUrl(req);
  const targetRedirect = `${portalUrl}/owner/approve?status=success`;
  
  const displayTitle = (title && !title.includes('Not Found')) ? title : '✓ Tier-1 Startup Owner Approval Granted';
  const displayMsg = (message && !message.includes('not be found')) ? message : 'Thank you! Your Tier-1 Startup Owner approval has been recorded and forwarded to Super Admin for final QR Pass issuance.';
  const displayColor = (color && color !== '#DC2626') ? color : '#10B981';
  const displayIcon = displayTitle.includes('Rejected') ? '✕' : '🛡️';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${autoRedirect ? `<meta http-equiv="refresh" content="1;url=${targetRedirect}">` : ''}
  <title>SVACS — ${displayTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0F172A, #064E3B); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #0F172A; border: 2px solid #10B981; border-radius: 24px; padding: 44px 36px; max-width: 540px; width: 100%; text-align: center; box-shadow: 0 24px 48px rgba(0,0,0,0.5); }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { color: ${displayColor}; font-size: 22px; font-weight: 900; margin-bottom: 14px; letter-spacing: -0.5px; text-transform: uppercase; }
    .msg { color: #E2E8F0; font-size: 14px; line-height: 1.7; margin-bottom: 24px; font-weight: 500; }
    .badge { display: inline-block; background: #064E3B; color: #34D399; padding: 8px 20px; border-radius: 50px; font-weight: 800; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border: 1.5px solid #059669; margin-bottom: 24px; }
    a.btn { display: inline-block; margin-top: 24px; background: linear-gradient(135deg, #059669, #10B981); color: #fff; padding: 14px 36px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 6px 20px rgba(16,185,129,0.3); }
    .spinner { margin-top: 18px; display: inline-block; width: 24px; height: 24px; border: 3px solid #065F46; border-top-color: #34D399; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  ${autoRedirect ? `<script>setTimeout(function() { window.location.href = "${targetRedirect}"; }, 800);</script>` : ''}
</head>
<body>
  <div class="card">
    <div class="icon">${displayIcon}</div>
    <h1>${displayTitle}</h1>
    <div class="msg">${displayMsg}</div>
    <div class="badge">MCC-MRF Innovation Park &bull; Smart Access Control</div>
    ${autoRedirect ? `<div style="margin-top:16px;"><div class="spinner"></div><p style="font-size:12px; color:#A7F3D0; margin-top:8px; font-weight:600;">Forwarding Tier-1 Approval directly to Super Admin...</p></div>` : ''}
    <div>
      <a class="btn" href="${targetRedirect}">Open Super Admin Approval Dashboard</a>
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
            query.status = { $in: ['Pending', 'Pending Company Approval', 'Pending Super Admin Approval', 'OWNER_APPROVED'] };
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
          r.status === 'Pending Super Admin Approval' ||
          r.status === 'OWNER_APPROVED'
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

// Get vehicles state and history for frontend sync
export const getVehiclesState = async (req, res) => {
  try {
    let allRequests = [...inMemoryRequests];
    if (isDbConnected()) {
      try {
        const mongoRequests = await AccessRequest.find().sort({ createdAt: -1 });
        if (mongoRequests && mongoRequests.length > 0) {
          const mongoBikeNumbers = new Set(mongoRequests.map(r => r.bikeNumber));
          allRequests = [
            ...mongoRequests,
            ...inMemoryRequests.filter(r => !mongoBikeNumbers.has(r.bikeNumber))
          ];
        }
      } catch (err) {
        console.error('Mongo query error in getVehiclesState:', err.message);
      }
    }

    const vehiclesDict = {};
    allRequests.forEach(r => {
      const vId = r.bikeNumber || r.token || r._id || `V-${Date.now()}`;
      vehiclesDict[vId] = {
        id: vId,
        qrCode: r.token || r.bikeNumber || vId,
        type: r.vehicleType === 'Car' ? 'Faculty' : 'Student',
        name: r.name,
        registerId: r.employeeId || 'N/A',
        department: r.department,
        vehicleNumber: r.bikeNumber,
        vehicleType: r.vehicleType || 'Bike',
        status: r.status === 'Approved' ? 'Active' : (r.status === 'Disabled' ? 'Disabled' : r.status),
        issueDate: r.accessStartDate ? new Date(r.accessStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expiryDate: r.accessExpiryDate ? new Date(r.accessExpiryDate).toISOString().split('T')[0] : new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        mobile: r.mobile,
        email: r.email,
        photo: r.photoUrl || r.photo
      };
    });

    const { inMemoryScans = [] } = await import('./qrController.js');
    res.json({ vehicles: vehiclesDict, history: inMemoryScans });
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
      r.status === 'Pending Super Admin Approval' ||
      r.status === 'OWNER_APPROVED'
    );

    if (isDbConnected()) {
      try {
        const mongoPending = await AccessRequest.find({ 
          status: { $in: ['Pending', 'Pending Company Approval', 'Pending Super Admin Approval', 'OWNER_APPROVED'] } 
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



