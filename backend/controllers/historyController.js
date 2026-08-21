import ScanHistory from '../models/ScanHistory.js';
import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';

const isDbConnected = () => mongoose.connection.readyState === 1;

export const getScanHistory = async (req, res) => {
  try {
    const { inMemoryScans = [] } = await import('./qrController.js');
    const { inMemoryRequests = [] } = await import('./requestController.js');

    let dbHistory = [];
    if (isDbConnected()) {
      try {
        dbHistory = await ScanHistory.find().populate('request').sort({ scanDate: -1, createdAt: -1 }).limit(200).lean();
      } catch (err) {
        console.warn('ScanHistory query warning:', err.message);
      }
    }
    
    // Combine DB history with in-memory scans (removing duplicates by _id)
    const combinedMap = new Map();
    inMemoryScans.forEach(item => combinedMap.set(String(item._id), item));
    dbHistory.forEach(item => combinedMap.set(String(item._id), item));

    const rawList = Array.from(combinedMap.values());

    // Dynamically resolve ownerName and vehicleNumber if unpopulated
    const historyList = rawList.map(item => {
      let reqObj = item.request;
      if (!reqObj || typeof reqObj !== 'object' || !reqObj.name) {
        const token = item.qrToken || item.vehicleNumber || '';
        const cleanToken = token.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        
        const match = inMemoryRequests.find(r => {
          const rTokenClean = (r.token || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const rBikeClean = (r.bikeNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const rEmpClean = (r.employeeId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const rIdClean = String(r._id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          
          return (
            (rTokenClean && (rTokenClean === cleanToken || rTokenClean.includes(cleanToken) || cleanToken.includes(rTokenClean))) ||
            (rBikeClean && (rBikeClean === cleanToken || rBikeClean.includes(cleanToken) || cleanToken.includes(rBikeClean))) ||
            (rEmpClean.length >= 2 && (rEmpClean === cleanToken)) ||
            (rIdClean && rIdClean === cleanToken)
          );
        });

        if (match) {
          reqObj = {
            _id: match._id,
            name: match.name,
            bikeNumber: match.bikeNumber,
            employeeId: match.employeeId,
            department: match.department,
            vehicleType: match.vehicleType
          };
        }
      }

      let resolvedOwnerName = reqObj?.name || (item.ownerName && !['Verified Vehicle', 'Verified User'].includes(item.ownerName) ? item.ownerName : null);
      
      const isDenied = item.result === 'Denied' || item.status === 'Denied' || (item.reason && item.reason.toUpperCase().includes('INVALID'));
      if (!resolvedOwnerName) {
        resolvedOwnerName = isDenied ? 'Unregistered QR / Visitor' : 'Authorized User';
      }

      const vehicleNumber = reqObj?.bikeNumber || item.vehicleNumber || item.qrToken || 'N/A';

      return {
        ...item,
        ownerName: resolvedOwnerName,
        vehicleNumber,
        request: reqObj && typeof reqObj === 'object' && reqObj.name ? reqObj : {
          name: resolvedOwnerName,
          bikeNumber: vehicleNumber,
          employeeId: item.registerId || 'N/A',
          department: item.department || 'N/A'
        }
      };
    });

    // Sort by timestamp descending (newest scans at top)
    historyList.sort((a, b) => {
      const dateA = new Date(a.scanDate || a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.scanDate || b.createdAt || b.date || 0).getTime();
      return dateB - dateA;
    });

    res.json(historyList);
  } catch (error) {
    console.error('getScanHistory error:', error.message);
    const { inMemoryScans = [] } = await import('./qrController.js');
    res.json(inMemoryScans);
  }
};

export const deleteScanHistoryLog = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected()) {
      try {
        await ScanHistory.findByIdAndDelete(id);
      } catch (e) {
        console.warn('ScanHistory DB delete attempt:', e.message);
      }
    }
    const { inMemoryScans = [], saveScansToDisk } = await import('./qrController.js');
    const idx = inMemoryScans.findIndex(s => String(s._id) === String(id) || String(s.id) === String(id));
    if (idx !== -1) {
      inMemoryScans.splice(idx, 1);
      if (typeof saveScansToDisk === 'function') saveScansToDisk();
    }
    res.json({ message: 'Scan history log deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearAllScanHistoryLogs = async (req, res) => {
  try {
    if (isDbConnected()) {
      try {
        await ScanHistory.deleteMany({});
      } catch (e) {
        console.warn('ScanHistory DB deleteMany attempt:', e.message);
      }
    }
    const { inMemoryScans = [], saveScansToDisk } = await import('./qrController.js');
    inMemoryScans.length = 0;
    if (typeof saveScansToDisk === 'function') saveScansToDisk();
    res.json({ message: 'All scan history logs cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json([
        {
          _id: 'AUDIT-101',
          action: 'CREATED',
          comments: 'New access request created for TN 14 AE 8495',
          createdAt: new Date()
        },
        {
          _id: 'AUDIT-102',
          action: 'APPROVED',
          comments: 'Approved bike access for TN 38 AB 1234',
          createdAt: new Date(Date.now() - 7200000)
        }
      ]);
    }
    const logs = await AuditLog.find().populate('request actionedBy').sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmailLogs = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const { inMemoryEmailLogs } = await import('../services/emailService.js');
      return res.json(inMemoryEmailLogs);
    }
    const EmailLog = (await import('../models/EmailLog.js')).default;
    const logs = await EmailLog.find().populate('request').sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
