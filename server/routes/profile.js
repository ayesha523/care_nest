const express = require("express");
const router = express.Router();
const User = require("../models/User");
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

// @route   GET /api/profile/:userId
// @desc    Get user profile
// @access  Public
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("badges");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get average rating if companion
    if (user.role === "companion") {
      const reviews = await Review.find({ companionId: user._id });
      res.status(200).json({
        success: true,
        user,
        reviewCount: reviews.length,
        avgRating: reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
          : 0,
      });
    } else {
      res.status(200).json({ success: true, user });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/profile/:userId
// @desc    Update user profile
// @access  Private
router.put("/:userId", verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const updatableFields = [
      "name",
      "bio",
      "profilePicture",
      "age",
      "university",
      "skills",
      "interests",
      "location",
      "hourlyRate",
      "availability",
      "specializations",
      "volunteeerMode",
      "eldyDetails",
    ];

    const updateData = {};
    updatableFields.forEach(field => {
      if (field in req.body) {
        updateData[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/profile/:userId/reviews
// @desc    Get all reviews for a user
// @access  Public
router.get("/:userId/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ companionId: req.params.userId })
      .populate("reviewerId", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/profile/companions/search
// @desc    Get all companions (for filtering/search)
// @access  Public
router.get("/search/all", async (req, res) => {
  try {
    const companions = await User.find({ role: "companion", isBlocked: false })
      .select("-password")
      .populate("badges");

    res.status(200).json({
      success: true,
      companions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/profile/:userId
// @desc    Delete user account
// @access  Private
router.delete("/:userId", verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
