const express = require("express");
const router = express.Router();
const DailyCheckIn = require("../models/DailyCheckIn");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret_change_me", (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

// @route   POST /api/daily-checkin
// @desc    Create daily check-in
// @access  Private
router.post("/", verifyToken, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const checkIn = new DailyCheckIn({
      elderId: req.user.id,
      status,
      notes,
      respondedAt: new Date(),
    });

    await checkIn.save();

    // If emergency, create urgent notification
    if (status === "emergency") {
      const notification = new Notification({
        userId: req.user.id,
        type: "emergency_alert",
        title: "Emergency Alert Recorded",
        message: `Emergency status recorded at ${new Date().toLocaleTimeString()}`,
        relatedId: checkIn._id,
        relatedModel: "DailyCheckIn",
      });

      await notification.save();
    }

    res.status(201).json({
      success: true,
      message: "Daily check-in recorded",
      checkIn,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/daily-checkin/me
// @desc    Get user's daily check-ins
// @access  Private
router.get("/me/all", verifyToken, async (req, res) => {
  try {
    const checkIns = await DailyCheckIn.find({ elderId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      checkIns,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/daily-checkin/today
// @desc    Get today's check-in status
// @access  Private
router.get("/today/status", verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = await DailyCheckIn.findOne({
      elderId: req.user.id,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    res.status(200).json({
      success: true,
      hasCheckedIn: !!checkIn,
      checkIn,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
