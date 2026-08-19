import AccessRequest from '../models/AccessRequest.js';
import ScanHistory from '../models/ScanHistory.js';
import QRCode from '../models/QRCode.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const isDbConnected = () => mongoose.connection.readyState === 1;

export const getDashboardStats = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const { inMemoryScans = [] } = await import('./qrController.js');
      const { inMemoryRequests = [] } = await import('./requestController.js');

      const totalUsers = inMemoryRequests.length;
      const pendingApprovals = inMemoryRequests.filter(r => r.status === 'Pending').length;
      const approvedUsers = inMemoryRequests.filter(r => r.status === 'Approved').length;
      const rejectedUsers = inMemoryRequests.filter(r => r.status === 'Rejected').length;
      const disabledUsers = inMemoryRequests.filter(r => r.status === 'Disabled').length;
      const activeUsers = approvedUsers;
      const expiredUsers = 0;
      const totalQRGenerated = inMemoryRequests.filter(r => r.status === 'Approved').length;

      const now = new Date();
      const todaysScansList = inMemoryScans.filter(s => {
        const d = new Date(s.scanDate || s.createdAt || s.date || 0);
        return d.toDateString() === now.toDateString();
      });

      const todaysAllowed = todaysScansList.filter(s => (s.result === 'Granted' || s.status === 'Granted' || s.status === 'ALLOWED')).length;
      const todaysDenied = todaysScansList.filter(s => (s.result === 'Denied' || s.status === 'Denied' || s.status === 'REJECTED')).length;

      return res.json({
        totalUsers,
        pendingApprovals,
        approvedUsers,
        rejectedUsers,
        activeUsers,
        expiredUsers,
        disabledUsers,
        totalQRGenerated,
        todaysScans: todaysScansList.length,
        todaysAllowed,
        todaysDenied
      });
    }

    const totalUsersCount = await User.countDocuments();
    const totalRequestsCount = await AccessRequest.countDocuments();
    
    const pendingApprovals = await AccessRequest.countDocuments({ status: 'Pending' });
    const approvedUsers = await AccessRequest.countDocuments({ status: 'Approved' });
    const rejectedUsers = await AccessRequest.countDocuments({ status: 'Rejected' });
    const disabledUsers = await AccessRequest.countDocuments({ status: 'Disabled' });

    const now = new Date();
    const activeUsers = await AccessRequest.countDocuments({
      status: 'Approved',
      accessStartDate: { $lte: now },
      accessExpiryDate: { $gte: now }
    });

    const expiredUsers = await AccessRequest.countDocuments({
      status: 'Approved',
      accessExpiryDate: { $lt: now }
    });

    const totalQRGenerated = await QRCode.countDocuments({ isValid: true });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const scansToday = await ScanHistory.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    const todaysAllowed = scansToday.filter(s => s.result === 'Granted').length;
    const todaysDenied = scansToday.filter(s => s.result === 'Denied').length;

    res.json({
      totalUsers: totalUsersCount + totalRequestsCount,
      pendingApprovals,
      approvedUsers,
      rejectedUsers,
      activeUsers,
      expiredUsers,
      disabledUsers,
      totalQRGenerated,
      todaysScans: scansToday.length,
      todaysAllowed,
      todaysDenied
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


