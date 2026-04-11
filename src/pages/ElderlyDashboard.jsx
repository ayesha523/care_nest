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

      const healthResponse = await fetch(`/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        const profile = healthData.user || {};
        setHealthConditions(profile.healthConditions || []);
        setMedications(profile.medications || []);
      }

      const emergencyResponse = await fetch("/api/emergency-contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (emergencyResponse.ok) {
        const emergencyData = await emergencyResponse.json();
        setEmergencyContactsData(emergencyData.contacts || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLastUpdatedAt(new Date());
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const scrollToSection = useCallback((sectionId) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const visibleCompanions = useMemo(() => {
    return filteredCompanions
      .filter((c) => {
        if (c.hourlyRate > maxRate) return false;
        if (c.rating < minRating) return false;
        if (onlyVerified && !c.verified) return false;
        return true;
      })
      .sort((a, b) => b.rating - a.rating);
  }, [filteredCompanions, maxRate, minRating, onlyVerified]);

  return (
    <>
      <Navbar />
      <div className="dashboard-shell elderly-theme">

        <header className="dashboard-hero-card">
          <h1>Welcome back, {user?.name || "User"}</h1>
        </header>

        {/* ACTION CENTER */}
        <section className="panel-card action-center-card">
          <h2>🎯 Action Center</h2>
          <p>Stay updated with your care plan.</p>
        </section>

        {/* FIND COMPANION */}
        <section className="panel-card">
          <h2>🔍 Find Companion</h2>

          {visibleCompanions.map((c) => (
            <div key={c.id}>
              <h3>{c.name}</h3>
              <button onClick={() => setSelectedCompanion(c)}>Request</button>
            </div>
          ))}
        </section>

      </div>
    </>
  );
}

export default ElderlyDashboard;