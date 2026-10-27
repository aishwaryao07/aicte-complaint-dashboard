const express = require('express');
const Institution = require('../models/Institution');
const Complaint = require('../models/Complaint');

const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/institutions?search=demo
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ institutionId: rx }, { name: rx }, { city: rx }];
    }
    const institutions = await Institution.find(filter).sort({ institutionId: 1 }).lean();
    res.json(institutions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/institutions/:institutionId  (the 360° profile)
router.get('/:institutionId', async (req, res) => {
  try {
    const institution = await Institution.findOne({ institutionId: req.params.institutionId }).lean();
    if (!institution) return res.status(404).json({ error: 'Institution not found' });

    const raw = await Complaint.find({ institutionId: institution.institutionId })
      .sort({ updatedAt: -1 })
      .lean();

    const now = new Date();
    const complaints = raw.map((c) => ({
      ...c,
      isOverdue: !!c.dueDate && new Date(c.dueDate) < now && c.status !== 'Closed',
    }));

    const open = complaints.filter((c) => c.status !== 'Closed');
    const activeBureaus = [...new Set(open.map((c) => c.bureau))];

    // Coordination alert: 2+ open cases involving 2+ different Bureaus
    const alertActive = open.length >= 2 && activeBureaus.length >= 2;

    res.json({
      institution,
      summary: {
        totalCases: complaints.length,
        openCases: open.length,
        overdueCases: complaints.filter((c) => c.isOverdue).length,
        activeBureaus,
      },
      coordinationAlert: {
        active: alertActive,
        message: alertActive
          ? `${complaints.length} complaint records are linked to ${institution.institutionId}. ${activeBureaus.length} different Bureaus/Cells (${activeBureaus.join(', ')}) are handling active cases. Review the related records and confirm whether coordination is required.`
          : null,
      },
      complaints,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;