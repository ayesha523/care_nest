import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getCompanions, requestCompanion } from "../services/marketplaceService";
import Navbar from "../components/Navbar";
import RealtimeChatWidget from "../components/RealtimeChatWidget";
import AdvancedChatBox from "../components/AdvancedChatBox";
import { getUserPreferences, PREFERENCES_UPDATED_EVENT } from "../utils/preferences";
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
  const [elderlyProfilePicture, setElderlyProfilePicture] = useState("");
  const [emergencyContactsData, setEmergencyContactsData] = useState([]);
  const [maxRate, setMaxRate] = useState(80);
  const [minRating, setMinRating] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [companionSort, setCompanionSort] = useState("rating");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [preferences, setPreferences] = useState(() => getUserPreferences());

  const userId =
    user?.id ||
    user?._id ||
    JSON.parse(localStorage.getItem("user") || "null")?.id ||
    JSON.parse(localStorage.getItem("user") || "null")?._id ||
    "";

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(preferences.locale || "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: preferences.timeZone || "UTC",
      }),
    [preferences.locale, preferences.timeZone]
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(preferences.locale || "en-US", {
        timeStyle: "short",
        timeZone: preferences.timeZone || "UTC",
      }),
    [preferences.locale, preferences.timeZone]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(preferences.locale || "en-US", {
        style: "currency",
        currency: preferences.currency || "USD",
        maximumFractionDigits: 0,
      }),
    [preferences.currency, preferences.locale]
  );

  const formatDateTime = useCallback(
    (value) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "-" : dateTimeFormatter.format(date);
    },
    [dateTimeFormatter]
  );

  const formatCurrency = useCallback(
    (value) => currencyFormatter.format(Number(value || 0)),
    [currencyFormatter]
  );

  const getCompanionId = useCallback((companion) => {
    const rawId = companion?.id || companion?._id;
    return typeof rawId === "string" ? rawId : "";
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const token = localStorage.getItem("token") || localStorage.getItem("carenest_token");

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

      try {
        const healthResponse = await fetch(`/api/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          const profile = healthData.user || {};
          setHealthConditions(profile.healthConditions || []);
          setMedications(profile.medications || []);
          setElderlyProfilePicture(profile.profilePicture || "");
        }
      } catch (err) {
        console.error("Error fetching health data:", err);
      }

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
      setLastUpdatedAt(new Date());
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const syncPreferences = () => setPreferences(getUserPreferences());
    window.addEventListener(PREFERENCES_UPDATED_EVENT, syncPreferences);
    window.addEventListener("storage", syncPreferences);
    return () => {
      window.removeEventListener(PREFERENCES_UPDATED_EVENT, syncPreferences);
      window.removeEventListener("storage", syncPreferences);
    };
  }, []);

  const openChatWith = async (otherUserId, userData) => {
    const token = localStorage.getItem("token") || localStorage.getItem("carenest_token");
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

  const chatContacts = useMemo(
    () =>
      companions
        .map((companion) => ({
        id: getCompanionId(companion),
        name: companion.name || "Companion",
        subtitle: companion.specializations?.[0] || "Care companion",
      }))
        .filter((contact) => Boolean(contact.id)),
    [companions, getCompanionId]
  );

  const handleFilter = (e) => {
    const query = e.target.value.toLowerCase();
    setFilter(query);

    const next = companions.filter(
      (c) =>
        String(c.name || "").toLowerCase().includes(query) ||
        (c.specializations || []).some((s) => String(s || "").toLowerCase().includes(query)) ||
        (c.bio || "").toLowerCase().includes(query)
    );
    setFilteredCompanions(next);
  };

  const scrollToSection = useCallback((sectionId) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const visibleCompanions = useMemo(() => {
    return filteredCompanions
      .filter((companion) => {
        const rate = Number(companion.hourlyRate || 0);
        const rating = Number(companion.rating || 0);
        if (rate > Number(maxRate)) return false;
        if (rating < Number(minRating)) return false;
        if (onlyVerified && !companion.verified) return false;
        return true;
      })
      .sort((a, b) => {
        if (companionSort === "rate-asc") {
          return Number(a.hourlyRate || 0) - Number(b.hourlyRate || 0);
        }
        if (companionSort === "rate-desc") {
          return Number(b.hourlyRate || 0) - Number(a.hourlyRate || 0);
        }
        if (companionSort === "experience") {
          return Number(b.reviews || 0) - Number(a.reviews || 0);
        }
        return Number(b.rating || 0) - Number(a.rating || 0);
      });
  }, [companionSort, filteredCompanions, maxRate, minRating, onlyVerified]);

  const actionItems = useMemo(() => {
    const items = [];

    if (!hasCheckedInToday) {
      items.push({
        id: "checkin",
        level: "high",
        title: "Complete today's wellness check-in",
        detail: "A daily check-in improves care visibility for companions and family.",
        cta: "Open check-in",
        onClick: () => navigate("/daily-checkin"),
      });
    }

    if (emergencyContactsData.length === 0) {
      items.push({
        id: "emergency",
        level: "high",
        title: "Add an emergency contact",
        detail: "Emergency contacts are critical for urgent care scenarios.",
        cta: "Add contacts",
        onClick: () => navigate("/emergency-contacts"),
      });
    }

    if (upcomingBookings.length === 0) {
      items.push({
        id: "booking",
        level: "medium",
        title: "No upcoming visits scheduled",
        detail: "Book a companion to maintain continuity in your care routine.",
        cta: "Find companions",
        onClick: () => scrollToSection("elderly-find"),
      });
    }

    if (healthConditions.length === 0 || medications.length === 0) {
      items.push({
        id: "profile-health",
        level: "medium",
        title: "Complete health profile details",
        detail: "Health conditions and medications improve matching and care quality.",
        cta: "Update profile",
        onClick: () => navigate("/profile-edit"),
      });
    }

    if (unreadNotifications > 0) {
      items.push({
        id: "alerts",
        level: "low",
        title: `${unreadNotifications} unread notifications`,
        detail: "Review alerts to stay updated with care requests and messages.",
        cta: "Open alerts",
        onClick: () => navigate("/notifications"),
      });
    }

    return items.slice(0, 4);
  }, [
    emergencyContactsData.length,
    hasCheckedInToday,
    healthConditions.length,
    medications.length,
    navigate,
    scrollToSection,
    unreadNotifications,
    upcomingBookings.length,
  ]);

  const handleRequestCompanion = async () => {
    setRequestError("");
    setRequestSuccess("");

    if (!selectedCompanion) {
      setRequestError("Please select a companion first.");
      return;
    }

    const companionId = getCompanionId(selectedCompanion);
    if (!companionId) {
      setRequestError("Unable to send request: selected companion has no valid ID.");
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
    try {
      const response = await requestCompanion(companionId, {
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
    } catch (error) {
      setRequestError("Failed to send request.");
    } finally {
      setLoadingRequest(false);
    }
  };

  const recommendedCompanions = useMemo(() => {
    if (!healthConditions.length) return [];

    return filteredCompanions
      .filter((c) => {
        const companionSpecs = (c.specializations || []).map((s) => s.toLowerCase());
        return healthConditions.some((condition) =>
          String(condition || "") &&
          companionSpecs.some(
            (spec) =>
              String(condition).toLowerCase().includes(spec) ||
              spec.includes(String(condition).toLowerCase())
          )
        );
      })
      .slice(0, 3);
  }, [filteredCompanions, healthConditions]);

  return (
    <>
      <Navbar />
      <div className="dashboard-shell elderly-theme">
        {activeChatUser && activeChatConversation && (
          <div
            className="modal-chatbox-overlay"
            onClick={() => {
              setActiveChatUser(null);
              setActiveChatConversation(null);
            }}
          >
            <div className="modal-chatbox-wrapper" onClick={(e) => e.stopPropagation()}>
              <AdvancedChatBox
                otherUser={activeChatUser}
                currentUser={user}
                conversationId={activeChatConversation}
                onClose={() => {
                  setActiveChatUser(null);
                  setActiveChatConversation(null);
                }}
              />
            </div>
          </div>
        )}

        <header className="dashboard-hero-card">
          <div>
            <p className="dashboard-eyebrow">👵 Elder Care Command Center</p>
            <h1>Welcome back, {user?.name || "Elderly Member"}</h1>
            <p>
              Your personalized care dashboard with companion search, live messaging,
              and health tracking in one place.
            </p>
          </div>
          <div className="hero-avatar-block">
            <img
              className="hero-avatar"
              src={elderlyProfilePicture || "https://ui-avatars.com/api/?background=115b4c&color=fff&name=Elderly"}
              alt={user?.name || "Elderly Member"}
            />
            <button className="btn-ghost btn-small" onClick={() => navigate("/profile-edit")}>Update photo</button>
          </div>
          <div className="hero-actions">
            <button className="action-btn" onClick={fetchDashboardData} title="Refresh dashboard">🔄 Refresh</button>
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

        <section className="dashboard-meta-row">
          <p className="meta-text">
            Last sync: {lastUpdatedAt ? timeFormatter.format(lastUpdatedAt) : "Not synced yet"}
          </p>
          <p className="meta-text meta-text-highlight">
            Safety status: {hasCheckedInToday && emergencyContactsData.length > 0 ? "Protected" : "Action needed"}
          </p>
        </section>

        <section className="stats-band">
          <article className="stat-tile">
            <span className="label">⏱️ Care Hours</span>
            <strong>{stats.totalHours}h</strong>
          </article>
          <article className="stat-tile">
            <span className="label">💰 Total Spend</span>
            <strong>{formatCurrency(stats.totalSpent)}</strong>
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
              <strong>{visibleCompanions.length > 0 ? "High" : "Low"}</strong>
            </article>
            <article className="insight-card">
              <span>Health Follow-up</span>
              <strong>{hasCheckedInToday ? "On Track" : "Pending"}</strong>
            </article>
          </div>
        </section>

        <section className="panel-card action-center-card">
          <div className="panel-head">
            <h2>🎯 Action Center</h2>
            <span className="badge-count">{actionItems.length}</span>
          </div>
          {actionItems.length === 0 ? (
            <p className="panel-empty">Everything is up to date. Great work staying on top of your care plan.</p>
          ) : (
            <div className="action-list">
              {actionItems.map((item) => (
                <article key={item.id} className={`action-item ${item.level}`}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <button className="btn-primary btn-small" onClick={item.onClick}>{item.cta}</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="elderly-upcoming" className="dashboard-grid two-column">
          <article className="panel-card">
            <div className="panel-head">
              <h2>📅 Upcoming Care Visits</h2>
              <span className="badge-count">{upcomingBookings.length}</span>
            </div>
            {upcomingBookings.length === 0 ? (
              <p className="panel-empty">No upcoming bookings yet. Schedule one now!</p>
            ) : (
              <div className="timeline-list">
                {upcomingBookings.map((booking) => (
                  <div key={booking._id} className="timeline-item">
                    <div className="timeline-content">
                      <div className="avatar-row">
                        <img
                          className="entity-avatar"
                          src={
                            booking.companionId?.profilePicture ||
                            "https://ui-avatars.com/api/?background=ecf4ef&color=115b4c&name=Companion"
                          }
                          alt={booking.companionId?.name || "Companion"}
                        />
                        <strong>{booking.companionId?.name || "Companion"}</strong>
                      </div>
                      <p>{formatDateTime(booking.startDate)}</p>
                    </div>
                    <div className="timeline-actions">
                      <span className={`status-chip ${booking.status}`}>{booking.status}</span>
                      <button
                        className="btn-ghost btn-small"
                        onClick={() =>
                          openChatWith(
                            booking.companionId?._id || booking.companionId?.id || "",
                            booking.companionId
                          )
                        }
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

          <RealtimeChatWidget currentUser={user} contacts={chatContacts} title="💬 Active Conversations" />
        </section>

        <section id="elderly-find" className="panel-card">
          <div className="panel-head">
            <h2>🔍 Find a Companion</h2>
            <span className="badge-count">{visibleCompanions.length}</span>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name, specialization, or bio..."
              value={filter}
              onChange={handleFilter}
            />
          </div>

          <div className="filter-toolbar">
            <label>
              Max rate
              <input
                type="range"
                min="10"
                max="120"
                value={maxRate}
                onChange={(e) => setMaxRate(Number(e.target.value))}
              />
              <span>${maxRate}/hr</span>
            </label>
            <label>
              Min rating
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                <option value="0">Any</option>
                <option value="3">3.0+</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
              </select>
            </label>
            <label>
              Sort by
              <select value={companionSort} onChange={(e) => setCompanionSort(e.target.value)}>
                <option value="rating">Top rated</option>
                <option value="experience">Most reviewed</option>
                <option value="rate-asc">Lowest rate</option>
                <option value="rate-desc">Highest rate</option>
              </select>
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
              />
              Verified only
            </label>
          </div>

          {loading ? (
            <p className="panel-empty">Loading companions...</p>
          ) : visibleCompanions.length === 0 ? (
            <p className="panel-empty">No companions match your current filters. Try broadening your criteria.</p>
          ) : (
            <div className="cards-grid">
              {visibleCompanions.map((companion) => (
                <article
                  key={getCompanionId(companion) || companion.email || companion.name}
                  className="profile-card companion-card"
                >
                  <div className="profile-head">
                    <div className="avatar-row">
                      <img
                        className="entity-avatar"
                        src={
                          companion.profilePicture ||
                          "https://ui-avatars.com/api/?background=ecf4ef&color=115b4c&name=Companion"
                        }
                        alt={companion.name}
                      />
                      <h3>{companion.name}</h3>
                    </div>
                    {companion.verified && <span className="verified-tag">✔ Verified</span>}
                  </div>

                  <p className="muted-text">{companion.bio}</p>

                  <div className="card-meta">
                    <p><strong>Skills:</strong> {(companion.specializations || []).join(", ")}</p>
                    <p><strong>Rate:</strong> {formatCurrency(companion.hourlyRate)}/hr</p>
                    <p><strong>Rating:</strong> ⭐ {companion.rating} ({companion.reviews} reviews)</p>
                  </div>

                  <div className="request-actions">
                    <button className="btn-primary" onClick={() => setSelectedCompanion(companion)} title="Request this companion">
                      📝 Request
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => navigate(`/booking/${getCompanionId(companion)}`)}
                      title="Book companion"
                      disabled={!getCompanionId(companion)}
                    >
                      📅 Book
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => openChatWith(getCompanionId(companion), companion)}
                      title="Chat"
                      disabled={!getCompanionId(companion)}
                    >
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
                <button className="btn-cancel" onClick={() => setSelectedCompanion(null)}>
                  Cancel
                </button>
                <button className="btn-submit" onClick={handleRequestCompanion} disabled={loadingRequest}>
                  {loadingRequest ? "Sending..." : "✉️ Send Request"}
                </button>
              </div>
            </div>
          </div>
        )}

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

        <section id="elderly-emergency" className="panel-card">
          <div className="panel-head">
            <h2>🚨 Emergency Contacts</h2>
            <span className="badge-health">{emergencyContactsData.length}</span>
          </div>
          {emergencyContactsData.length === 0 ? (
            <p className="panel-empty">
              No emergency contacts added.
              <button className="link-btn" onClick={() => navigate("/emergency-contacts")} style={{ marginLeft: "8px" }}>
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
                  {contact.email && (
                    <p><strong>Email:</strong> <a href={`mailto:${contact.email}`}>{contact.email}</a></p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="elderly-recommend" className="panel-card">
          <div className="panel-head">
            <h2>✨ Recommended Companions for Your Conditions</h2>
          </div>
          {healthConditions.length === 0 ? (
            <p className="panel-empty">Add your health conditions to get personalized companion recommendations.</p>
          ) : (
            <div className="cards-grid">
              {recommendedCompanions.map((companion) => (
                <article
                  key={getCompanionId(companion) || companion.email || companion.name}
                  className="profile-card recommendation-card"
                >
                  <div className="recommendation-badge">⭐ Recommended Match</div>
                  <div className="profile-head">
                    <div className="avatar-row">
                      <img
                        className="entity-avatar"
                        src={
                          companion.profilePicture ||
                          "https://ui-avatars.com/api/?background=ecf4ef&color=115b4c&name=Companion"
                        }
                        alt={companion.name}
                      />
                      <h3>{companion.name}</h3>
                    </div>
                    {companion.verified && <span className="verified-tag">✔ Verified</span>}
                  </div>
                  <p className="muted-text">{companion.bio}</p>
                  <div className="card-meta">
                    <p><strong>Specialties:</strong> {(companion.specializations || []).join(", ")}</p>
                    <p><strong>Rate:</strong> {formatCurrency(companion.hourlyRate)}/hr</p>
                    <p><strong>Rating:</strong> ⭐ {companion.rating}</p>
                  </div>
                  <div className="request-actions">
                    <button className="btn-primary" onClick={() => setSelectedCompanion(companion)}>
                      📝 Request
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => openChatWith(getCompanionId(companion), companion)}
                      disabled={!getCompanionId(companion)}
                    >
                      💬 Chat
                    </button>
                  </div>
                </article>
              ))}
              {recommendedCompanions.length === 0 && (
                <p className="panel-empty">No condition-specific matches yet. Use search filters to find a suitable companion manually.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default ElderlyDashboard;
