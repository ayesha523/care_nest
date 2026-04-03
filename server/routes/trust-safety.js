const express = require("express");
const router = express.Router();
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

// @route   POST /api/trust-safety/block-user/:userId
// @desc    Block a user
// @access  Private
router.post("/block-user/:userId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.blockedUsers) {
      user.blockedUsers = [];
    }

    if (!user.blockedUsers.includes(req.params.userId)) {
      user.blockedUsers.push(req.params.userId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/trust-safety/unblock-user/:userId
// @desc    Unblock a user
// @access  Private
router.post("/unblock-user/:userId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.blockedUsers) {
      user.blockedUsers = user.blockedUsers.filter(
        (id) => id.toString() !== req.params.userId
      );
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/trust-safety/blocked-users
// @desc    Get list of blocked users
// @access  Private
router.get("/blocked-users/all", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("blockedUsers", "name profilePicture email");

    res.status(200).json({
      success: true,
      blockedUsers: user.blockedUsers || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/trust-safety/verify-identity
// @desc    Submit identity verification
// @access  Private
router.post("/verify-identity", verifyToken, async (req, res) => {
  try {
    const { documentUrl } = req.body;

    if (!documentUrl) {
      return res.status(400).json({
        success: false,
        message: "Document URL is required",
      });
    }

    const user = await User.findById(req.user.id);
    user.verificationDocument = documentUrl;
    user.identityVerified = false; // Pending verification
    await user.save();

    res.status(200).json({
      success: true,
      message: "Verification document submitted. Pending admin review.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/trust-safety/user-status/:userId
// @desc    Get user verification status
// @access  Public
router.get("/user-status/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      identityVerified: user.identityVerified,
      isBlocked: user.isBlocked,
      rating: user.rating,
      reviewCount: user.reviewCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
