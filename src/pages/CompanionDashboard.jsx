import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "../context/UserContext";
import {
  getJobRequests,
  acceptJobRequest,
  declineJobRequest,
  getElderlyMembers,
  requestElderlySupport,
} from "../services/marketplaceService";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import RealtimeChatWidget from "../components/RealtimeChatWidget";
import AdvancedChatBox from "../components/AdvancedChatBox";
import { getUserPreferences, PREFERENCES_UPDATED_EVENT } from "../utils/preferences";
import "../styles/dashboard.css";
import "../styles/advanced-chatbox.css";

function CompanionDashboard() {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({ totalHours: 0, totalEarnings: 0, totalBookings: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [activeChatConversation, setActiveChatConversation] = useState(null);
  const [expertise, setExpertise] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [companionBio, setCompanionBio] = useState("");
  const [companionProfilePicture, setCompanionProfilePicture] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [requestSort, setRequestSort] = useState("newest");
  const [minimumRate, setMinimumRate] = useState(0);
  const [onlySkillMatched, setOnlySkillMatched] = useState(false);
  const [bookingActionLoadingId, setBookingActionLoadingId] = useState("");
  const [decliningRequestId, setDecliningRequestId] = useState("");
  const [elderlySearchQuery, setElderlySearchQuery] = useState(
    () => new URLSearchParams(location.search).get("elderly")?.trim() || ""
  );
  const [bookingFeedLabel, setBookingFeedLabel] = useState("Active");
  const [elderlyDirectory, setElderlyDirectory] = useState([]);
  const [elderlyDirectoryQuery, setElderlyDirectoryQuery] = useState("");
  const [elderlyDirectoryLoading, setElderlyDirectoryLoading] = useState(false);
  const [selectedElderly, setSelectedElderly] = useState(null);
  const [supportRequestMessage, setSupportRequestMessage] = useState("");
  const [supportHoursPerWeek, setSupportHoursPerWeek] = useState(8);
  const [supportStartDate, setSupportStartDate] = useState("");
  const [supportHourlyRate, setSupportHourlyRate] = useState(0);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [preferences, setPreferences] = useState(() => getUserPreferences());

  const userId =
    user?.id ||
    user?._id ||
    JSON.parse(localStorage.getItem("user") || "null")?.id ||
    JSON.parse(localStorage.getItem("user") || "null")?._id ||
    "";

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(preferences.locale || "en-US", {
        dateStyle: "medium",
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

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
  }, []);

  const formatDate = useCallback(
    (value) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
    },
    [dateFormatter]
  );

  const formatCurrency = useCallback(
    (value) => currencyFormatter.format(Number(value || 0)),
    [currencyFormatter]
  );

  const getRequestId = useCallback((request) => {
    const rawId = request?.id || request?._id;
    return typeof rawId === "string" ? rawId : "";
  }, []);

  const getRequestElderlyDetails = useCallback((request) => {
    const elderly = request?.elderlyId;
    if (elderly && typeof elderly === "object") {
      return {
        id: elderly._id || elderly.id || "",
        name: request?.elderlyName || elderly.name || "Elderly Member",
        email: request?.elderlyEmail || elderly.email || "",
        profilePicture: request?.elderlyProfilePicture || elderly.profilePicture || "",
      };
    }

    return {
      id: typeof elderly === "string" ? elderly : "",
      name: request?.elderlyName || "Elderly Member",
      email: request?.elderlyEmail || "",
      profilePicture: request?.elderlyProfilePicture || "",
    };
  }, []);

  const fetchCompanionDashboard = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await getJobRequests({});
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
        setCompanionProfilePicture(profile.profilePicture || "");
        setSupportHourlyRate(Number(profile.hourlyRate || 0));
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
        const allBookings = bookingsData.bookings || [];
        setBookingHistory(
          [...allBookings].sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          )
        );
        const active = allBookings.filter((booking) =>
          ["pending", "confirmed", "in-progress"].includes(booking.status)
        );
        setBookingFeedLabel(active.length > 0 ? "Active" : "Recent");
        setRecentBookings((active.length > 0 ? active : allBookings).slice(0, 4));
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
      setLastUpdatedAt(new Date());
      setLoading(false);
    }
  }, [userId]);

  const fetchElderlyDirectory = useCallback(async () => {
    setElderlyDirectoryLoading(true);
    try {
      const response = await getElderlyMembers(
        elderlyDirectoryQuery.trim() ? { search: elderlyDirectoryQuery.trim() } : {}
      );
      if (response.success) {
        setElderlyDirectory(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error loading elderly directory:", error);
    } finally {
      setElderlyDirectoryLoading(false);
    }
  }, [elderlyDirectoryQuery]);

  useEffect(() => {
    fetchCompanionDashboard();
  }, [fetchCompanionDashboard]);

  useEffect(() => {
    fetchElderlyDirectory();
  }, [fetchElderlyDirectory]);

  useEffect(() => {
    const syncPreferences = () => setPreferences(getUserPreferences());
    window.addEventListener(PREFERENCES_UPDATED_EVENT, syncPreferences);
    window.addEventListener("storage", syncPreferences);
    return () => {
      window.removeEventListener(PREFERENCES_UPDATED_EVENT, syncPreferences);
      window.removeEventListener("storage", syncPreferences);
    };
  }, []);

  useEffect(() => {
    if (!feedback.message) {
      return;
    }
    const timer = window.setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [feedback.message]);

  useEffect(() => {
    const queryFromUrl = new URLSearchParams(location.search).get("elderly")?.trim() || "";
    if (queryFromUrl !== elderlySearchQuery) {
      setElderlySearchQuery(queryFromUrl);
      if (queryFromUrl) {
        setStatusFilter("all");
      }
    }
  }, [elderlySearchQuery, location.search]);

  const getElderlyDetails = useCallback((booking) => {
    const elderly = booking?.elderlyId;
    if (elderly && typeof elderly === "object") {
      return {
        id: elderly._id || elderly.id || "",
        name: elderly.name || "Elderly Member",
        email: elderly.email || "",
        profilePicture: elderly.profilePicture || "",
      };
    }
    return {
      id: typeof elderly === "string" ? elderly : "",
      name: booking?.elderlyName || "Elderly Member",
      email: "",
      profilePicture: "",
    };
  }, []);

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
      const elderlyDetails = getRequestElderlyDetails(request);
      if (elderlyDetails.id) {
        map.set(elderlyDetails.id, {
          id: elderlyDetails.id,
          name: elderlyDetails.name,
          subtitle: request.status || "request",
        });
      }
    });

    return Array.from(map.values());
  }, [filteredRequests, getRequestElderlyDetails, recentBookings]);

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

  const handleBookingAction = async (booking, action) => {
    const bookingId = booking?._id;
    if (!bookingId || !action) {
      return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("carenest_token");
    if (!token) {
      showFeedback("error", "You are not authenticated. Please login again.");
      return;
    }

    setBookingActionLoadingId(`${action}:${bookingId}`);

    try {
      const endpoint = action === "accept" ? "accept" : action === "decline" ? "reject" : "cancel";
      const response = await fetch(`/api/bookings/${bookingId}/${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body:
          action === "cancel"
            ? JSON.stringify({
                cancelledBy: "companion",
                reason: "Cancelled by companion from dashboard",
              })
            : JSON.stringify({}),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${action} booking`);
      }

      await fetchCompanionDashboard();
      showFeedback("success", `Booking ${action}ed successfully.`);
    } catch (error) {
      showFeedback("error", error.message || `Unable to ${action} booking`);
    } finally {
      setBookingActionLoadingId("");
    }
  };

  const handleDeclineRequest = async (request) => {
    const requestId = getRequestId(request);
    if (!requestId) {
      showFeedback("error", "Unable to decline request: missing request ID");
      return;
    }

    setDecliningRequestId(requestId);
    try {
      const response = await declineJobRequest(requestId);
      if (!response.success) {
        throw new Error(response.error || "Failed to decline request");
      }
      await fetchCompanionDashboard();
      showFeedback("success", "Request declined.");
    } catch (error) {
      showFeedback("error", error.message || "Unable to decline request");
    } finally {
      setDecliningRequestId("");
    }
  };

  const handleSubmitSupportRequest = async () => {
    if (!selectedElderly?.id) {
      return;
    }
    if (!supportStartDate) {
      showFeedback("error", "Please select a start date");
      return;
    }
    if (!supportRequestMessage.trim()) {
      showFeedback("error", "Please include a short message");
      return;
    }
    if (Number(supportHoursPerWeek) <= 0 || Number(supportHoursPerWeek) > 168) {
      showFeedback("error", "Hours per week must be between 1 and 168");
      return;
    }

    setSupportSubmitting(true);
    try {
      const response = await requestElderlySupport(selectedElderly.id, {
        message: supportRequestMessage.trim(),
        hoursPerWeek: Number(supportHoursPerWeek),
        hourlyRate: Number(supportHourlyRate || 0),
        startDate: supportStartDate,
        specializations: expertise.slice(0, 5),
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to send request");
      }

      setSelectedElderly(null);
      setSupportRequestMessage("");
      setSupportHoursPerWeek(8);
      setSupportStartDate("");
      showFeedback("success", "Support request sent successfully.");
    } catch (error) {
      showFeedback("error", error.message || "Unable to send support request");
    } finally {
      setSupportSubmitting(false);
    }
  };

  const visibleRequests = useMemo(() => {
    const expertiseSet = new Set((expertise || []).map((skill) => skill.toLowerCase()));
    const normalizedSearch = elderlySearchQuery.trim().toLowerCase();
    const base = filteredRequests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) {
        return false;
      }

      if (normalizedSearch) {
        const elderlyRef = request.elderlyId && typeof request.elderlyId === "object" ? request.elderlyId : null;
        const elderlyName = String(request.elderlyName || elderlyRef?.name || "").toLowerCase();
        const elderlyEmail = String(request.elderlyEmail || elderlyRef?.email || "").toLowerCase();
        const careSummary = String(request.description || "").toLowerCase();
        const requiredServices = (request.specializations || []).join(" ").toLowerCase();
        if (
          !elderlyName.includes(normalizedSearch) &&
          !elderlyEmail.includes(normalizedSearch) &&
          !careSummary.includes(normalizedSearch) &&
          !requiredServices.includes(normalizedSearch)
        ) {
          return false;
        }
      }

      const hourlyRate = Number(request.hourlyRate || 0);
      if (hourlyRate < Number(minimumRate)) {
        return false;
      }
      if (!onlySkillMatched) {
        return true;
      }

      const requestedSkills = (request.specializations || []).map((skill) => skill.toLowerCase());
      return requestedSkills.some((skill) => expertiseSet.has(skill));
    });

    return base.sort((a, b) => {
      if (requestSort === "rate-desc") {
        return Number(b.hourlyRate || 0) - Number(a.hourlyRate || 0);
      }
      if (requestSort === "hours-desc") {
        return Number(b.hoursPerWeek || 0) - Number(a.hoursPerWeek || 0);
      }
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [elderlySearchQuery, expertise, filteredRequests, minimumRate, onlySkillMatched, requestSort, statusFilter]);

  const visibleBookings = useMemo(() => {
    const normalizedSearch = elderlySearchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      return recentBookings;
    }

    return recentBookings.filter((booking) => {
      const details = getElderlyDetails(booking);
      const name = String(details.name || "").toLowerCase();
      const email = String(details.email || "").toLowerCase();
      const notes = String(booking.notes || "").toLowerCase();
      return (
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        notes.includes(normalizedSearch)
      );
    });
  }, [elderlySearchQuery, getElderlyDetails, recentBookings]);

  const visibleBookingHistory = useMemo(() => {
    const normalizedSearch = elderlySearchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      return bookingHistory;
    }

    return bookingHistory.filter((booking) => {
      const details = getElderlyDetails(booking);
      const name = String(details.name || "").toLowerCase();
      const email = String(details.email || "").toLowerCase();
      const notes = String(booking.notes || "").toLowerCase();
      const services = (booking.services || []).join(" ").toLowerCase();
      return (
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        notes.includes(normalizedSearch) ||
        services.includes(normalizedSearch)
      );
    });
  }, [bookingHistory, elderlySearchQuery, getElderlyDetails]);

  const currentClients = useMemo(() => {
    const map = new Map();
    recentBookings
      .filter((booking) => ["confirmed", "in-progress", "pending"].includes(booking.status))
      .forEach((booking) => {
        const details = getElderlyDetails(booking);
        const key = details.id || booking._id;
        if (!map.has(key)) {
          map.set(key, {
            ...details,
            profilePicture: details.profilePicture || "",
            status: booking.status,
            startDate: booking.startDate,
            services: booking.services || [],
          });
        }
      });

    const normalizedSearch = elderlySearchQuery.trim().toLowerCase();
    const values = Array.from(map.values());
    if (!normalizedSearch) {
      return values;
    }

    return values.filter((client) => {
      const name = String(client.name || "").toLowerCase();
      const email = String(client.email || "").toLowerCase();
      const services = (client.services || []).join(" ").toLowerCase();
      return (
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        services.includes(normalizedSearch)
      );
    });
  }, [elderlySearchQuery, getElderlyDetails, recentBookings]);

  const companionActionItems = useMemo(() => {
    const items = [];

    if (!companionBio || expertise.length === 0 || certifications.length === 0) {
      items.push({
        id: "profile",
        level: "high",
        title: "Complete your professional profile",
        detail: "A complete profile helps you get matched to better requests.",
        cta: "Edit profile",
        onClick: () => navigate("/profile-edit"),
      });
    }

    const openRequests = filteredRequests.filter((request) => request.status === "open").length;
    if (openRequests > 0) {
      items.push({
        id: "open-requests",
        level: "high",
        title: `${openRequests} open requests need attention`,
        detail: "Review and accept suitable requests to secure more shifts.",
        cta: "Review queue",
        onClick: () => {
          const target = document.getElementById("companion-requests");
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        },
      });
    }

    if (recentBookings.length === 0) {
      items.push({
        id: "bookings",
        level: "medium",
        title: "No active shifts scheduled",
        detail: "Accept requests to keep your schedule and income steady.",
        cta: "View requests",
        onClick: () => {
          const target = document.getElementById("companion-requests");
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        },
      });
    }

    if (unreadNotifications > 0) {
      items.push({
        id: "alerts",
        level: "low",
        title: `${unreadNotifications} unread alerts`,
        detail: "Read alerts to avoid missing booking or platform updates.",
        cta: "Open alerts",
        onClick: () => navigate("/notifications"),
      });
    }

    return items.slice(0, 4);
  }, [
    certifications.length,
    companionBio,
    expertise.length,
    filteredRequests,
    navigate,
    recentBookings.length,
    unreadNotifications,
  ]);

  const handleAcceptRequest = async (requestId, request) => {
    const normalizedRequestId = requestId || getRequestId(request);
    if (!normalizedRequestId) {
      showFeedback("error", "Unable to accept request: missing request ID");
      return;
    }

    setAcceptingId(normalizedRequestId);
    const response = await acceptJobRequest(normalizedRequestId);

    if (response.success) {
      const elderlyDetails = getRequestElderlyDetails(request);
      if (elderlyDetails.id) {
        // Open chat after accepting
        await openChatWith(elderlyDetails.id, {
          id: elderlyDetails.id,
          name: elderlyDetails.name,
        });
      }
      fetchCompanionDashboard();
      showFeedback("success", "Request accepted successfully.");
    } else {
      showFeedback("error", response.error || "Failed to accept request");
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
        <div className="hero-avatar-block">
          <img
            className="hero-avatar"
            src={companionProfilePicture || "https://ui-avatars.com/api/?background=115b4c&color=fff&name=Companion"}
            alt={user?.name || "Companion"}
          />
          <button className="btn-ghost btn-small" onClick={() => navigate("/profile-edit")}>Update photo</button>
        </div>
        <div className="hero-actions">
          <button className="action-btn" onClick={fetchCompanionDashboard} title="Refresh dashboard">🔄 Refresh</button>
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

      <section className="dashboard-meta-row">
        <p className="meta-text">
          Last sync: {lastUpdatedAt ? timeFormatter.format(lastUpdatedAt) : "Not synced yet"}
        </p>
        <p className="meta-text meta-text-highlight">
          Pipeline health: {visibleRequests.length > 0 ? "Opportunities available" : "Needs attention"}
        </p>
      </section>

      {feedback.message && (
        <section className={`feedback-banner ${feedback.type === "error" ? "error" : "success"}`}>
          {feedback.message}
        </section>
      )}

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
          <strong>{formatCurrency(stats.totalEarnings)}</strong>
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
          <button className="section-pill" onClick={() => scrollToSection("companion-elderly-network")}>Elderly Network</button>
          <button className="section-pill" onClick={() => scrollToSection("companion-requests")}>Requests</button>
          <button className="section-pill" onClick={() => scrollToSection("companion-expertise")}>Expertise</button>
          <button className="section-pill" onClick={() => scrollToSection("companion-shifts")}>Shifts</button>
          <button className="section-pill" onClick={() => scrollToSection("companion-clients")}>Clients</button>
          <button className="section-pill" onClick={() => scrollToSection("companion-history")}>History</button>
          <button className="section-pill" onClick={() => scrollToSection("companion-match")}>Matches</button>
        </div>
        <div className="insight-strip">
          <article className="insight-card">
            <span>Acceptance Flow</span>
            <strong>{visibleRequests.length > 0 ? "Active" : "Idle"}</strong>
          </article>
          <article className="insight-card">
            <span>Schedule Load</span>
            <strong>{visibleBookings.length} {bookingFeedLabel}</strong>
          </article>
          <article className="insight-card">
            <span>Profile Strength</span>
            <strong>{Math.min(100, 50 + expertise.length * 10)}%</strong>
          </article>
        </div>
      </section>

      <section className="panel-card action-center-card">
        <div className="panel-head">
          <h2>🎯 Action Center</h2>
          <span className="badge-count">{companionActionItems.length}</span>
        </div>
        {companionActionItems.length === 0 ? (
          <p className="panel-empty">You are fully set up. Keep responding quickly to maintain top performance.</p>
        ) : (
          <div className="action-list">
            {companionActionItems.map((item) => (
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

      <section id="companion-elderly-network" className="panel-card">
        <div className="panel-head">
          <h2>🌍 Elderly Discovery & Outreach</h2>
          <span className="badge-count">{elderlyDirectory.length}</span>
        </div>
        <div className="filter-toolbar">
          <label>
            Find elderly members
            <input
              type="text"
              value={elderlyDirectoryQuery}
              placeholder="Search name, email, city"
              onChange={(e) => setElderlyDirectoryQuery(e.target.value)}
            />
          </label>
          <button type="button" className="btn-ghost btn-small" onClick={fetchElderlyDirectory}>Refresh</button>
        </div>

        {elderlyDirectoryLoading ? (
          <p className="panel-empty">Loading elderly members...</p>
        ) : elderlyDirectory.length === 0 ? (
          <p className="panel-empty">No elderly members found for current filters.</p>
        ) : (
          <div className="cards-grid">
            {elderlyDirectory.slice(0, 12).map((elderly) => (
              <article key={elderly.id} className="profile-card">
                <div className="avatar-row">
                  <img
                    className="entity-avatar"
                    src={elderly.profilePicture || "https://ui-avatars.com/api/?background=ecf4ef&color=115b4c&name=Elderly"}
                    alt={elderly.name || "Elderly member"}
                  />
                  <div className="avatar-meta">
                    <h3>{elderly.name || "Elderly Member"}</h3>
                    {elderly.city && <p>{elderly.city}</p>}
                  </div>
                </div>
                {elderly.email && <p className="muted-text">📧 {elderly.email}</p>}
                {Array.isArray(elderly.supportNeeds) && elderly.supportNeeds.length > 0 && (
                  <p className="muted-text">Needs: {elderly.supportNeeds.slice(0, 3).join(", ")}</p>
                )}
                <div className="request-actions">
                  <button className="btn-primary" onClick={() => setSelectedElderly(elderly)}>📝 Send Request</button>
                  <button
                    className="btn-ghost"
                    onClick={() => openChatWith(elderly.id, { id: elderly.id, name: elderly.name || "Elderly Member" })}
                  >
                    💬 Chat
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="companion-queue" className="dashboard-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>📋 {bookingFeedLabel} Booking Queue</h2>
            <span className="badge-count">{visibleBookings.length}</span>
          </div>
          {visibleBookings.length === 0 ? (
            <p className="panel-empty">No active bookings yet. Accept some requests!</p>
          ) : (
            <div className="timeline-list">
              {visibleBookings.map((booking) => (
                <div key={booking._id} className="timeline-item">
                  <div className="timeline-content">
                    <strong>{getElderlyDetails(booking).name}</strong>
                    {getElderlyDetails(booking).email && <p>{getElderlyDetails(booking).email}</p>}
                    <p>{new Date(booking.startDate).toLocaleDateString()}</p>
                    <p>{booking.services?.length ? booking.services.join(", ") : "General support"}</p>
                  </div>
                  <div className="timeline-actions">
                    <span className={`status-chip ${booking.status}`}>{booking.status}</span>
                    {booking.status === "pending" && (
                      <>
                        <button
                          className="btn-primary btn-small"
                          onClick={() => handleBookingAction(booking, "accept")}
                          disabled={bookingActionLoadingId === `accept:${booking._id}`}
                          title="Accept booking"
                        >
                          {bookingActionLoadingId === `accept:${booking._id}` ? "Accepting..." : "✅"}
                        </button>
                        <button
                          className="btn-cancel btn-small"
                          onClick={() => handleBookingAction(booking, "decline")}
                          disabled={bookingActionLoadingId === `decline:${booking._id}`}
                          title="Decline booking"
                        >
                          {bookingActionLoadingId === `decline:${booking._id}` ? "Declining..." : "❌"}
                        </button>
                      </>
                    )}
                    <button
                      className="btn-ghost btn-small"
                      onClick={() =>
                        openChatWith(getElderlyDetails(booking).id, {
                          id: getElderlyDetails(booking).id,
                          name: getElderlyDetails(booking).name,
                        })
                      }
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
              <option value="all">📚 All</option>
              <option value="open">🆕 Open</option>
              <option value="accepted">✅ Accepted</option>
              <option value="completed">🎉 Completed</option>
            </select>
          </div>
        </div>

        <div className="filter-toolbar">
          <label>
            Search elderly
            <input
              type="text"
              placeholder="Name, email, or location"
              value={elderlySearchQuery}
              onChange={(e) => setElderlySearchQuery(e.target.value)}
            />
            <span>{visibleRequests.length} match{visibleRequests.length === 1 ? "" : "es"}</span>
          </label>
          <button
            type="button"
            className="btn-ghost btn-small"
            onClick={() => {
              setElderlySearchQuery("");
              navigate("/companion-dashboard");
            }}
          >
            Clear
          </button>
          <label>
            Minimum rate
            <input
              type="range"
              min="0"
              max="120"
              value={minimumRate}
              onChange={(e) => setMinimumRate(Number(e.target.value))}
            />
            <span>${minimumRate}/hr</span>
          </label>
          <label>
            Sort by
            <select value={requestSort} onChange={(e) => setRequestSort(e.target.value)}>
              <option value="newest">Newest start date</option>
              <option value="rate-desc">Highest pay</option>
              <option value="hours-desc">Most hours/week</option>
            </select>
          </label>
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={onlySkillMatched}
              onChange={(e) => setOnlySkillMatched(e.target.checked)}
            />
            Match my expertise only
          </label>
        </div>

        {loading ? (
          <p className="panel-empty">Loading job requests...</p>
        ) : visibleRequests.length === 0 ? (
          <p className="panel-empty">No {statusFilter} requests for your current filters. Try broadening criteria.</p>
        ) : (
          <div className="cards-grid">
            {visibleRequests.map((request) => (
              <article
                key={getRequestId(request) || `${request.elderlyName || "elderly"}-${request.startDate || "start"}`}
                className="profile-card request-card-advanced"
              >
                <div className="profile-head">
                  <div className="avatar-row">
                    <img
                      className="entity-avatar"
                      src={
                        getRequestElderlyDetails(request).profilePicture ||
                        "https://ui-avatars.com/api/?background=ecf4ef&color=115b4c&name=Elderly"
                      }
                      alt={getRequestElderlyDetails(request).name}
                    />
                    <h3>{getRequestElderlyDetails(request).name}</h3>
                  </div>
                  <span className={`status-chip ${request.status}`}>{request.status}</span>
                </div>

                <div className="card-meta">
                  <p><strong>Skills:</strong> {(request.specializations || []).join(", ")}</p>
                  <p><strong>Hours/Week:</strong> {request.hoursPerWeek}h</p>
                  <p><strong>Rate:</strong> ${request.hourlyRate}/hr</p>
                  <p><strong>Start:</strong> {formatDate(request.startDate)}</p>
                </div>
                <p className="muted-text">{request.description}</p>

                <div className="request-actions">
                  {request.status === "open" && (
                    <>
                      <button
                        className="btn-primary"
                        onClick={() => handleAcceptRequest(getRequestId(request), request)}
                        disabled={acceptingId === getRequestId(request)}
                        title="Accept this job"
                      >
                        {acceptingId === getRequestId(request) ? "⏳ Accepting..." : "✅ Accept"}
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => handleDeclineRequest(request)}
                        disabled={decliningRequestId === getRequestId(request)}
                        title="Decline this job"
                      >
                        {decliningRequestId === getRequestId(request) ? "Declining..." : "❌ Decline"}
                      </button>
                    </>
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
                    onClick={() => {
                      const elderlyDetails = getRequestElderlyDetails(request);
                      openChatWith(elderlyDetails.id, {
                        name: elderlyDetails.name,
                        id: elderlyDetails.id,
                      });
                    }}
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
            <h2>📋 Request Details - {getRequestElderlyDetails(selectedRequest).name}</h2>
            <div className="modal-details">
              <p>
                <strong>📌 Specializations Needed:</strong>{" "}
                {(selectedRequest.specializations || []).join(", ") || "General care"}
              </p>
              <p>
                <strong>⏱️ Hours Per Week:</strong> {selectedRequest.hoursPerWeek} hours
              </p>
              <p>
                <strong>💰 Hourly Rate:</strong> ${selectedRequest.hourlyRate}/hour
              </p>
              <p>
                <strong>📅 Start Date:</strong>{" "}
                {formatDate(selectedRequest.startDate)}
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
                <>
                  <button
                    className="btn-submit"
                    onClick={() => {
                      handleAcceptRequest(getRequestId(selectedRequest), selectedRequest);
                      setSelectedRequest(null);
                    }}
                  >
                    ✅ Accept Job
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      handleDeclineRequest(selectedRequest);
                      setSelectedRequest(null);
                    }}
                  >
                    ❌ Decline Job
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedElderly && (
        <div className="modal-overlay" onClick={() => setSelectedElderly(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🤝 Send Support Request</h2>
            <p>
              Reach out to <strong>{selectedElderly.name || "Elderly Member"}</strong> with a tailored care proposal.
            </p>
            <label>
              Start Date
              <input
                type="date"
                value={supportStartDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSupportStartDate(e.target.value)}
              />
            </label>
            <label>
              Hours Per Week
              <input
                type="number"
                min="1"
                max="80"
                value={supportHoursPerWeek}
                onChange={(e) => setSupportHoursPerWeek(Number(e.target.value))}
              />
            </label>
            <label>
              Hourly Rate
              <input
                type="number"
                min="0"
                value={supportHourlyRate}
                onChange={(e) => setSupportHourlyRate(Number(e.target.value))}
              />
            </label>
            <label>
              Message
              <textarea
                rows="4"
                value={supportRequestMessage}
                onChange={(e) => setSupportRequestMessage(e.target.value)}
                placeholder="Write a short introduction and care plan"
              />
            </label>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSelectedElderly(null)}>Close</button>
              <button className="btn-submit" onClick={handleSubmitSupportRequest} disabled={supportSubmitting}>
                {supportSubmitting ? "Sending..." : "Send Request"}
              </button>
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
                    {cert.expiryDate && <p className="cert-expiry">Valid until: {formatDate(cert.expiryDate)}</p>}
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
                <span className="stat-number">{formatCurrency(stats.totalEarnings)}</span>
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
        {visibleBookings.length === 0 ? (
          <p className="panel-empty">No upcoming shifts. Accept job requests to see your schedule here!</p>
        ) : (
          <div className="shifts-schedule">
            {visibleBookings.map((booking) => (
              <div key={booking._id} className="shift-card">
                <div className="shift-header">
                  <div className="avatar-row">
                    <img
                      className="entity-avatar"
                      src={
                        getElderlyDetails(booking).profilePicture ||
                        "https://ui-avatars.com/api/?background=ecf4ef&color=115b4c&name=Elderly"
                      }
                      alt={getElderlyDetails(booking).name}
                    />
                    <h4>{getElderlyDetails(booking).name}</h4>
                  </div>
                  <span className={`shift-status ${booking.status}`}>{booking.status.toUpperCase()}</span>
                </div>
                {getElderlyDetails(booking).email && <p className="shift-rate">📧 {getElderlyDetails(booking).email}</p>}
                <p className="shift-date">📅 {formatDate(booking.startDate)}</p>
                <p className="shift-duration">⏱️ {booking.duration || 'N/A'} hours</p>
                <p className="shift-rate">💰 {Number(booking.totalCost || 0) > 0 ? formatCurrency(booking.totalCost) : "TBD"}</p>
                {booking.notes && <p className="shift-rate">📝 {booking.notes}</p>}
                <div className="request-actions">
                  {booking.status === "pending" && (
                    <>
                      <button
                        className="btn-primary btn-small"
                        onClick={() => handleBookingAction(booking, "accept")}
                        disabled={bookingActionLoadingId === `accept:${booking._id}`}
                      >
                        {bookingActionLoadingId === `accept:${booking._id}` ? "Accepting..." : "✅ Accept Booking"}
                      </button>
                      <button
                        className="btn-cancel btn-small"
                        onClick={() => handleBookingAction(booking, "decline")}
                        disabled={bookingActionLoadingId === `decline:${booking._id}`}
                      >
                        {bookingActionLoadingId === `decline:${booking._id}` ? "Declining..." : "❌ Decline"}
                      </button>
                    </>
                  )}
                  {["confirmed", "in-progress"].includes(booking.status) && (
                    <button
                      className="btn-cancel btn-small"
                      onClick={() => handleBookingAction(booking, "cancel")}
                      disabled={bookingActionLoadingId === `cancel:${booking._id}`}
                    >
                      {bookingActionLoadingId === `cancel:${booking._id}` ? "Cancelling..." : "❌ Cancel Booking"}
                    </button>
                  )}
                  <button
                    className="btn-primary btn-small"
                    onClick={() =>
                      openChatWith(getElderlyDetails(booking).id, {
                        id: getElderlyDetails(booking).id,
                        name: getElderlyDetails(booking).name,
                      })
                    }
                  >
                    💬 Contact Client
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="companion-clients" className="panel-card">
        <div className="panel-head">
          <h2>🤝 Currently Working With</h2>
          <span className="badge-count">{currentClients.length}</span>
        </div>
        {currentClients.length === 0 ? (
          <p className="panel-empty">No active elderly clients right now.</p>
        ) : (
          <div className="cards-grid">
            {currentClients.map((client) => (
              <article key={client.id || client.name} className="profile-card">
                <div className="profile-head">
                  <div className="avatar-row">
                    <img
                      className="entity-avatar"
                      src={client.profilePicture || "https://ui-avatars.com/api/?background=ecf4ef&color=115b4c&name=Elderly"}
                      alt={client.name || "Elderly Member"}
                    />
                    <h3>{client.name || "Elderly Member"}</h3>
                  </div>
                  <span className={`status-chip ${client.status}`}>{client.status}</span>
                </div>
                {client.email && <p className="muted-text">📧 {client.email}</p>}
                <p className="muted-text">📅 Since {formatDate(client.startDate)}</p>
                <p className="muted-text">
                  🛟 {(client.services || []).length > 0 ? client.services.join(", ") : "General support"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="companion-history" className="panel-card">
        <div className="panel-head">
          <h2>🗂️ Booking History</h2>
          <span className="badge-count">{visibleBookingHistory.length}</span>
        </div>
        {visibleBookingHistory.length === 0 ? (
          <p className="panel-empty">No booking history matched your search.</p>
        ) : (
          <div className="timeline-list">
            {visibleBookingHistory.slice(0, 12).map((booking) => (
              <div key={booking._id} className="timeline-item">
                <div className="timeline-content">
                  <strong>{getElderlyDetails(booking).name}</strong>
                  {getElderlyDetails(booking).email && <p>{getElderlyDetails(booking).email}</p>}
                  <p>Start: {formatDate(booking.startDate)}</p>
                  <p>{booking.services?.length ? booking.services.join(", ") : "General support"}</p>
                </div>
                <div className="timeline-actions">
                  <span className={`status-chip ${booking.status}`}>{booking.status}</span>
                </div>
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
                <article
                  key={getRequestId(request) || `${request.elderlyName || "elderly"}-${request.startDate || "start"}`}
                  className="profile-card match-card"
                >
                  <div className="match-badge">🎯 Perfect Match</div>
                  <div className="profile-head">
                    <h3>{request.elderlyName || "Client Inquiry"}</h3>
                    <span className={`status-chip ${request.status}`}>{request.status}</span>
                  </div>
                  <div className="card-meta">
                    <p><strong>Skills Needed:</strong> {(request.specializations || []).join(", ") || "General care"}</p>
                    <p><strong>Hours/Week:</strong> {request.hoursPerWeek}h</p>
                    <p><strong>Rate:</strong> ${request.hourlyRate}/hr</p>
                  </div>
                  <div className="request-actions">
                    {request.status === "open" && (
                      <button 
                        className="btn-primary"
                        onClick={() => handleAcceptRequest(getRequestId(request), request)}
                        disabled={acceptingId === getRequestId(request)}
                      >
                        {acceptingId === getRequestId(request) ? "⏳..." : "✅ Accept"}
                      </button>
                    )}
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        const elderlyDetails = getRequestElderlyDetails(request);
                        openChatWith(elderlyDetails.id, { name: elderlyDetails.name, id: elderlyDetails.id });
                      }}
                    >
                      💬 Chat
                    </button>
                  </div>
                </article>
              ))}
            {filteredRequests.filter((req) => {
              const reqSpecs = (req.specializations || []).map((s) => s.toLowerCase());
              return expertise.some((skill) =>
                reqSpecs.some((spec) => skill.toLowerCase() === spec || spec.includes(skill.toLowerCase()))
              );
            }).length === 0 && (
              <p className="panel-empty">No perfect skill matches right now. Keep profile expertise updated for better matches.</p>
            )}
          </div>
        )}
      </section>
      </div>
    </>
  );
}

export default CompanionDashboard;
