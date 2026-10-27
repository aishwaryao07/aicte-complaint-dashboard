require('dotenv').config();
const mongoose = require('mongoose');
const Institution = require('./models/Institution');
const Complaint = require('./models/Complaint');
const AuditLog = require('./models/AuditLog');

const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const institutions = [
  { institutionId: 'INST-204', name: 'Demo Institute of Engineering (Synthetic A)', city: 'Sample City 1', state: 'Sample State' },
  { institutionId: 'INST-311', name: 'Demo College of Technology (Synthetic B)', city: 'Sample City 2', state: 'Sample State' },
  { institutionId: 'INST-427', name: 'Demo Polytechnic (Synthetic C)', city: 'Sample City 3', state: 'Sample State' },
];

const complaints = [
  { caseId: 'AI-1001', institutionId: 'INST-204', bureau: 'RB', category: 'Regulatory compliance',
    description: 'Synthetic: alleged non-compliance with faculty norms.', priority: 'High',
    status: 'Under review', assignedTo: 'RB Officer 1', dueDate: days(5) },
  { caseId: 'AI-1002', institutionId: 'INST-204', bureau: 'PGRC', category: 'Student grievance',
    description: 'Synthetic: student reports faculty shortage affecting classes.', priority: 'Medium',
    status: 'Pending action', assignedTo: 'PGRC Officer 1', dueDate: days(2) },
  { caseId: 'AI-1003', institutionId: 'INST-204', bureau: 'PGRC', category: 'Student grievance',
    description: 'Synthetic: student reports shortage of teaching staff.', priority: 'Medium',
    status: 'New', assignedTo: 'Unassigned', dueDate: days(10) },
  { caseId: 'AI-1004', institutionId: 'INST-311', bureau: 'RB', category: 'Approval-related issue',
    description: 'Synthetic: query on approval documentation.', priority: 'Low',
    status: 'Under review', assignedTo: 'RB Officer 2', dueDate: days(8) },
  { caseId: 'AI-1005', institutionId: 'INST-427', bureau: 'PGRC', category: 'Fee-related grievance',
    description: 'Synthetic: fee refund not processed.', priority: 'High',
    status: 'Pending action', assignedTo: 'PGRC Officer 2', dueDate: days(-6) }, // overdue
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([Institution.deleteMany(), Complaint.deleteMany(), AuditLog.deleteMany()]);

  await Institution.insertMany(institutions);
  await Complaint.insertMany(complaints);
  await AuditLog.insertMany(complaints.map((c) => ({
    caseId: c.caseId, action: 'CREATED', to: c.status, reason: 'Seed data', actor: 'system',
  })));

  console.log('Seeded', institutions.length, 'institutions and', complaints.length, 'complaints');
  await mongoose.disconnect();
})();