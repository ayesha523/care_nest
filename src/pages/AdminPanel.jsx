import React, { useState, useEffect } from "react";
import "../styles/admin-panel.css";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const response = await fetch("http://localhost:5000/api/admin/users?limit=100", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data.data || []);
        }
      } else if (activeTab === "bookings") {
        const response = await fetch("http://localhost:5000/api/admin/bookings?limit=100", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setBookings(data.data || []);
        }
      } else if (activeTab === "stats") {
        const response = await fetch("http://localhost:5000/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } else if (activeTab === "logs") {
        const response = await fetch("http://localhost:5000/api/admin/logs?limit=100", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
    setLoading(false);
  };

  const handleVerifyUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/verify`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ verified: true })
      });
      if (response.ok) {
        alert("User verified successfully");
        fetchAdminData();
      }
    } catch (error) {
      console.error("Error verifying user:", error);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/block`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ block: true })
      });
      if (response.ok) {
        alert("User blocked successfully");
        fetchAdminData();
      }
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/unblock`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ block: false })
      });
      if (response.ok) {
        alert("User unblocked successfully");
        fetchAdminData();
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="admin-panel-container">
      <header className="admin-header">
        <h1>🔐 Admin Dashboard</h1>
        <p>Manage users, monitor bookings, and view platform statistics</p>
      </header>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users Management
        </button>
        <button 
          className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          📅 Bookings
        </button>
        <button 
          className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          📊 Statistics
        </button>
        <button 
          className={`tab-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          📋 Activity Logs
        </button>
      </div>

      <div className="admin-content">
        {/* Users Management Tab */}
        {activeTab === "users" && (
          <section className="admin-section">
            <h2>User Management</h2>
            <div className="filter-controls">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="role-filter"
              >
                <option value="all">All Roles</option>
                <option value="elderly">Elderly</option>
                <option value="companion">Companion</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {loading ? (
              <p className="loading">Loading users...</p>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Verified</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className={user.isBlocked ? "blocked-row" : ""}>
                        <td className="user-name">
                          <strong>{user.name}</strong>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge role-${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          {user.identityVerified ? (
                            <span className="verified-badge">✓ Verified</span>
                          ) : (
                            <span className="unverified-badge">✗ Unverified</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${user.isBlocked ? "blocked" : "active"}`}>
                            {user.isBlocked ? "🚫 Blocked" : "✓ Active"}
                          </span>
                        </td>
                        <td>{user.rating ? user.rating.toFixed(1) + " ⭐" : "N/A"}</td>
                        <td className="action-buttons">
                          {!user.identityVerified && (
                            <button
                              className="btn-verify"
                              onClick={() => handleVerifyUser(user._id)}
                              title="Verify user identity"
                            >
                              ✓ Verify
                            </button>
                          )}
                          {!user.isBlocked && (
                            <button
                              className="btn-block"
                              onClick={() => handleBlockUser(user._id)}
                              title="Block this user"
                            >
                              🚫 Block
                            </button>
                          )}
                          {user.isBlocked && (
                            <button
                              className="btn-unblock"
                              onClick={() => handleUnblockUser(user._id)}
                              title="Unblock this user"
                            >
                              ↩️ Unblock
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <section className="admin-section">
            <h2>Bookings Monitoring</h2>
            {loading ? (
              <p className="loading">Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <p className="no-data">No bookings found</p>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Elderly</th>
                      <th>Companion</th>
                      <th>Start Date</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>{booking.elderId?.name || "N/A"}</td>
                        <td>{booking.companionId?.name || "N/A"}</td>
                        <td>{new Date(booking.startDate).toLocaleDateString()}</td>
                        <td>{booking.duration} hours</td>
                        <td>
                          <span className={`status-badge status-${booking.status}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>${booking.totalCost || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && (
          <section className="admin-section">
            <h2>Platform Statistics</h2>
            {loading ? (
              <p className="loading">Loading statistics...</p>
            ) : stats ? (
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalUsers || 0}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">👨‍🦳</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.elderdlyCount || 0}</div>
                    <div className="stat-label">Elderly Members</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">🤝</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.companionCount || 0}</div>
                    <div className="stat-label">Companions</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalBookings || 0}</div>
                    <div className="stat-label">Total Bookings</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <div className="stat-value">${stats.totalRevenue || 0}</div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.averageRating?.toFixed(1) || "N/A"}</div>
                    <div className="stat-label">Avg. Rating</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="no-data">No statistics available</p>
            )}
          </section>
        )}

        {/* Activity Logs Tab */}
        {activeTab === "logs" && (
          <section className="admin-section">
            <h2>Admin Activity Logs</h2>
            {loading ? (
              <p className="loading">Loading logs...</p>
            ) : logs.length === 0 ? (
              <p className="no-data">No activity logs found</p>
            ) : (
              <div className="logs-timeline">
                {logs.map((log, idx) => (
                  <div key={idx} className="log-entry">
                    <div className="log-time">{new Date(log.createdAt).toLocaleString()}</div>
                    <div className="log-action">{log.action}</div>
                    <div className="log-target">{log.targetUserId?.name || "N/A"}</div>
                    {log.reason && <div className="log-reason">Reason: {log.reason}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
