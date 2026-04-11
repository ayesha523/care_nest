/**
 * MongoDB Atlas Connection Verification Script
 * Tests the connection to MongoDB Atlas and provides diagnostics
 */

const mongoose = require("mongoose");
const dns = require("dns").promises;
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

async function verifyMongoDBAtlas() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 MONGODB ATLAS CONNECTION VERIFICATION");
  console.log("=".repeat(70) + "\n");

  // Step 1: Check environment variables
  console.log("📋 STEP 1: Checking Environment Variables\n");
  const mongoUri = process.env.MONGO_URI;
  const jwtSecret = process.env.JWT_SECRET;

  if (!mongoUri) {
    console.error("❌ MONGO_URI is not set in .env file");
    process.exit(1);
  }

  console.log(`✅ MONGO_URI found`);
  console.log(`   Format: mongodb+srv://...`);
  console.log(`   Database: ${extractDatabaseName(mongoUri)}`);
  console.log(`   Cluster: ${extractClusterName(mongoUri)}\n`);

  if (!jwtSecret) {
    console.warn("⚠️  JWT_SECRET not found - using development fallback\n");
  } else {
    console.log(`✅ JWT_SECRET is configured\n`);
  }

  // Step 2: DNS Resolution Test
  console.log("📋 STEP 2: Testing DNS Resolution\n");
  try {
    const srvHost = extractClusterHostname(mongoUri);
    console.log(`   Attempting to resolve: _mongodb._tcp.${srvHost}`);
    
    const addresses = await dns.resolveSrv(`_mongodb._tcp.${srvHost}`);
    console.log(`✅ DNS SRV record resolved successfully`);
    console.log(`   Found ${addresses.length} MongoDB host(s):`);
    addresses.forEach((addr, idx) => {
      console.log(`   ${idx + 1}. ${addr.name}:${addr.port}`);
    });
    console.log();
  } catch (error) {
    console.warn(`⚠️  DNS SRV resolution failed: ${error.message}`);
    console.log(`   This might be due to:
   - Network connectivity issues
   - Firewall blocking DNS/MongoDB ports
   - ISP DNS issues
   - MongoDB Atlas service temporarily unavailable
   - Trying with alternate DNS servers...\n`);

    try {
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
      const addresses = await dns.resolveSrv(`_mongodb._tcp.${extractClusterHostname(mongoUri)}`);
      console.log(`✅ DNS SRV resolved with Google DNS`);
      console.log(`   Found ${addresses.length} MongoDB host(s)\n`);
    } catch (dnsError) {
      console.error(`❌ DNS resolution failed even with alternate servers\n`);
    }
  }

  // Step 3: MongoDB Connection Test
  console.log("📋 STEP 3: Testing MongoDB Connection\n");
  try {
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    console.log("   Connecting to MongoDB Atlas...");
    const conn = await mongoose.connect(mongoUri, options);

    console.log(`✅ MongoDB Connection Successful!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   State: ${getConnectionState(conn.connection.readyState)}`);
    console.log(`   MongoDB Version: Checking...\n`);

    // Get MongoDB server info
    const admin = conn.connection.db.admin();
    const serverInfo = await admin.serverInfo();
    console.log(`   Server Version: ${serverInfo.version}`);
    console.log(`   Operating System: ${serverInfo.os.type}\n`);

    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`✅ Database Collections (${collections.length} found):`);
    if (collections.length === 0) {
      console.log("   (Empty database - collections will be created when needed)\n");
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
      console.log();
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed\n`);
    console.error(`Error: ${error.message}\n`);

    if (error.message.includes("ECONNREFUSED")) {
      console.log("Troubleshooting ECONNREFUSED:");
      console.log("  1. Check your IP is whitelisted in MongoDB Atlas");
      console.log("  2. Verify network connectivity");
      console.log("  3. Check firewall settings allow port 27017");
      console.log("  4. Try using static IP or 0.0.0.0/0 in Atlas (if in dev)\n");
    } else if (error.message.includes("Invalid credentials")) {
      console.log("Troubleshooting Invalid credentials:");
      console.log("  1. Check username and password in connection string");
      console.log("  2. Verify special characters are URL encoded");
      console.log("  3. Ensure user has proper database access permissions\n");
    } else if (error.message.includes("getaddrinfo")) {
      console.log("Troubleshooting DNS/Network issues:");
      console.log("  1. Check internet connectivity");
      console.log("  2. Try pinging MongoDB Atlas cluster");
      console.log("  3. Check firewall/antivirus blocking connections");
      console.log("  4. Verify MONGO_URI is correct\n");
    } else {
      console.log("General troubleshooting:");
      console.log("  1. Verify .env file exists and is readable");
      console.log("  2. Check MONGO_URI format: mongodb+srv://user:pass@host/db");
      console.log("  3. Test connection manually in MongoDB Compass");
      console.log("  4. Check MongoDB Atlas cluster is active\n");
    }

    process.exit(1);
  }

  // Step 4: Summary
  console.log("=".repeat(70));
  console.log("✅ MONGODB ATLAS VERIFICATION COMPLETE - ALL SYSTEMS GO!");
  console.log("=".repeat(70) + "\n");

  console.log("📝 Next Steps:");
  console.log("  1. Start backend:  node server/server.js");
  console.log("  2. Start frontend: npm start");
  console.log("  3. Seed demo accounts: node seed-demo-accounts.js");
  console.log("  4. Login with demo credentials");
  console.log("\n");
}

function extractDatabaseName(uri) {
  const match = uri.match(/\/([^?]+)/);
  return match ? match[1] : "unknown";
}

function extractClusterName(uri) {
  const match = uri.match(/@([^.]+)\./);
  return match ? match[1] : "unknown";
}

function extractClusterHostname(uri) {
  const match = uri.match(/@([^/]+)\//);
  return match ? match[1] : "unknown";
}

function getConnectionState(state) {
  const states = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };
  return states[state] || "Unknown";
}

// Run verification
verifyMongoDBAtlas().catch(error => {
  console.error("Verification script error:", error);
  process.exit(1);
});
