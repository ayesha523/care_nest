const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
      validate: {
        validator: function(value) {
          // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
          return (
            value.length >= 8 &&
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /[0-9]/.test(value) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(value)
          );
        },
        message: "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character"
      }
    },
    role: {
      type: String,
      enum: ["elderly", "companion"],
      required: [true, "Please specify a role"],
    },
    // Role-specific fields
    specializations: {
      type: [String],
      default: [],
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    availability: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    // Profile fields
    profilePicture: String,
    age: Number,
    university: String, // For companions
    eldyDetails: {
      elderName: String,
      elderAge: Number,
      healthConditions: [String],
      mobilityLevel: String,
      preferences: [String],
    },
    skills: {
      type: [String],
      default: [], // e.g., ["reading", "talking", "walking", "tech-help", "companionship"]
    },
    interests: [String], // e.g., ["reading", "movies", "walking", "gardening"]
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      latitude: Number,
      longitude: Number,
    },
    volunteeerMode: {
      type: Boolean,
      default: false,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    badges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserBadge",
      }
    ],
    identityVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocument: String,
    verificationDate: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
