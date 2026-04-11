import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "../context/UserContext";
import { getCompanions, requestCompanion } from "../services/marketplaceService";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import RealtimeChatWidget from "../components/RealtimeChatWidget";
import AdvancedChatBox from "../components/AdvancedChatBox";
import "../styles/dashboard.css";
import "../styles/advanced-chatbox.css";

function ElderlyDashboard() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [companions, setCompanions] = useState([]);
  const [filteredCompanions, setFilteredCompanions] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [stats, setStats] = useState({ totalHours: 0, totalSpent: 0, totalBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedCompanion, setSelectedCompanion] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState(12);
  const [startDate, setStartDate] = useState("");
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [activeChatConversation, setActiveChatConversation] = useState(null);
  const [healthConditions, setHealthConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [emergencyContactsData, setEmergencyContactsData] = useState([]);

  const userId =
    user?.id ||
    user?._id ||
    JSON.parse(localStorage.getItem("user") || "null")?.id ||
    JSON.parse(localStorage.getItem("user") || "null")?._id ||
    "";

  const fetchDashboardData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const companionsResponse = await getCompanions();
      if (companionsResponse.success) {
        const list = companionsResponse.data || [];
        setCompanions(list);
        setFilteredCompanions(list);
      }

      const bookingsResponse = await fetch(`/api/bookings/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        const allBookings = bookingsData.bookings || [];
        const upcoming = allBookings.filter(
          (booking) =>
            new Date(booking.startDate) > new Date() &&
            ["confirmed", "pending", "in-progress"].includes(booking.status)
        );

        setUpcomingBookings(upcoming.slice(0, 3));
        setStats({
          totalHours: allBookings.reduce((sum, b) => sum + (b.duration || 0), 0),
          totalSpent: allBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0),
          totalBookings: allBookings.length,
        });
      }

      const notificationsResponse = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setUnreadNotifications(notificationsData.unreadCount || 0);
      }

      const checkinResponse = await fetch("/api/daily-checkin/today/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkinResponse.ok) {
        const checkinData = await checkinResponse.json();
        setHasCheckedInToday(!!checkinData.hasCheckedIn);
      }

      // Fetch health conditions
      try {
        const healthResponse = await fetch(`/api/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          const profile = healthData.user || {};
          setHealthConditions(profile.healthConditions || []);
          setMedications(profile.medications || []);
        }
      } catch (err) {
        console.error("Error fetching health data:", err);
      }

      // Fetch emergency contacts
      try {
        const emergencyResponse = await fetch("/api/emergency-contacts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (emergencyResponse.ok) {
          const emergencyData = await emergencyResponse.json();
          setEmergencyContactsData(emergencyData.contacts || []);
        }
      } catch (err) {
        console.error("Error fetching emergency contacts:", err);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const openChatWith = async (otherUserId, userData) => {
    const token = localStorage.getItem("token");
    if (!otherUserId || !token) return;

    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otherUserId }),
      });

      const data = await response.json();
      if (data.success && data.conversation?._id) {
        setActiveChatUser(userData || { id: otherUserId, name: "User" });
        setActiveChatConversation(data.conversation._id);
      }
    } catch (error) {
      console.error("Unable to open conversation:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const chatContacts = useMemo(
    () =>
      companions.map((companion) => ({
        id: companion.id,
        name: companion.name,
        subtitle: `${companion.specializations?.[0] || "Care companion"}`,
      })),
    [companions]
  );

  const handleFilter = (e) => {
    const query = e.target.value.toLowerCase();
    setFilter(query);

    const filtered = companions.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.specializations || []).some((s) => s.toLowerCase().includes(query)) ||
        (c.bio || "").toLowerCase().includes(query)
    );
    setFilteredCompanions(filtered);
  };

  const handleRequestCompanion = async () => {
    setRequestError("");
    setRequestSuccess("");

    // Validation with specific error messages
    if (!selectedCompanion) {
      setRequestError("Please select a companion first.");
      return;
    }

    if (!startDate) {
      setRequestError("Please select a preferred start date.");
      return;
    }

    if (!requestMessage || requestMessage.trim().length === 0) {
      setRequestError("Please describe your care needs and preferences.");
      return;
    }

    if (Number(hoursPerWeek) <= 0 || Number(hoursPerWeek) > 168) {
      setRequestError("Please enter valid hours per week (1-168).");
      return;
    }

    setLoadingRequest(true);
    const response = await requestCompanion(selectedCompanion.id, {
      specializations: selectedCompanion.specializations?.length
        ? [selectedCompanion.specializations[0]]
        : ["general care"],
      hoursPerWeek: Number(hoursPerWeek),
      hourlyRate: Number(selectedCompanion.hourlyRate || 0),
      startDate,
      description: requestMessage,
      message: requestMessage,
    });

    if (response.success) {
      setRequestSuccess("Request sent successfully!");
      setTimeout(() => {
        setSelectedCompanion(null);
        setRequestMessage("");
        setHoursPerWeek(12);
        setStartDate("");
        fetchDashboardData();
      }, 1500);
    } else {
      setRequestError(response.error || "Failed to send request.");
    }

    setLoadingRequest(false);
  };

  const scrollToSection = (sectionId) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-shell elderly-theme">
      {/* Active Chat Modal */}
      {activeChatUser && activeChatConversation && (
        <div className="modal-chatbox-overlay" onClick={() => { setActiveChatUser(null); setActiveChatConversation(null); }}>
          <div className="modal-chatbox-wrapper" onClick={(e) => e.stopPropagation()}>
            <AdvancedChatBox
              otherUser={activeChatUser}
              currentUser={user}
              conversationId={activeChatConversation}
              onClose={() => { setActiveChatUser(null); setActiveChatConversation(null); }}
            />
          </div>
        </div>
      )}

      <header className="dashboard-hero-card">
        <div>
          <p className="dashboard-eyebrow">👵 Elder Care Command Center</p>
          <h1>Welcome back, {user?.name || "Elderly Member"}</h1>
          <p>
            Your personalized care dashboard with companion search, live messaging, and health tracking in one place.
          </p>
        </div>
        <div className="hero-actions">
          <button className="action-btn" onClick={() => navigate("/mood-tracker")} title="Track mood">😊 Mood</button>
          <button className="action-btn" onClick={() => navigate("/daily-checkin")} title="Daily check-in">✅ Check-In</button>
          <button className="action-btn" onClick={() => navigate("/emergency-contacts")} title="Emergency contacts">🆘 Emergency</button>
          <button
            className="action-btn action-btn-logout"
            onClick={() => {
              logout();
              navigate("/");
            }}
            title="Logout"
          >
            🚪 Logout
          </button>
        </div>
      </header>

      <section className="stats-band">
        <article className="stat-tile">
          <span className="label">⏱️ Care Hours</span>
          <strong>{stats.totalHours}h</strong>
        </article>
        <article className="stat-tile">
          <span className="label">💰 Total Spend</span>
          <strong>${stats.totalSpent.toFixed(0)}</strong>
        </article>
        <article className="stat-tile">
          <span className="label">📅 Bookings</span>
          <strong>{stats.totalBookings}</strong>
        </article>
        <article className="stat-tile">
          <span className="label">📢 Alerts</span>
          <strong>{unreadNotifications}</strong>
        </article>
        <article className="stat-tile">
          <span className="label">✓ Check-In</span>
          <strong>{hasCheckedInToday ? "✅" : "⏳"}</strong>
        </article>
      </section>

      <section className="smart-nav-strip">
        <div className="section-pills">
          <button className="section-pill" onClick={() => scrollToSection("elderly-upcoming")}>Upcoming</button>
          <button className="section-pill" onClick={() => scrollToSection("elderly-find")}>Find Companion</button>
          <button className="section-pill" onClick={() => scrollToSection("elderly-health")}>Health</button>
          <button className="section-pill" onClick={() => scrollToSection("elderly-emergency")}>Emergency</button>
          <button className="section-pill" onClick={() => scrollToSection("elderly-recommend")}>Recommendations</button>
        </div>
        <div className="insight-strip">
          <article className="insight-card">
            <span>Weekly Care Plan</span>
            <strong>{Math.min(100, Math.round((stats.totalHours / 20) * 100))}%</strong>
          </article>
          <article className="insight-card">
            <span>Companion Response</span>
            <strong>{filteredCompanions.length > 0 ? "High" : "Low"}</strong>
          </article>
          <article className="insight-card">
            <span>Health Follow-up</span>
            <strong>{hasCheckedInToday ? "On Track" : "Pending"}</strong>
          </article>
        </div>
      </section>

      <section id="elderly-upcoming" className="dashboard-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>📅 Upcoming Visits</h2>
            <span className="badge-count">{upcomingBookings.length}</span>
          </div>

          {upcomingBookings.length === 0 ? (
            <p className="panel-empty">No upcoming bookings. Schedule one now!</p>
          ) : (
            <div className="timeline-list">
              {upcomingBookings.map((booking) => (
                <div key={booking._id} className="timeline-item">
                  <div className="timeline-content">
                    <strong>{booking.companionId?.name || "Companion"}</strong>
                    <p>{new Date(booking.startDate).toLocaleString()}</p>
                  </div>
                  <div className="timeline-actions">
                    <span className={`status-chip ${booking.status}`}>{booking.status}</span>
                    <button
                      className="btn-ghost btn-small"
                      onClick={() => openChatWith(booking.companionId?._id, booking.companionId)}
                      title="Chat with companion"
                    >
                      💬
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <RealtimeChatWidget
          currentUser={user}
          contacts={chatContacts}
          title="💬 Active Conversations"
        />
      </section>

      <section id="elderly-find" className="panel-card">
        <div className="panel-head">
          <h2>🔍 Find a Companion</h2>
          <span className="badge-count">{filteredCompanions.length}</span>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, specialization, or bio..."
            value={filter}
            onChange={handleFilter}
          />
        </div>

        {loading ? (
          <p className="panel-empty">Loading companions...</p>
        ) : filteredCompanions.length === 0 ? (
          <p className="panel-empty">No companions found matching your search.</p>
        ) : (
          <div className="cards-grid">
            {filteredCompanions.map((companion) => (
              <article key={companion.id} className="profile-card companion-card">
                <div className="profile-head">
                  <h3>{companion.name}</h3>
                  {companion.verified && <span className="verified-tag">✔ Verified</span>}
                </div>
                <p className="muted-text">{companion.bio}</p>
                <div className="card-meta">
                  <p><strong>Skills:</strong> {companion.specializations.join(", ")}</p>
                  <p><strong>Rate:</strong> ${companion.hourlyRate}/hr</p>
                  <p><strong>Rating:</strong> ⭐ {companion.rating} ({companion.reviews} reviews)</p>
                </div>
                <div className="request-actions">
                  <button className="btn-primary" onClick={() => setSelectedCompanion(companion)} title="Request this companion">
                    📝 Request
                  </button>
                  <button className="btn-ghost" onClick={() => navigate(`/booking/${companion.id}`)} title="Book companion">
                    📅 Book
                  </button>
                  <button className="btn-ghost" onClick={() => openChatWith(companion.id, companion)} title="Chat">
                    💬
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedCompanion && (
        <div className="modal-overlay" onClick={() => setSelectedCompanion(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📋 Request {selectedCompanion.name}</h2>
            <p>Tell them about your care needs:</p>
            <label>
              Preferred Start Date *
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  // Validate date is in future
                  if (dateValue) {
                    const selectedDate = new Date(dateValue);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (selectedDate < today) {
                      setRequestError("Please select a future date");
                      return;
                    }
                    setStartDate(dateValue);
                    setRequestError("");
                  } else {
                    setStartDate("");
                  }
                }}
              />
            </label>
            <label>
              Hours Per Week *
              <input
                type="number"
                min="1"
                max="80"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
              />
            </label>
            <label>
              Care Requirements & Preferences *
              <textarea
                placeholder="Describe your care needs, preferences, and any specific requirements..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows="5"
              />
            </label>
            {requestError && <p className="form-error-inline">❌ {requestError}</p>}
            {requestSuccess && <p className="form-success-inline">✅ {requestSuccess}</p>}
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setSelectedCompanion(null)}
              >
                Cancel
              </button>
              <button className="btn-submit" onClick={handleRequestCompanion} disabled={loadingRequest}>
                {loadingRequest ? "Sending..." : "✉️ Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Health & Medical Information Section */}
      <section id="elderly-health" className="dashboard-grid two-column">
        <article className="panel-card health-card">
          <div className="panel-head">
            <h2>🏥 Health Conditions</h2>
            <span className="badge-health">{healthConditions.length}</span>
          </div>
          {healthConditions.length === 0 ? (
            <p className="panel-empty">No health conditions recorded. Add them in your profile.</p>
          ) : (
            <div className="health-list">
              {healthConditions.map((condition, idx) => (
                <div key={idx} className="health-item">
                  <span className="health-icon">🩹</span>
                  <span className="health-text">{condition}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel-card medication-card">
          <div className="panel-head">
            <h2>💊 Current Medications</h2>
            <span className="badge-health">{medications.length}</span>
          </div>
          {medications.length === 0 ? (
            <p className="panel-empty">No medications recorded. Add them in your profile.</p>
          ) : (
            <div className="medication-list">
              {medications.map((med, idx) => (
                <div key={idx} className="medication-item">
                  <span className="med-icon">⚕️</span>
                  <div className="med-details">
                    <strong>{med.name || med}</strong>
                    {med.dosage && <p className="med-dosage">{med.dosage}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {/* Emergency Contacts Section */}
      <section id="elderly-emergency" className="panel-card">
        <div className="panel-head">
          <h2>🚨 Emergency Contacts</h2>
          <span className="badge-health">{emergencyContactsData.length}</span>
        </div>
        {emergencyContactsData.length === 0 ? (
          <p className="panel-empty">
            No emergency contacts added. 
            <button className="link-btn" onClick={() => navigate("/emergency-contacts")} style={{marginLeft: '8px'}}>
              Add now →
            </button>
          </p>
        ) : (
          <div className="emergency-contacts-grid">
            {emergencyContactsData.map((contact, idx) => (
              <div key={idx} className="emergency-contact-card">
                <h4>{contact.name}</h4>
                <p><strong>Relationship:</strong> {contact.relationship}</p>
                <p><strong>Phone:</strong> <a href={`tel:${contact.phone}`}>{contact.phone}</a></p>
                {contact.email && <p><strong>Email:</strong> <a href={`mailto:${contact.email}`}>{contact.email}</a></p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Professional Companion Match Recommendations */}
      <section id="elderly-recommend" className="panel-card">
        <div className="panel-head">
          <h2>✨ Recommended Companions for Your Conditions</h2>
        </div>
        {healthConditions.length === 0 ? (
          <p className="panel-empty">Add your health conditions to get personalized companion recommendations.</p>
        ) : (
          <div className="cards-grid">
            {filteredCompanions
              .filter((c) => {
                const companionSpecs = (c.specializations || []).map(s => s.toLowerCase());
                return healthConditions.some(condition => 
                  companionSpecs.some(spec => condition.toLowerCase().includes(spec) || spec.includes(condition.toLowerCase()))
                );
              })
              .slice(0, 3)
              .map((companion) => (
                <article key={companion.id} className="profile-card recommendation-card">
                  <div className="recommendation-badge">⭐ Recommended Match</div>
                  <div className="profile-head">
                    <h3>{companion.name}</h3>
                    {companion.verified && <span className="verified-tag">✔ Verified</span>}
                  </div>
                  <p className="muted-text">{companion.bio}</p>
                  <div className="card-meta">
                    <p><strong>Specialties:</strong> {companion.specializations.join(", ")}</p>
                    <p><strong>Rate:</strong> ${companion.hourlyRate}/hr</p>
                    <p><strong>Rating:</strong> ⭐ {companion.rating}</p>
                  </div>
                  <div className="request-actions">
                    <button className="btn-primary" onClick={() => setSelectedCompanion(companion)}>
                      📝 Request
                    </button>
                    <button className="btn-ghost" onClick={() => openChatWith(companion.id, companion)}>
                      💬 Chat
                    </button>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>
      </div>
    </>
  );
}

export default ElderlyDashboard;
