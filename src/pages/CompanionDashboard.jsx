import React, { useCallback, useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { getJobRequests, acceptJobRequest } from "../services/marketplaceService";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

function CompanionDashboard() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [filteredRequests, setFilteredRequests] = useState([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalEarnings: 0,
    totalBookings: 0,
    rating: 0,
  });

  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [acceptingId, setAcceptingId] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

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
      // JOB REQUESTS
      const response = await getJobRequests({});
      if (response.success) {
        setFilteredRequests(response.data || []);
      }

      // PROFILE
      const profileRes = await fetch(`/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.ok) {
        const data = await profileRes.json();
        const profile = data.user || {};

        setStats({
          totalHours: profile.totalHours || 0,
          totalEarnings: profile.totalEarnings || 0,
          totalBookings: profile.totalBookings || 0,
          rating: profile.rating || 0,
        });
      }

      // BOOKINGS
      const bookingRes = await fetch(`/api/bookings/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (bookingRes.ok) {
        const data = await bookingRes.json();
        const all = data.bookings || [];

        setRecentBookings(all.slice(0, 5));
      }

      // NOTIFICATIONS
      const notifRes = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (notifRes.ok) {
        const data = await notifRes.json();
        setUnreadNotifications(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLastUpdatedAt(new Date());
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCompanionDashboard();
  }, [fetchCompanionDashboard]);

  const handleAcceptRequest = async (requestId) => {
    setAcceptingId(requestId);

    try {
      const res = await acceptJobRequest(requestId);

      if (res.success) {
        await fetchCompanionDashboard();
      }
    } catch (err) {
      console.error("Accept request error:", err);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <>
      <Navbar />

      <div className="dashboard-shell companion-theme">

        {/* HERO */}
        <header className="dashboard-hero-card">
          <h1>Welcome back, {user?.name || "Companion"}</h1>
          <p>
            Last updated:{" "}
            {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : "—"}
          </p>
        </header>

        {/* ACTION CENTER */}
        <section className="panel-card action-center-card">
          <h2>🎯 Action Center</h2>
          <p className="panel-empty">
            Stay active and accept requests to grow your profile.
          </p>
        </section>

        {/* STATS */}
        <section className="stats-band">
          <div>Hours: {stats.totalHours}</div>
          <div>Earnings: ${stats.totalEarnings}</div>
          <div>Bookings: {stats.totalBookings}</div>
          <div>Rating: ⭐ {stats.rating}</div>
          <div>Alerts: {unreadNotifications}</div>
        </section>

        {/* BOOKINGS */}
        <section className="panel-card">
          <h2>📋 Active Bookings</h2>

          {recentBookings.length === 0 ? (
            <p className="panel-empty">No active bookings.</p>
          ) : (
            recentBookings.map((b) => (
              <div key={b._id} className="list-item">
                <strong>{b.elderlyName || "Client"}</strong>
                <p>{new Date(b.startDate).toLocaleString()}</p>
              </div>
            ))
          )}
        </section>

        {/* JOB REQUESTS */}
        <section className="panel-card">
          <h2>📝 Job Requests</h2>

          {filteredRequests.length === 0 ? (
            <p className="panel-empty">No job requests available.</p>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id || request._id} className="list-item">
                <strong>{request.elderlyName || "Elderly User"}</strong>

                <div className="request-actions">
                  <button
                    onClick={() => handleAcceptRequest(request.id || request._id)}
                    disabled={acceptingId === request.id || request._id}
                  >
                    {acceptingId === (request.id || request._id)
                      ? "Accepting..."
                      : "Accept"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}

export default CompanionDashboard;