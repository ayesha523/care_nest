const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Booking = require("../models/Booking");
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

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private (Only after completed booking)
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      companionId,
      bookingId,
      rating,
      comment,
      categories,
    } = req.body;

    // Validate required fields
    if (!companionId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify booking exists and is completed
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking || booking.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Booking must be completed to review",
        });
      }
    }

    const review = new Review({
      reviewerId: req.user.id,
      companionId,
      bookingId,
      rating,
      comment,
      categories,
      isVerified: !!bookingId, // Auto-verify if from a booking
    });

    await review.save();

    // Update companion rating
    const allReviews = await Review.find({ companionId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    const companion = await User.findById(companionId);
    companion.rating = parseFloat(avgRating.toFixed(2));
    companion.reviewCount = allReviews.length;
    await companion.save();

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
      updatedRating: avgRating.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/reviews/companion/:companionId
// @desc    Get all reviews for a companion
// @access  Public
router.get("/companion/:companionId", async (req, res) => {
  try {
    const reviews = await Review.find({
      companionId: req.params.companionId,
      isVerified: true,
    })
      .populate("reviewerId", "name profilePicture")
      .sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      reviews,
      averageRating: avgRating,
      totalReviews: reviews.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private (Only reviewer can update)
router.put("/:reviewId", verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.reviewerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { rating, comment, categories } = req.body;

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    if (categories) review.categories = categories;

    await review.save();

    // Recalculate companion rating
    const allReviews = await Review.find({ companionId: review.companionId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    const companion = await User.findById(review.companionId);
    companion.rating = parseFloat(avgRating.toFixed(2));
    await companion.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.delete("/:reviewId", verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.reviewerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const companionId = review.companionId;
    await Review.findByIdAndDelete(req.params.reviewId);

    // Recalculate rating
    const allReviews = await Review.find({ companionId });
    const avgRating =
      allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(2)
        : 0;

    const companion = await User.findById(companionId);
    companion.rating = parseFloat(avgRating);
    companion.reviewCount = allReviews.length;
    await companion.save();

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
