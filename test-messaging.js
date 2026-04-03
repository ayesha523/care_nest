/**
 * Test Message Sending
 * Diagnoses messaging API issues
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

const testMessaging = async () => {
  await connectDatabase();
  
  const User = require("./server/models/User");
  const Conversation = require("./server/models/Conversation");
  const Message = require("./server/models/Message");

  console.log("📨 Testing Messaging System\n");
  console.log("=".repeat(70) + "\n");

  try {
    // Find elderly user
    const elderlyUser = await User.findOne({ email: "elderly.demo@carenest.com" });
    const companionUser = await User.findOne({ email: "companion.demo@carenest.com" });

    if (!elderlyUser) {
      console.log("❌ Elderly user not found!");
      process.exit(1);
    }
    if (!companionUser) {
      console.log("❌ Companion user not found!");
      process.exit(1);
    }

    console.log("✅ Found users:");
    console.log(`   Elderly: ${elderlyUser.name} (${elderlyUser.email})`);
    console.log(`   Companion: ${companionUser.name} (${companionUser.email})\n`);

    // Create or get conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [elderlyUser._id, companionUser._id] },
    })
      .populate("participants", "name email _id")
      .populate("lastMessage");

    if (!conversation) {
      console.log("📝 Creating new conversation...");
      conversation = new Conversation({
        participants: [elderlyUser._id, companionUser._id],
        isActive: true,
      });
      await conversation.save();
      await conversation.populate("participants", "name email _id");
      console.log(`✅ Conversation created: ${conversation._id}\n`);
    } else {
      console.log(`✅ Conversation found: ${conversation._id}\n`);
    }

    console.log("Participants in conversation:");
    conversation.participants.forEach(p => {
      console.log(`  - ${p.name} (${p._id})`);
    });
    console.log();

    // Try to send a message
    console.log("📬 Sending test message from elderly user to companion...\n");

    const message = new Message({
      conversationId: conversation._id,
      senderId: elderlyUser._id,
      recipientId: companionUser._id,
      content: "Test message: I am looking for a caretaker",
    });

    await message.save();
    await message.populate("senderId", "name email _id");

    console.log("✅ Message saved successfully!");
    console.log(`   ID: ${message._id}`);
    console.log(`   From: ${message.senderId.name}`);
    console.log(`   Content: "${message.content}"`);
    console.log(`   Created at: ${message.createdAt}\n`);

    // Update conversation last message
    conversation.lastMessage = message._id;
    await conversation.save();
    console.log("✅ Conversation updated with last message\n");

    // Fetch all messages in conversation
    const allMessages = await Message.find({
      conversationId: conversation._id,
      deleted: false,
    })
      .populate("senderId", "name email _id")
      .sort({ createdAt: 1 });

    console.log(`📋 All messages in conversation (${allMessages.length} total):\n`);
    allMessages.forEach((msg, idx) => {
      console.log(`   ${idx + 1}. From ${msg.senderId.name}: "${msg.content}"`);
      console.log(`      Created: ${msg.createdAt}`);
    });

    console.log("\n" + "=".repeat(70));
    console.log("\n✅ Messaging System Test Complete!");
    console.log("\n🔍 Diagnostics:");
    console.log(`   - Elderly User ID: ${elderlyUser._id}`);
    console.log(`   - Companion User ID: ${companionUser._id}`);
    console.log(`   - Conversation ID: ${conversation._id}`);
    console.log(`   - Last Message ID: ${conversation.lastMessage}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  }

  await mongoose.connection.close();
  process.exit(0);
};

testMessaging().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
