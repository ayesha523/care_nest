const express = require("express");
const router = express.Router();
const User = require("../models/User");
const JobRequest = require("../models/JobRequest");
const Notification = require("../models/Notification");
const Booking = require("../models/Booking");
const { protect, authorize } = require("../middleware/auth");

// @route   GET /api/marketplace/elderly
// @desc    Get elderly members for companions
// @access  Private (companions)
router.get("/elderly", protect, authorize("companion"), async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const query = { role: "elderly", isBlocked: false };

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { "location.city": new RegExp(search, "i") },
      ];
    }

    const elderlyMembers = await User.find(query)
      .select("name email profilePicture age interests location eldyDetails")
      .sort({ createdAt: -1 })
      .limit(120);

    res.json({
      success: true,
      data: elderlyMembers.map((member) => ({
        id: member._id,
        name: member.name,
        email: member.email,
        age: member.age || member.eldyDetails?.elderAge || null,
        profilePicture: member.profilePicture || "",
        interests: member.interests || [],
        city: member.location?.city || "",
        supportNeeds: member.eldyDetails?.healthConditions || [],
      })),
    });
  } catch (error) {
    console.error("Get elderly members error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching elderly members",
    });
  }
});

// @route   POST /api/marketplace/elderly/:elderlyId/request
// @desc    Companion sends support request to an elderly member
// @access  Private (companions)
router.post("/elderly/:elderlyId/request", protect, authorize("companion"), async (req, res) => {
  try {
    const { elderlyId } = req.params;
    const { message, hoursPerWeek, hourlyRate, startDate, specializations } = req.body;

    const elderlyMember = await User.findOne({ _id: elderlyId, role: "elderly", isBlocked: false }).select("name");
    if (!elderlyMember) {
      return res.status(404).json({
        success: false,
        message: "Elderly member not found",
      });
    }

    const companion = await User.findById(req.user.id).select("name hourlyRate specializations");
    if (!companion) {
      return res.status(404).json({
        success: false,
        message: "Companion account not found",
      });
    }

    const requestMessage = String(message || "").trim();
    if (!requestMessage) {
      return res.status(400).json({
        success: false,
        message: "Please include a message for the elderly member",
      });
    }

    const parsedHours = Number(hoursPerWeek || 0);
    const parsedRate = Number(hourlyRate || companion.hourlyRate || 0);
    const parsedStartDate = startDate ? new Date(startDate) : null;

    if (parsedHours <= 0 || !Number.isFinite(parsedHours)) {
      return res.status(400).json({
        success: false,
        message: "Hours per week must be greater than 0",
      });
    }

    if (parsedRate < 0 || !Number.isFinite(parsedRate)) {
      return res.status(400).json({
        success: false,
        message: "Hourly rate must be 0 or greater",
      });
    }

    if (!parsedStartDate || Number.isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid start date",
      });
    }

    const normalizedSpecializations = Array.isArray(specializations)
      ? specializations.filter(Boolean)
      : Array.isArray(companion.specializations)
        ? companion.specializations.slice(0, 5)
        : [];

    await Notification.create({
      userId: elderlyId,
      type: "system_notification",
      title: "New Companion Request",
      message: `${companion.name || "A companion"} sent you a care support request`,
      actionUrl: "/notifications",
      data: {
        requestType: "companion_to_elderly",
        companionId: req.user.id,
        companionName: companion.name || "Companion",
        elderlyId,
        elderlyName: elderlyMember.name || "Elderly Member",
        message: requestMessage,
        hoursPerWeek: parsedHours,
        hourlyRate: parsedRate,
        startDate: parsedStartDate,
        specializations: normalizedSpecializations,
      },
    });

    await Notification.create({
      userId: req.user.id,
      type: "system_notification",
      title: "Request Sent",
      message: `Your request was sent to ${elderlyMember.name || "the elderly member"}`,
      actionUrl: "/companion-dashboard",
      data: {
        requestType: "companion_to_elderly",
        elderlyId,
        elderlyName: elderlyMember.name || "Elderly Member",
      },
    });

    res.status(201).json({
      success: true,
      data: {
        elderlyId,
        elderlyName: elderlyMember.name || "Elderly Member",
        status: "sent",
      },
    });
  } catch (error) {
    console.error("Create companion request error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating companion request",
    });
  }
});

// @route   POST /api/marketplace/elderly/requests/:notificationId/respond
// @desc    Elderly accepts or declines a companion request
// @access  Private (elderly)
router.post(
  "/elderly/requests/:notificationId/respond",
  protect,
  authorize("elderly"),
  async (req, res) => {
    try {
      const { notificationId } = req.params;
      const action = String(req.body.action || "").trim().toLowerCase();

      if (!["accept", "decline"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Action must be accept or decline",
        });
      }

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Request notification not found",
        });
      }

      if (String(notification.userId) !== String(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const requestData = notification.data || {};
      if (requestData.requestType !== "companion_to_elderly") {
        return res.status(400).json({
          success: false,
          message: "This notification is not a companion request",
        });
      }

      if (requestData.responseStatus) {
        return res.status(400).json({
          success: false,
          message: `This request was already ${requestData.responseStatus}`,
        });
      }

      const companionId = requestData.companionId;
      const companion = await User.findById(companionId).select("name");
      if (!companion) {
        return res.status(404).json({
          success: false,
          message: "Companion not found",
        });
      }

      let booking = null;
      if (action === "accept") {
        const startDate = new Date(requestData.startDate || new Date());
        const duration = Number(requestData.hoursPerWeek || 1) * 4;
        const endDate = new Date(startDate.getTime() + 4 * 7 * 24 * 60 * 60 * 1000);
        const totalCost = Number(requestData.hourlyRate || 0) * duration;

        booking = await Booking.create({
          elderlyId: req.user.id,
          companionId,
          startDate,
          endDate,
          duration,
          status: "confirmed",
          services: requestData.specializations || [],
          totalCost,
          notes: requestData.message || "Companion request accepted",
        });
      }

      notification.data = {
        ...requestData,
        responseStatus: action === "accept" ? "accepted" : "declined",
        respondedAt: new Date(),
      };
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      await Notification.create({
        userId: companionId,
        type: action === "accept" ? "booking_confirmed" : "system_notification",
        title: action === "accept" ? "Request Accepted" : "Request Declined",
        message:
          action === "accept"
            ? `${req.user.name || "An elderly member"} accepted your care request.`
            : `${req.user.name || "An elderly member"} declined your care request.`,
        relatedId: booking?._id,
        relatedModel: booking ? "Booking" : undefined,
        actionUrl: action === "accept" ? "/companion-dashboard" : "/notifications",
      });

      res.json({
        success: true,
        data: {
          status: action === "accept" ? "accepted" : "declined",
          booking,
        },
      });
    } catch (error) {
      console.error("Respond companion request error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error responding to companion request",
      });
    }
  }
);

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
      "name email profilePicture specializations hourlyRate rating reviewCount availability bio verified"
    );

    res.json({
      success: true,
      data: companions.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        profilePicture: c.profilePicture || "",
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
      "name email profilePicture specializations hourlyRate rating reviewCount availability bio verified"
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
        profilePicture: companion.profilePicture || "",
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

    const requests = await JobRequest.find(query).populate("elderlyId", "name email profilePicture");

    res.json({
      success: true,
      data: requests.map((r) => ({
        id: r._id,
        elderlyName: r.elderlyId?.name || "Unknown",
        elderlyEmail: r.elderlyId?.email || "",
        elderlyProfilePicture: r.elderlyId?.profilePicture || "",
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

// @route   POST /api/marketplace/requests/:id/decline
// @desc    Decline a job request (companion declining)
// @access  Private
router.post("/requests/:id/decline", protect, authorize("companion"), async (req, res) => {
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
        message: `Cannot decline request with status: ${request.status}`,
      });
    }

    if (String(request.companionId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to decline this request.",
      });
    }

    request.status = "cancelled";
    await request.save();

    const companion = await User.findById(req.user.id).select("name");
    await Notification.create({
      userId: request.elderlyId,
      type: "system_notification",
      title: "Request Declined",
      message: `${companion?.name || "A companion"} declined your request.`,
      actionUrl: "/elderly-dashboard",
      data: {
        requestType: "job_request",
        requestId: request._id,
        status: "cancelled",
      },
    });

    res.json({
      success: true,
      data: {
        requestId: request._id,
        status: request.status,
      },
    });
  } catch (error) {
    console.error("Decline request error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error declining request",
    });
  }
});

module.exports = router;
