import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  qrCode: { type: String, required: true },
  type: { type: String, default: 'Visitor' }, // Staff, Visitor, Student, etc.
  name: { type: String, required: true },
  registerId: { type: String, default: 'N/A' },
  department: { type: String, default: 'General' },
  vehicleNumber: { type: String, required: true },
  vehicleType: { type: String, default: 'Unknown' },
  brand: { type: String, default: '' },
  status: { type: String, default: 'Active', enum: ['Active', 'Expired', 'Suspended', 'Blacklisted', 'Disabled', 'Pending'] },
  issueDate: { type: String, required: true },
  expiryDate: { type: String, required: true },
  mobile: { type: String },
  email: { type: String },
  photo: { type: String },
  vehicleDetails: {
    number: String,
    type: { type: String },
    brand: String
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Vehicle', vehicleSchema);
