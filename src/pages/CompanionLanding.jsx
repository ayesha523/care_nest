import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getJobRequests } from "../services/marketplaceService";
import { useUser } from "../context/UserContext";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.55 } },
};
const stagger = { show: { transition: { staggerChildren: 0.09 } } };
const staggerFast = { show: { transition: { staggerChildren: 0.055 } } };
const slideLeft = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const slideRight = {
  hidden: { opacity: 0, x: 28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Constants ───────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Companion · 2 years",
    avatar: "🧑‍⚕️",
    stars: 5,
    quote:
      "CareNest gave me purpose and a steady income. The platform is so easy to use — I found my first client within 48 hours of signing up.",
  },
  {
    name: "David K.",
    role: "Companion · 3 years",
    avatar: "👨‍🦱",
    stars: 5,
    quote:
      "I retired from nursing but still wanted to make a difference. CareNest connected me with seniors who genuinely need my skills.",
  },
  {
    name: "Priya R.",
    role: "Companion · 1 year",
    avatar: "👩",
    stars: 5,
    quote:
      "The flexibility is unmatched. I set my own hours, pick clients that fit me, and the earnings are the best I've found in this field.",
  },
  {
    name: "James T.",
    role: "Companion · 4 years",
    avatar: "🧔",
    stars: 5,
    quote:
      "Beyond a job — it's a calling. The dashboard makes scheduling and communication effortless so I can focus on what matters.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "📝",
    title: "Create Your Profile",
    desc: "Sign up in minutes. Highlight your skills, certifications, and availability to stand out to care seekers.",
  },
  {
    step: "02",
    icon: "🔍",
    title: "Browse Open Requests",
    desc: "Explore care requests matched to your expertise. Filter by skills, schedule, and pay rate.",
  },
  {
    step: "03",
    icon: "✅",
    title: "Accept & Connect",
    desc: "Accept a job and immediately open a private chat with your new client to coordinate care.",
  },
  {
    step: "04",
    icon: "💳",
    title: "Get Paid Reliably",
    desc: "Track your hours and earnings directly in your dashboard. Payments processed securely every week.",
  },
];

const BENEFITS = [
  { icon: "🕐", title: "Flexible Hours", desc: "Choose shifts that fit your lifestyle. Full-time, part-time, or weekend-only — you decide." },
  { icon: "💰", title: "Competitive Pay", desc: "Set your own hourly rate and negotiate directly. Top companions earn $28–$42/hr." },
  { icon: "🏅", title: "Earn Badges", desc: "Build credibility with verified skill badges and performance milestones displayed on your profile." },
  { icon: "🔒", title: "Safe & Verified", desc: "Every companion and care seeker is identity-verified. Our trust framework protects you." },
  { icon: "📱", title: "Real-time Chat", desc: "Built-in messaging keeps communication seamless between you and your clients, 24/7." },
  { icon: "📈", title: "Career Growth", desc: "Access training resources, earn certifications, and grow your professional reputation over time." },
];

const STATS = [
  { value: "12,400+", label: "Active Companions", icon: "🤝" },
  { value: "98%", label: "Satisfaction Rate", icon: "⭐" },
  { value: "$36", label: "Avg. Hourly Rate", icon: "💰" },
  { value: "48hr", label: "Avg. Time to First Job", icon: "⚡" },
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
      opacity: 0.11,
      pointerEvents: "none",
      ...style,
    }}
    animate={{ scale: [1, 1.18, 0.94, 1], x: [0, 22, -14, 0], y: [0, -22, 16, 0] }}
    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

const GridOverlay = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)",
      backgroundSize: "64px 64px",
      pointerEvents: "none",
    }}
  />
);

const StarRow = ({ count = 5 }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} style={{ color: "#f5c842", fontSize: 13 }}>★</span>
    ))}
  </div>
);

const SectionLabel = ({ children }) => (
  <motion.div
    variants={fadeIn}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: "rgba(31,181,165,0.1)",
      border: "1px solid rgba(31,181,165,0.28)",
      borderRadius: 20,
      padding: "6px 18px",
      fontSize: 12.5,
      color: "#5bbfad",
      fontWeight: 700,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      marginBottom: 20,
    }}
  >
    {children}
  </motion.div>
);

const RequestCard = ({ req, user, index }) => (
  <motion.article
    variants={fadeUp}
    whileHover={{ y: -5, boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(31,181,165,0.25)" }}
    style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "26px",
      position: "relative",
      overflow: "hidden",
      cursor: "default",
      transition: "box-shadow 0.25s",
    }}
  >
    {/* Top accent bar */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, #1fb5a5 ${index * 20}%, #2dd4bf)`,
        opacity: 0.8,
      }}
    />

    {/* Header */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(31,181,165,0.2), rgba(15,142,128,0.2))",
            border: "1px solid rgba(31,181,165,0.25)",
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
            {req.elderlyName || "Care Seeker"}
          </h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", margin: "2px 0 0" }}>
            {req.location || "Location not specified"}
          </p>
        </div>
      </div>
      <span
        style={{
          background: "rgba(45,212,191,0.12)",
          color: "#4ec9b8",
          border: "1px solid rgba(45,212,191,0.28)",
          borderRadius: 20,
          padding: "4px 12px",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Open
      </span>
    </div>

    {/* Meta info */}
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, fontSize: 13, color: "rgba(255,255,255,0.48)" }}>
      {req.specializations?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {req.specializations.map((s) => (
            <span
              key={s}
              style={{
                background: "rgba(91,191,173,0.1)",
                border: "1px solid rgba(91,191,173,0.2)",
                borderRadius: 8,
                padding: "2px 9px",
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
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
        {req.hoursPerWeek && <span>⏱ {req.hoursPerWeek}h/week</span>}
        {req.hourlyRate && (
          <span style={{ color: "#5bbfad", fontWeight: 700 }}>
            💰 ${req.hourlyRate}/hr
          </span>
        )}
        {req.startDate && <span>📅 {new Date(req.startDate).toLocaleDateString()}</span>}
      </div>
    </div>

    {req.description && (
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.35)",
          margin: "0 0 18px",
          lineHeight: 1.65,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {req.description}
      </p>
    )}

    <Link
      to={user ? "/companion-dashboard" : "/companion-signup"}
      style={{
        display: "block",
        textAlign: "center",
        background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
        color: "#fff",
        textDecoration: "none",
        borderRadius: 11,
        padding: "11px",
        fontSize: 13.5,
        fontWeight: 700,
        boxShadow: "0 6px 20px rgba(31,181,165,0.3)",
        letterSpacing: "-0.01em",
      }}
    >
      {user ? "View in Dashboard →" : "Join to Apply →"}
    </Link>
  </motion.article>
);

const TestimonialCard = ({ t, active }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.94 }}
    animate={{ opacity: active ? 1 : 0.45, scale: active ? 1 : 0.96 }}
    transition={{ duration: 0.4 }}
    style={{
      background: active
        ? "rgba(31,181,165,0.08)"
        : "rgba(255,255,255,0.03)",
      border: `1px solid ${active ? "rgba(31,181,165,0.3)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 20,
      padding: "28px 30px",
      minWidth: 300,
      maxWidth: 360,
      boxShadow: active ? "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(31,181,165,0.15)" : "none",
      transition: "all 0.35s ease",
    }}
  >
    <StarRow count={t.stars} />
    <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 14.5, lineHeight: 1.7, margin: "14px 0 20px", fontStyle: "italic" }}>
      "{t.quote}"
    </p>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "linear-gradient(135deg, rgba(31,181,165,0.2), rgba(45,212,191,0.2))",
          border: "1px solid rgba(31,181,165,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {t.avatar}
      </div>
      <div>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>{t.name}</p>
        <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 12.5, margin: "2px 0 0" }}>{t.role}</p>
      </div>
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
function CompanionLanding() {
  const { user } = useUser();
  const navigate = useNavigate();
  const heroRef = useRef(null);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [inquiry, setInquiry] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    skill: "",
    note: "",
  });
  const [inquiryError, setInquiryError] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [focused, setFocused] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Parallax
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  // Testimonial auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((i) => (i + 1) % TESTIMONIALS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Nav scroll detection
  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch job requests
  useEffect(() => {
    let isMounted = true;
    setLoadingRequests(true);
    getJobRequests({ status: "open" }).then((response) => {
      if (!isMounted) return;
      if (response.success) {
        setRequests(Array.isArray(response.data) ? response.data : []);
        setRequestsError("");
      } else {
        setRequests([]);
        setRequestsError(response.error || "Unable to load job requests.");
      }
      setLoadingRequests(false);
    });
    return () => { isMounted = false; };
  }, []);

  const availableSkills = useMemo(() => {
    const skills = requests.flatMap((r) => r.specializations || []);
    return [...new Set(skills)].sort();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (!skillFilter) return requests.slice(0, 6);
    return requests
      .filter((r) =>
        (r.specializations || []).some((s) => s.toLowerCase() === skillFilter.toLowerCase())
      )
      .slice(0, 6);
  }, [requests, skillFilter]);

  const handleInquirySubmit = useCallback(
    (e) => {
      e.preventDefault();
      setInquiryError("");
      setInquirySuccess("");
      if (inquiry.fullName.trim().length < 2) {
        setInquiryError("Please enter your full name.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email.trim())) {
        setInquiryError("Please enter a valid email.");
        return;
      }
      if (!inquiry.note.trim()) {
        setInquiryError("Please add a short note.");
        return;
      }
      setSubmittingInquiry(true);
      setTimeout(() => {
        setInquirySuccess("Inquiry submitted! We'll reach out within 24 hours. 🎉");
        setInquiry((prev) => ({ ...prev, skill: "", note: "" }));
        setSubmittingInquiry(false);
      }, 1400);
    },
    [inquiry]
  );

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  const getBorder = (f) =>
    focused === f ? "#5bbfad" : "rgba(134,193,182,0.22)";
  const getShadow = (f) =>
    focused === f ? "0 0 0 3px rgba(91,191,173,0.14)" : "none";
  const inputStyle = (f) => ({
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: `1.5px solid ${getBorder(f)}`,
    borderRadius: 13,
    padding: "14px 16px",
    color: "#fff",
    fontSize: 14.5,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: getShadow(f),
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a1918",
        color: "#e8f5f3",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ─── Navbar ──────────────────────────────────────────────────────── */}
      <motion.nav
        style={{
          background: navScrolled
            ? "rgba(10,25,24,0.96)"
            : "rgba(10,25,24,0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: navScrolled
            ? "1px solid rgba(31,181,165,0.16)"
            : "1px solid rgba(31,181,165,0.07)",
          padding: "0 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
          position: "sticky",
          top: 0,
          zIndex: 200,
          transition: "background 0.3s, border-color 0.3s",
        }}
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <div
            style={{
              width: 38,
              height: 38,
              background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 19,
              boxShadow: "0 6px 18px rgba(31,181,165,0.35)",
            }}
          >
            🤝
          </div>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>
            CareNest
          </span>
        </Link>

        {/* Desktop nav links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            fontSize: 14,
            fontWeight: 500,
          }}
          className="nav-links"
        >
          {[
            ["How It Works", "how-it-works"],
            ["Benefits", "benefits"],
            ["Open Requests", "requests"],
            ["Reviews", "testimonials"],
          ].map(([label, id]) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.52)",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#5bbfad")}
              onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.52)")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <motion.button
              whileHover={{ y: -1, boxShadow: "0 14px 36px rgba(31,181,165,0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/companion-dashboard")}
              style={{
                background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                color: "#fff",
                border: "none",
                borderRadius: 11,
                padding: "10px 22px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 14,
                boxShadow: "0 6px 20px rgba(31,181,165,0.3)",
              }}
            >
              Go to Dashboard →
            </motion.button>
          ) : (
            <>
              <Link
                to="/companion-login"
                style={{
                  color: "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "9px 16px",
                  borderRadius: 10,
                  transition: "color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Sign In
              </Link>
              <motion.div whileHover={{ y: -1, boxShadow: "0 14px 36px rgba(31,181,165,0.38)" }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/companion-signup"
                  style={{
                    background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                    color: "#fff",
                    textDecoration: "none",
                    borderRadius: 11,
                    padding: "10px 22px",
                    fontWeight: 700,
                    fontSize: 14,
                    display: "block",
                    boxShadow: "0 6px 20px rgba(31,181,165,0.3)",
                  }}
                >
                  Join Now →
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </motion.nav>

      {/* ─── Hero Section ────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          padding: "110px 40px 90px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          minHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GlowOrb size={560} color="#1fb5a5" style={{ top: "-180px", left: "-180px" }} delay={0} />
        <GlowOrb size={420} color="#0f6b5e" style={{ bottom: "-120px", right: "-120px" }} delay={4} />
        <GlowOrb size={280} color="#2dd4bf" style={{ top: "35%", right: "10%" }} delay={8} />
        <GlowOrb size={200} color="#17a498" style={{ bottom: "20%", left: "6%" }} delay={2} />
        <GridOverlay />

        <motion.div style={{ y: heroY, opacity: heroOpacity, position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto" }}>
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeIn}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(31,181,165,0.11)",
                  border: "1px solid rgba(31,181,165,0.28)",
                  borderRadius: 20,
                  padding: "7px 20px",
                  fontSize: 13,
                  color: "#5bbfad",
                  fontWeight: 700,
                  marginBottom: 30,
                  letterSpacing: "0.04em",
                }}
              >
                <span style={{ width: 7, height: 7, background: "#5bbfad", borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" }} />
                ✨ 12,400+ Companions Earning on CareNest
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              style={{
                fontSize: "clamp(38px, 6vw, 72px)",
                fontWeight: 900,
                color: "#fff",
                margin: "0 0 22px",
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
              }}
            >
              Turn Your Care into
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #1fb5a5, #2dd4bf, #5bbfad)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                A Rewarding Career
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              style={{
                color: "rgba(255,255,255,0.52)",
                fontSize: "clamp(15px, 2.5vw, 19px)",
                lineHeight: 1.7,
                maxWidth: 580,
                margin: "0 auto 44px",
              }}
            >
              Connect with seniors who need your skills. Set your own hours, earn competitive pay, and build meaningful relationships — all through one trusted platform.
            </motion.p>

            <motion.div
              variants={fadeUp}
              style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
            >
              <Link
                to="/companion-signup"
                style={{
                  background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 14,
                  padding: "15px 34px",
                  fontWeight: 800,
                  fontSize: 16,
                  boxShadow: "0 12px 36px rgba(31,181,165,0.42), inset 0 1px 0 rgba(255,255,255,0.15)",
                  letterSpacing: "-0.01em",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 20px 50px rgba(31,181,165,0.5), inset 0 1px 0 rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 12px 36px rgba(31,181,165,0.42), inset 0 1px 0 rgba(255,255,255,0.15)";
                }}
              >
                Start Your Journey →
              </Link>
              <button
                onClick={() => scrollToSection("requests")}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: "15px 30px",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  backdropFilter: "blur(10px)",
                  transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                }}
              >
                Browse Open Requests
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeIn}
              style={{
                display: "flex",
                gap: 28,
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: 48,
                paddingTop: 40,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {["🔐 Secure & Verified", "⚡ 48hr to First Job", "💳 Weekly Payouts", "🤝 12k+ Companions"].map((b) => (
                <span key={b} style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 500 }}>
                  {b}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          style={{ position: "absolute", bottom: 36, left: "50%", x: "-50%", zIndex: 2 }}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            style={{
              width: 30,
              height: 50,
              border: "2px solid rgba(255,255,255,0.15)",
              borderRadius: 15,
              display: "flex",
              justifyContent: "center",
              paddingTop: 10,
            }}
          >
            <motion.div
              style={{
                width: 4,
                height: 10,
                background: "#5bbfad",
                borderRadius: 2,
              }}
              animate={{ y: [0, 14, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </section>

      {/* ─── Stats Bar ───────────────────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
        style={{
          background: "rgba(31,181,165,0.06)",
          borderTop: "1px solid rgba(31,181,165,0.12)",
          borderBottom: "1px solid rgba(31,181,165,0.12)",
          padding: "40px 40px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
          }}
        >
          {STATS.map(({ value, label, icon }) => (
            <motion.div
              key={label}
              variants={scaleIn}
              style={{ textAlign: "center", padding: "20px 16px" }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "-0.04em",
                  background: "linear-gradient(135deg, #fff, #a0e8df)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {value}
              </div>
              <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>
                {label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ─── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "100px 40px", position: "relative", overflow: "hidden" }}>
        <GlowOrb size={500} color="#1fb5a5" style={{ top: "10%", left: "-200px" }} delay={2} />
        <GridOverlay />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            style={{ textAlign: "center", marginBottom: 70 }}
          >
            <SectionLabel>📋 Process</SectionLabel>
            <motion.h2
              variants={fadeUp}
              style={{
                fontSize: "clamp(28px, 4vw, 46px)",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.035em",
                margin: "0 0 16px",
              }}
            >
              How It Works
            </motion.h2>
            <motion.p
              variants={fadeUp}
              style={{
                color: "rgba(255,255,255,0.44)",
                fontSize: 16.5,
                maxWidth: 500,
                margin: "0 auto",
                lineHeight: 1.65,
              }}
            >
              From signup to your first paycheck — here's what to expect on CareNest.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                whileHover={{ y: -6, boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(31,181,165,0.2)" }}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 22,
                  padding: "36px 30px",
                  position: "relative",
                  overflow: "hidden",
                  transition: "box-shadow 0.3s",
                }}
              >
                {/* Step number watermark */}
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    fontSize: 80,
                    fontWeight: 900,
                    color: "rgba(31,181,165,0.06)",
                    lineHeight: 1,
                    userSelect: "none",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {item.step}
                </div>

                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: -12,
                      width: 24,
                      height: 2,
                      background: "linear-gradient(90deg, rgba(31,181,165,0.4), transparent)",
                      zIndex: 2,
                    }}
                  />
                )}

                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, rgba(31,181,165,0.2), rgba(45,212,191,0.1))",
                    border: "1px solid rgba(31,181,165,0.28)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    marginBottom: 22,
                    boxShadow: "0 8px 24px rgba(31,181,165,0.15)",
                  }}
                >
                  {item.icon}
                </div>

                <div
                  style={{
                    display: "inline-block",
                    background: "rgba(31,181,165,0.1)",
                    color: "#5bbfad",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    padding: "3px 10px",
                    borderRadius: 8,
                    marginBottom: 14,
                    textTransform: "uppercase",
                  }}
                >
                  Step {item.step}
                </div>

                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#fff",
                    margin: "0 0 10px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.46)", fontSize: 14, lineHeight: 1.65, margin: 0 }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Benefits ────────────────────────────────────────────────────── */}
      <section id="benefits" style={{ padding: "100px 40px", background: "rgba(255,255,255,0.015)", position: "relative", overflow: "hidden" }}>
        <GlowOrb size={400} color="#2dd4bf" style={{ top: "20%", right: "-150px" }} delay={6} />
        <GridOverlay />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            style={{ textAlign: "center", marginBottom: 70 }}
          >
            <SectionLabel>✨ Why CareNest</SectionLabel>
            <motion.h2
              variants={fadeUp}
              style={{
                fontSize: "clamp(28px, 4vw, 46px)",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.035em",
                margin: "0 0 16px",
              }}
            >
              Everything You Need to Thrive
            </motion.h2>
            <motion.p
              variants={fadeUp}
              style={{ color: "rgba(255,255,255,0.44)", fontSize: 16.5, maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}
            >
              Built by caregivers, for caregivers. Every feature is designed to make your work easier and more rewarding.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                variants={fadeUp}
                whileHover={{ y: -4, borderColor: "rgba(31,181,165,0.28)" }}
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 18,
                  padding: "30px 28px",
                  display: "flex",
                  gap: 20,
                  alignItems: "flex-start",
                  transition: "border-color 0.25s, transform 0.25s",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 13,
                    background: "linear-gradient(135deg, rgba(31,181,165,0.18), rgba(45,212,191,0.08))",
                    border: "1px solid rgba(31,181,165,0.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 23,
                    flexShrink: 0,
                  }}
                >
                  {b.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                    {b.title}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.44)", fontSize: 13.5, lineHeight: 1.65, margin: 0 }}>
                    {b.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Open Requests ───────────────────────────────────────────────── */}
      <section id="requests" style={{ padding: "100px 40px", position: "relative", overflow: "hidden" }}>
        <GlowOrb size={450} color="#0f6b5e" style={{ bottom: "-100px", left: "-150px" }} delay={3} />
        <GridOverlay />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            style={{ textAlign: "center", marginBottom: 50 }}
          >
            <SectionLabel>💼 Marketplace</SectionLabel>
            <motion.h2
              variants={fadeUp}
              style={{
                fontSize: "clamp(28px, 4vw, 46px)",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.035em",
                margin: "0 0 16px",
              }}
            >
              Open Care Requests
            </motion.h2>
            <motion.p
              variants={fadeUp}
              style={{ color: "rgba(255,255,255,0.44)", fontSize: 16.5, maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}
            >
              Browse live requests from seniors seeking compassionate companions with your skills.
            </motion.p>
          </motion.div>

          {/* Skill filter */}
          {availableSkills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: 40,
              }}
            >
              <button
                onClick={() => setSkillFilter("")}
                style={{
                  background: !skillFilter ? "linear-gradient(135deg, #1fb5a5, #0f8e80)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${!skillFilter ? "transparent" : "rgba(255,255,255,0.1)"}`,
                  color: !skillFilter ? "#fff" : "rgba(255,255,255,0.5)",
                  borderRadius: 24,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                All Skills
              </button>
              {availableSkills.map((s) => (
                <button
                  key={s}
                  onClick={() => setSkillFilter(s)}
                  style={{
                    background: skillFilter === s ? "linear-gradient(135deg, #1fb5a5, #0f8e80)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${skillFilter === s ? "transparent" : "rgba(255,255,255,0.1)"}`,
                    color: skillFilter === s ? "#fff" : "rgba(255,255,255,0.5)",
                    borderRadius: 24,
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}

          {loadingRequests ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                style={{
                  width: 40,
                  height: 40,
                  border: "3px solid rgba(31,181,165,0.18)",
                  borderTopColor: "#1fb5a5",
                  borderRadius: "50%",
                  margin: "0 auto 14px",
                }}
              />
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Loading care requests…</p>
            </div>
          ) : requestsError ? (
            <div
              style={{
                background: "rgba(224,112,112,0.08)",
                border: "1px solid rgba(224,112,112,0.2)",
                borderRadius: 16,
                padding: "24px 28px",
                color: "rgba(255,150,150,0.8)",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              ⚠️ {requestsError}
            </div>
          ) : filteredRequests.length === 0 ? (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.32)", padding: "60px 0", fontSize: 15 }}>
              No requests match the selected filter.
            </p>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                gap: 22,
              }}
            >
              {filteredRequests.map((req, i) => (
                <RequestCard key={req._id || i} req={req} user={user} index={i} />
              ))}
            </motion.div>
          )}

          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                textAlign: "center",
                marginTop: 52,
                padding: "44px 40px",
                background: "linear-gradient(135deg, rgba(31,181,165,0.08), rgba(45,212,191,0.05))",
                border: "1px solid rgba(31,181,165,0.2)",
                borderRadius: 22,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>🤝</div>
              <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.025em" }}>
                Ready to Start Helping?
              </h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, margin: "0 0 28px", lineHeight: 1.6 }}>
                Join thousands of compassionate companions already making a difference and earning great pay.
              </p>
              <Link
                to="/companion-signup"
                style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 13,
                  padding: "14px 36px",
                  fontWeight: 800,
                  fontSize: 16,
                  boxShadow: "0 10px 30px rgba(31,181,165,0.38)",
                  letterSpacing: "-0.01em",
                }}
              >
                Create Free Account →
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <section
        id="testimonials"
        style={{
          padding: "100px 40px",
          background: "rgba(255,255,255,0.015)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <GlowOrb size={380} color="#1fb5a5" style={{ top: "30%", right: "-120px" }} delay={5} />
        <GridOverlay />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            style={{ textAlign: "center", marginBottom: 60 }}
          >
            <SectionLabel>⭐ Reviews</SectionLabel>
            <motion.h2
              variants={fadeUp}
              style={{
                fontSize: "clamp(28px, 4vw, 46px)",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.035em",
                margin: "0 0 16px",
              }}
            >
              Loved by Our Companions
            </motion.h2>
            <motion.p
              variants={fadeUp}
              style={{ color: "rgba(255,255,255,0.44)", fontSize: 16.5, maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}
            >
              Don't take our word for it — hear from the people who make CareNest what it is.
            </motion.p>
          </motion.div>

          {/* Testimonial cards */}
          <div
            style={{
              display: "flex",
              gap: 20,
              justifyContent: "center",
              flexWrap: "wrap",
              alignItems: "stretch",
            }}
          >
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} t={t} active={i === activeTestimonial} />
            ))}
          </div>

          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 36 }}>
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                style={{
                  width: i === activeTestimonial ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === activeTestimonial ? "#1fb5a5" : "rgba(255,255,255,0.15)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.35s ease",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Inquiry / Contact Form ──────────────────────────────────────── */}
      <section style={{ padding: "100px 40px", position: "relative", overflow: "hidden" }}>
        <GlowOrb size={500} color="#1fb5a5" style={{ bottom: "-200px", right: "-150px" }} delay={1} />
        <GridOverlay />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 50 }}>
              <SectionLabel>💬 Get in Touch</SectionLabel>
              <h2
                style={{
                  fontSize: "clamp(28px, 4vw, 44px)",
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "-0.035em",
                  margin: "0 0 14px",
                }}
              >
                Have Questions?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 16, lineHeight: 1.65 }}>
                Our team responds within 24 hours. We're here to help you get started.
              </p>
            </motion.div>

            <motion.div
              variants={scaleIn}
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 26,
                padding: "48px 50px",
                boxShadow: "0 40px 100px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <form onSubmit={handleInquirySubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={inquiry.fullName}
                      onChange={(e) => setInquiry((p) => ({ ...p, fullName: e.target.value }))}
                      onFocus={() => setFocused("fn")}
                      onBlur={() => setFocused(null)}
                      placeholder="Jane Smith"
                      style={inputStyle("fn")}
                    />
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={inquiry.email}
                      onChange={(e) => setInquiry((p) => ({ ...p, email: e.target.value }))}
                      onFocus={() => setFocused("em")}
                      onBlur={() => setFocused(null)}
                      placeholder="you@example.com"
                      style={inputStyle("em")}
                    />
                  </div>
                </div>

                {availableSkills.length > 0 && (
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>
                      Skill Area (optional)
                    </label>
                    <select
                      value={inquiry.skill}
                      onChange={(e) => setInquiry((p) => ({ ...p, skill: e.target.value }))}
                      style={{ ...inputStyle("sk"), appearance: "none", cursor: "pointer" }}
                    >
                      <option value="">Select a skill area</option>
                      {availableSkills.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>
                    Your Message
                  </label>
                  <textarea
                    value={inquiry.note}
                    onChange={(e) => setInquiry((p) => ({ ...p, note: e.target.value }))}
                    onFocus={() => setFocused("note")}
                    onBlur={() => setFocused(null)}
                    placeholder="Tell us about your experience, availability, and what draws you to companion care…"
                    rows={5}
                    style={{ ...inputStyle("note"), resize: "vertical" }}
                  />
                </div>

                <AnimatePresence>
                  {inquiryError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        background: "rgba(224,112,112,0.1)",
                        border: "1px solid rgba(224,112,112,0.28)",
                        borderRadius: 12,
                        padding: "12px 16px",
                        color: "#f5a3a3",
                        fontSize: 13.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span>⚠️</span> {inquiryError}
                    </motion.div>
                  )}
                  {inquirySuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        background: "rgba(78,201,184,0.1)",
                        border: "1px solid rgba(78,201,184,0.28)",
                        borderRadius: 12,
                        padding: "12px 16px",
                        color: "#4ec9b8",
                        fontSize: 13.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {inquirySuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={submittingInquiry}
                  whileHover={!submittingInquiry ? { scale: 1.015, boxShadow: "0 20px 50px rgba(31,181,165,0.45)" } : {}}
                  whileTap={!submittingInquiry ? { scale: 0.975 } : {}}
                  style={{
                    padding: "15px",
                    background: submittingInquiry
                      ? "rgba(91,191,173,0.45)"
                      : "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 13,
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: submittingInquiry ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "-0.01em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    boxShadow: "0 10px 30px rgba(31,181,165,0.3)",
                  }}
                >
                  {submittingInquiry ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                        style={{ display: "inline-block" }}
                      >
                        ⟳
                      </motion.span>{" "}
                      Sending your inquiry…
                    </>
                  ) : (
                    "Send Inquiry →"
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "40px 40px",
          position: "relative",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
              }}
            >
              🤝
            </div>
            <div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 15 }}>CareNest</span>
              <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, marginLeft: 12 }}>© 2025 · All rights reserved</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              ["Login", "/companion-login"],
              ["Sign Up", "/companion-signup"],
              ["Home", "/"],
            ].map(([label, to]) => (
              <Link
                key={to}
                to={to}
                style={{ color: "rgba(255,255,255,0.35)", fontSize: 13.5, textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#5bbfad")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                {label}
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {["🔐 Secure", "✅ Verified", "💚 Trusted"].map((b) => (
              <span key={b} style={{ color: "rgba(255,255,255,0.2)", fontSize: 12.5 }}>{b}</span>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        * { box-sizing: border-box; }
        select option { background: #0d1f1e; color: #fff; }
        @media (max-width: 700px) {
          .nav-links { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default CompanionLanding;