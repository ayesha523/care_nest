const express = require("express");
const router = express.Router();
const MoodLog = require("../models/MoodLog");
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

// @route   POST /api/mood
// @desc    Log mood entry
// @access  Private (Elderly users)
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      mood,
      moodScore,
      notes,
      activities,
      companionId,
      bookingId,
      attachments,
    } = req.body;

    if (!mood || !moodScore) {
      return res.status(400).json({
        success: false,
        message: "Mood and mood score are required",
      });
    }

    const moodLog = new MoodLog({
      elderId: req.user.id,
      mood,
      moodScore,
      notes,
      activities,
      companionId,
      bookingId,
      attachments,
    });

    await moodLog.save();
    await moodLog.populate("companionId", "name profilePicture");

    res.status(201).json({
      success: true,
      message: "Mood logged successfully",
      moodLog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/mood/me
// @desc    Get user's mood logs
// @access  Private
router.get("/me/all", verifyToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const moodLogs = await MoodLog.find({
      elderId: req.user.id,
      createdAt: { $gte: startDate },
    })
      .populate("companionId", "name profilePicture")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const avgMoodScore =
      moodLogs.length > 0
        ? (moodLogs.reduce((sum, log) => sum + log.moodScore, 0) / moodLogs.length).toFixed(2)
        : 0;

    const moodDistribution = {
      very_happy: moodLogs.filter((log) => log.mood === "very_happy").length,
      happy: moodLogs.filter((log) => log.mood === "happy").length,
      neutral: moodLogs.filter((log) => log.mood === "neutral").length,
      sad: moodLogs.filter((log) => log.mood === "sad").length,
      very_sad: moodLogs.filter((log) => log.mood === "very_sad").length,
    };

    res.status(200).json({
      success: true,
      moodLogs,
      statistics: {
        averageMoodScore: avgMoodScore,
        totalEntries: moodLogs.length,
        moodDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/mood/:moodLogId
// @desc    Update mood log
// @access  Private
router.put("/:moodLogId", verifyToken, async (req, res) => {
  try {
    const moodLog = await MoodLog.findById(req.params.moodLogId);

    if (!moodLog) {
      return res.status(404).json({ success: false, message: "Mood log not found" });
    }

    if (moodLog.elderId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { mood, moodScore, notes, activities } = req.body;

    if (mood) moodLog.mood = mood;
    if (moodScore) moodLog.moodScore = moodScore;
    if (notes !== undefined) moodLog.notes = notes;
    if (activities) moodLog.activities = activities;

    await moodLog.save();

    res.status(200).json({
      success: true,
      message: "Mood log updated",
      moodLog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/mood/:moodLogId
// @desc    Delete mood log
// @access  Private
router.delete("/:moodLogId", verifyToken, async (req, res) => {
  try {
    const moodLog = await MoodLog.findById(req.params.moodLogId);

    if (!moodLog) {
      return res.status(404).json({ success: false, message: "Mood log not found" });
    }

    if (moodLog.elderId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await MoodLog.findByIdAndDelete(req.params.moodLogId);

    res.status(200).json({
      success: true,
      message: "Mood log deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
