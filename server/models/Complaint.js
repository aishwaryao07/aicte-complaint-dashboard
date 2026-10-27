const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },     // e.g. AI-1001
  institutionId: { type: String, required: true, index: true },
  bureau: { type: String, enum: ['RB', 'PGRC', 'OTHER'], required: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: {
    type: String,
    enum: ['New', 'Under review', 'Pending action', 'Awaiting other Bureau', 'Closed'],
    default: 'New',
  },
  assignedTo: { type: String, default: 'Unassigned' },
  dueDate: Date,
  relatedCases: [{
    caseId: String,
    reviewStatus: { type: String, enum: ['Suggested', 'Confirmed', 'Rejected'], default: 'Suggested' },
    reason: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);