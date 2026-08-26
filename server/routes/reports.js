const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const Scan = require('../models/Scan');
const { generateComplianceReport } = require('../services/pdfService');

const router = express.Router();

router.get('/:scanId/pdf', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.scanId)
      .populate('officerId', 'name')
      .populate('productId', 'name brand');
      
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    const pdfBytes = await generateComplianceReport(scan);

    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=compliance_report_${scan._id}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating PDF' });
  }
});

module.exports = router;
