import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "../context/UserContext";
import { getJobRequests, acceptJobRequest } from "../services/marketplaceService";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import RealtimeChatWidget from "../components/RealtimeChatWidget";
import AdvancedChatBox from "../components/AdvancedChatBox";
import "../styles/dashboard.css";
import "../styles/advanced-chatbox.css";

function CompanionDashboard() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({ totalHours: 0, totalEarnings: 0, totalBookings: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [activeChatConversation, setActiveChatConversation] = useState(null);
  const [expertise, setExpertise] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [companionBio, setCompanionBio] = useState("");

  const userId =
    user?.id ||
    user?._id ||
    JSON.parse(localStorage.getItem("user") || "null")?.id ||
    JSON.parse(localStorage.getItem("user") || "null")?._id ||
    "";

  const fetchCompanionDashboard = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await getJobRequests({ status: statusFilter });
      if (response.success) {
        setFilteredRequests(response.data || []);
      }

      const userResponse = await fetch(`/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const profile = userData.user || {};
        setStats({
          totalHours: profile.totalHours || 0,
          totalEarnings: profile.totalEarnings || 0,
          totalBookings: profile.totalBookings || 0,
          rating: profile.rating || 0,
        });
        setExpertise(profile.specializations || []);
        setCertifications(profile.certifications || []);
        setCompanionBio(profile.bio || "");
      }

      const badgesResponse = await fetch(`/api/badges/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (badgesResponse.ok) {
        const badgesData = await badgesResponse.json();
        setBadges(badgesData.badges || []);
      }

      const bookingsResponse = await fetch(`/api/bookings/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        const active = (bookingsData.bookings || []).filter((booking) =>
          ["pending", "confirmed", "in-progress"].includes(booking.status)
        );
        setRecentBookings(active.slice(0, 4));
      }

      const notificationsResponse = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setUnreadNotifications(notificationsData.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching companion dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, userId]);

  useEffect(() => {
    fetchCompanionDashboard();
  }, [fetchCompanionDashboard]);

  const chatContacts = useMemo(() => {
    const map = new Map();

    recentBookings.forEach((booking) => {
      const elderlyId = booking.elderlyId?._id;
      if (elderlyId) {
        map.set(elderlyId, {
          id: elderlyId,
          name: booking.elderlyId?.name || "Elderly Member",
          subtitle: booking.status || "booking",
        });
      }
    });

    filteredRequests.forEach((request) => {
      if (request.elderlyId) {
        map.set(request.elderlyId, {
          id: request.elderlyId,
          name: request.elderlyName || "Elderly Member",
          subtitle: request.status || "request",
        });
      }
    });

    return Array.from(map.values());
  }, [filteredRequests, recentBookings]);

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

  const handleAcceptRequest = async (requestId, request) => {
    setAcceptingId(requestId);
    const response = await acceptJobRequest(requestId);

    if (response.success) {
      if (request?.elderlyId) {
        // Open chat after accepting
        await openChatWith(request.elderlyId._id || request.elderlyId, {
          id: request.elderlyId._id || request.elderlyId,
          name: request.elderlyName || "Elderly Member"
        });
      }
      fetchCompanionDashboard();
    } else {
      alert(response.error || "Failed to accept request");
    }
    setAcceptingId(null);
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
      <div className="dashboard-shell companion-theme">
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
          <p className="dashboard-eyebrow">🩺 Companion Performance Hub</p>
          <h1>Welcome back, {user?.name || "Companion"}</h1>
          <p>
            Track your requests, manage active bookings, view achievements, and message elderly members in real-time.
          </p>
        </div>
        <div className="hero-actions">
          <button className="action-btn" onClick={() => navigate("/availability")} title="Manage availability">📅 Availability</button>
          <button className="action-btn" onClick={() => navigate("/profile-edit")} title="Edit profile">✏️ Profile</button>
          <button className="action-btn" onClick={() => navigate("/notifications")} title="View notifications">🔔 Alerts</button>
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
          <span className="label">⭐ Rating</span>
          <strong>{stats.rating.toFixed(1)}</strong>
        </article>
        <article className="stat-tile">
          <span className="label">⏱️ Total Hours</span>
          <strong>{stats.totalHours}h</strong>
        </article>
        <article className="stat-tile">
          <span className="label">💵 Earnings</span>
          <strong>${stats.totalEarnings.toFixed(0)}</strong>
        </article>
        <article className="stat-tile">
          <span className="label">📅 Bookings</span>
          <strong>{stats.totalBookings}</strong>
        </article>
        <article className="stat-tile">
          <span className="label">📢 Alerts</span>
          <strong>{unreadNotifications}</strong>
        </article>
      </section>

      <section className="smart-nav-strip">
        <div className="section-pills">
          <button className="section-pill" onClick={() => scrollToSection("companion-queue")}>Queue</button>
          <button className="section-pill" onClick={() => scrollToSection("companion-requests")}>Requests</button>
          <button className="section-pill" onClick={() => scrollToSection("companion-expertise")}>Expertise</button>
          <button className="section-pill" onClick={() => scrollToSection("companion-shifts")}>Shifts</button>
          <button className="section-pill" onClick={() => scrollToSection("companion-match")}>Matches</button>
        </div>
        <div className="insight-strip">
          <article className="insight-card">
            <span>Acceptance Flow</span>
            <strong>{filteredRequests.length > 0 ? "Active" : "Idle"}</strong>
          </article>
          <article className="insight-card">
            <span>Schedule Load</span>
            <strong>{recentBookings.length} Active</strong>
          </article>
          <article className="insight-card">
            <span>Profile Strength</span>
            <strong>{Math.min(100, 50 + expertise.length * 10)}%</strong>
          </article>
        </div>
      </section>

      <section id="companion-queue" className="dashboard-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>📋 Active Booking Queue</h2>
            <span className="badge-count">{recentBookings.length}</span>
          </div>
          {recentBookings.length === 0 ? (
            <p className="panel-empty">No active bookings yet. Accept some requests!</p>
          ) : (
            <div className="timeline-list">
              {recentBookings.map((booking) => (
                <div key={booking._id} className="timeline-item">
                  <div className="timeline-content">
                    <strong>{booking.elderlyId?.name || "Elderly Member"}</strong>
                    <p>{new Date(booking.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="timeline-actions">
                    <span className={`status-chip ${booking.status}`}>{booking.status}</span>
                    <button
                      className="btn-ghost btn-small"
                      onClick={() => openChatWith(booking.elderlyId?._id, booking.elderlyId)}
                      title="Chat with elderly member"
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
          title="💬 Quick Messages"
        />
      </section>

      {badges.length > 0 && (
        <section className="panel-card">
          <div className="panel-head">
            <h2>🏆 Achievement Badges</h2>
            <span className="badge-count">{badges.length}</span>
          </div>
          <div className="badge-list">
            {badges.map((badge, idx) => (
              <article key={idx} className="badge-pill" title={badge.badgeId?.description}>
                <div className="badge-icon">🎖️</div>
                <strong>{badge.badgeId?.name || "Badge"}</strong>
                <p>{badge.badgeId?.criteria || "Milestone"}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section id="companion-requests" className="panel-card">
        <div className="panel-head">
          <h2>📝 Job Requests</h2>
          <div className="status-filter">
            <label htmlFor="status-filter">Filter:</label>
            <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="open">🆕 Open</option>
              <option value="accepted">✅ Accepted</option>
              <option value="completed">🎉 Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="panel-empty">Loading job requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p className="panel-empty">No {statusFilter} requests right now.</p>
        ) : (
          <div className="cards-grid">
            {filteredRequests.map((request) => (
              <article key={request.id} className="profile-card request-card-advanced">
                <div className="profile-head">
                  <h3>{request.elderlyName}</h3>
                  <span className={`status-chip ${request.status}`}>{request.status}</span>
                </div>

                <div className="card-meta">
                  <p><strong>Skills:</strong> {(request.specializations || []).join(", ")}</p>
                  <p><strong>Hours/Week:</strong> {request.hoursPerWeek}h</p>
                  <p><strong>Rate:</strong> ${request.hourlyRate}/hr</p>
                  <p><strong>Start:</strong> {new Date(request.startDate).toLocaleDateString()}</p>
                </div>
                <p className="muted-text">{request.description}</p>

                <div className="request-actions">
                  {request.status === "open" && (
                    <button
                      className="btn-primary"
                      onClick={() => handleAcceptRequest(request.id, request)}
                      disabled={acceptingId === request.id}
                      title="Accept this job"
                    >
                      {acceptingId === request.id ? "⏳ Accepting..." : "✅ Accept"}
                    </button>
                  )}
                  <button 
                    className="btn-ghost" 
                    onClick={() => setSelectedRequest(request)}
                    title="View full details"
                  >
                    📄 Details
                  </button>
                  <button 
                    className="btn-ghost" 
                    onClick={() => openChatWith(request.elderlyId._id || request.elderlyId, { name: request.elderlyName, id: request.elderlyId })}
                    title="Chat with elderly member"
                  >
                    💬
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📋 Request Details - {selectedRequest.elderlyName}</h2>
            <div className="modal-details">
              <p>
                <strong>📌 Specializations Needed:</strong>{" "}
                {selectedRequest.specializations.join(", ")}
              </p>
              <p>
                <strong>⏱️ Hours Per Week:</strong> {selectedRequest.hoursPerWeek} hours
              </p>
              <p>
                <strong>💰 Hourly Rate:</strong> ${selectedRequest.hourlyRate}/hour
              </p>
              <p>
                <strong>📅 Start Date:</strong>{" "}
                {new Date(selectedRequest.startDate).toLocaleDateString()}
              </p>
              <p>
                <strong>📝 Care Description:</strong>
              </p>
              <p className="description-text">{selectedRequest.description}</p>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
              {selectedRequest.status === "open" && (
                <button
                  className="btn-submit"
                  onClick={() => {
                    handleAcceptRequest(selectedRequest.id, selectedRequest);
                    setSelectedRequest(null);
                  }}
                >
                  ✅ Accept Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Professional Expertise & Qualifications Section */}
      <section id="companion-expertise" className="dashboard-grid two-column">
        <article className="panel-card expertise-card">
          <div className="panel-head">
            <h2>🎓 Professional Expertise</h2>
            <span className="badge-expertise">{expertise.length}</span>
          </div>
          {expertise.length === 0 ? (
            <p className="panel-empty">
              No expertise areas added. 
              <button className="link-btn" onClick={() => navigate("/profile-edit")} style={{marginLeft: '8px'}}>
                Add expertise →
              </button>
            </p>
          ) : (
            <div className="expertise-list">
              {expertise.map((skill, idx) => (
                <div key={idx} className="expertise-item">
                  <span className="expertise-icon">✨</span>
                  <span className="expertise-text">{skill}</span>
                  <span className="expertise-badge">Pro</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel-card certification-card">
          <div className="panel-head">
            <h2>🏅 Certifications & Credentials</h2>
            <span className="badge-expertise">{certifications.length}</span>
          </div>
          {certifications.length === 0 ? (
            <p className="panel-empty">
              No certifications added. 
              <button className="link-btn" onClick={() => navigate("/profile-edit")} style={{marginLeft: '8px'}}>
                Add credentials →
              </button>
            </p>
          ) : (
            <div className="certification-list">
              {certifications.map((cert, idx) => (
                <div key={idx} className="certification-item">
                  <span className="cert-icon">📜</span>
                  <div className="cert-details">
                    <strong>{cert.name || cert}</strong>
                    {cert.issuer && <p className="cert-issuer">Issued by: {cert.issuer}</p>}
                    {cert.expiryDate && <p className="cert-expiry">Valid until: {new Date(cert.expiryDate).toLocaleDateString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {/* Professional Bio Section */}
      <section className="panel-card professional-bio-card">
        <div className="panel-head">
          <h2>👤 Professional Profile</h2>
        </div>
        {companionBio ? (
          <div className="bio-content">
            <p>{companionBio}</p>
            <div className="bio-stats">
              <div className="bio-stat">
                <span className="stat-number">{stats.rating.toFixed(1)}</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="bio-stat">
                <span className="stat-number">{stats.totalHours}</span>
                <span className="stat-label">Hours Worked</span>
              </div>
              <div className="bio-stat">
                <span className="stat-number">{stats.totalBookings}</span>
                <span className="stat-label">Bookings</span>
              </div>
              <div className="bio-stat">
                <span className="stat-number">${stats.totalEarnings.toFixed(0)}</span>
                <span className="stat-label">Earned</span>
              </div>
            </div>
            <button className="link-btn" onClick={() => navigate("/profile-edit")}>
              ✏️ Edit Profile →
            </button>
          </div>
        ) : (
          <p className="panel-empty">
            No professional bio added. Complete your profile to attract more elderly members.
            <button className="link-btn" onClick={() => navigate("/profile-edit")} style={{marginLeft: '8px'}}>
              Complete profile →
            </button>
          </p>
        )}
      </section>

      {/* Upcoming Shifts & Schedule */}
      <section id="companion-shifts" className="panel-card">
        <div className="panel-head">
          <h2>📅 Your Upcoming Shifts</h2>
          <span className="badge-expertise">{recentBookings.length}</span>
        </div>
        {recentBookings.length === 0 ? (
          <p className="panel-empty">No upcoming shifts. Accept job requests to see your schedule here!</p>
        ) : (
          <div className="shifts-schedule">
            {recentBookings.map((booking) => (
              <div key={booking._id} className="shift-card">
                <div className="shift-header">
                  <h4>{booking.elderlyId?.name || "Client"}</h4>
                  <span className={`shift-status ${booking.status}`}>{booking.status.toUpperCase()}</span>
                </div>
                <p className="shift-date">📅 {new Date(booking.startDate).toLocaleDateString()}</p>
                <p className="shift-duration">⏱️ {booking.duration || 'N/A'} hours</p>
                <p className="shift-rate">💰 ${booking.totalCost || 'TBD'}</p>
                <button 
                  className="btn-primary btn-small"
                  onClick={() => openChatWith(booking.elderlyId?._id, booking.elderlyId)}
                >
                  💬 Contact Client
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recommended Matches Based on Skills */}
      <section id="companion-match" className="panel-card">
        <div className="panel-head">
          <h2>💡 Requests Matching Your Expertise</h2>
        </div>
        {expertise.length === 0 ? (
          <p className="panel-empty">Add your expertise areas to see matching requests.</p>
        ) : (
          <div className="cards-grid">
            {filteredRequests
              .filter((req) => {
                const reqSpecs = (req.specializations || []).map(s => s.toLowerCase());
                return expertise.some(skill => 
                  reqSpecs.some(spec => skill.toLowerCase() === spec || spec.includes(skill.toLowerCase()))
                );
              })
              .slice(0, 3)
              .map((request) => (
                <article key={request.id} className="profile-card match-card">
                  <div className="match-badge">🎯 Perfect Match</div>
                  <div className="profile-head">
                    <h3>{request.elderlyName || "Client Inquiry"}</h3>
                    <span className={`status-chip ${request.status}`}>{request.status}</span>
                  </div>
                  <div className="card-meta">
                    <p><strong>Skills Needed:</strong> {request.specializations.join(", ")}</p>
                    <p><strong>Hours/Week:</strong> {request.hoursPerWeek}h</p>
                    <p><strong>Rate:</strong> ${request.hourlyRate}/hr</p>
                  </div>
                  <div className="request-actions">
                    {request.status === "open" && (
                      <button 
                        className="btn-primary"
                        onClick={() => handleAcceptRequest(request.id, request)}
                        disabled={acceptingId === request.id}
                      >
                        {acceptingId === request.id ? "⏳..." : "✅ Accept"}
                      </button>
                    )}
                    <button className="btn-ghost" onClick={() => openChatWith(request.elderlyId._id || request.elderlyId, { name: request.elderlyName, id: request.elderlyId })}>
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

export default CompanionDashboard;
