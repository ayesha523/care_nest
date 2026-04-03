const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    icon: String, // URL to badge icon
    criteria: {
      type: String,
      enum: [
        "volunteer_hours",
        "5_stars",
        "10_bookings",
        "verified_identity",
        "responds_quickly"
      ],
    },
    requiredValue: Number, // e.g., 50 hours for volunteer badge
    color: String,
  },
  {
    timestamps: true,
  }
);

const userBadgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  Badge: mongoose.model("Badge", badgeSchema),
  UserBadge: mongoose.model("UserBadge", userBadgeSchema),
};
