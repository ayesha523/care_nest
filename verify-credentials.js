/**
 * Verify demo account credentials
 */
const mongoose = require("mongoose");
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

const testLogin = async () => {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║             🔑 DEMO ACCOUNT CREDENTIALS VERIFICATION                ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  await connectDatabase();
  console.log("✅ MongoDB Connected\n");

  const User = require("./server/models/User");

  try {
    // Test credentials
    const testCreds = [
      {
        email: "elderly.demo@carenest.com",
        password: "PasswordElderly@1",
        name: "Margaret Johnson",
      },
      {
        email: "companion.demo@carenest.com",
        password: "PasswordCompanion@1",
        name: "Emily Chen",
      },
    ];

    console.log("Testing login with demo credentials...\n");

    for (const cred of testCreds) {
      console.log(`📧 Email: ${cred.email}`);
      console.log(`🔐 Password: ${cred.password}`);
      console.log(`👤 Name: ${cred.name}`);

      // Find user
      const user = await User.findOne({ email: cred.email.toLowerCase() }).select(
        "+password"
      );

      if (!user) {
        console.log("❌ User not found in database\n");
        continue;
      }

      console.log(`✅ User found: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Email: ${user.email}`);

      // Test password
      const isMatch = await user.comparePassword(cred.password);
      if (isMatch) {
        console.log(`✅ PASSWORD CORRECT - Login should work!\n`);
      } else {
        console.log(`❌ PASSWORD INCORRECT - Login will fail!\n`);
      }
    }

    // Also show what happened with the attempted password
    console.log("\n" + "=".repeat(72));
    console.log("🔍 CHECKING ATTEMPTED PASSWORD\n");

    const companion = await User.findOne({
      email: "companion.demo@carenest.com",
    }).select("+password");

    if (companion) {
      const attemptedPassword = "DemoPassword@123";
      const isMatch = await companion.comparePassword(attemptedPassword);
      console.log(`Email: companion.demo@carenest.com`);
      console.log(`Attempted password: ${attemptedPassword}`);
      console.log(`Match result: ${isMatch ? "✅ YES" : "❌ NO"}\n`);

      if (!isMatch) {
        console.log("⚠️  REASON FOR 'Invalid credentials' MESSAGE:");
        console.log("   The password you're using is different from what's stored.");
        console.log(`   Please use: PasswordCompanion@1\n`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

testLogin();
