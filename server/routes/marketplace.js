const express = require("express");
const router = express.Router();
const User = require("../models/User");
const JobRequest = require("../models/JobRequest");
const { protect, authorize } = require("../middleware/auth");

// @route   GET /api/marketplace/companions
// @desc    Get all companions with optional filters
// @access  Public
router.get("/companions", protect, async (req, res) => {
  try {
    const { specialization, maxRate, minRating } = req.query;

    let query = { role: "companion" };

    if (specialization) {
      query.specializations = { $in: [specialization] };
    }

    if (maxRate) {
      query.hourlyRate = { $lte: parseFloat(maxRate) };
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const companions = await User.find(query).select(
      "name email specializations hourlyRate rating reviewCount availability bio verified"
    );

    res.json({
      success: true,
      data: companions.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        role: "companion",
        specializations: c.specializations || [],
        hourlyRate: c.hourlyRate || 0,
        rating: c.rating || 0,
        reviews: c.reviewCount || 0,
        availability: c.availability || "Not specified",
        bio: c.bio || "No bio available",
        verified: c.verified || false,
      })),
    });
  } catch (error) {
    console.error("Get companions error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching companions",
    });
  }
});

// @route   GET /api/marketplace/companions/:id
// @desc    Get companion by ID
// @access  Public
router.get("/companions/:id", protect, async (req, res) => {
  try {
    const companion = await User.findOne({
      _id: req.params.id,
      role: "companion",
    }).select(
      "name email specializations hourlyRate rating reviewCount availability bio verified"
    );

    if (!companion) {
      return res.status(404).json({
        success: false,
        message: "Companion not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: companion._id,
        name: companion.name,
        email: companion.email,
        role: "companion",
        specializations: companion.specializations || [],
        hourlyRate: companion.hourlyRate || 0,
        rating: companion.rating || 0,
        reviews: companion.reviewCount || 0,
        availability: companion.availability || "Not specified",
        bio: companion.bio || "No bio available",
        verified: companion.verified || false,
      },
    });
  } catch (error) {
    console.error("Get companion error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching companion",
    });
  }
});

// @route   GET /api/marketplace/requests
// @desc    Get job requests with optional filters
// @access  Public
router.get("/requests", protect, authorize("companion"), async (req, res) => {
  try {
    const { status, specialization } = req.query;

    let query = { companionId: req.user.id };

    if (status) {
      query.status = status;
    }

    if (specialization) {
      query.specializations = { $in: [specialization] };
    }

    const requests = await JobRequest.find(query).populate(
      "elderlyId",
      "name email"
    );

    res.json({
      success: true,
      data: requests.map((r) => ({
        id: r._id,
        elderlyName: r.elderlyId?.name || "Unknown",
        elderlyEmail: r.elderlyId?.email || "",
        elderlyId: r.elderlyId?._id,
        companionId: r.companionId,
        status: r.status,
        specializations: r.specializations,
        hoursPerWeek: r.hoursPerWeek,
        hourlyRate: r.hourlyRate,
        startDate: r.startDate,
        description: r.description,
        message: r.message,
      })),
    });
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching requests",
    });
  }
});

// @route   POST /api/marketplace/requests
// @desc    Create a job request (elderly hiring companion)
// @access  Public (should be protected in production)
router.post("/requests", protect, authorize("elderly"), async (req, res) => {
  try {
    const {
      companionId,
      specializations,
      hoursPerWeek,
      hourlyRate,
      startDate,
      description,
      message,
    } = req.body;

    const normalizedSpecializations = Array.isArray(specializations)
      ? specializations.filter(Boolean)
      : specializations
        ? [specializations]
        : [];

    const parsedHours = Number(hoursPerWeek);
    const parsedRate = Number(hourlyRate);

    // Validation
    if (!companionId || normalizedSpecializations.length === 0 || !startDate || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
      return res.status(400).json({
        success: false,
        message: "Hours per week must be greater than 0",
      });
    }

    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      return res.status(400).json({
        success: false,
        message: "Hourly rate must be a valid non-negative number",
      });
    }

    // Verify companion exists
    const companion = await User.findOne({
      _id: companionId,
      role: "companion",
    });
    if (!companion) {
      return res.status(404).json({
        success: false,
        message: "Companion not found",
      });
    }

    // Create request
    const request = await JobRequest.create({
      elderlyId: req.user.id,
      companionId,
      specializations: normalizedSpecializations,
      hoursPerWeek: parsedHours,
      hourlyRate: parsedRate,
      startDate,
      description,
      message,
      status: "open",
    });

    res.status(201).json({
      success: true,
      data: {
        id: request._id,
        companionId: request.companionId,
        status: request.status,
      },
    });
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating request",
    });
  }
});

// @route   POST /api/marketplace/requests/:id/accept
// @desc    Accept a job request (companion accepting)
// @access  Public (should be protected in production)
router.post("/requests/:id/accept", protect, authorize("companion"), async (req, res) => {
  try {
    const request = await JobRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.status !== "open") {
      return res.status(400).json({
        success: false,
        message: `Cannot accept request with status: ${request.status}`,
      });
    }

    if (String(request.companionId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this request.",
      });
    }

    // Update JobRequest status
    request.status = "accepted";
    request.companionId = req.user.id;
    await request.save();

    // Create a Booking from the JobRequest
    const Booking = require("../models/Booking");
    const startDate = new Date(request.startDate);
    // Assume a 4-week engagement by default
    const endDate = new Date(startDate.getTime() + 4 * 7 * 24 * 60 * 60 * 1000);
    const totalDurationHours = request.hoursPerWeek * 4; // 4 weeks of service
    const totalCost = request.hourlyRate * totalDurationHours;

    const booking = new Booking({
      elderlyId: request.elderlyId,
      companionId: req.user.id,
      startDate: startDate,
      endDate: endDate,
      duration: totalDurationHours, // Total hours over the 4-week period
      status: "confirmed", // Booking is confirmed when request is accepted
      services: request.specializations,
      totalCost: totalCost,
      notes: request.description,
    });

    await booking.save();

    // Create notifications for both users
    const Notification = require("../models/Notification");
    const User = require("../models/User");
    
    // Get companion details for elderly notification
    const companion = await User.findById(req.user.id);
    
    // Notify elderly that request was accepted
    await Notification.create({
      userId: request.elderlyId,
      type: "booking_confirmed",
      title: "Request Accepted",
      message: `Your care request has been accepted by ${companion?.name || "a companion"}!`,
      relatedId: booking._id,
      relatedModel: "Booking",
      read: false,
    });

    // Notify companion of acceptance confirmation
    await Notification.create({
      userId: req.user.id,
      type: "booking_confirmed",
      title: "Booking Confirmed",
      message: `You have successfully accepted the care request. Booking confirmed!`,
      relatedId: booking._id,
      relatedModel: "Booking",
      read: false,
    });

    res.json({
      success: true,
      data: {
        requestId: request._id,
        bookingId: booking._id,
        companionId: req.user.id,
        status: "confirmed",
        booking: booking,
      },
    });
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error accepting request",
    });
  }
});

module.exports = router;
