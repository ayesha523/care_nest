const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    elderlyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    startTime: String,
    endTime: String,
    duration: {
      type: Number,
      required: true,
    }, // in hours
    status: {
      type: String,
      enum: ["pending", "confirmed", "in-progress", "completed", "cancelled", "rejected"],
      default: "pending",
    },
    services: [String], // e.g., ["reading", "talking", "walking", "tech-help"]
    location: {
      address: String,
      latitude: Number,
      longitude: Number,
    },
    totalCost: Number,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    notes: String,
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ["elderly", "companion"],
    },
    completedAt: Date,
    companionArrivalTime: Date,
    actualEndTime: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
