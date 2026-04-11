/**
 * Test Login Endpoint
 * Tests if demo accounts can login successfully
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

    console.log("✅ Connected to MongoDB\n");
    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const testLogin = async () => {
  await connectDatabase();
  
  const User = require("./server/models/User");

  console.log("🔐 Testing Login with Demo Accounts\n");
  console.log("=".repeat(60));

  const testAccounts = [
    { email: "elderly.demo@carenest.com", password: "PasswordElderly@1", role: "elderly" },
    { email: "companion2.demo@carenest.com", password: "PasswordCompanion@2", role: "companion" },
  ];

  for (const testAccount of testAccounts) {
    console.log(`\n📧 Testing: ${testAccount.email}`);
    console.log(`   Password: ${testAccount.password}`);
    console.log(`   Role: ${testAccount.role}`);

    try {
      // Find user
      const user = await User.findOne({ email: testAccount.email.toLowerCase() }).select("+password");

      if (!user) {
        console.log(`   ❌ User not found in database!`);
        continue;
      }

      console.log(`   ✅ User found: ${user.name}`);
      console.log(`   Stored role: ${user.role}`);
      console.log(`   Stored password hash: ${user.password.substring(0, 20)}...`);

      // Check role match
      if (testAccount.role && user.role !== testAccount.role) {
        console.log(`   ❌ Role mismatch! Expected ${testAccount.role}, got ${user.role}`);
        continue;
      }

      // Test password comparison
      const isMatch = await user.comparePassword(testAccount.password);
      console.log(`   🔑 Password comparison: ${isMatch ? "✅ MATCH" : "❌ NO MATCH"}`);

      if (!isMatch) {
        console.log(`   Details:`);
        console.log(`     - Entered: ${testAccount.password}`);
        console.log(`     - Hash: ${user.password.substring(0, 30)}...`);
      }

      // If everything is good, show what would be returned
      if (isMatch) {
        console.log(`\n   ✅ LOGIN SUCCESSFUL!`);
        console.log(`   User would get:`);
        console.log(`     - ID: ${user._id}`);
        console.log(`     - Name: ${user.name}`);
        console.log(`     - Email: ${user.email}`);
        console.log(`     - Role: ${user.role}`);
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Test complete");
  
  mongoose.connection.close();
  process.exit(0);
};

testLogin().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
