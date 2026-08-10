import mongoose from 'mongoose';

const qrCodeSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true }, // Secure random unique token
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessRequest', required: true },
  qrImageUrl: { type: String }, // Store generated QR image URL or base64 if needed
  isValid: { type: Boolean, default: true } // Can be immediately invalidated if admin revokes
}, { timestamps: true });

export default mongoose.model('QRCode', qrCodeSchema);
