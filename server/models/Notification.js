const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "booking_request",
        "booking_confirmed",
        "booking_cancelled",
        "booking_reminder",
        "new_message",
        "review_received",
        "profile_verified",
        "emergency_alert",
        "system_notification"
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: mongoose.Schema.Types.ObjectId, // Booking ID, Message ID, etc.
    relatedModel: String, // "Booking", "Message", etc.
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    actionUrl: String,
    data: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
