const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    elderlyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "success", "fail", "cancel"],
      default: "pending",
    },
    gateway: {
      type: String,
      default: "mock-sslcommerz",
    },
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
