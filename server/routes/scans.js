const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const Scan = require('../models/Scan');
const Violation = require('../models/Violation');
const { extractLabelData } = require('../services/aiService');

const router = express.Router();

// Multer config for file uploads
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `scan-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Create new scan
router.post('/', protect, authorize('admin', 'officer'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const { productId, notes } = req.body;
    const imagePath = req.file.path;

    // Call Python AI Microservice
    let aiResult;
    try {
      aiResult = await extractLabelData(imagePath);
    } catch (aiError) {
      console.error(aiError);
      return res.status(502).json({ message: 'Error communicating with AI service' });
    }

    if (!aiResult.success) {
      return res.status(500).json({ message: 'AI processing failed' });
    }

    // Save scan result to DB
    const scan = await Scan.create({
      productId: productId || null, // Optional, could be an unlinked scan initially
      officerId: req.user._id,
      images: [imagePath],
      declarations: aiResult.declarations,
      complianceStatus: aiResult.compliance.status,
      riskScore: aiResult.compliance.risk_score,
      notes: notes || ''
    });

    // Save violations
    if (aiResult.compliance.violations && aiResult.compliance.violations.length > 0) {
      const violationsToInsert = aiResult.compliance.violations.map(v => ({
        scanId: scan._id,
        ruleId: v.rule_id,
        field: v.field,
        description: v.description,
        severity: v.severity,
        ruleReference: v.rule_reference
      }));
      await Violation.insertMany(violationsToInsert);
    }

    res.status(201).json({
      scan,
      aiResult // Sending back full details for frontend display
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during scan creation' });
  }
});

// Get all scans
router.get('/', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const scans = await Scan.find()
      .populate('officerId', 'name')
      .populate('productId', 'name brand')
      .sort('-createdAt');
    res.json(scans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get scan by ID
router.get('/:id', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id)
      .populate('officerId', 'name email')
      .populate('productId', 'name brand category');
      
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }
    
    const violations = await Violation.find({ scanId: scan._id });
    
    res.json({ scan, violations });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
