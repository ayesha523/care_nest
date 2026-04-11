const mongoose = require("mongoose");

const dailyCheckInSchema = new mongoose.Schema(
  {
    elderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["good", "okay", "needs_help", "emergency"],
      required: true,
    },
    notes: String,
    responsedAt: Date,
    remindAt: Date,
    reminderSent: {
      type: Boolean,
      default: false,
    },
    checkedInByCompanion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DailyCheckIn", dailyCheckInSchema);
