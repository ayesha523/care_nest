/**
 * MongoDB Connection Script
 * Direct way to connect to MongoDB using Node.js
 * Run: node server/connect-db.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const connectAndTest = async () => {
  try {
    // Connection string from .env
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/carenest";

    console.log("🔄 Connecting to MongoDB...");
    console.log(`📍 Connection URL: ${mongoUri}`);

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB Connected Successfully!");
    console.log(`✅ Host: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);

    // Get database stats
    const db = conn.connection.db;
    const stats = await db.stats();
    console.log("\n📊 Database Stats:");
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`   Storage Size: ${(stats.storageSize / 1024).toFixed(2)} KB`);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("\n📚 Collections in Database:");
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });

    // Show example data from Users collection
    const User = require("./models/User");
    const userCount = await User.countDocuments();
    console.log(`\n👥 Total Users: ${userCount}`);

    if (userCount > 0) {
      const users = await User.find().limit(3);
      console.log("\n📋 Sample Users:");
      users.forEach((user) => {
        console.log(
          `   - ${user.name} (${user.email}) - Role: ${user.role}`
        );
      });
    }

    // Show example data from JobRequests collection
    const JobRequest = require("./models/JobRequest");
    const requestCount = await JobRequest.countDocuments();
    console.log(`\n💼 Total Job Requests: ${requestCount}`);

    if (requestCount > 0) {
      const requests = await JobRequest.find().limit(3);
      console.log("\n📋 Sample Job Requests:");
      requests.forEach((req) => {
        console.log(
          `   - Status: ${req.status}, Hours/Week: ${req.hoursPerWeek}, Rate: $${req.hourlyRate}`
        );
      });
    }

    console.log("\n✅ Database connection test completed successfully!");

    // Close connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:");
    console.error(`   ${error.message}`);
    console.error("\n💡 Troubleshooting:");
    console.error("   1. Make sure MongoDB is running");
    console.error("   2. Check your MONGO_URI in .env file");
    console.error("   3. Verify MongoDB is on port 27017");
    process.exit(1);
  }
};

connectAndTest();
