import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // 'CREATED', 'APPROVED', 'REJECTED', 'DISABLED', 'DELETED'
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessRequest', required: true },
  actionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comments: { type: String }, // Optional comments or rejection reason
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
