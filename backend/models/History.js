import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  ownerName: { type: String, required: true },
  registerId: { type: String, required: true },
  department: { type: String, required: true },
  vehicleType: { type: String, required: true },
  gate: { type: String, required: true },
  status: { type: String, required: true, enum: ['Granted', 'Denied'] },
  reason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('History', historySchema);
