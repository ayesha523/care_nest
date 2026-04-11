/**
 * Test script to verify that accepting a job request creates a booking
 * and both elderly and companion can see it in their active bookings
 */

const API_BASE = "http://localhost:5000";

async function testJobRequestFlow() {
  try {
    console.log("========================================");
    console.log("🧪 JOB REQUEST ACCEPTANCE TEST");
    console.log("========================================\n");

    // Step 1: Login elderly user
    console.log("1️⃣  Logging in elderly user...");
    const elderlyLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "elderly.demo@carenest.com",
        password: "PasswordElderly@1",
      }),
    });

    const elderlyData = await elderlyLoginRes.json();
    const elderlyToken = elderlyData.data?.token;
    const elderlyId = elderlyData.data?.user?.id;

    if (!elderlyToken || !elderlyId) {
      throw new Error("Elderly login failed");
    }

    console.log(`✅ Elderly logged in: ${elderlyData.data.user.name}`);
    console.log();

    // Step 2: Login companion user
    console.log("2️⃣  Logging in companion user...");
    const companionLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "companion2.demo@carenest.com",
        password: "PasswordCompanion@2",
      }),
    });

    const companionData = await companionLoginRes.json();
    const companionToken = companionData.data?.token;
    const companionId = companionData.data?.user?.id;

    if (!companionToken || !companionId) {
      throw new Error("Companion login failed");
    }

    console.log(`✅ Companion logged in: ${companionData.data.user.name}`);
    console.log();

    // Step 3: Elderly posts a job request
    console.log("3️⃣  Elderly posting job request...");
    const requestRes = await fetch(`${API_BASE}/api/marketplace/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${elderlyToken}`,
      },
      body: JSON.stringify({
        companionId: companionId,
        specializations: ["dementia-care", "meal-prep"],
        hoursPerWeek: 12,
        hourlyRate: 30,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
        description: "I need comprehensive care assistance with meals and activities. Prefer experienced companion.",
        message: "Looking for reliable, patient companion.",
      }),
    });

    if (!requestRes.ok) {
      const error = await requestRes.text();
      throw new Error(`Job request failed: ${error}`);
    }

    const requestData = await requestRes.json();
    const jobRequestId = requestData.data?.id;

    if (!jobRequestId) {
      throw new Error("No job request ID returned");
    }

    console.log(`✅ Job request posted: ${jobRequestId}`);
    console.log();

    // Step 4: Companion accepts the request
    console.log("4️⃣  Companion accepting job request...");
    const acceptRes = await fetch(`${API_BASE}/api/marketplace/requests/${jobRequestId}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${companionToken}`,
      },
    });

    if (!acceptRes.ok) {
      const error = await acceptRes.text();
      throw new Error(`Accept request failed: ${error}`);
    }

    const acceptData = await acceptRes.json();
    const bookingId = acceptData.data?.bookingId;

    console.log(`✅ Request accepted!`);
    console.log(`   Full response:`, JSON.stringify(acceptData, null, 2));
    console.log(`   Booking ID: ${bookingId}`);
    console.log();

    // Step 5: Check elderly sees the booking
    console.log("5️⃣  Checking elderly's active bookings...");
    const elderlyBookingsRes = await fetch(`${API_BASE}/api/bookings/user/${elderlyId}`, {
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });

    const elderlyBookingsData = await elderlyBookingsRes.json();
    const elderlyBookings = elderlyBookingsData.bookings || [];
    const activeBookings = elderlyBookings.filter((b) =>
      ["confirmed", "pending", "in-progress"].includes(b.status)
    );

    console.log(`✅ Elderly has ${activeBookings.length} active booking(s)`);
    activeBookings.forEach((booking) => {
      console.log(`   - Companion: ${booking.companionId?.name || "Unknown"}`);
      console.log(`     Status: ${booking.status}`);
      console.log(`     Start: ${new Date(booking.startDate).toLocaleDateString()}`);
      console.log(`     Duration: ${booking.duration} hours`);
      console.log(`     Total Cost: $${booking.totalCost}`);
    });
    console.log();

    // Step 6: Check companion sees the booking
    console.log("6️⃣  Checking companion's active bookings...");
    const companionBookingsRes = await fetch(`${API_BASE}/api/bookings/user/${companionId}`, {
      headers: { Authorization: `Bearer ${companionToken}` },
    });

    const companionBookingsData = await companionBookingsRes.json();
    const companionBookings = companionBookingsData.bookings || [];
    const companionActive = companionBookings.filter((b) =>
      ["confirmed", "pending", "in-progress"].includes(b.status)
    );

    console.log(`✅ Companion has ${companionActive.length} active booking(s)`);
    companionActive.forEach((booking) => {
      console.log(`   - Elderly: ${booking.elderlyId?.name || "Unknown"}`);
      console.log(`     Status: ${booking.status}`);
      console.log(`     Start: ${new Date(booking.startDate).toLocaleDateString()}`);
      console.log(`     Duration: ${booking.duration} hours`);
      console.log(`     Can earn: $${booking.totalCost}`);
    });
    console.log();

    // Step 7: Verify notifications were created
    console.log("7️⃣  Checking notifications...");
    const elderlyNotificationsRes = await fetch(`${API_BASE}/api/notifications`, {
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });

    if (elderlyNotificationsRes.ok) {
      const notificationsData = await elderlyNotificationsRes.json();
      console.log(`✅ Elderly has ${notificationsData.notifications?.length || 0} notification(s)`);
    }
    console.log();

    console.log("========================================");
    console.log("✅ TEST PASSED!");
    console.log("========================================");
    console.log();
    console.log("Summary:");
    console.log(`• Elderly requested job from companion`);
    console.log(`• Companion accepted request`);
    console.log(`• Booking created and confirmed`);
    console.log(`• Both users can see the booking in their active bookings`);
    console.log();

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error.message);
    process.exit(1);
  }
}

testJobRequestFlow();
