/**
 * Test Message API with Real Authentication
 * Logs in a user and tests the messaging API
 */

const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
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

const makeRequest = (method, url, headers, body) => {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: url,
      method: method,
      headers: headers,
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed,
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on("error", (error) => {
      resolve({
        error: error.message,
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

const testMessagingAPI = async () => {
  await connectDatabase();
  
  const User = require("./server/models/User");

  console.log("📨 Testing Messaging API with Real Authentication\n");
  console.log("=".repeat(70) + "\n");

  try {
    // Get users
    const elderlyUser = await User.findOne({ email: "elderly.demo@carenest.com" });
    const companionUser = await User.findOne({ email: "companion.demo@carenest.com" });

    if (!elderlyUser || !companionUser) {
      console.log("❌ Users not found!");
      process.exit(1);
    }

    console.log("✅ Found users:");
    console.log(`   Elderly: ${elderlyUser.name} (${elderlyUser._id})`);
    console.log(`   Companion: ${companionUser.name} (${companionUser._id})\n`);

    // Generate JWT for elderly user
    const token = jwt.sign(
      {
        id: elderlyUser._id.toString(),
        email: elderlyUser.email,
        role: elderlyUser.role,
        name: elderlyUser.name,
      },
      process.env.JWT_SECRET || "dev_jwt_secret_change_me",
      { expiresIn: "7d" }
    );

    console.log("🔑 Generated JWT token for elderly user\n");

    // Test 1: Create conversation
    console.log("Test 1️⃣: Create/Get Conversation");
    console.log("-".repeat(70));
    const conversationRes = await makeRequest(
      "POST",
      "/api/messages/conversations",
      {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      {
        otherUserId: companionUser._id.toString(),
      }
    );

    console.log(`Status: ${conversationRes.status}`);
    console.log(`Response:`, JSON.stringify(conversationRes.data, null, 2));

    if (!conversationRes.data?.conversation?._id) {
      console.log("❌ Failed to create/get conversation!");
      process.exit(1);
    }

    const conversationId = conversationRes.data.conversation._id;
    console.log(`\n✅ Conversation ID: ${conversationId}\n`);

    // Wait a bit
    await new Promise(r => setTimeout(r, 1000));

    // Test 2: Fetch messages
    console.log("Test 2️⃣: Fetch Conversation Messages");
    console.log("-".repeat(70));
    const fetchRes = await makeRequest(
      "GET",
      `/api/messages/${conversationId}`,
      {
        "Authorization": `Bearer ${token}`,
      }
    );

    console.log(`Status: ${fetchRes.status}`);
    console.log(`Messages Count: ${fetchRes.data?.messages?.length || 0}`);
    if (fetchRes.data?.messages?.length > 0) {
      console.log(`First Message: "${fetchRes.data.messages[0].content}"`);
    }
    console.log();

    // Wait a bit
    await new Promise(r => setTimeout(r, 1000));

    // Test 3: Send message
    console.log("Test 3️⃣: Send Message");
    console.log("-".repeat(70));
    const sendRes = await makeRequest(
      "POST",
      `/api/messages/${conversationId}`,
      {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      {
        content: `Test message from API debug: ${new Date().toLocaleTimeString()}`,
      }
    );

    console.log(`Status: ${sendRes.status}`);
    if (sendRes.error) {
      console.log(`❌ Error: ${sendRes.error}`);
    } else {
      console.log(`Message ID: ${sendRes.data?.message?._id || "unknown"}`);
      console.log(`Content: "${sendRes.data?.message?.content || sendRes.data}"`);
      if (sendRes.status === 201 || sendRes.status === 200) {
        console.log("✅ Message sent successfully!");
      } else {
        console.log(`⚠️ Unexpected status: ${sendRes.status}`);
        console.log("Response:", JSON.stringify(sendRes.data, null, 2));
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("\n✅ API Tests Complete!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  }

  await mongoose.connection.close();
  process.exit(0);
};

testMessagingAPI().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
