const express = require("express");
const router = express.Router();
const User = require("../models/User");
const AdminLog = require("../models/AdminLog");
const Booking = require("../models/Booking");
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

// Admin check middleware
const adminCheck = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users (paginated)
// @access  Private (Admin)
router.get("/users", verifyToken, adminCheck, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isBlocked } = req.query;

    let filter = {};
    if (role) filter.role = role;
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === "true";

    const users = await User.find(filter)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUsers: total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/users/:userId/verify
// @desc    Verify user identity
// @access  Private (Admin)
router.put("/users/:userId/verify", verifyToken, adminCheck, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { identityVerified: true, verificationDate: new Date() },
      { new: true }
    );

    const adminLog = new AdminLog({
      adminId: req.user.id,
      action: "user_verified",
      targetUserId: req.params.userId,
      reason: "Identity verification approved",
    });

    await adminLog.save();

    // Notify user
    const notification = new Notification({
      userId: req.params.userId,
      type: "profile_verified",
      title: "Profile Verified",
      message: "Your identity has been verified by CareNest",
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: "User verified successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/users/:userId/block
// @desc    Block a user
// @access  Private (Admin)
router.put("/users/:userId/block", verifyToken, adminCheck, async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBlocked: true },
      { new: true }
    );

    const adminLog = new AdminLog({
      adminId: req.user.id,
      action: "user_suspended",
      targetUserId: req.params.userId,
      reason,
    });

    await adminLog.save();

    // Notify user
    const notification = new Notification({
      userId: req.params.userId,
      type: "system_notification",
      title: "Account Suspended",
      message: `Your account has been suspended. Reason: ${reason || "Not specified"}`,
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/users/:userId/unblock
// @desc    Unblock a user
// @access  Private (Admin)
router.put("/users/:userId/unblock", verifyToken, adminCheck, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBlocked: false },
      { new: true }
    );

    const adminLog = new AdminLog({
      adminId: req.user.id,
      action: "user_warned", // Using as unblock action in log
      targetUserId: req.params.userId,
      reason: "User unblocked",
    });

    await adminLog.save();

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings for monitoring
// @access  Private (Admin)
router.get("/bookings", verifyToken, adminCheck, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("elderlyId", "name email")
      .populate("companionId", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalBookings: total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Private (Admin)
router.get("/stats", verifyToken, adminCheck, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCompanions = await User.countDocuments({ role: "companion" });
    const totalElderly = await User.countDocuments({ role: "elderly" });
    const verifiedUsers = await User.countDocuments({ identityVerified: true });
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: "completed" });
    const pendingBookings = await Booking.countDocuments({ status: "pending" });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          companions: totalCompanions,
          elderly: totalElderly,
          verified: verifiedUsers,
          blocked: blockedUsers,
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          pending: pendingBookings,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/logs
// @desc    Get admin activity logs
// @access  Private (Admin)
router.get("/logs", verifyToken, adminCheck, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const logs = await AdminLog.find()
      .populate("adminId", "name email")
      .populate("targetUserId", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await AdminLog.countDocuments();

    res.status(200).json({
      success: true,
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
