import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "../context/UserContext";
import { getJobRequests, acceptJobRequest } from "../services/marketplaceService";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AdvancedChatBox from "../components/AdvancedChatBox";
import { motion, AnimatePresence } from "framer-motion";

// CSS Imports
import "../styles/dashboard.css";
import "../styles/advanced-chatbox.css";

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.07 } } };
const staggerFast = { show: { transition: { staggerChildren: 0.045 } } };
const slideIn = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Constants ────────────────────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { value: "open", label: "Open", emoji: "🟢" },
  { value: "accepted", label: "Accepted", emoji: "✅" },
  { value: "completed", label: "Completed", emoji: "🏁" },
  { value: "cancelled", label: "Cancelled", emoji: "❌" },
];

const STATUS_COLORS = {
  open: { bg: "rgba(45,212,191,0.12)", text: "#4ec9b8", border: "rgba(45,212,191,0.28)" },
  accepted: { bg: "rgba(91,191,173,0.12)", text: "#5bbfad", border: "rgba(91,191,173,0.25)" },
  confirmed: { bg: "rgba(91,191,173,0.12)", text: "#5bbfad", border: "rgba(91,191,173,0.25)" },
  "in-progress": { bg: "rgba(240,160,96,0.12)", text: "#f0a060", border: "rgba(240,160,96,0.25)" },
  pending: { bg: "rgba(240,160,96,0.12)", text: "#f0a060", border: "rgba(240,160,96,0.25)" },
  completed: { bg: "rgba(78,201,184,0.12)", text: "#4ec9b8", border: "rgba(78,201,184,0.22)" },
  cancelled: { bg: "rgba(224,112,112,0.1)", text: "#e07070", border: "rgba(224,112,112,0.22)" },
};

const NAV_SECTIONS = [
  { id: "cdash-overview", emoji: "📊", label: "Overview" },
  { id: "cdash-requests", emoji: "💼", label: "Requests" },
  { id: "cdash-shifts", emoji: "📅", label: "Shifts" },
  { id: "cdash-profile", emoji: "👤", label: "Profile" },
  { id: "cdash-matches", emoji: "🎯", label: "Matches" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const GlowOrb = ({ size, color, style, delay = 0 }) => (
  <motion.div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      filter: "blur(80px)",
      opacity: 0.09,
      pointerEvents: "none",
      ...style,
    }}
    animate={{ scale: [1, 1.2, 0.93, 1], x: [0, 20, -14, 0], y: [0, -18, 15, 0] }}
    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

const GridOverlay = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.01) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.01) 1px,transparent 1px)",
      backgroundSize: "64px 64px",
      pointerEvents: "none",
      zIndex: 0,
    }}
  />
);

const StatusChip = ({ status }) => {
  const key = status?.toLowerCase().replace(/\s+/g, "-");
  const colors = STATUS_COLORS[key] || { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.12)" };
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: 20,
        padding: "4px 12px",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
};

const StatCard = ({ icon, value, label, sublabel, trend, color, delay = 0 }) => (
  <motion.div
    variants={scaleIn}
    whileHover={{ y: -4, boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${color}33` }}
    style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "26px 24px",
      position: "relative",
      overflow: "hidden",
      cursor: "default",
      transition: "box-shadow 0.3s",
    }}
  >
    {/* Accent glow */}
    <div
      style={{
        position: "absolute",
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: "50%",
        background: color,
        filter: "blur(40px)",
        opacity: 0.15,
        pointerEvents: "none",
      }}
    />
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.7 }} />

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, position: "relative" }}>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          background: `${color}1a`,
          border: `1px solid ${color}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        {icon}
      </div>
      {trend !== undefined && (
        <div
          style={{
            background: trend >= 0 ? "rgba(78,201,184,0.12)" : "rgba(224,112,112,0.1)",
            color: trend >= 0 ? "#4ec9b8" : "#e07070",
            border: `1px solid ${trend >= 0 ? "rgba(78,201,184,0.25)" : "rgba(224,112,112,0.22)"}`,
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11.5,
            fontWeight: 700,
          }}
        >
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </div>
      )}
    </div>

    <div
      style={{
        fontSize: 32,
        fontWeight: 900,
        color: "#fff",
        letterSpacing: "-0.04em",
        lineHeight: 1,
        marginBottom: 6,
        background: `linear-gradient(135deg, #fff, ${color})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        position: "relative",
      }}
    >
      {value}
    </div>
    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13.5, fontWeight: 600, position: "relative" }}>{label}</div>
    {sublabel && (
      <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, marginTop: 4, position: "relative" }}>{sublabel}</div>
    )}
  </motion.div>
);

const RequestCard = ({ request, onAccept, onChat, acceptingId, index }) => {
  const isAccepting = acceptingId === request.id;
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -4, boxShadow: "0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(31,181,165,0.2)" }}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.25s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, #1fb5a5 ${index * 20}%, #2dd4bf)`,
          opacity: 0.7,
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(31,181,165,0.18), rgba(15,142,128,0.12))",
              border: "1px solid rgba(31,181,165,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            👴
          </div>
          <div>
            <h3 style={{ fontSize: 15.5, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>
              {request.elderlyName || "Care Seeker"}
            </h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>
              {request.location || "Location not specified"}
            </p>
          </div>
        </div>
        <StatusChip status={request.status} />
      </div>

      {/* Skill tags */}
      {request.specializations?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {request.specializations.map((s) => (
            <span
              key={s}
              style={{
                background: "rgba(91,191,173,0.1)",
                border: "1px solid rgba(91,191,173,0.2)",
                borderRadius: 8,
                padding: "3px 10px",
                fontSize: 11.5,
                color: "#7dd3cc",
                fontWeight: 600,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
        {request.hoursPerWeek && <span>⏱ {request.hoursPerWeek}h/week</span>}
        {request.hourlyRate && (
          <span style={{ color: "#5bbfad", fontWeight: 700, fontSize: 14 }}>
            💰 ${request.hourlyRate}/hr
          </span>
        )}
        {request.startDate && <span>📅 {new Date(request.startDate).toLocaleDateString()}</span>}
      </div>

      {request.description && (
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
            margin: "0 0 18px",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {request.description}
        </p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {request.status === "open" && (
          <motion.button
            onClick={() => onAccept(request.id, request)}
            disabled={isAccepting}
            whileHover={!isAccepting ? { scale: 1.03, boxShadow: "0 10px 28px rgba(31,181,165,0.38)" } : {}}
            whileTap={!isAccepting ? { scale: 0.97 } : {}}
            style={{
              flex: 1,
              padding: "11px",
              background: isAccepting ? "rgba(91,191,173,0.4)" : "linear-gradient(135deg, #1fb5a5, #0f8e80)",
              color: "#fff",
              border: "none",
              borderRadius: 11,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: isAccepting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              boxShadow: "0 6px 18px rgba(31,181,165,0.28)",
            }}
          >
            {isAccepting ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} style={{ display: "inline-block" }}>⟳</motion.span>
                Accepting…
              </>
            ) : "✅ Accept Job"}
          </motion.button>
        )}
        <motion.button
          onClick={() => onChat(request.elderlyId?._id || request.elderlyId, { name: request.elderlyName || "Client", id: request.elderlyId?._id || request.elderlyId })}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            flex: request.status === "open" ? "0 0 auto" : 1,
            padding: "11px 16px",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 11,
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          💬 Chat
        </motion.button>
      </div>
    </motion.article>
  );
};

const ShiftCard = ({ booking, onChat }) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -3, boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}
    style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 18,
      padding: "22px 20px",
      transition: "box-shadow 0.25s",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(31,181,165,0.15)", border: "1px solid rgba(31,181,165,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          👴
        </div>
        <div>
          <h4 style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", margin: 0 }}>{booking.elderlyId?.name || "Client"}</h4>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>Upcoming shift</p>
        </div>
      </div>
      <StatusChip status={booking.status} />
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
      <span>📅 {new Date(booking.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
      {booking.duration && <span>⏱ {booking.duration} hours</span>}
      {booking.totalCost && <span style={{ color: "#5bbfad", fontWeight: 700 }}>💰 ${booking.totalCost} total</span>}
    </div>

    <motion.button
      onClick={() => onChat(booking.elderlyId?._id, booking.elderlyId)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: "100%",
        padding: "10px",
        background: "rgba(31,181,165,0.1)",
        color: "#5bbfad",
        border: "1px solid rgba(31,181,165,0.22)",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
      }}
    >
      💬 Message Client
    </motion.button>
  </motion.div>
);

const BadgeCard = ({ badge }) => (
  <motion.div
    variants={scaleIn}
    whileHover={{ scale: 1.05, y: -2 }}
    style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: "18px 16px",
      textAlign: "center",
      cursor: "default",
    }}
  >
    <div style={{ fontSize: 34, marginBottom: 10 }}>{badge.icon || "🏅"}</div>
    <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{badge.name}</div>
    {badge.description && (
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, lineHeight: 1.5 }}>{badge.description}</div>
    )}
    {badge.earnedAt && (
      <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 11, marginTop: 8 }}>
        {new Date(badge.earnedAt).toLocaleDateString()}
      </div>
    )}
  </motion.div>
);

// Panel wrapper
const Panel = ({ id, title, badge, action, children, delay = 0, style = {} }) => (
  <motion.div
    id={id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    style={{
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 22,
      padding: "28px 26px",
      ...style,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
        {badge !== undefined && badge !== null && (
          <span
            style={{
              background: "rgba(31,181,165,0.15)",
              color: "#5bbfad",
              border: "1px solid rgba(31,181,165,0.28)",
              borderRadius: 12,
              padding: "2px 10px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {action && action}
    </div>
    {children}
  </motion.div>
);

const EmptyState = ({ icon, message, cta, onCta }) => (
  <div style={{ textAlign: "center", padding: "36px 20px" }}>
    <div style={{ fontSize: 38, marginBottom: 14 }}>{icon}</div>
    <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, lineHeight: 1.65, margin: "0 0 16px" }}>{message}</p>
    {cta && onCta && (
      <button
        onClick={onCta}
        style={{ background: "none", border: "none", color: "#5bbfad", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
      >
        {cta} →
      </button>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
function CompanionDashboard() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // Data state
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({ totalHours: 0, totalEarnings: 0, totalBookings: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [expertise, setExpertise] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [companionBio, setCompanionBio] = useState("");
  const [weeklyStats, setWeeklyStats] = useState({ hoursThisWeek: 0, earningsThisWeek: 0, newRequests: 0 });

  // Chat state
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [activeChatConversation, setActiveChatConversation] = useState(null);

  // UI state
  const [activeSection, setActiveSection] = useState("cdash-overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userId =
    user?.id ||
    user?._id ||
    JSON.parse(localStorage.getItem("user") || "null")?.id ||
    JSON.parse(localStorage.getItem("user") || "null")?._id ||
    "";

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const fetchCompanionDashboard = useCallback(
    async (silent = false) => {
      if (!userId) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const token = localStorage.getItem("token");

      try {
        // Parallel data fetching for speed
        const [requestsResp, userResp, badgesResp, bookingsResp, notifResp] = await Promise.allSettled([
          getJobRequests({ status: statusFilter }),
          fetch(`/api/profile/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/badges/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/bookings/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        // Requests
        if (requestsResp.status === "fulfilled" && requestsResp.value.success) {
          setFilteredRequests(requestsResp.value.data || []);
        }

        // User profile
        if (userResp.status === "fulfilled" && userResp.value.ok) {
          const userData = await userResp.value.json();
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
          setWeeklyStats({
            hoursThisWeek: profile.hoursThisWeek || 0,
            earningsThisWeek: profile.earningsThisWeek || 0,
            newRequests: profile.newRequests || 0,
          });
        }

        // Badges
        if (badgesResp.status === "fulfilled" && badgesResp.value.ok) {
          const d = await badgesResp.value.json();
          setBadges(d.badges || []);
        }

        // Bookings
        if (bookingsResp.status === "fulfilled" && bookingsResp.value.ok) {
          const d = await bookingsResp.value.json();
          const active = (d.bookings || []).filter((b) =>
            ["pending", "confirmed", "in-progress"].includes(b.status)
          );
          setRecentBookings(active.slice(0, 5));
        }

        // Notifications
        if (notifResp.status === "fulfilled" && notifResp.value.ok) {
          const d = await notifResp.value.json();
          setUnreadNotifications(d.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching companion dashboard:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, userId]
  );

  useEffect(() => {
    fetchCompanionDashboard();
  }, [fetchCompanionDashboard]);

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      NAV_SECTIONS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) setActiveSection(id);
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Derived data ───────────────────────────────────────────────────────────
  const chatContacts = useMemo(() => {
    const map = new Map();
    recentBookings.forEach((b) => {
      const id = b.elderlyId?._id;
      if (id) map.set(id, { id, name: b.elderlyId?.name || "Elderly Member", subtitle: b.status || "booking" });
    });
    filteredRequests.forEach((r) => {
      if (r.elderlyId) {
        map.set(r.elderlyId, { id: r.elderlyId, name: r.elderlyName || "Elderly Member", subtitle: r.status || "request" });
      }
    });
    return Array.from(map.values());
  }, [filteredRequests, recentBookings]);

  const matchedRequests = useMemo(() => {
    if (!expertise.length) return [];
    return filteredRequests
      .filter((req) => {
        const specs = (req.specializations || []).map((s) => s.toLowerCase());
        return expertise.some((skill) =>
          specs.some((s) => s.includes(skill.toLowerCase()) || skill.toLowerCase().includes(s))
        );
      })
      .slice(0, 4);
  }, [filteredRequests, expertise]);

  const searchedRequests = useMemo(() => {
    if (!searchQuery.trim()) return filteredRequests;
    const q = searchQuery.toLowerCase();
    return filteredRequests.filter(
      (r) =>
        r.elderlyName?.toLowerCase().includes(q) ||
        r.specializations?.some((s) => s.toLowerCase().includes(q)) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [filteredRequests, searchQuery]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const openChatWith = useCallback(
    async (otherUserId, userData) => {
      const token = localStorage.getItem("token");
      if (!otherUserId || !token) return;
      try {
        const resp = await fetch("/api/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ otherUserId }),
        });
        const data = await resp.json();
        if (data.success && data.conversation?._id) {
          setActiveChatUser(userData || { id: otherUserId, name: "User" });
          setActiveChatConversation(data.conversation._id);
        }
      } catch (err) {
        console.error("Unable to open conversation:", err);
      }
    },
    []
  );

  const handleAcceptRequest = useCallback(
    async (requestId, request) => {
      setAcceptingId(requestId);
      const response = await acceptJobRequest(requestId);
      if (response.success) {
        if (request?.elderlyId) {
          await openChatWith(request.elderlyId._id || request.elderlyId, {
            id: request.elderlyId._id || request.elderlyId,
            name: request.elderlyName || "Elderly Member",
          });
        }
        fetchCompanionDashboard(true);
      } else {
        alert(response.error || "Failed to accept request. Please try again.");
      }
      setAcceptingId(null);
    },
    [openChatWith, fetchCompanionDashboard]
  );

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/companion-login");
  }, [logout, navigate]);

  // ─── Loading screen ──────────────────────────────────────────────────────────
  if (loading && !filteredRequests.length) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #080f0e, #0d1f1e, #091a19)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        }}
      >
        <GlowOrb size={400} color="#1fb5a5" style={{ top: "20%", left: "20%" }} delay={0} />
        <GlowOrb size={300} color="#2dd4bf" style={{ bottom: "20%", right: "20%" }} delay={4} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{
            width: 52,
            height: 52,
            border: "4px solid rgba(31,181,165,0.18)",
            borderTopColor: "#1fb5a5",
            borderRadius: "50%",
          }}
        />
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, letterSpacing: "-0.01em" }}>
          Loading your dashboard…
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
          {["Fetching requests", "Loading profile", "Setting up"].map((s, i) => (
            <motion.span
              key={s}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}
            >
              {s}…
            </motion.span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #080f0e 0%, #0c1c1b 50%, #091a19 100%)",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: "#e8f5f3",
        position: "relative",
      }}
    >
      <GlowOrb size={600} color="#1fb5a5" style={{ top: "0px", left: "-200px" }} delay={0} />
      <GlowOrb size={400} color="#0f6b5e" style={{ bottom: "200px", right: "-150px" }} delay={6} />
      <GlowOrb size={300} color="#2dd4bf" style={{ top: "50%", right: "30%" }} delay={10} />
      <GridOverlay />

      {/* ─── Navbar ────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ─── Chat Overlay ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeChatUser && activeChatConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setActiveChatUser(null); setActiveChatConversation(null); }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
              zIndex: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "rgba(13,30,29,0.98)",
                border: "1px solid rgba(31,181,165,0.2)",
                borderRadius: 24,
                width: "min(600px, 95vw)",
                height: "min(700px, 90vh)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
              }}
            >
              {/* Chat header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 22px",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(31,181,165,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      background: "rgba(31,181,165,0.15)",
                      border: "1px solid rgba(31,181,165,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    👴
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{activeChatUser.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12 }}>
                      <span style={{ width: 6, height: 6, background: "#4ec9b8", borderRadius: "50%", display: "inline-block", marginRight: 5 }} />
                      Online
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => { setActiveChatUser(null); setActiveChatConversation(null); }}
                  whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 16,
                    fontFamily: "inherit",
                    transition: "background 0.2s",
                  }}
                >
                  ✕
                </motion.button>
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <AdvancedChatBox
                  otherUser={activeChatUser}
                  currentUser={user}
                  conversationId={activeChatConversation}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Dashboard Layout ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto", padding: "24px 32px 60px", gap: 24, position: "relative", zIndex: 1 }}>

        {/* ── Sidebar navigation ── */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          style={{
            width: 220,
            flexShrink: 0,
            position: "sticky",
            top: 88,
            height: "fit-content",
          }}
          className="dashboard-sidebar"
        >
          {/* Profile card */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: "20px 18px",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                margin: "0 auto 12px",
                boxShadow: "0 8px 24px rgba(31,181,165,0.35)",
              }}
            >
              {user?.name?.[0]?.toUpperCase() || "🤝"}
            </div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14.5 }}>
              {user?.name || "Companion"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, marginTop: 3 }}>
              {user?.email || ""}
            </div>
            {stats.rating > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 10 }}>
                <span style={{ color: "#f5c842", fontSize: 13 }}>★</span>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 13.5 }}>{stats.rating.toFixed(1)}</span>
              </div>
            )}
            {unreadNotifications > 0 && (
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  background: "rgba(224,112,112,0.15)",
                  border: "1px solid rgba(224,112,112,0.3)",
                  borderRadius: 20,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#f5a3a3",
                  marginTop: 10,
                }}
              >
                🔔 {unreadNotifications} new
              </motion.div>
            )}
          </div>

          {/* Nav links */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: "8px",
              marginBottom: 12,
            }}
          >
            {NAV_SECTIONS.map(({ id, emoji, label }) => (
              <motion.button
                key={id}
                onClick={() => scrollTo(id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: activeSection === id ? "rgba(31,181,165,0.12)" : "transparent",
                  border: `1px solid ${activeSection === id ? "rgba(31,181,165,0.25)" : "transparent"}`,
                  color: activeSection === id ? "#5bbfad" : "rgba(255,255,255,0.45)",
                  fontSize: 13.5,
                  fontWeight: activeSection === id ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  transition: "all 0.2s",
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 16 }}>{emoji}</span>
                {label}
              </motion.button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <motion.button
              onClick={() => navigate("/profile-edit")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: "100%",
                padding: "11px",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              ✏️ Edit Profile
            </motion.button>
            <motion.button
              onClick={() => fetchCompanionDashboard(true)}
              disabled={refreshing}
              whileHover={!refreshing ? { scale: 1.02 } : {}}
              whileTap={!refreshing ? { scale: 0.97 } : {}}
              style={{
                width: "100%",
                padding: "11px",
                background: "rgba(31,181,165,0.08)",
                color: "#5bbfad",
                border: "1px solid rgba(31,181,165,0.2)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                cursor: refreshing ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <motion.span
                animate={refreshing ? { rotate: 360 } : {}}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                style={{ display: "inline-block" }}
              >
                🔄
              </motion.span>
              Refresh
            </motion.button>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: "100%",
                padding: "11px",
                background: "rgba(224,112,112,0.07)",
                color: "#e07070",
                border: "1px solid rgba(224,112,112,0.18)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              🚪 Sign Out
            </motion.button>
          </div>
        </motion.aside>

        {/* ── Main content ── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}
          >
            <div>
              <h1 style={{ color: "#fff", fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 900, margin: 0, letterSpacing: "-0.035em" }}>
                Good{" "}
                {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
                <span style={{ background: "linear-gradient(135deg, #1fb5a5, #2dd4bf)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {user?.name?.split(" ")[0] || "Companion"}
                </span>{" "}
                👋
              </h1>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, margin: "4px 0 0" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                {unreadNotifications > 0 && (
                  <span style={{ color: "#f5a3a3", marginLeft: 12 }}>
                    • {unreadNotifications} unread notification{unreadNotifications > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>

            {/* Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "0 14px",
                width: 260,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 15 }}>🔍</span>
              <input
                type="text"
                placeholder="Search requests…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 14,
                  padding: "11px 0",
                  fontFamily: "inherit",
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 14, padding: "4px", borderRadius: 6 }}>✕</button>
              )}
            </div>
          </motion.div>

          {/* ── Overview: Stats ── */}
          <section id="cdash-overview">
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}
            >
              <StatCard icon="⭐" value={stats.rating > 0 ? stats.rating.toFixed(1) : "–"} label="Your Rating" sublabel={stats.totalBookings > 0 ? `From ${stats.totalBookings} bookings` : "No ratings yet"} color="#f5c842" />
              <StatCard icon="💰" value={`$${stats.totalEarnings.toLocaleString()}`} label="Total Earned" sublabel={weeklyStats.earningsThisWeek > 0 ? `$${weeklyStats.earningsThisWeek} this week` : "All time"} trend={weeklyStats.earningsThisWeek > 0 ? 12 : undefined} color="#1fb5a5" />
              <StatCard icon="⏱" value={stats.totalHours} label="Total Hours" sublabel={weeklyStats.hoursThisWeek > 0 ? `${weeklyStats.hoursThisWeek}h this week` : "All sessions"} color="#2dd4bf" />
              <StatCard icon="📋" value={stats.totalBookings} label="Total Jobs" sublabel={`${filteredRequests.length} active requests`} color="#17a498" />
              <StatCard icon="🏅" value={badges.length} label="Badges Earned" sublabel="Verified skills" color="#f0a060" />
              <StatCard icon="💬" value={chatContacts.length} label="Connections" sublabel="Active clients" color="#a78bfa" />
            </motion.div>
          </section>

          {/* ── Job Requests ── */}
          <Panel
            id="cdash-requests"
            title="💼 Job Requests"
            badge={searchedRequests.length}
            delay={0.15}
            action={
              <div style={{ display: "flex", gap: 6 }}>
                {FILTER_OPTIONS.map(({ value, label, emoji }) => (
                  <motion.button
                    key={value}
                    onClick={() => { setStatusFilter(value); setSearchQuery(""); }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: "7px 13px",
                      borderRadius: 20,
                      background:
                        statusFilter === value
                          ? "linear-gradient(135deg, #1fb5a5, #0f8e80)"
                          : "rgba(255,255,255,0.05)",
                      border: `1px solid ${statusFilter === value ? "transparent" : "rgba(255,255,255,0.1)"}`,
                      color: statusFilter === value ? "#fff" : "rgba(255,255,255,0.45)",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.2s",
                    }}
                  >
                    {emoji} {label}
                  </motion.button>
                ))}
              </div>
            }
          >
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                  style={{ width: 36, height: 36, border: "3px solid rgba(31,181,165,0.18)", borderTopColor: "#1fb5a5", borderRadius: "50%" }}
                />
              </div>
            ) : searchedRequests.length === 0 ? (
              <EmptyState
                icon="📭"
                message={
                  searchQuery
                    ? `No requests found matching "${searchQuery}".`
                    : `No ${statusFilter} requests right now. Check back soon or try a different filter.`
                }
                cta={searchQuery ? "Clear search" : undefined}
                onCta={searchQuery ? () => setSearchQuery("") : undefined}
              />
            ) : (
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}
              >
                {searchedRequests.map((request, i) => (
                  <RequestCard
                    key={request.id || request._id}
                    request={request}
                    onAccept={handleAcceptRequest}
                    onChat={openChatWith}
                    acceptingId={acceptingId}
                    index={i}
                  />
                ))}
              </motion.div>
            )}
          </Panel>

          {/* ── Upcoming Shifts ── */}
          <Panel
            id="cdash-shifts"
            title="📅 Upcoming Shifts"
            badge={recentBookings.length}
            delay={0.2}
          >
            {recentBookings.length === 0 ? (
              <EmptyState
                icon="📆"
                message="No upcoming shifts scheduled. Accept job requests to fill your calendar."
              />
            ) : (
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}
              >
                {recentBookings.map((booking) => (
                  <ShiftCard key={booking._id} booking={booking} onChat={openChatWith} />
                ))}
              </motion.div>
            )}
          </Panel>

          {/* ── Profile: two-column grid ── */}
          <div id="cdash-profile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Expertise */}
            <Panel
              title="🛠 Skills & Expertise"
              badge={expertise.length}
              delay={0.25}
              action={
                <motion.button
                  onClick={() => navigate("/profile-edit")}
                  whileHover={{ scale: 1.03 }}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 14px", color: "rgba(255,255,255,0.5)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  ✏️ Edit
                </motion.button>
              }
            >
              {expertise.length === 0 ? (
                <EmptyState
                  icon="🏷️"
                  message="No skills added yet. Add your expertise to appear in more searches."
                  cta="Add skills"
                  onCta={() => navigate("/profile-edit")}
                />
              ) : (
                <motion.div
                  variants={staggerFast}
                  initial="hidden"
                  animate="show"
                  style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                >
                  {expertise.map((skill) => (
                    <motion.span
                      key={skill}
                      variants={scaleIn}
                      whileHover={{ scale: 1.05 }}
                      style={{
                        background: "rgba(31,181,165,0.1)",
                        border: "1px solid rgba(31,181,165,0.25)",
                        borderRadius: 20,
                        padding: "6px 14px",
                        fontSize: 13,
                        color: "#5bbfad",
                        fontWeight: 600,
                      }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </Panel>

            {/* Certifications */}
            <Panel
              title="🏅 Certifications"
              badge={certifications.length}
              delay={0.28}
              action={
                <motion.button
                  onClick={() => navigate("/profile-edit")}
                  whileHover={{ scale: 1.03 }}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 14px", color: "rgba(255,255,255,0.5)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  + Add
                </motion.button>
              }
            >
              {certifications.length === 0 ? (
                <EmptyState
                  icon="📜"
                  message="No certifications added. Credentials build trust with care seekers."
                  cta="Add credentials"
                  onCta={() => navigate("/profile-edit")}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {certifications.map((cert, idx) => (
                    <motion.div
                      key={idx}
                      variants={slideIn}
                      initial="hidden"
                      animate="show"
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "12px 14px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 13,
                      }}
                    >
                      <span style={{ fontSize: 22, flexShrink: 0 }}>📜</span>
                      <div>
                        <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>{cert.name || cert}</p>
                        {cert.issuer && <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 12.5, margin: "3px 0 0" }}>Issued by: {cert.issuer}</p>}
                        {cert.expiryDate && (
                          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, margin: "2px 0 0" }}>
                            Valid until: {new Date(cert.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* ── Professional Bio ── */}
          <Panel
            title="👤 Professional Profile"
            delay={0.32}
            action={
              <motion.button
                onClick={() => navigate("/profile-edit")}
                whileHover={{ scale: 1.03 }}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 14px", color: "rgba(255,255,255,0.5)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                ✏️ Edit Bio
              </motion.button>
            }
          >
            {companionBio ? (
              <>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.75, margin: "0 0 24px" }}>
                  {companionBio}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                    paddingTop: 20,
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {[
                    { val: stats.rating > 0 ? stats.rating.toFixed(1) : "–", label: "Rating", icon: "⭐" },
                    { val: stats.totalHours, label: "Hours", icon: "⏱" },
                    { val: stats.totalBookings, label: "Bookings", icon: "📋" },
                    { val: `$${stats.totalEarnings.toLocaleString()}`, label: "Earned", icon: "💰" },
                  ].map(({ val, label, icon }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em" }}>{val}</div>
                      <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12.5, marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon="👤"
                message="No professional bio yet. A compelling bio increases your chances of getting hired."
                cta="Write your bio"
                onCta={() => navigate("/profile-edit")}
              />
            )}
          </Panel>

          {/* ── Badges ── */}
          {badges.length > 0 && (
            <Panel
              title="🏆 Achievement Badges"
              badge={badges.length}
              delay={0.36}
            >
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}
              >
                {badges.map((badge, i) => (
                  <BadgeCard key={i} badge={badge} />
                ))}
              </motion.div>
            </Panel>
          )}

          {/* ── Skill-Matched Requests ── */}
          <Panel
            id="cdash-matches"
            title="🎯 Requests Matching Your Skills"
            badge={matchedRequests.length || undefined}
            delay={0.4}
          >
            {expertise.length === 0 ? (
              <EmptyState
                icon="🎯"
                message="Add expertise areas to see personalized job recommendations here."
                cta="Add skills"
                onCta={() => navigate("/profile-edit")}
              />
            ) : matchedRequests.length === 0 ? (
              <EmptyState
                icon="🔍"
                message="No skill-matched requests at this time. We'll notify you when matches appear."
              />
            ) : (
              <>
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13.5, marginBottom: 18 }}>
                  These requests specifically need your skills — apply now for the best chance.
                </p>
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}
                >
                  {matchedRequests.map((request, i) => (
                    <motion.div key={request.id || request._id} variants={fadeUp} style={{ position: "relative" }}>
                      {/* Match badge */}
                      <div
                        style={{
                          position: "absolute",
                          top: -8,
                          left: 16,
                          zIndex: 10,
                          background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                          color: "#fff",
                          fontSize: 10.5,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          padding: "3px 10px",
                          borderRadius: 8,
                          boxShadow: "0 4px 12px rgba(31,181,165,0.4)",
                          textTransform: "uppercase",
                        }}
                      >
                        🎯 Skill Match
                      </div>
                      <RequestCard
                        request={request}
                        onAccept={handleAcceptRequest}
                        onChat={openChatWith}
                        acceptingId={acceptingId}
                        index={i}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}
          </Panel>

          {/* ── Chat Contacts quick access ── */}
          {chatContacts.length > 0 && (
            <Panel
              title="💬 Quick Chat"
              badge={chatContacts.length}
              delay={0.44}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {chatContacts.map(({ id, name, subtitle }) => (
                  <motion.button
                    key={id}
                    onClick={() => openChatWith(id, { id, name })}
                    whileHover={{ scale: 1.04, boxShadow: "0 10px 28px rgba(0,0,0,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: "rgba(31,181,165,0.15)",
                        border: "1px solid rgba(31,181,165,0.22)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                      }}
                    >
                      👴
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 13.5 }}>{name}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, textTransform: "capitalize" }}>{subtitle}</div>
                    </div>
                    <span style={{ color: "#5bbfad", fontSize: 14, marginLeft: 4 }}>→</span>
                  </motion.button>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* ─── Request Details Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRequest(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
              zIndex: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "rgba(13,30,29,0.98)",
                border: "1px solid rgba(31,181,165,0.2)",
                borderRadius: 24,
                padding: "36px 36px",
                width: "min(540px, 95vw)",
                maxHeight: "85vh",
                overflowY: "auto",
                boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
              }}
            >
              <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                📋 {selectedRequest.elderlyName}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 24px" }}>Request Details</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
                {[
                  { icon: "💼", label: "Required Skills", value: selectedRequest.specializations?.join(", ") },
                  { icon: "⏱", label: "Hours per Week", value: `${selectedRequest.hoursPerWeek}h` },
                  { icon: "💰", label: "Hourly Rate", value: `$${selectedRequest.hourlyRate}/hr` },
                  { icon: "📅", label: "Start Date", value: new Date(selectedRequest.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
                      <div style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>{value}</div>
                    </div>
                  </div>
                ))}
                {selectedRequest.description && (
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>📝</span>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Description</div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7 }}>{selectedRequest.description}</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setSelectedRequest(null)}
                  style={{ flex: "0 0 auto", padding: "12px 22px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Close
                </button>
                {selectedRequest.status === "open" && (
                  <motion.button
                    onClick={() => { handleAcceptRequest(selectedRequest.id, selectedRequest); setSelectedRequest(null); }}
                    whileHover={{ scale: 1.03, boxShadow: "0 14px 36px rgba(31,181,165,0.38)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ✅ Accept Job
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CompanionDashboard;