const Complaint = require('../models/Complaint');

// Words that carry no meaning for matching
const STOPWORDS = new Set([
  'synthetic', 'of', 'the', 'a', 'an', 'and', 'to', 'in', 'on', 'with', 'for', 'is', 'are',
]);

const tokenize = (text = '') =>
  new Set(
    text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOPWORDS.has(w))
  );

// Jaccard similarity: shared words / all distinct words (0 to 1)
const similarity = (a, b) => {
  const shared = [...a].filter((w) => b.has(w)).length;
  const total = new Set([...a, ...b]).size;
  return total === 0 ? 0 : shared / total;
};

const RANK = { High: 3, Medium: 2, Low: 1 };

async function findRelated(caseId) {
  const base = await Complaint.findOne({ caseId }).lean();
  if (!base) return null;

  const others = await Complaint.find({
    institutionId: base.institutionId,
    caseId: { $ne: caseId },
  }).lean();

  const baseTokens = tokenize(base.description);

  return others
    .map((o) => {
      const sim = similarity(baseTokens, tokenize(o.description));
      const sameCategory = o.category === base.category;
      const reasons = [`Same institution (${base.institutionId})`];
      if (sameCategory) reasons.push(`Same category: ${o.category}`);
      if (sim >= 0.3) reasons.push(`Similar wording (${Math.round(sim * 100)}% word overlap)`);
      if (o.bureau !== base.bureau) reasons.push(`Handled by a different Bureau (${o.bureau})`);

      let confidence = 'Low';
      if (sameCategory && sim >= 0.3) confidence = 'High';
      else if (sameCategory || sim >= 0.3) confidence = 'Medium';

      return {
        caseId: o.caseId,
        bureau: o.bureau,
        status: o.status,
        category: o.category,
        confidence,
        similarity: Math.round(sim * 100) / 100,
        reasons,
      };
    })
    .sort((x, y) => RANK[y.confidence] - RANK[x.confidence] || y.similarity - x.similarity);
}

module.exports = { findRelated };