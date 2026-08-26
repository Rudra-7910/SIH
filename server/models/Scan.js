const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  images: [{ type: String }],
  declarations: [{
    field: String,
    found: Boolean,
    value: String,
    raw_match: String,
    confidence: Number,
    rule_reference: String
  }],
  complianceStatus: { type: String, enum: ['COMPLIANT', 'NON_COMPLIANT'] },
  riskScore: { type: Number },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Scan', scanSchema);
