const express = require('express');
const Complaint = require('../models/Complaint');

const router = express.Router();

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const complaints = await Complaint.find().lean();
    const now = new Date();

    const open = complaints.filter((c) => c.status !== 'Closed');
    const overdue = open.filter((c) => c.dueDate && new Date(c.dueDate) < now);
    const awaitingOther = open.filter((c) => c.status === 'Awaiting other Bureau');

    // Group open cases by institution
    const byInstitution = {};
    open.forEach((c) => {
      (byInstitution[c.institutionId] = byInstitution[c.institutionId] || []).push(c);
    });

    // A "related-case group" = an institution with 2+ open cases
    const relatedGroups = Object.entries(byInstitution)
      .filter(([, cases]) => cases.length >= 2)
      .map(([institutionId, cases]) => ({
        institutionId,
        caseCount: cases.length,
        bureaus: [...new Set(cases.map((c) => c.bureau))],
      }));

    // Counts for charts later
        const countBy = (key) =>
      complaints.reduce((acc, c) => {
        acc[c[key]] = (acc[c[key]] || 0) + 1;
        return acc;
      }, {});

    res.json({
      totalCases: complaints.length,
      openCases: open.length,
      overdueCases: overdue.length,
      awaitingCoordination: awaitingOther.length,
      relatedCaseGroups: relatedGroups.length,
      relatedGroups,
      byBureau: countBy('bureau'),
      byStatus: countBy('status'),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;