const express = require("express");
const router = express.Router();
const { Badge, UserBadge } = require("../models/Badge");
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

// @route   GET /api/badges
// @desc    Get all available badges
// @access  Public
router.get("/", async (req, res) => {
  try {
    const badges = await Badge.find();
    res.status(200).json({ success: true, badges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/badges/user/:userId
// @desc    Get badges earned by a user
// @access  Public
router.get("/user/:userId", async (req, res) => {
  try {
    const userBadges = await UserBadge.find({ userId: req.params.userId })
      .populate("badgeId")
      .sort({ earnedAt: -1 });

    res.status(200).json({
      success: true,
      badges: userBadges,
      totalBadges: userBadges.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/badges/check-and-award
// @desc    Check if user qualifies for new badges (Auto-awarding)
// @access  Private (Admin/System)
router.post("/check-and-award/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const badges = await Badge.find();
    const newBadges = [];

    for (const badge of badges) {
      // Check if user already has this badge
      const hasBadge = await UserBadge.findOne({
        userId: req.params.userId,
        badgeId: badge._id,
      });

      if (hasBadge) continue;

      let qualifies = false;

      switch (badge.criteria) {
        case "volunteer_hours":
          qualifies = user.totalHours >= badge.requiredValue;
          break;
        case "5_stars":
          qualifies = user.rating >= 5 && user.reviewCount >= 5;
          break;
        case "10_bookings":
          qualifies = user.totalBookings >= 10;
          break;
        case "verified_identity":
          qualifies = user.identityVerified;
          break;
        case "responds_quickly":
          qualifies = user.rating >= 4.5;
          break;
      }

      if (qualifies) {
        const userBadge = new UserBadge({
          userId: req.params.userId,
          badgeId: badge._id,
        });

        await userBadge.save();
        newBadges.push(badge);
      }
    }

    // Update user badges array
    if (newBadges.length > 0) {
      const allUserBadges = await UserBadge.find({ userId: req.params.userId });
      user.badges = allUserBadges.map((ub) => ub._id);
      await user.save();
    }

    res.status(200).json({
      success: true,
      newBadgesEarned: newBadges,
      message: `User earned ${newBadges.length} new badge(s)`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
