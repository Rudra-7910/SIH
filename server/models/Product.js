const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String },
  category: { type: String },
  barcode: { type: String },
  images: [{ type: String }] // URLs or file paths
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
