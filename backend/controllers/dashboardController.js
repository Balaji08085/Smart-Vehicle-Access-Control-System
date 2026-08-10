import AccessRequest from '../models/AccessRequest.js';
import ScanHistory from '../models/ScanHistory.js';
import QRCode from '../models/QRCode.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const isDbConnected = () => mongoose.connection.readyState === 1;

export const getDashboardStats = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({
        totalUsers: 7,
        pendingApprovals: 1,
        approvedUsers: 5,
        rejectedUsers: 1,
        activeUsers: 4,
        expiredUsers: 1,
        disabledUsers: 1,
        totalQRGenerated: 5,
        todaysScans: 12,
        todaysAllowed: 10,
        todaysDenied: 2
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


