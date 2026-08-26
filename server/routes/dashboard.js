const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const Scan = require('../models/Scan');
const Violation = require('../models/Violation');

const router = express.Router();

router.get('/stats', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const totalScans = await Scan.countDocuments();
    const compliantScans = await Scan.countDocuments({ complianceStatus: 'COMPLIANT' });
    const nonCompliantScans = await Scan.countDocuments({ complianceStatus: 'NON_COMPLIANT' });
    const complianceRate = totalScans > 0 ? (compliantScans / totalScans) * 100 : 0;

    // Violations by category/field
    const violationsByCategory = await Violation.aggregate([
      { $group: { _id: '$field', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Risk score distribution
    const riskDistribution = {
      high: await Scan.countDocuments({ riskScore: { $gte: 75 } }),
      medium: await Scan.countDocuments({ riskScore: { $gte: 40, $lt: 75 } }),
      low: await Scan.countDocuments({ riskScore: { $lt: 40 } })
    };

    res.json({
      totalScans,
      compliantScans,
      nonCompliantScans,
      complianceRate: complianceRate.toFixed(1),
      violationsByCategory,
      riskDistribution
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
