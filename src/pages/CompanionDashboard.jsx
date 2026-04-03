import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { getJobRequests, acceptJobRequest } from "../services/marketplaceService";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function CompanionDashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({ totalHours: 0, totalEarnings: 0, totalBookings: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    fetchCompanionDashboard();
  }, [statusFilter]);

  const fetchCompanionDashboard = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      // Fetch job requests
      const response = await getJobRequests({ status: statusFilter });
      if (response.success) {
        setRequests(response.data || []);
        setFilteredRequests(response.data || []);
      }

      // Fetch user stats (totalHours, totalEarnings, totalBookings, rating)
      const userResponse = await fetch(`http://localhost:5000/api/profile/${user?._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setStats({
          totalHours: userData.data?.totalHours || 0,
          totalEarnings: userData.data?.totalEarnings || 0,
          totalBookings: userData.data?.totalBookings || 0,
          rating: userData.data?.rating || 0
        });
      }

      // Fetch earned badges
      const badgesResponse = await fetch(`http://localhost:5000/api/badges/user/${user?._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (badgesResponse.ok) {
        const badgesData = await badgesResponse.json();
        setBadges(badgesData.data || []);
      }
    } catch (error) {
      console.error("Error fetching companion dashboard:", error);
    }
    setLoading(false);
  };

  const handleAcceptRequest = async (requestId) => {
    setAcceptingId(requestId);
    const response = await acceptJobRequest(requestId);

    if (response.success) {
      alert("Request accepted! Contact the elderly member to confirm details.");
      fetchCompanionDashboard();
    } else {
      alert(response.error || "Failed to accept request");
    }
    setAcceptingId(null);
  };

  return (
    <div className="dashboard companion-dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name || "Companion"}</h1>
        <p className="dashboard-subtitle">
          Review job requests and manage your care assignments
        </p>
      </header>

      {/* Stats Cards */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{stats.rating.toFixed(1)}</div>
            <div className="stat-label">Rating</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🕐</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalHours}</div>
            <div className="stat-label">Total Hours</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">${stats.totalEarnings}</div>
            <div className="stat-label">Earnings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalBookings}</div>
            <div className="stat-label">Bookings</div>
          </div>
        </div>
      </section>

      {/* Badges Section */}
      {badges.length > 0 && (
        <section className="badges-section">
          <h2>🏆 Your Badges</h2>
          <div className="badges-grid">
            {badges.map((badge, idx) => (
              <div key={idx} className="badge-item" title={badge.badgeId?.description}>
                <span className="badge-emoji">🎖️</span>
                <span className="badge-name">{badge.badgeId?.name || "Badge"}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="quick-actions">
        <button className="action-btn" onClick={() => navigate("/availability")}>📅 Manage Schedule</button>
        <button className="action-btn" onClick={() => navigate("/profile-edit")}>✏️ Edit Profile</button>
        <button className="action-btn" onClick={() => navigate("/notifications")}>🔔 Notifications</button>
      </section>

      <section className="dashboard-content">
        <div className="status-filter">
          <label>Filter by status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="open">Open Requests</option>
            <option value="accepted">Accepted Jobs</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <p className="loading">Loading job requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p className="no-results">
            No {statusFilter} requests available right now.
          </p>
        ) : (
          <div className="requests-grid">
            {filteredRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>{request.elderlyName}</h3>
                  <span className={`status-badge status-${request.status}`}>
                    {request.status}
                  </span>
                </div>

                <div className="request-details">
                  <p>
                    <strong>Needed Skills:</strong>{" "}
                    {request.specializations.join(", ")}
                  </p>
                  <p>
                    <strong>Hours/Week:</strong> {request.hoursPerWeek} hours
                  </p>
                  <p>
                    <strong>Rate:</strong> ${request.hourlyRate}/hour
                  </p>
                  <p>
                    <strong>Start Date:</strong>{" "}
                    {new Date(request.startDate).toLocaleDateString()}
                  </p>
                  <p className="request-description">
                    <strong>Care Details:</strong> {request.description}
                  </p>
                </div>

                <div className="request-actions">
                  {request.status === "open" && (
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={acceptingId === request.id}
                    >
                      {acceptingId === request.id ? "Accepting..." : "Accept Request"}
                    </button>
                  )}
                  <button
                    className="btn-view-details"
                    onClick={() => setSelectedRequest(request)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedRequest.elderlyName}</h2>
            <div className="modal-details">
              <p>
                <strong>Specializations Needed:</strong>{" "}
                {selectedRequest.specializations.join(", ")}
              </p>
              <p>
                <strong>Hours Per Week:</strong> {selectedRequest.hoursPerWeek}
              </p>
              <p>
                <strong>Hourly Rate:</strong> ${selectedRequest.hourlyRate}
              </p>
              <p>
                <strong>Start Date:</strong>{" "}
                {new Date(selectedRequest.startDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Care Description:</strong>
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
                    handleAcceptRequest(selectedRequest.id);
                    setSelectedRequest(null);
                  }}
                >
                  Accept This Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanionDashboard;
