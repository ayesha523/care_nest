const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
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

// @route   GET /api/search/companions
// @desc    Search and filter companions
// @access  Public
router.get("/companions", async (req, res) => {
  try {
    const {
      location,
      skills,
      minRating,
      maxRate,
      availability,
      volunteersOnly,
    } = req.query;

    let filter = { role: "companion", isBlocked: false };

    if (location) {
      filter["location.city"] = { $regex: location, $options: "i" };
    }

    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      filter.skills = { $in: skillArray };
    }

    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    if (maxRate) {
      filter.hourlyRate = { $lte: parseFloat(maxRate) };
    }

    if (volunteersOnly === "true") {
      filter.volunteeerMode = true;
    }

    const companions = await User.find(filter)
      .select("-password")
      .populate("badges")
      .limit(50);

    // Add review count and avg rating
    const companionsWithRatings = await Promise.all(
      companions.map(async (companion) => {
        const reviews = await Review.find({ companionId: companion._id });
        return {
          ...companion.toObject(),
          reviewCount: reviews.length,
          averageRating:
            reviews.length > 0
              ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
              : 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: companionsWithRatings.length,
      companions: companionsWithRatings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/search/companion/:companionId/availability
// @desc    Get companion availability for booking
// @access  Public
router.get("/companion/:companionId/availability", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const bookings = await Booking.find({
      companionId: req.params.companionId,
      status: { $in: ["confirmed", "in-progress"] },
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    });

    res.status(200).json({
      success: true,
      bookedSlots: bookings,
      isAvailable: bookings.length === 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/search/recommendations
// @desc    Get AI-based recommendations (simple algorithm)
// @access  Private
router.get("/recommendations", verifyToken, async (req, res) => {
  try {
    const elderly = await User.findById(req.user.id);

    if (elderly.role !== "elderly") {
      return res.status(400).json({
        success: false,
        message: "Only elderly users can get recommendations",
      });
    }

    // Simple matching algorithm
    let recommendations = await User.find({
      role: "companion",
      isBlocked: false,
      skills: { $in: elderly.interests || [] },
    })
      .populate("badges")
      .limit(20);

    // Score and sort recommendations
    const scoredRecommendations = await Promise.all(
      recommendations.map(async (comp) => {
        let score = 0;

        // Skills match
        const skillMatches = (comp.skills || []).filter((skill) =>
          (elderly.interests || []).includes(skill)
        ).length;
        score += skillMatches * 10;

        // Location match
        if (
          comp.location?.city &&
          elderly.location?.city &&
          comp.location.city === elderly.location.city
        ) {
          score += 15;
        }

        // Rating
        score += (comp.rating || 0) * 5;

        // Reviews
        const reviews = await Review.find({ companionId: comp._id });
        score += Math.min(reviews.length, 10); // Cap at 10 points

        return {
          ...comp.toObject(),
          matchScore: score,
          reviewCount: reviews.length,
        };
      })
    );

    const sorted = scoredRecommendations.sort(
      (a, b) => b.matchScore - a.matchScore
    );

    res.status(200).json({
      success: true,
      recommendations: sorted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
