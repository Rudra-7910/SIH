const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', required: true },
  ruleId: { type: String },
  field: { type: String },
  description: { type: String },
  severity: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
  ruleReference: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Violation', violationSchema);
