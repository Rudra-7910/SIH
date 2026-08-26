const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const CitizenReport = require('../models/CitizenReport');
const { extractLabelData } = require('../services/aiService');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `citizen-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Public route for consumers to submit reports
router.post('/report', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const { reporterName, reporterEmail } = req.body;
    const imagePath = req.file.path;

    // Run AI to pre-populate data (no compliance check needed yet)
    let aiResult;
    try {
      aiResult = await extractLabelData(imagePath);
    } catch (err) {
      // If AI fails, still allow submission but log it
      console.warn("AI extraction failed for citizen report", err);
    }

    const report = await CitizenReport.create({
      reporterName,
      reporterEmail,
      images: [imagePath],
      declarations: aiResult ? aiResult.declarations : [],
      status: 'pending'
    });

    res.status(201).json({ message: 'Report submitted successfully', reportId: report._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during submission' });
  }
});

// Officer/Admin route to view reports
router.get('/', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const reports = await CitizenReport.find().sort('-createdAt');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
