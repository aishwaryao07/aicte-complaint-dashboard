const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  institutionId: { type: String, required: true, unique: true }, // e.g. INST-204
  name: { type: String, required: true },
  city: String,
  state: String,
});

module.exports = mongoose.model('Institution', institutionSchema);