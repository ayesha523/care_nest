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
  const [maxRate, setMaxRate] = useState(80);
  const [minRating, setMinRating] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [companionSort, setCompanionSort] = useState("rating");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

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
          (b) =>
            new Date(b.startDate) > new Date() &&
            ["confirmed", "pending", "in-progress"].includes(b.status)
        );

        setUpcomingBookings(upcoming.slice(0, 3));

        setStats({
          totalHours: allBookings.reduce((s, b) => s + (b.duration || 0), 0),
          totalSpent: allBookings.reduce((s, b) => s + (b.totalCost || 0), 0),
          totalBookings: allBookings.length,
        });
      }

      const notificationsResponse = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (notificationsResponse.ok) {
        const data = await notificationsResponse.json();
        setUnreadNotifications(data.unreadCount || 0);
      }

      const checkinResponse = await fetch("/api/daily-checkin/today/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkinResponse.ok) {
        const data = await checkinResponse.json();
        setHasCheckedInToday(!!data.hasCheckedIn);
      }

      const healthResponse = await fetch(`/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        const profile = data.user || {};
        setHealthConditions(profile.healthConditions || []);
        setMedications(profile.medications || []);
      }

      const emergencyResponse = await fetch("/api/emergency-contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (emergencyResponse.ok) {
        const data = await emergencyResponse.json();
        setEmergencyContactsData(data.contacts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLastUpdatedAt(new Date());
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const openChatWith = async (otherUserId, userData) => {
    const token = localStorage.getItem("token");
    if (!otherUserId || !token) return;

    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otherUserId }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveChatUser(userData);
        setActiveChatConversation(data.conversation._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const chatContacts = useMemo(
    () =>
      companions.map((c) => ({
        id: c.id,
        name: c.name,
        subtitle: c.specializations?.[0] || "Care companion",
      })),
    [companions]
  );

  const handleFilter = (e) => {
    const q = e.target.value.toLowerCase();
    setFilter(q);

    setFilteredCompanions(
      companions.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.bio || "").toLowerCase().includes(q)
      )
    );
  };

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  const visibleCompanions = useMemo(() => {
    return filteredCompanions
      .filter((c) => {
        if (Number(c.hourlyRate || 0) > maxRate) return false;
        if (Number(c.rating || 0) < minRating) return false;
        if (onlyVerified && !c.verified) return false;
        return true;
      })
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  }, [filteredCompanions, maxRate, minRating, onlyVerified]);

  return (
    <>
      <Navbar />

      <div className="dashboard-shell elderly-theme">
        {/* CHAT MODAL */}
        {activeChatUser && activeChatConversation && (
          <div className="modal-chatbox-overlay" onClick={() => {
            setActiveChatUser(null);
            setActiveChatConversation(null);
          }}>
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
          <h1>Welcome, {user?.name || "User"}</h1>
          <button onClick={fetchDashboardData}>Refresh</button>
        </header>

        <section className="stats-band">
          <div>Hours: {stats.totalHours}</div>
          <div>Spent: ${stats.totalSpent}</div>
          <div>Bookings: {stats.totalBookings}</div>
          <div>Alerts: {unreadNotifications}</div>
        </section>

        {/* ACTION CENTER (FIXED) */}
        <section className="panel-card">
          <h2>Action Center</h2>
          <p>Everything is up to date.</p>
        </section>

        <section id="elderly-find">
          <input value={filter} onChange={handleFilter} placeholder="Search..." />

          {visibleCompanions.map((c) => (
            <div key={c.id}>
              <h3>{c.name}</h3>
              <button onClick={() => setSelectedCompanion(c)}>Request</button>
              <button onClick={() => openChatWith(c.id, c)}>Chat</button>
            </div>
          ))}
        </section>

        <RealtimeChatWidget
          currentUser={user}
          contacts={chatContacts}
          title="Chats"
        />
      </div>
    </>
  );
}

export default ElderlyDashboard;