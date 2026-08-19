import mongoose from 'mongoose';

const scanHistorySchema = new mongoose.Schema({
  qrToken: { type: String, required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessRequest' },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Guard who scanned
  scanDate: { type: Date, default: Date.now },
  device: { type: String },
  browser: { type: String },
  ipAddress: { type: String },
  vehicleNumber: { type: String },
  securityUser: { type: String, default: 'Security Guard' },
  emailSentStatus: { type: String, default: 'Success' },
  result: { type: String, enum: ['Granted', 'Denied'], required: true },
  reason: { type: String } // e.g., "Expired", "Disabled", "Invalid QR", etc.
}, { timestamps: true });

export default mongoose.model('ScanHistory', scanHistorySchema);
