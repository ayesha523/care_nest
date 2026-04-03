const mongoose = require("mongoose");

const moodLogSchema = new mongoose.Schema(
  {
    elderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mood: {
      type: String,
      enum: ["very_happy", "happy", "neutral", "sad", "very_sad"],
      required: true,
    },
    moodScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    notes: String,
    activities: [String], // e.g., ["watched movie", "went for walk", "had visitor"]
    companionId: mongoose.Schema.Types.ObjectId, // Reference to companion if during visit
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    attachments: [String], // URLs to photos, etc.
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MoodLog", moodLogSchema);
