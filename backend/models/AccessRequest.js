import mongoose from 'mongoose';

const accessRequestSchema = new mongoose.Schema({
  applicantCategory: { type: String, enum: ['Admin', 'Startup'], default: 'Startup' },
  name: { type: String, required: true },
  photoUrl: { type: String },
  employeeId: { type: String }, // Optional
  department: { type: String, required: true },
  company: { type: String, required: true },
  companyHead: { type: String },        // Startup owner name (e.g. Mr. Franklin)
  companyHeadEmail: { type: String },    // Startup owner email for Tier-1 approval
  designation: { type: String, required: true },
  bikeNumber: { type: String, required: true, unique: true },
  vehicleType: { type: String, enum: ['Bike', 'Car'], default: 'Bike' },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  accessStartDate: { type: Date, required: true },
  accessExpiryDate: { type: Date, required: true },
  
  token: { type: String },
  approvalToken: { type: String, index: true },
  approvalTokenExpiry: { type: Date },
  status: { 
    type: String, 
    enum: ['Pending', 'Pending Company Approval', 'Pending Super Admin Approval', 'OWNER_APPROVED', 'OWNER_REJECTED', 'Approved', 'Rejected', 'Disabled', 'Deleted'], 
    default: 'Pending Company Approval' 
  },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Super Admin
  
  // Tier-1 Company Owner Approval Meta
  companyApproved: { type: Boolean, default: false },
  companyApprovedAt: { type: Date },
  ownerApprovedAt: { type: Date },
  ownerApprovedEmail: { type: String },

  // Rejection/Approval meta
  actionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actionDate: { type: Date },
  actionReason: { type: String }
  
}, { timestamps: true });

export default mongoose.model('AccessRequest', accessRequestSchema);
