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
