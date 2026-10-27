const express = require('express');
const Complaint = require('../models/Complaint');

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

module.exports = router;