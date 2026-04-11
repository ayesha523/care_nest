import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser } from "../services/authService";
import { useUser } from "../context/UserContext";

// ─── Animation Variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const slideLeft = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Email validation ─────────────────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── Animated background orbs ────────────────────────────────────────────────
const FloatingOrb = ({ size, color, style, delay = 0, duration = 18 }) => (
  <motion.div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      filter: "blur(80px)",
      opacity: 0.14,
      pointerEvents: "none",
      ...style,
    }}
    animate={{
      scale: [1, 1.2, 0.92, 1],
      x: [0, 24, -16, 0],
      y: [0, -20, 18, 0],
    }}
    transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

// ─── Floating particle ───────────────────────────────────────────────────────
const Particle = ({ style }) => (
  <motion.div
    style={{
      position: "absolute",
      width: 3,
      height: 3,
      borderRadius: "50%",
      background: "#5bbfad",
      opacity: 0,
      pointerEvents: "none",
      ...style,
    }}
    animate={{ opacity: [0, 0.6, 0], scale: [0, 1.4, 0], y: [0, -40] }}
    transition={{
      duration: Math.random() * 2 + 2,
      repeat: Infinity,
      ease: "easeOut",
      delay: Math.random() * 4,
    }}
  />
);

// ─── Grid overlay ────────────────────────────────────────────────────────────
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

// ─── Password strength calculation ───────────────────────────────────────────
const QUICK_TIPS = [
  "💡 Use a password manager to create a strong, unique password.",
  "🔒 Never share your login credentials with anyone.",
  "📱 Enable 2FA on your account for extra protection.",
  "⚡ You'll have access to your dashboard instantly after login.",
];

// ─── Main Component ───────────────────────────────────────────────────────────
function CompanionLogin() {
  const navigate = useNavigate();
  const { login } = useUser();
  const emailRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState(null);
  const [emailValid, setEmailValid] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  // Auto-focus email
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Rotating tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % QUICK_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Pre-fill from localStorage
  useEffect(() => {
    const remembered = localStorage.getItem("companion_email");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // Email validation effect
  useEffect(() => {
    if (email.length > 3) setEmailValid(isValidEmail(email));
    else setEmailValid(null);
  }, [email]);

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setError("");

      // Client-side validation
      if (!email.trim()) {
        setError("Email address is required.");
        return;
      }
      if (!isValidEmail(email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!password) {
        setError("Password is required.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      setIsSubmitting(true);
      setAttemptCount((c) => c + 1);

      try {
        const response = await loginUser({ email: email.trim(), password, role: "companion" });

        if (!response.success) {
          setError(
            response.error ||
            response.message ||
            "Invalid credentials. Please check your email and password."
          );
          setIsSubmitting(false);
          return;
        }

        // Handle remember me
        if (rememberMe) {
          localStorage.setItem("companion_email", email.trim());
        } else {
          localStorage.removeItem("companion_email");
        }

        const userData = {
          ...(response.data?.user || { email: email.trim(), role: "companion" }),
          token: response.data?.token || "",
        };

        if (response.data?.token) {
          localStorage.setItem("token", response.data.token);
        }

        // Success state
        setLoginSuccess(true);
        login(userData);

        // Delayed redirect for success animation
        setTimeout(() => {
          navigate("/companion-dashboard");
        }, 800);
      } catch (err) {
        setError(
          "Connection error. Please check your internet connection and try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, isSubmitting, rememberMe, login, navigate]
  );

  // Dynamic border colors
  const getBorderColor = useCallback(
    (field) => {
      if (loginSuccess) return "#4ec9b8";
      if (focused === field) return "#5bbfad";
      if (
        error &&
        ((field === "email" && (!email || !isValidEmail(email))) ||
          (field === "password" && !password))
      )
        return "#e07070";
      if (field === "email" && emailValid === true) return "rgba(78,201,184,0.5)";
      return "rgba(134,193,182,0.22)";
    },
    [focused, error, email, password, emailValid, loginSuccess]
  );

  const getBoxShadow = useCallback(
    (field) => {
      if (focused === field) return "0 0 0 3px rgba(91,191,173,0.15)";
      if (loginSuccess) return "0 0 0 3px rgba(78,201,184,0.2)";
      return "none";
    },
    [focused, loginSuccess]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #080f0e 0%, #0d1f1e 40%, #091a19 70%, #060e0d 100%)",
        display: "flex",
        alignItems: "stretch",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      {/* ─── Background Effects ─────────────────────────────────────────── */}
      <FloatingOrb size={600} color="#1fb5a5" style={{ top: "-200px", left: "-200px" }} delay={0} />
      <FloatingOrb size={450} color="#0f6b5e" style={{ bottom: "-120px", right: "-120px" }} delay={5} />
      <FloatingOrb size={300} color="#2dd4bf" style={{ top: "40%", right: "20%" }} delay={9} />
      <FloatingOrb size={220} color="#17a498" style={{ bottom: "30%", left: "15%" }} delay={3} />
      <GridOverlay />

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Particle
          key={i}
          style={{
            left: `${10 + (i * 7.5) % 80}%`,
            bottom: `${5 + (i * 11) % 30}%`,
          }}
        />
      ))}

      {/* ─── Left panel (desktop) ───────────────────────────────────────── */}
      <div
        className="login-left-panel"
        style={{
          flex: "0 0 44%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 70px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 60 }}>
            <div
              style={{
                width: 46,
                height: 46,
                background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                borderRadius: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                boxShadow: "0 10px 28px rgba(31,181,165,0.42)",
              }}
            >
              🤝
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>
                CareNest
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Companion Portal
              </div>
            </div>
          </div>

          {/* Hero text */}
          <h2
            style={{
              color: "#fff",
              fontSize: "clamp(26px, 3.5vw, 40px)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              margin: "0 0 18px",
            }}
          >
            Make a Difference,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #1fb5a5, #2dd4bf)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Every Day
            </span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1.7, margin: "0 0 48px" }}>
            Sign in to access your companion dashboard — where meaningful connections and great earnings await.
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "📅", title: "Flexible scheduling", desc: "You pick when and how much you work" },
              { icon: "💳", title: "Weekly payouts", desc: "Reliable earnings every Friday" },
              { icon: "🏅", title: "Skill recognition", desc: "Earn badges that boost your profile" },
              { icon: "💬", title: "Direct communication", desc: "Chat with clients inside the platform" },
            ].map(({ icon, title, desc }) => (
              <motion.div
                key={title}
                whileHover={{ x: 4 }}
                style={{ display: "flex", alignItems: "flex-start", gap: 14 }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: "rgba(31,181,165,0.12)",
                    border: "1px solid rgba(31,181,165,0.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{title}</div>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, marginTop: 2 }}>{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Rotating tip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              style={{
                marginTop: 52,
                background: "rgba(31,181,165,0.07)",
                border: "1px solid rgba(31,181,165,0.18)",
                borderRadius: 14,
                padding: "14px 18px",
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {QUICK_TIPS[tipIndex]}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ─── Right panel (form) ──────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 40px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ width: "100%", maxWidth: 460 }}
        >
          {/* Card */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              border: `1px solid ${loginSuccess ? "rgba(78,201,184,0.35)" : "rgba(255,255,255,0.09)"}`,
              borderRadius: 28,
              padding: "50px 46px",
              boxShadow: loginSuccess
                ? "0 40px 90px rgba(0,0,0,0.5), 0 0 0 1px rgba(78,201,184,0.2), inset 0 1px 0 rgba(255,255,255,0.07)"
                : "0 40px 90px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
              transition: "border-color 0.4s, box-shadow 0.4s",
            }}
          >
            {/* Mobile logo */}
            <motion.div
              className="mobile-logo"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: "backOut" }}
              style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                  borderRadius: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 21,
                  boxShadow: "0 8px 24px rgba(31,181,165,0.4)",
                }}
              >
                🤝
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em" }}>
                  CareNest
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Companion Portal
                </div>
              </div>
            </motion.div>

            {/* Headings */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={itemVariants}>
                <h1
                  style={{
                    color: "#fff",
                    fontSize: 28,
                    fontWeight: 900,
                    margin: "0 0 6px",
                    letterSpacing: "-0.035em",
                  }}
                >
                  {loginSuccess ? "✅ Welcome back!" : "Welcome back"}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14.5, margin: "0 0 34px", lineHeight: 1.5 }}>
                  {loginSuccess
                    ? "Redirecting to your dashboard…"
                    : "Sign in to your companion account to continue."}
                </p>
              </motion.div>

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }} noValidate>
                {/* Email Field */}
                <motion.div variants={slideLeft}>
                  <label
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 9,
                    }}
                  >
                    <span>Email Address</span>
                    {emailValid === false && (
                      <span style={{ color: "#e07070", fontSize: 11, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>
                        Invalid format
                      </span>
                    )}
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      background: "rgba(255,255,255,0.055)",
                      border: `1.5px solid ${getBorderColor("email")}`,
                      borderRadius: 13,
                      padding: "0 15px",
                      transition: "border-color 0.22s, box-shadow 0.22s",
                      boxShadow: getBoxShadow("email"),
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 15 }}>✉</span>
                    <input
                      ref={emailRef}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      autoComplete="email"
                      style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        color: "#fff",
                        fontSize: 15,
                        padding: "14px 0",
                        fontFamily: "inherit",
                      }}
                      required
                    />
                    <AnimatePresence>
                      {emailValid !== null && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.4 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          style={{ color: emailValid ? "#4ec9b8" : "#e07070", fontSize: 16 }}
                        >
                          {emailValid ? "✓" : "✗"}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Password Field */}
                <motion.div variants={slideLeft}>
                  <label
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 9,
                    }}
                  >
                    <span>Password</span>
                    <Link
                      to="/forgot-password"
                      style={{
                        color: "#5bbfad",
                        fontSize: 12,
                        textDecoration: "none",
                        fontWeight: 600,
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      Forgot password?
                    </Link>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      background: "rgba(255,255,255,0.055)",
                      border: `1.5px solid ${getBorderColor("password")}`,
                      borderRadius: 13,
                      padding: "0 10px 0 15px",
                      transition: "border-color 0.22s, box-shadow 0.22s",
                      boxShadow: getBoxShadow("password"),
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 14 }}>🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      autoComplete="current-password"
                      style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        color: "#fff",
                        fontSize: 15,
                        padding: "14px 0",
                        fontFamily: "inherit",
                      }}
                      required
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: showPassword ? "#5bbfad" : "rgba(255,255,255,0.3)",
                        fontSize: 15,
                        padding: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        transition: "color 0.2s",
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Remember Me */}
                <motion.div variants={itemVariants} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setRememberMe((v) => !v)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `2px solid ${rememberMe ? "#1fb5a5" : "rgba(255,255,255,0.2)"}`,
                      background: rememberMe ? "linear-gradient(135deg, #1fb5a5, #0f8e80)" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.2s",
                      padding: 0,
                    }}
                  >
                    <AnimatePresence>
                      {rememberMe && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13.5, cursor: "pointer", userSelect: "none" }}
                    onClick={() => setRememberMe((v) => !v)}>
                    Remember my email
                  </span>
                </motion.div>

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      style={{
                        background: "rgba(224,112,112,0.09)",
                        border: "1px solid rgba(224,112,112,0.28)",
                        borderRadius: 13,
                        padding: "13px 16px",
                        color: "#f5a3a3",
                        fontSize: 13.5,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <span style={{ flexShrink: 0, marginTop: 1 }}>⚠️</span>
                      <div>
                        <span>{error}</span>
                        {attemptCount >= 3 && (
                          <div style={{ marginTop: 6, fontSize: 12.5, color: "rgba(245,163,163,0.7)" }}>
                            Multiple failed attempts detected.{" "}
                            <Link to="/forgot-password" style={{ color: "#f5a3a3", fontWeight: 700 }}>
                              Reset your password →
                            </Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={isSubmitting || loginSuccess}
                  whileHover={!isSubmitting && !loginSuccess ? { scale: 1.015, boxShadow: "0 20px 50px rgba(31,181,165,0.46)" } : {}}
                  whileTap={!isSubmitting && !loginSuccess ? { scale: 0.975 } : {}}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background:
                      loginSuccess
                        ? "linear-gradient(135deg, #0f9b8c, #0b7a6e)"
                        : isSubmitting
                          ? "rgba(91,191,173,0.45)"
                          : "linear-gradient(135deg, #1fb5a5 0%, #0f8e80 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 13,
                    fontSize: 15.5,
                    fontWeight: 800,
                    cursor: isSubmitting || loginSuccess ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "-0.01em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 9,
                    boxShadow: "0 10px 28px rgba(31,181,165,0.32)",
                    marginTop: 4,
                    transition: "background 0.3s",
                  }}
                >
                  {loginSuccess ? (
                    <>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        ✅
                      </motion.span>{" "}
                      Signed in successfully!
                    </>
                  ) : isSubmitting ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
                        style={{ display: "inline-block", fontSize: 17 }}
                      >
                        ⟳
                      </motion.span>{" "}
                      Signing in…
                    </>
                  ) : (
                    "Sign In to Dashboard →"
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <motion.div
                variants={itemVariants}
                style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0" }}
              >
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>or</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              </motion.div>

              {/* Footer links */}
              <motion.div
                variants={itemVariants}
                style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}
              >
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, margin: 0 }}>
                  New to CareNest?{" "}
                  <Link
                    to="/companion-signup"
                    style={{ color: "#5bbfad", fontWeight: 700, textDecoration: "none" }}
                  >
                    Create your account →
                  </Link>
                </p>
                <Link
                  to="/"
                  style={{
                    color: "rgba(255,255,255,0.22)",
                    fontSize: 13,
                    textDecoration: "none",
                    display: "inline-block",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                >
                  ← Back to home
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 22,
              marginTop: 24,
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: "🔐", label: "256-bit SSL" },
              { icon: "✅", label: "ID Verified" },
              { icon: "💚", label: "Trusted Care" },
              { icon: "🛡️", label: "Privacy Safe" },
            ].map(({ icon, label }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: "rgba(255,255,255,0.22)",
                  fontSize: 12,
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 900px) {
          .login-left-panel { display: none !important; }
          .mobile-logo { display: flex !important; }
        }
        @media (min-width: 901px) {
          .mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default CompanionLogin;