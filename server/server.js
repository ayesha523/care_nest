const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Verify environment variables loaded
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET not found. Using development fallback secret.');
}

console.log('✅ Environment variables loaded');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

const configuredClientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const allowedOrigins = [
  configuredClientUrl,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5001",
  "http://127.0.0.1:5001",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const isLocalDevOrigin = (origin) => {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin || "");
};

// Middleware - CORS first, before JSON parsing
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/marketplace", require("./routes/marketplace"));

// New API Routes
app.use("/api/profile", require("./routes/profile"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/search", require("./routes/search"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/availability", require("./routes/availability"));
app.use("/api/trust-safety", require("./routes/trust-safety"));
app.use("/api/daily-checkin", require("./routes/daily-checkin"));
app.use("/api/mood", require("./routes/mood"));
app.use("/api/badges", require("./routes/badges"));
app.use("/api/admin", require("./routes/admin"));

// Emergency contact management (added to trust-safety or separate)
const EmergencyContact = require("./models/EmergencyContact");
app.post("/api/emergency-contacts", async (req, res) => {
  try {
    const { name, phone, relationship, address, notes } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    const jwt = require("jsonwebtoken");
    
    if (!token) return res.status(401).json({ success: false });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret_change_me");
    
    const emergency = new EmergencyContact({
      userId: decoded.id,
      name,
      phone,
      relationship,
      address,
      notes,
    });
    
    await emergency.save();
    res.status(201).json({ success: true, emergency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CareNest API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 CareNest server running on port ${PORT}`);
});
