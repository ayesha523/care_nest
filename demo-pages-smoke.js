const BASE_URL = "http://localhost:5000";

const DEMO_USERS = {
  elderly: {
    name: "Demo Elderly",
    email: "elderly@demo.com",
    password: "Password123!",
    role: "elderly",
  },
  companion: {
    name: "Demo Companion",
    email: "companion@demo.com",
    password: "Password123!",
    role: "companion",
  },
};

const results = [];

function pushResult(page, action, ok, status, detail = "") {
  results.push({ page, action, ok, status, detail });
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { response, body };
}

async function ensureUser(user) {
  const signup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (signup.response.ok && signup.body?.data?.token) {
    return signup.body.data;
  }

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password, role: user.role }),
  });

  if (!login.response.ok || !login.body?.data?.token) {
    const message = login.body?.message || signup.body?.message || "Auth failed";
    throw new Error(`${user.role} auth failed: ${message}`);
  }

  return login.body.data;
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function run() {
  console.log("Running demo account smoke test across page APIs...\n");

  const elderlyAuth = await ensureUser(DEMO_USERS.elderly);
  const companionAuth = await ensureUser(DEMO_USERS.companion);

  const elderlyId = elderlyAuth.user.id;
  const companionId = companionAuth.user.id;

  // SearchCompanions page
  {
    const { response } = await request("/api/search/companions");
    pushResult("SearchCompanions", "GET /api/search/companions", response.ok, response.status);
  }

  // ProfileView page
  {
    const a = await request(`/api/profile/${companionId}`);
    pushResult("ProfileView", "GET /api/profile/:userId", a.response.ok, a.response.status);

    const b = await request(`/api/reviews/companion/${companionId}`);
    pushResult("ProfileView", "GET /api/reviews/companion/:companionId", b.response.ok, b.response.status);
  }

  // ProfileEdit page (elderly)
  {
    const a = await request(`/api/profile/${elderlyId}`);
    pushResult("ProfileEdit", "GET /api/profile/:userId", a.response.ok, a.response.status);

    const b = await request(`/api/profile/${elderlyId}`, {
      method: "PUT",
      headers: authHeaders(elderlyAuth.token),
      body: JSON.stringify({ bio: `Smoke test update ${new Date().toISOString()}` }),
    });
    pushResult("ProfileEdit", "PUT /api/profile/:userId", b.response.ok, b.response.status);
  }

  // BookingPage page
  let bookingId = "";
  {
    const a = await request(`/api/profile/${companionId}`);
    pushResult("BookingPage", "GET /api/profile/:companionId", a.response.ok, a.response.status);

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const b = await request("/api/bookings", {
      method: "POST",
      headers: authHeaders(elderlyAuth.token),
      body: JSON.stringify({
        companionId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        startTime: "10:00",
        endTime: "12:00",
        duration: 2,
        services: ["companionship"],
        notes: "Smoke test booking",
      }),
    });
    bookingId = b.body?.booking?._id || "";
    pushResult("BookingPage", "POST /api/bookings", b.response.ok, b.response.status, bookingId ? "booking created" : "no booking id");
  }

  // ChatPage page
  let conversationId = "";
  {
    const a = await request("/api/messages/conversations", {
      method: "POST",
      headers: authHeaders(elderlyAuth.token),
      body: JSON.stringify({ otherUserId: companionId, bookingId: bookingId || undefined }),
    });
    conversationId = a.body?.conversation?._id || "";
    pushResult("ChatPage", "POST /api/messages/conversations", a.response.ok, a.response.status, conversationId ? "conversation ready" : "no conversation id");

    if (conversationId) {
      const b = await request(`/api/messages/${conversationId}`, {
        method: "GET",
        headers: authHeaders(elderlyAuth.token),
      });
      pushResult("ChatPage", "GET /api/messages/:conversationId", b.response.ok, b.response.status);

      const c = await request(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: authHeaders(elderlyAuth.token),
        body: JSON.stringify({ content: "Smoke test message" }),
      });
      pushResult("ChatPage", "POST /api/messages/:conversationId", c.response.ok, c.response.status);
    }
  }

  // ReviewPage page
  {
    const a = await request(`/api/profile/${companionId}`);
    pushResult("ReviewPage", "GET /api/profile/:companionId", a.response.ok, a.response.status);

    const b = await request("/api/reviews", {
      method: "POST",
      headers: authHeaders(elderlyAuth.token),
      body: JSON.stringify({
        companionId,
        rating: 5,
        comment: "Great companion from smoke test",
        categories: { punctuality: 5, professionalism: 5, friendliness: 5 },
      }),
    });
    pushResult("ReviewPage", "POST /api/reviews", b.response.ok, b.response.status);
  }

  // AvailabilityManagement page
  let availabilityId = "";
  {
    const a = await request("/api/availability/me/all", {
      method: "GET",
      headers: authHeaders(companionAuth.token),
    });
    pushResult("AvailabilityManagement", "GET /api/availability/me/all", a.response.ok, a.response.status);

    const b = await request("/api/availability", {
      method: "POST",
      headers: authHeaders(companionAuth.token),
      body: JSON.stringify({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "11:00",
        isRecurring: true,
      }),
    });
    availabilityId = b.body?.availability?._id || "";
    pushResult("AvailabilityManagement", "POST /api/availability", b.response.ok, b.response.status);

    if (availabilityId) {
      const c = await request(`/api/availability/${availabilityId}`, {
        method: "DELETE",
        headers: authHeaders(companionAuth.token),
      });
      pushResult("AvailabilityManagement", "DELETE /api/availability/:id", c.response.ok, c.response.status);
    }
  }

  // MoodTracker page
  {
    const a = await request("/api/mood/me/all", {
      method: "GET",
      headers: authHeaders(elderlyAuth.token),
    });
    pushResult("MoodTracker", "GET /api/mood/me/all", a.response.ok, a.response.status);

    const b = await request("/api/mood", {
      method: "POST",
      headers: authHeaders(elderlyAuth.token),
      body: JSON.stringify({ mood: "happy", moodScore: 4, notes: "Smoke test mood" }),
    });
    pushResult("MoodTracker", "POST /api/mood", b.response.ok, b.response.status);
  }

  // DailyCheckIn page
  {
    const a = await request("/api/daily-checkin", {
      method: "POST",
      headers: authHeaders(elderlyAuth.token),
      body: JSON.stringify({ status: "good", notes: "Smoke test check-in" }),
    });
    pushResult("DailyCheckIn", "POST /api/daily-checkin", a.response.ok, a.response.status);
  }

  // NotificationsPage page
  {
    const a = await request("/api/notifications", {
      method: "GET",
      headers: authHeaders(elderlyAuth.token),
    });
    pushResult("NotificationsPage", "GET /api/notifications", a.response.ok, a.response.status);

    const b = await request("/api/notifications/read-all", {
      method: "PUT",
      headers: authHeaders(elderlyAuth.token),
      body: JSON.stringify({}),
    });
    pushResult("NotificationsPage", "PUT /api/notifications/read-all", b.response.ok, b.response.status);
  }

  // EmergencyContacts page
  {
    const a = await request("/api/emergency-contacts", {
      method: "POST",
      headers: authHeaders(elderlyAuth.token),
      body: JSON.stringify({
        name: "Emergency Contact",
        phone: "1234567890",
        relationship: "Family",
        address: "Demo Address",
        notes: "Smoke test",
      }),
    });
    pushResult("EmergencyContacts", "POST /api/emergency-contacts", a.response.ok, a.response.status);
  }

  const failed = results.filter((r) => !r.ok);

  console.table(results);
  console.log(`\nTotal checks: ${results.length}`);
  console.log(`Passed: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailures:");
    for (const f of failed) {
      console.log(`- [${f.page}] ${f.action} -> ${f.status} ${f.detail ? `(${f.detail})` : ""}`);
    }
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Smoke test crashed:", error.message);
  process.exit(1);
});
