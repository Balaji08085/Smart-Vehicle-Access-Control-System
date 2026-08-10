import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessRequest' },
  email: { type: String, required: true },
  qrToken: { type: String },
  scanId: { type: String },
  emailType: { type: String, default: 'Entry Verification' },
  status: { type: String, enum: ['Sent', 'Failed', 'Suppressed (Duplicate Window)'], required: true },
  date: { type: String },
  time: { type: String },
  errorMessage: { type: String }
}, { timestamps: true });

export default mongoose.model('EmailLog', emailLogSchema);
