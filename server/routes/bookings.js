const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const User = require("../models/User");
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

// @route   POST /api/bookings
// @desc    Create a booking request
// @access  Private
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      companionId,
      startDate,
      endDate,
      startTime,
      endTime,
      duration,
      services,
      location,
      notes,
    } = req.body;

    // Validate required fields
    if (!companionId || !startDate || !endDate || !duration) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const companion = await User.findById(companionId);
    if (!companion) {
      return res.status(404).json({ success: false, message: "Companion not found" });
    }

    const booking = new Booking({
      elderlyId: req.user.id,
      companionId,
      startDate,
      endDate,
      startTime,
      endTime,
      duration,
      services,
      location,
      notes,
      totalCost: duration * (companion.hourlyRate || 0),
    });

    await booking.save();

    // Create notification for companion
    const notification = new Notification({
      userId: companionId,
      type: "booking_request",
      title: "New Booking Request",
      message: `You have received a new booking request for ${services?.join(", ") || "services"}`,
      relatedId: booking._id,
      relatedModel: "Booking",
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/bookings/:bookingId
// @desc    Get booking details
// @access  Private
router.get("/:bookingId", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("elderlyId", "name email profilePicture location")
      .populate("companionId", "name email profilePicture skills rating");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Check authorization
    if (
      booking.elderlyId._id.toString() !== req.user.id &&
      booking.companionId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/bookings/user/:userId
// @desc    Get all bookings for a user
// @access  Private
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ elderlyId: req.params.userId }, { companionId: req.params.userId }],
    })
      .populate("elderlyId", "name email profilePicture")
      .populate("companionId", "name email profilePicture skills rating")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/bookings/:bookingId/accept
// @desc    Accept booking request (Companion)
// @access  Private
router.put("/:bookingId/accept", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.companionId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending bookings can be accepted. Current status: ${booking.status}`,
      });
    }

    booking.status = "confirmed";
    await booking.save();

    // Notify elderly user
    const notification = new Notification({
      userId: booking.elderlyId,
      type: "booking_confirmed",
      title: "Booking Confirmed",
      message: "Your booking has been confirmed by the companion",
      relatedId: booking._id,
      relatedModel: "Booking",
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Booking accepted successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/bookings/:bookingId/reject
// @desc    Reject booking request
// @access  Private
router.put("/:bookingId/reject", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.companionId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending bookings can be declined. Current status: ${booking.status}`,
      });
    }

    booking.status = "rejected";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking rejected",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/bookings/:bookingId/cancel
// @desc    Cancel booking
// @access  Private
router.put("/:bookingId/cancel", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    const { cancelledBy, reason } = req.body;

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Check authorization
    if (
      booking.elderlyId.toString() !== req.user.id &&
      booking.companionId.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const isCompanion = booking.companionId.toString() === req.user.id;
    const isElderly = booking.elderlyId.toString() === req.user.id;

    if (!["pending", "confirmed", "in-progress"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled in status: ${booking.status}`,
      });
    }

    if (isCompanion && !["confirmed", "in-progress"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Companion can cancel only after accepting the booking",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Paid bookings cannot be cancelled directly",
      });
    }

    booking.status = "cancelled";
    booking.cancelledBy = cancelledBy || (isCompanion ? "companion" : isElderly ? "elderly" : "elderly");
    booking.cancellationReason = reason;
    await booking.save();

    // Notify the other party
    const notifiedUserId =
      booking.elderlyId.toString() === req.user.id
        ? booking.companionId
        : booking.elderlyId;

    const notification = new Notification({
      userId: notifiedUserId,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: "A booking has been cancelled",
      relatedId: booking._id,
      relatedModel: "Booking",
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/bookings/:bookingId/complete
// @desc    Mark booking as completed
// @access  Private
router.put("/:bookingId/complete", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.companionId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();

    // Update companion stats
    const companion = await User.findById(booking.companionId);
    companion.totalHours += booking.duration;
    companion.totalBookings += 1;
    companion.totalEarnings += booking.totalCost || 0;
    await companion.save();

    res.status(200).json({
      success: true,
      message: "Booking marked as completed",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
