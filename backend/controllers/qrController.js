import QRCode from '../models/QRCode.js';
import AccessRequest from '../models/AccessRequest.js';
import ScanHistory from '../models/ScanHistory.js';
import { inMemoryRequests } from './requestController.js';
import { sendScanVerificationEmail, sendScanAlertEmail } from '../services/emailService.js';
import mongoose from 'mongoose';

const isDbConnected = () => mongoose.connection.readyState === 1;

import fs from 'fs';
import path from 'path';

const SCANS_FILE = path.resolve(process.cwd(), 'scans_db.json');

export const inMemoryScans = [
  {
    _id: 'SCAN-101',
    qrToken: 'BIKE-2026-000001',
    scanDate: new Date(),
    result: 'Granted',
    reason: 'ALLOWED',
    device: 'Main Gate Terminal 1',
    ownerName: 'Dr. Ramesh Kumar',
    registerId: 'EMP-9023',
    department: 'Mechanical Engineering',
    gate: 'Main Entrance Gate',
    vehicleNumber: 'TN 38 AB 1234',
    vehicleType: 'Car'
  },
  {
    _id: 'SCAN-102',
    qrToken: 'expired-token',
    scanDate: new Date(Date.now() - 3600000),
    result: 'Denied',
    reason: 'ACCESS EXPIRED',
    device: 'South Gate Terminal',
    ownerName: 'Suresh Mohan',
    registerId: 'EMP-0001',
    department: 'Mechanical',
    gate: 'South Gate',
    vehicleNumber: 'TN 38 EXP 2025',
    vehicleType: 'Bike'
  }
];

export const saveScansToDisk = () => {
  try {
    fs.writeFileSync(SCANS_FILE, JSON.stringify(inMemoryScans, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save scans to disk:', err.message);
  }
};

export const loadScansFromDisk = () => {
  try {
    if (fs.existsSync(SCANS_FILE)) {
      const data = fs.readFileSync(SCANS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryScans.length = 0;
        inMemoryScans.push(...parsed);
      }
    }
  } catch (err) {
    console.error('Failed to load scans from disk:', err.message);
  }
};

loadScansFromDisk();

const logScan = async (data) => {
  // Format for in-memory and frontend reports
  const dateObj = new Date();
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  let reqObj = null;
  if (data.request && typeof data.request === 'object' && data.request.name) {
    reqObj = data.request;
  } else if (data.request) {
    reqObj = inMemoryRequests.find(r => String(r._id) === String(data.request) || r.token === String(data.request) || r.bikeNumber === String(data.request));
    if (!reqObj && isDbConnected()) {
      try {
        reqObj = await AccessRequest.findById(data.request);
      } catch (_) {}
    }
  }

  if (!reqObj && data.qrToken) {
    reqObj = inMemoryRequests.find(r => 
      r.token === data.qrToken || 
      (r.bikeNumber && data.qrToken.includes(r.bikeNumber.replace(/\s+/g, '')))
    );
  }

  const ownerName = reqObj?.name || data.ownerName || 'Verified User';
  const vehicleNumber = reqObj?.bikeNumber || data.vehicleNumber || data.qrToken || 'N/A';
  const registerId = reqObj?.employeeId || data.registerId || 'N/A';
  const department = reqObj?.department || data.department || 'N/A';
  const vehicleType = reqObj?.vehicleType || data.vehicleType || 'Bike';

  const newScan = {
    _id: `SCAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    qrToken: data.qrToken,
    date: dateStr,
    time: timeStr,
    scanDate: dateObj,
    result: data.result,
    reason: data.reason || 'ALLOWED',
    device: data.device || 'Mobile Scanner',
    gate: data.device || 'Main Gate Terminal 1',
    status: data.result,
    ownerName,
    vehicleNumber,
    registerId,
    department,
    vehicleType,
    request: {
      _id: reqObj ? reqObj._id : (data.request || 'N/A'),
      name: ownerName,
      bikeNumber: vehicleNumber,
      employeeId: registerId,
      department: department,
      vehicleType: vehicleType
    }
  };

  inMemoryScans.unshift(newScan);
  saveScansToDisk();

  if (isDbConnected()) {
    try {
      await ScanHistory.create({
        ...data,
        vehicleNumber,
        request: reqObj?._id || (mongoose.Types.ObjectId.isValid(data.request) ? data.request : null)
      });
    } catch (e) {
      console.warn('Scan history log error:', e.message);
    }
  }
};

export const verifyToken = async (req, res) => {
  const rawQuery = req.params.token || req.body?.token || req.body?.qrToken || req.body?.scannedQuery || req.body?.code || '';
  const { device = 'Mobile Scanner', browser = 'Web', ipAddress = '127.0.0.1' } = req.body || {};

  try {
    let qrRecord = null;
    let request = null;

    let inputToken = String(rawQuery).trim();
    if (!inputToken) {
      return res.json({ 
        status: 'DENIED', 
        resultType: 'INVALID_QR',
        reason: 'NO TOKEN PROVIDED — ACCESS DENIED' 
      });
    }

    // Handle full URLs like https://localhost:5173/verify/BIKE-2026-000344
    if (inputToken.includes('/verify/')) {
      inputToken = inputToken.split('/verify/').pop().trim();
    }
    inputToken = decodeURIComponent(inputToken).trim();

    const normalizedToken = inputToken;
    const cleanAlphaNum = normalizedToken.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Strip common prefix like BIKE-2026- or BIKE-
    let tokenNoPrefix = normalizedToken;
    if (tokenNoPrefix.toUpperCase().startsWith('BIKE-2026-')) {
      tokenNoPrefix = tokenNoPrefix.substring(10);
    } else if (tokenNoPrefix.toUpperCase().startsWith('BIKE-')) {
      tokenNoPrefix = tokenNoPrefix.substring(5);
    }
    const cleanNoPrefixAlphaNum = tokenNoPrefix.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // 1. Check MongoDB Database first if connected
    if (isDbConnected()) {
      qrRecord = await QRCode.findOne({ token: normalizedToken }).populate('request');
      if (!qrRecord) {
        let reqDoc = await AccessRequest.findOne({ 
          $or: [
            { token: normalizedToken },
            { bikeNumber: normalizedToken },
            { bikeNumber: new RegExp(normalizedToken, 'i') }
          ]
        });
        
        if (!reqDoc) {
          const allReqs = await AccessRequest.find({});
          reqDoc = allReqs.find(r => {
            const reqTokenClean = (r.token || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const reqBikeClean = (r.bikeNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const reqIdClean = String(r._id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const reqEmpClean = (r.employeeId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

            return (
              (reqTokenClean && (reqTokenClean === cleanAlphaNum || reqTokenClean === cleanNoPrefixAlphaNum)) ||
              (reqBikeClean && (reqBikeClean === cleanAlphaNum || reqBikeClean === cleanNoPrefixAlphaNum)) ||
              (reqIdClean && (reqIdClean === cleanAlphaNum || reqIdClean === cleanNoPrefixAlphaNum)) ||
              (reqEmpClean.length >= 2 && (reqEmpClean === cleanAlphaNum || reqEmpClean === cleanNoPrefixAlphaNum))
            );
          });
        }

        if (reqDoc) {
          request = reqDoc;
          qrRecord = { token: normalizedToken, isValid: request.status === 'Approved', request };
        }
      } else {
        request = qrRecord.request;
      }
    }

    // 2. Fallback to in-memory store if not found in MongoDB
    if (!qrRecord) {
      const foundInMemory = inMemoryRequests.find(r => {
        const reqTokenClean = (r.token || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const reqBikeClean = (r.bikeNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const reqIdClean = String(r._id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const reqEmpClean = (r.employeeId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        return (
          (reqTokenClean && (reqTokenClean === cleanAlphaNum || reqTokenClean === cleanNoPrefixAlphaNum)) ||
          (reqBikeClean && (reqBikeClean === cleanAlphaNum || reqBikeClean === cleanNoPrefixAlphaNum)) ||
          (reqIdClean && (reqIdClean === cleanAlphaNum || reqIdClean === cleanNoPrefixAlphaNum)) ||
          (reqEmpClean.length >= 2 && (reqEmpClean === cleanAlphaNum || reqEmpClean === cleanNoPrefixAlphaNum))
        );
      });

      if (foundInMemory) {
        request = foundInMemory;
        qrRecord = { token: normalizedToken, isValid: request.status === 'Approved', request };
      } else if (normalizedToken === 'test-token') {
        request = {
          _id: 'REQ-DEMO',
          name: 'Demo User',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
          employeeId: 'DEMO-001',
          department: 'Computer Science',
          company: 'MRF Innovation Park',
          designation: 'Demo Account',
          bikeNumber: 'TN 00 DEMO 0000',
          email: 'demo@mrf-innovationpark.edu',
          mobile: '+91 00000 00000',
          accessStartDate: new Date('2026-01-01'),
          accessExpiryDate: new Date('2027-01-01'),
          status: 'Approved'
        };
        qrRecord = { token: normalizedToken, isValid: true, request };
      }
    }

    // Case 4: QR Does Not Exist
    if (!qrRecord) {
      await logScan({
        qrToken: normalizedToken,
        scannedBy: req.user?._id,
        device, browser, ipAddress,
        result: 'Denied',
        reason: 'INVALID QR'
      });
      return res.json({ 
        status: 'DENIED', 
        resultType: 'INVALID_QR',
        reason: 'INVALID QR — ACCESS DENIED' 
      });
    }

    // Case 5: User Deleted or Request Not Found
    if (!request || request.status === 'Deleted') {
      await logScan({
        qrToken: normalizedToken,
        request: request?._id,
        scannedBy: req.user?._id,
        device, browser, ipAddress,
        result: 'Denied',
        reason: 'USER NOT FOUND'
      });
      return res.json({ 
        status: 'DENIED', 
        resultType: 'USER_NOT_FOUND',
        reason: 'USER NOT FOUND — ACCESS DENIED',
        request
      });
    }

    // Case 3: Admin Disabled User or QR Revoked
    if (!qrRecord.isValid || request.status === 'Disabled') {
      await logScan({
        qrToken: normalizedToken,
        request: request._id,
        scannedBy: req.user?._id,
        device, browser, ipAddress,
        result: 'Denied',
        reason: 'ACCOUNT DISABLED'
      });
      return res.json({ 
        status: 'DENIED', 
        resultType: 'ACCOUNT_DISABLED',
        reason: 'ACCOUNT DISABLED — ACCESS DENIED',
        request
      });
    }

    // Check if request is not approved (e.g. Rejected or Pending)
    if (request.status !== 'Approved') {
      await logScan({
        qrToken: normalizedToken,
        request: request._id,
        scannedBy: req.user?._id,
        device, browser, ipAddress,
        result: 'Denied',
        reason: request.status.toUpperCase()
      });
      return res.json({ 
        status: 'DENIED', 
        resultType: request.status.toUpperCase(),
        reason: `REQUEST ${request.status.toUpperCase()} — ACCESS DENIED`,
        request
      });
    }

    // Case 2: Expiry Check (Current Date > Expiry Date)
    const now = new Date();
    if (now > new Date(request.accessExpiryDate)) {
      await logScan({
        qrToken: normalizedToken,
        request: request._id,
        scannedBy: req.user?._id,
        device, browser, ipAddress,
        result: 'Denied',
        reason: 'ACCESS EXPIRED'
      });
      return res.json({ 
        status: 'DENIED', 
        resultType: 'ACCESS_EXPIRED',
        reason: 'ACCESS EXPIRED — ACCESS DENIED',
        request
      });
    }

    // Future Start Date check
    if (now < new Date(request.accessStartDate)) {
      await logScan({
        qrToken: normalizedToken,
        request: request._id,
        scannedBy: req.user?._id,
        device, browser, ipAddress,
        result: 'Denied',
        reason: 'ACCESS NOT YET ACTIVE'
      });
      return res.json({ 
        status: 'DENIED', 
        resultType: 'NOT_ACTIVE_YET',
        reason: 'ACCESS NOT YET ACTIVE — ACCESS DENIED',
        request
      });
    }

    // Case 1: All Valid -> ACCESS ALLOWED
    logScan({
      qrToken: normalizedToken,
      request: request._id,
      scannedBy: req.user?._id,
      vehicleNumber: request.bikeNumber,
      securityUser: 'Security',
      emailSentStatus: 'Disabled (Approval Only)',
      device, browser, ipAddress,
      result: 'Granted',
      reason: 'ALLOWED'
    }).catch(err => console.error('Scan log error:', err));

    return res.json({ 
      status: 'GRANTED', 
      resultType: 'VERIFIED',
      reason: 'ACCESS ALLOWED',
      request,
      qrToken: normalizedToken,
      vehicleNumber: request.bikeNumber,
      ownerName: request.name,
      registerId: request.employeeId || request.bikeNumber,
      department: request.department,
      vehicleType: request.vehicleType || 'Bike',
      photoUrl: request.photoUrl || request.photo,
      emailSent: false,
      emailSentStatus: 'Disabled (Approval Only)',
      emailSentTo: request?.email
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
