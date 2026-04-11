const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "user_suspended",
        "user_verified",
        "user_deleted",
        "booking_cancelled",
        "dispute_resolved",
        "user_warned",
        "content_moderated"
      ],
      required: true,
    },
    targetUserId: mongoose.Schema.Types.ObjectId,
    reason: String,
    details: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AdminLog", adminLogSchema);
