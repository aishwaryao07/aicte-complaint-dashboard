const express = require('express');
const Complaint = require('../models/Complaint');
const { findRelated } = require('../services/relatedCases');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// "Overdue" is computed, never stored
const withOverdue = (c) => ({
  ...c,
  isOverdue: !!c.dueDate && new Date(c.dueDate) < new Date() && c.status !== 'Closed',
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/complaints  (supports filters)
router.get('/', async (req, res) => {
  try {
    const { institutionId, bureau, status, category, priority, search } = req.query;
    const filter = {};
    if (institutionId) filter.institutionId = institutionId;
    if (bureau) filter.bureau = bureau;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ caseId: rx }, { description: rx }];
    }

    const complaints = await Complaint.find(filter).sort({ updatedAt: -1 }).lean();
    res.json(complaints.map(withOverdue));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/complaints/:caseId  (one case)
router.get('/:caseId', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ caseId: req.params.caseId }).lean();
    if (!complaint) return res.status(404).json({ error: 'Case not found' });
    res.json(withOverdue(complaint));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/complaints/:caseId/related  (suggested related cases)
router.get('/:caseId/related', async (req, res) => {
  try {
    const related = await findRelated(req.params.caseId);
    if (!related) return res.status(404).json({ error: 'Case not found' });
    res.json(related);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/complaints/:caseId/status  (status change and/or handoff, reason required)
router.patch('/:caseId/status', async (req, res) => {
  try {
    const { status, reason, assignedTo, bureau, actor = 'demo.officer' } = req.body;

    if (!reason || !reason.trim()) return res.status(400).json({ error: 'A reason is required' });
    if (!status && !assignedTo && !bureau) return res.status(400).json({ error: 'Nothing to update' });

    const validStatuses = Complaint.schema.path('status').enumValues;
    const validBureaus = Complaint.schema.path('bureau').enumValues;
    if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    if (bureau && !validBureaus.includes(bureau)) return res.status(400).json({ error: 'Invalid bureau' });

    const complaint = await Complaint.findOne({ caseId: req.params.caseId });
    if (!complaint) return res.status(404).json({ error: 'Case not found' });

    const logs = [];

    if (status && status !== complaint.status) {
      logs.push({ caseId: complaint.caseId, action: 'STATUS_CHANGE', from: complaint.status, to: status, reason, actor });
      complaint.status = status;
    }

    const newBureau = bureau || complaint.bureau;
    const newOwner = assignedTo || complaint.assignedTo;
    if (newBureau !== complaint.bureau || newOwner !== complaint.assignedTo) {
      logs.push({
        caseId: complaint.caseId,
        action: 'HANDOFF',
        from: `${complaint.bureau} / ${complaint.assignedTo}`,
        to: `${newBureau} / ${newOwner}`,
        reason,
        actor,
      });
      complaint.bureau = newBureau;
      complaint.assignedTo = newOwner;
    }

    if (logs.length === 0) return res.status(400).json({ error: 'No changes to apply' });

    await complaint.save();
    await AuditLog.insertMany(logs);
    res.json(withOverdue(complaint.toObject()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/complaints/:caseId/audit  (timeline, oldest first)
router.get('/:caseId/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find({ caseId: req.params.caseId }).sort({ createdAt: 1 }).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;