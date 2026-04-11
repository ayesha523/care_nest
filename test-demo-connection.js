/**
 * Test script to create and verify connection between demo elderly and companion
 * Tests full conversation flow: login, create conversation, send message, retrieve messages
 */

const API_BASE = "http://localhost:5000";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testDemoConnection() {
  try {
    console.log("========================================");
    console.log("🧪 DEMO CONNECTION TEST");
    console.log("========================================\n");

    // Step 1: Login elderly
    console.log("1️⃣  Logging in elderly user...");
    const elderlyLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "elderly@demo.com",
        password: "Password123!",
      }),
    });

    if (!elderlyLoginRes.ok) {
      throw new Error(`Elderly login failed: ${elderlyLoginRes.status}`);
    }

    const elderlyData = await elderlyLoginRes.json();
    const elderlyToken = elderlyData.data?.token;
    const elderlyId = elderlyData.data?.user?.id;

    if (!elderlyToken || !elderlyId) {
      throw new Error("No token or ID from elderly login");
    }

    console.log(`✅ Elderly logged in:  ${elderlyData.data.user.name}`);
    console.log(`   ID: ${elderlyId}`);
    console.log();

    // Step 2: Login companion
    console.log("2️⃣  Logging in companion user...");
    const companionLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "companion@demo.com",
        password: "Password123!",
      }),
    });

    if (!companionLoginRes.ok) {
      throw new Error(`Companion login failed: ${companionLoginRes.status}`);
    }

    const companionData = await companionLoginRes.json();
    const companionToken = companionData.data?.token;
    const companionId = companionData.data?.user?.id;

    if (!companionToken || !companionId) {
      throw new Error("No token or ID from companion login");
    }

    console.log(`✅ Companion logged in: ${companionData.data.user.name}`);
    console.log(`   ID: ${companionId}`);
    console.log();

    // Step 3: Elderly creates conversation with companion
    console.log("3️⃣  Creating conversation (elderly initiating)...");
    const createConvRes = await fetch(`${API_BASE}/api/messages/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${elderlyToken}`,
      },
      body: JSON.stringify({ otherUserId: companionId }),
    });

    if (!createConvRes.ok) {
      const errorText = await createConvRes.text();
      throw new Error(`Create conversation failed: ${createConvRes.status} - ${errorText}`);
    }

    const convData = await createConvRes.json();
    const conversationId = convData.data?.conversation?._id || convData.conversation?._id;

    if (!conversationId) {
      throw new Error("No conversation ID in response");
    }

    console.log(`✅ Conversation created: ${conversationId}`);
    console.log(`   Participants: ${convData.data?.conversation?.participants?.length || convData.conversation?.participants?.length}`);
    console.log();

    // Step 4: Elderly sends message
    console.log("4️⃣  Elderly sending message...");
    const message1Res = await fetch(`${API_BASE}/api/messages/${conversationId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${elderlyToken}`,
      },
      body: JSON.stringify({
        content: "Hello! I need some help with daily activities. Can you assist?",
      }),
    });

    if (!message1Res.ok) {
      const errorText = await message1Res.text();
      throw new Error(`Send message failed: ${message1Res.status} - ${errorText}`);
    }

    const msg1Data = await message1Res.json();
    console.log(`✅ Message sent by elderly`);
    console.log(`   Content: "${msg1Data.data?.message?.content || msg1Data.message?.content}"`);
    console.log(`   ID: ${msg1Data.data?.message?._id || msg1Data.message?._id}`);
    console.log();

    // Step 5: Companion sends response
    console.log("5️⃣  Companion sending response...");
    const message2Res = await fetch(`${API_BASE}/api/messages/${conversationId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${companionToken}`,
      },
      body: JSON.stringify({
        content: "Of course! I'd be happy to help. When would you like me to come over?",
      }),
    });

    if (!message2Res.ok) {
      const errorText = await message2Res.text();
      throw new Error(`Send response failed: ${message2Res.status} - ${errorText}`);
    }

    const msg2Data = await message2Res.json();
    console.log(`✅ Message sent by companion`);
    console.log(`   Content: "${msg2Data.data?.message?.content || msg2Data.message?.content}"`);
    console.log();

    // Step 6: Elderly fetches conversation details
    console.log("6️⃣  Fetching conversation messages (elderly view)...");
    const getConvRes = await fetch(`${API_BASE}/api/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });

    if (!getConvRes.ok) {
      const errorText = await getConvRes.text();
      throw new Error(`Fetch conversation failed: ${getConvRes.status} - ${errorText}`);
    }

    const getConvData = await getConvRes.json();
    const messages = getConvData.data?.messages || getConvData.messages || [];

    console.log(`✅ Retrieved ${messages.length} messages`);
    messages.forEach((msg, idx) => {
      const sender = msg.senderId?.name || msg.senderId || "Unknown";
      console.log(`   [${idx + 1}] ${sender}: "${msg.content}"`);
    });
    console.log();

    // Step 7: Test conversation list for elderly
    console.log("7️⃣  Fetching conversation list (elderly)...");
    const listRes = await fetch(`${API_BASE}/api/messages/conversations/all`, {
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });

    if (!listRes.ok) {
      const errorText = await listRes.text();
      throw new Error(`Fetch list failed: ${listRes.status} - ${errorText}`);
    }

    const listData = await listRes.json();
    const conversations = listData.data?.conversations || listData.conversations || [];

    console.log(`✅ Elderly has ${conversations.length} conversation(s)`);
    conversations.forEach((conv) => {
      const participants = conv.participants || [];
      const otherUser = participants.find((p) => (p._id || p) !== elderlyId);
      console.log(`   - With: ${otherUser?.name || "Unknown"}`);
      console.log(`     Last message: "${conv.lastMessage?.content || "N/A"}"`);
    });
    console.log();

    // Step 8: Test conversation list for companion
    console.log("8️⃣  Fetching conversation list (companion)...");
    const companionListRes = await fetch(`${API_BASE}/api/messages/conversations/all`, {
      headers: { Authorization: `Bearer ${companionToken}` },
    });

    if (!companionListRes.ok) {
      const errorText = await companionListRes.text();
      throw new Error(`Fetch companion list failed: ${companionListRes.status} - ${errorText}`);
    }

    const companionListData = await companionListRes.json();
    const companionConversations = companionListData.data?.conversations || companionListData.conversations || [];

    console.log(`✅ Companion has ${companionConversations.length} conversation(s)`);
    companionConversations.forEach((conv) => {
      const participants = conv.participants || [];
      const otherUser = participants.find((p) => (p._id || p) !== companionId);
      console.log(`   - With: ${otherUser?.name || "Unknown"}`);
      console.log(`     Last message: "${conv.lastMessage?.content || "N/A"}"`);
    });
    console.log();

    console.log("========================================");
    console.log("✅ ALL TESTS PASSED!");
    console.log("========================================");
    console.log();
    console.log("📊 Summary:");
    console.log(`   • Elderly user: ${elderlyData.data.user.name}`);
    console.log(`   • Companion user: ${companionData.data.user.name}`);
    console.log(`   • Conversation ID: ${conversationId}`);
    console.log(`   • Total messages: ${messages.length}`);
    console.log("========================================\n");

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDemoConnection();
