import express from 'express';
import { 
  createRequest, 
  getRequests, 
  getPendingRequests, 
  companyApproveRequest,
  ownerEmailAction,
  getOwnerApprovalRequest,
  submitOwnerApproval,
  approveRequest, 
  rejectRequest,
  disableRequest,
  deleteRequest,
  updateRequestValidity
} from '../controllers/requestController.js';
import { verifyToken } from '../controllers/qrController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getScanHistory, deleteScanHistoryLog, clearAllScanHistoryLogs, getAuditLogs, getEmailLogs } from '../controllers/historyController.js';

const router = express.Router();

// -- Auth --
router.post('/auth/login', (req, res) => {
  const { role = 'guard' } = req.body || {};
  res.json({
    message: 'Login successful',
    token: `SECURE-${role.toUpperCase()}-JWT-TOKEN-${Date.now()}`,
    role
  });
});

// -- Bike Access Requests --
router.post('/requests', createRequest);
router.get('/requests', getRequests);
router.get('/requests/pending', getPendingRequests);
router.get('/owner/approval-request', getOwnerApprovalRequest);
router.post('/owner/approve', submitOwnerApproval);
router.get('/requests/:id/owner-action', ownerEmailAction);  // Email Approve/Reject click
router.put('/requests/:id/company-approve', companyApproveRequest);
router.put('/requests/:id/approve', approveRequest);
router.put('/requests/:id/reject', rejectRequest);
router.put('/requests/:id/disable', disableRequest);
router.put('/requests/:id', updateRequestValidity);
router.delete('/requests/:id', deleteRequest);

// -- QR Verification --
router.post('/verify', verifyToken);
router.post('/verify/:token', verifyToken);

// -- Dashboard & History --
router.get('/dashboard', getDashboardStats);
router.get('/history/scans', getScanHistory);
router.delete('/history/scans/clear-all', clearAllScanHistoryLogs);
router.delete('/history/scans/:id', deleteScanHistoryLog);
router.get('/history/audits', getAuditLogs);
router.get('/history/emails', getEmailLogs);

export default router;


