const express = require("express");
const router = express.Router();
const Availability = require("../models/Availability");
const User = require("../models/User");
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

// @route   POST /api/availability
// @desc    Add availability slot
// @access  Private (Companions only)
router.post("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== "companion") {
      return res.status(400).json({
        success: false,
        message: "Only companions can set availability",
      });
    }

    const {
      dayOfWeek,
      startTime,
      endTime,
      isRecurring,
      specificDate,
      isAvailable,
    } = req.body;

    if (!dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const availability = new Availability({
      companionId: req.user.id,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring: isRecurring !== false,
      specificDate,
      isAvailable: isAvailable !== false,
    });

    await availability.save();

    res.status(201).json({
      success: true,
      message: "Availability added successfully",
      availability,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/availability/companion/:companionId
// @desc    Get all availability slots for a companion
// @access  Public
router.get("/companion/:companionId", async (req, res) => {
  try {
    const availability = await Availability.find({
      companionId: req.params.companionId,
      isAvailable: true,
    }).sort({ dayOfWeek: 1 });

    res.status(200).json({
      success: true,
      availability,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/availability/me
// @desc    Get companion's own availability
// @access  Private
router.get("/me/all", verifyToken, async (req, res) => {
  try {
    const availability = await Availability.find({
      companionId: req.user.id,
    }).sort({ dayOfWeek: 1 });

    res.status(200).json({
      success: true,
      availability,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/availability/:availabilityId
// @desc    Update availability slot
// @access  Private
router.put("/:availabilityId", verifyToken, async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.availabilityId);

    if (!availability) {
      return res.status(404).json({ success: false, message: "Availability not found" });
    }

    if (availability.companionId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { startTime, endTime, isAvailable } = req.body;

    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;
    if (isAvailable !== undefined) availability.isAvailable = isAvailable;

    await availability.save();

    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/availability/:availabilityId
// @desc    Delete availability slot
// @access  Private
router.delete("/:availabilityId", verifyToken, async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.availabilityId);

    if (!availability) {
      return res.status(404).json({ success: false, message: "Availability not found" });
    }

    if (availability.companionId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await Availability.findByIdAndDelete(req.params.availabilityId);

    res.status(200).json({
      success: true,
      message: "Availability deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
