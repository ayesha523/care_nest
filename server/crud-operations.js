/**
 * MongoDB CRUD Operations
 * Create, Read, Update, Delete examples
 * Run: node server/crud-operations.js
 */

const mongoose = require("mongoose");
const User = require("./models/User");
const JobRequest = require("./models/JobRequest");
require("dotenv").config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/carenest";

const performOperations = async () => {
  try {
    // Connect
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // ==================== CREATE ====================
    console.log("📝 CREATE Operations:");
    console.log("─".repeat(50));

    // Create a new user
    const newUser = await User.create({
      name: "John Doe",
      email: `john_${Date.now()}@example.com`,
      password: "SecurePass123!",
      role: "elderly",
    });
    console.log(`✅ Created User: ${newUser.name} (${newUser._id})`);

    // Create a companion
    const companion = await User.create({
      name: "Sarah Smith",
      email: `sarah_${Date.now()}@example.com`,
      password: "SafePass456!",
      role: "companion",
      specializations: ["Cooking", "Gardening"],
      hourlyRate: 25,
      bio: "Experienced caregiver",
    });
    console.log(`✅ Created Companion: ${companion.name}`);

    // ==================== READ ====================
    console.log("\n📖 READ Operations:");
    console.log("─".repeat(50));

    // Find all users
    const allUsers = await User.find();
    console.log(`✅ Total Users in Database: ${allUsers.length}`);

    // Find specific user
    const foundUser = await User.findById(newUser._id);
    console.log(`✅ Found User: ${foundUser.name}`);

    // Find by email
    const userByEmail = await User.findOne({ email: newUser.email });
    console.log(`✅ Found by Email: ${userByEmail.email}`);

    // Count documents
    const userCount = await User.countDocuments({ role: "elderly" });
    console.log(`✅ Total Elderly Users: ${userCount}`);

    // ==================== UPDATE ====================
    console.log("\n✏️  UPDATE Operations:");
    console.log("─".repeat(50));

    // Update single field
    const updated = await User.findByIdAndUpdate(
      companion._id,
      { hourlyRate: 30 },
      { new: true }
    );
    console.log(
      `✅ Updated ${updated.name}'s hourly rate to $${updated.hourlyRate}`
    );

    // Update multiple fields
    const multiUpdate = await User.updateOne(
      { _id: newUser._id },
      {
        $set: {
          phone: "555-0123",
          availability: "Weekends",
        },
      }
    );
    console.log(
      `✅ Updated ${multiUpdate.modifiedCount} document with additional fields`
    );

    // ==================== DELETE ====================
    console.log("\n🗑️  DELETE Operations:");
    console.log("─".repeat(50));

    // Delete single document
    const deleted = await User.findByIdAndDelete(newUser._id);
    console.log(`✅ Deleted User: ${deleted.name}`);

    // Delete many documents (example - users with old emails)
    const deletedMany = await User.deleteMany({
      email: { $regex: "test.*@example.com" },
    });
    console.log(`✅ Deleted ${deletedMany.deletedCount} test documents`);

    // ==================== FINAL COUNT ====================
    console.log("\n📊 Final Database Count:");
    console.log("─".repeat(50));
    const finalUserCount = await User.countDocuments();
    const finalRequestCount = await JobRequest.countDocuments();
    console.log(`✅ Total Users: ${finalUserCount}`);
    console.log(`✅ Total Job Requests: ${finalRequestCount}`);

    console.log("\n✅ All CRUD operations completed successfully!");

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

performOperations();
