/**
 * Delete Demo Accounts
 * Removes demo accounts from database so they can be re-seeded with correct passwords
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

    console.log("✅ Connected to MongoDB\n");
    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const deleteDemoAccounts = async () => {
  await connectDatabase();
  
  const User = require("./server/models/User");

  const demoEmails = [
    "elderly.demo@carenest.com",
    "elderly2.demo@carenest.com",
    "elderly3.demo@carenest.com",
    "companion.demo@carenest.com",
    "companion2.demo@carenest.com",
    "companion3.demo@carenest.com",
  ];

  console.log("🗑️  Deleting demo accounts...\n");

  const result = await User.deleteMany({
    email: { $in: demoEmails }
  });

  console.log(`✅ Deleted ${result.deletedCount} demo accounts\n`);

  if (result.deletedCount > 0) {
    console.log("✨ Demo accounts cleared. Ready to re-seed with correct passwords.\n");
  }

  await mongoose.connection.close();
};

deleteDemoAccounts().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
