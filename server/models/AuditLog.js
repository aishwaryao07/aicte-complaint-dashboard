const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  caseId: { type: String, required: true, index: true },
  action: { type: String, required: true }, // CREATED, STATUS_CHANGE, HANDOFF, LINK_CONFIRMED...
  from: String,
  to: String,
  reason: String,
  actor: { type: String, default: 'system' },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditSchema);