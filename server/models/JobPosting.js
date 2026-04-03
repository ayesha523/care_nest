const mongoose = require("mongoose");

/**
 * JobPosting Schema
 * Represents care job postings created by elderly users
 * Allows companions to apply for care positions
 */
const jobPostingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID required"],
    },
    userName: {
      type: String,
      required: [true, "User name required"],
    },
    jobTitle: {
      type: String,
      required: [true, "Job title required"],
      trim: true,
      minlength: [3, "Job title must be at least 3 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description required"],
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    careType: {
      type: String,
      required: [true, "Care type required"],
      enum: [
        "companionship",
        "mobility-assistance",
        "dementia-care",
        "meal-prep",
        "housekeeping",
        "medication-reminders",
        "transportation",
        "physical-therapy",
      ],
    },
    hoursPerWeek: {
      type: Number,
      required: [true, "Hours per week required"],
      min: [1, "Must be at least 1 hour per week"],
      max: [168, "Cannot exceed 168 hours per week"],
    },
    hourlyRate: {
      type: Number,
      required: [true, "Hourly rate required"],
      min: [0, "Hourly rate cannot be negative"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date required"],
      validate: {
        validator: function (value) {
          return value >= new Date();
        },
        message: "Start date must be in the future",
      },
    },
    specialRequirements: {
      type: String,
      maxlength: [500, "Special requirements cannot exceed 500 characters"],
    },
    location: {
      type: String,
      required: [true, "Location required"],
    },
    agePreference: {
      type: String,
    },
    experienceRequired: {
      type: String,
    },
    status: {
      type: String,
      enum: ["open", "closed", "filled"],
      default: "open",
    },
    applications: [
      {
        companionId: mongoose.Schema.Types.ObjectId,
        companionName: String,
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    acceptedCompanion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    applicantCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for faster queries
jobPostingSchema.index({ userId: 1, status: 1 });
jobPostingSchema.index({ careType: 1 });
jobPostingSchema.index({ startDate: 1 });

module.exports = mongoose.model("JobPosting", jobPostingSchema);
