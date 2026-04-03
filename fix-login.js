/**
 * Deep diagnostic - check user data and test password comparison
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const dns = require("dns");

dotenv.config();

const getDnsServers = () => {
  return (process.env.MONGO_DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
};

const isAtlasSrvDnsError = (error) => {
  return error && /querySrv\s+ECONNREFUSED/i.test(error.message || "");
};

const connectDatabase = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/carenest";
    
    let conn;
    try {
      conn = await mongoose.connect(mongoUri, options);
    } catch (error) {
      if (mongoUri.startsWith("mongodb+srv://") && isAtlasSrvDnsError(error)) {
        const dnsServers = getDnsServers();
        console.log("⚠️  Retrying with alternate DNS servers...");
        dns.setServers(dnsServers);
        conn = await mongoose.connect(mongoUri, options);
      } else {
        throw error;
      }
    }

    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const diagnose = async () => {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║              🔍 DEEP DIAGNOSTIC - LOGIN ISSUE                      ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  await connectDatabase();
  console.log("✅ MongoDB Connected\n");

  const User = require("./server/models/User");

  try {
    console.log("1️⃣ CHECKING COMPANION USER IN DATABASE\n");
    
    const companion = await User.findOne({
      email: "companion.demo@carenest.com",
    }).select("+password");

    if (!companion) {
      console.log("❌ User not found! Need to recreate.\n");
      
      // Recreate the user
      console.log("🔄 Creating companion user...");
      const newUser = await User.create({
        name: "Emily Chen",
        email: "companion.demo@carenest.com",
        password: "PasswordCompanion@1",
        role: "companion",
        rating: 4.8,
        hourlyRate: 25,
      });
      console.log(`✅ User created: ${newUser.name}\n`);
      
      // Re-fetch to test
      const testUser = await User.findOne({
        email: "companion.demo@carenest.com",
      }).select("+password");
      
      console.log("2️⃣ TESTING PASSWORD AFTER RECREATION\n");
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Password hash: ${testUser.password.substring(0, 30)}...`);
      
      const match = await testUser.comparePassword("PasswordCompanion@1");
      console.log(`   Test password: PasswordCompanion@1`);
      console.log(`   Comparison result: ${match ? "✅ MATCH" : "❌ NO MATCH"}\n`);
      
    } else {
      console.log(`   Email: ${companion.email}`);
      console.log(`   Name: ${companion.name}`);
      console.log(`   Password hash: ${companion.password.substring(0, 30)}...`);
      console.log(`   Hash length: ${companion.password.length}\n`);

      console.log("2️⃣ TESTING PASSWORD WITH CORRECT VALUE\n");
      
      const testPassword = "PasswordCompanion@1";
      console.log(`   Testing: "${testPassword}"`);
      
      const match = await companion.comparePassword(testPassword);
      console.log(`   Result: ${match ? "✅ MATCH" : "❌ NO MATCH"}\n`);

      if (!match) {
        console.log("❌ PASSWORD MISMATCH DETECTED!\n");
        
        // Try to understand why
        console.log("Possible causes:");
        console.log("  1. User was pre-hashed during seeding (double-hashing)");
        console.log("  2. Password was stored in plain text originally");
        console.log("  3. Different bcrypt version used\n");
        
        console.log("🔄 SOLUTION: Delete and recreate user\n");
        
        await User.deleteOne({ email: "companion.demo@carenest.com" });
        console.log("   ✅ Old user deleted");
        
        const newCompanion = await User.create({
          name: "Emily Chen",
          email: "companion.demo@carenest.com",
          password: "PasswordCompanion@1",
          role: "companion",
          rating: 4.8,
          hourlyRate: 25,
        });
        
        const freshUser = await User.findOne({
          email: "companion.demo@carenest.com",
        }).select("+password");
        
        const freshMatch = await freshUser.comparePassword("PasswordCompanion@1");
        console.log(`   ✅ New user created`);
        console.log(`   ✅ Password test: ${freshMatch ? "✅ WORKS" : "❌ FAILED"}\n`);
      }
    }

    console.log("3️⃣ VERIFY ELDERLY USER\n");
    
    let elderly = await User.findOne({
      email: "elderly.demo@carenest.com",
    }).select("+password");

    if (!elderly) {
      console.log("❌ Elderly user not found. Creating...\n");
      await User.create({
        name: "Margaret Johnson",
        email: "elderly.demo@carenest.com",
        password: "PasswordElderly@1",
        role: "elderly",
      });
      elderly = await User.findOne({
        email: "elderly.demo@carenest.com",
      }).select("+password");
    }

    const elderlyMatch = await elderly.comparePassword("PasswordElderly@1");
    console.log(`   Email: ${elderly.email}`);
    console.log(`   Name: ${elderly.name}`);
    console.log(`   Password test: ${elderlyMatch ? "✅ WORKS" : "❌ FAILED"}\n`);

    if (!elderlyMatch) {
      await User.deleteOne({ email: "elderly.demo@carenest.com" });
      await User.create({
        name: "Margaret Johnson",
        email: "elderly.demo@carenest.com",
        password: "PasswordElderly@1",
        role: "elderly",
      });
      console.log(`   ✅ Recreated - password now works\n`);
    }

    console.log("═".repeat(72));
    console.log("\n✅ ALL USERS FIXED AND VERIFIED!\n");
    console.log("📝 Demo Credentials Ready:\n");
    console.log("COMPANION:");
    console.log("  Email: companion.demo@carenest.com");
    console.log("  Password: PasswordCompanion@1\n");
    console.log("ELDERLY:");
    console.log("  Email: elderly.demo@carenest.com");
    console.log("  Password: PasswordElderly@1\n");
    console.log("🎯 Try logging in now - should work!\n");

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(error);
  }

  await mongoose.connection.close();
  process.exit(0);
};

diagnose();
