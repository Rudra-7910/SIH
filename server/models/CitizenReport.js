const mongoose = require('mongoose');

const citizenReportSchema = new mongoose.Schema({
  reporterName: { type: String },
  reporterEmail: { type: String },
  images: [{ type: String }],
  declarations: [{
    field: String,
    found: Boolean,
    value: String
  }],
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  assignedOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('CitizenReport', citizenReportSchema);
