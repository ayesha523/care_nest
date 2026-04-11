import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signupUser } from "../services/authService";
import { useUser } from "../context/UserContext";

// ─── Password utilities ───────────────────────────────────────────────────────
const getPasswordRequirements = (pwd) => ({
  length: { met: pwd.length >= 8, label: "8+ characters" },
  upper: { met: /[A-Z]/.test(pwd), label: "Uppercase letter" },
  lower: { met: /[a-z]/.test(pwd), label: "Lowercase letter" },
  number: { met: /[0-9]/.test(pwd), label: "Number (0–9)" },
  special: { met: /[!@#$%^&*(),.?":{}|<>]/.test(pwd), label: "Special character" },
});

const getPasswordStrength = (pwd) => {
  const reqs = getPasswordRequirements(pwd);
  const score = Object.values(reqs).filter((r) => r.met).length;
  if (score === 0) return { score: 0, label: "", color: "transparent", width: "0%" };
  if (score <= 2) return { score, label: "Weak", color: "#e07070", width: "30%" };
  if (score === 3) return { score, label: "Fair", color: "#f0a060", width: "55%" };
  if (score === 4) return { score, label: "Good", color: "#d4c840", width: "78%" };
  return { score, label: "Strong", color: "#4ec9b8", width: "100%" };
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── Animation Variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.065 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
};
const slideLeft = {
  hidden: { opacity: 0, x: -18 },
  show: { opacity: 1, x: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
};
const popIn = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 18 } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const GlowOrb = ({ size, color, style, delay = 0 }) => (
  <motion.div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      filter: "blur(85px)",
      opacity: 0.13,
      pointerEvents: "none",
      ...style,
    }}
    animate={{ scale: [1, 1.18, 0.94, 1], x: [0, 20, -14, 0], y: [0, -18, 15, 0] }}
    transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

const GridOverlay = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
      backgroundSize: "64px 64px",
      pointerEvents: "none",
    }}
  />
);

// Step indicator
const StepIndicator = ({ currentStep, totalSteps }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
    {Array.from({ length: totalSteps }).map((_, i) => (
      <React.Fragment key={i}>
        <motion.div
          animate={{
            background:
              i < currentStep
                ? "linear-gradient(135deg, #1fb5a5, #0f8e80)"
                : i === currentStep
                  ? "rgba(31,181,165,0.3)"
                  : "rgba(255,255,255,0.08)",
            border:
              i === currentStep
                ? "2px solid #1fb5a5"
                : "2px solid transparent",
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: i <= currentStep ? "#fff" : "rgba(255,255,255,0.3)",
          }}
          transition={{ duration: 0.35 }}
        >
          {i < currentStep ? "✓" : i + 1}
        </motion.div>
        {i < totalSteps - 1 && (
          <motion.div
            style={{ flex: 1, height: 2, borderRadius: 1 }}
            animate={{ background: i < currentStep ? "linear-gradient(90deg, #1fb5a5, #2dd4bf)" : "rgba(255,255,255,0.08)" }}
            transition={{ duration: 0.4 }}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const STEP_LABELS = ["Account Info", "Set Password", "Review & Submit"];

const SKILLS_OPTIONS = [
  "Dementia Care", "Physical Therapy", "Medication Management",
  "Meal Preparation", "Mobility Assistance", "Companionship",
  "Light Housekeeping", "Transportation", "Post-Surgery Care",
  "Wound Care", "Mental Health Support", "Palliative Care",
];

// ─── Main Component ───────────────────────────────────────────────────────────
function CompanionSignup() {
  const navigate = useNavigate();
  const { login } = useUser();
  const nameRef = useRef(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // UI state
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState(null);
  const [step, setStep] = useState(0); // 0=account, 1=password, 2=review
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);

  const pwdStrength = getPasswordStrength(password);
  const pwdRequirements = getPasswordRequirements(password);

  // Auto-focus
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Simulated email availability check
  useEffect(() => {
    if (!isValidEmail(email)) {
      setEmailAvailable(null);
      return;
    }
    setEmailChecking(true);
    const timer = setTimeout(() => {
      // Simulate an API call result (always available in demo)
      setEmailAvailable(true);
      setEmailChecking(false);
    }, 900);
    return () => clearTimeout(timer);
  }, [email]);

  // Dynamic border/shadow helpers
  const getBorder = useCallback(
    (field) => {
      if (fieldErrors[field]) return "#e07070";
      if (focused === field) return "#5bbfad";
      if (field === "email" && emailAvailable === true) return "rgba(78,201,184,0.5)";
      return "rgba(134,193,182,0.22)";
    },
    [focused, fieldErrors, emailAvailable]
  );

  const getShadow = useCallback(
    (field) => {
      if (focused === field) return "0 0 0 3px rgba(91,191,173,0.14)";
      if (fieldErrors[field]) return "0 0 0 3px rgba(224,112,112,0.1)";
      return "none";
    },
    [focused, fieldErrors]
  );

  const inputWrapStyle = (field) => ({
    display: "flex",
    alignItems: "center",
    gap: 11,
    background: "rgba(255,255,255,0.055)",
    border: `1.5px solid ${getBorder(field)}`,
    borderRadius: 13,
    padding: "0 14px",
    transition: "border-color 0.22s, box-shadow 0.22s",
    boxShadow: getShadow(field),
  });

  const baseInput = {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: 15,
    padding: "14px 0",
    fontFamily: "inherit",
  };

  const labelStyle = {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 9,
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Validate step 0
  const validateStep0 = useCallback(() => {
    const errors = {};
    if (!name.trim() || name.trim().length < 2) errors.name = "Full name is required (min 2 chars)";
    if (!isValidEmail(email)) errors.email = "Please enter a valid email address";
    if (phone && !/^[\d\s\-+()]{7,15}$/.test(phone.trim())) errors.phone = "Invalid phone number format";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, email, phone]);

  // Validate step 1
  const validateStep1 = useCallback(() => {
    const errors = {};
    if (pwdStrength.score < 4) errors.password = "Password is too weak — meet all 5 requirements";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [password, confirmPassword, pwdStrength]);

  // Validate step 2
  const validateStep2 = useCallback(() => {
    const errors = {};
    if (!agreeTerms) errors.terms = "You must agree to the Terms of Service";
    if (!agreePrivacy) errors.privacy = "You must agree to the Privacy Policy";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [agreeTerms, agreePrivacy]);

  const handleNextStep = () => {
    setError("");
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleSignup = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setError("");

      if (!validateStep2()) return;

      setIsSubmitting(true);

      try {
        const response = await signupUser({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
          specializations: selectedSkills,
          password,
          role: "companion",
        });

        if (!response.success) {
          setError(response.error || response.message || "Registration failed. Please try again.");
          setIsSubmitting(false);
          return;
        }

        const userData = {
          ...(response.data?.user || { email: email.trim(), name: name.trim(), role: "companion" }),
          token: response.data?.token || "",
        };

        if (response.data?.token) {
          localStorage.setItem("token", response.data.token);
        }

        setSignupSuccess(true);
        login(userData);

        setTimeout(() => {
          navigate("/companion-dashboard");
        }, 900);
      } catch (err) {
        setError("Connection error. Please check your internet connection and try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, email, phone, bio, selectedSkills, password, agreeTerms, agreePrivacy, isSubmitting, login, navigate, validateStep2]
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
      <GlowOrb size={560} color="#1fb5a5" style={{ top: "-200px", left: "-180px" }} delay={0} />
      <GlowOrb size={400} color="#0f6b5e" style={{ bottom: "-120px", right: "-120px" }} delay={5} />
      <GlowOrb size={280} color="#2dd4bf" style={{ top: "45%", right: "16%" }} delay={9} />
      <GlowOrb size={200} color="#17a498" style={{ bottom: "25%", left: "8%" }} delay={2} />
      <GridOverlay />

      {/* ─── Left Panel ─────────────────────────────────────────────────── */}
      <div
        className="signup-left-panel"
        style={{
          flex: "0 0 40%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 64px",
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
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 56 }}>
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
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>CareNest</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Join as Companion
              </div>
            </div>
          </div>

          {/* Hero copy */}
          <h2
            style={{
              color: "#fff",
              fontSize: "clamp(24px, 3vw, 38px)",
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: "-0.04em",
              margin: "0 0 16px",
            }}
          >
            Start making a difference{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #1fb5a5, #2dd4bf)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              today
            </span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.44)", fontSize: 15.5, lineHeight: 1.7, margin: "0 0 44px" }}>
            Join 12,400+ companions who've found meaningful work and reliable income through CareNest.
          </p>

          {/* Step preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {STEP_LABELS.map((label, i) => (
              <motion.div
                key={label}
                animate={{ opacity: i === step ? 1 : 0.45, x: i === step ? 0 : 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: 14,
                  background: i === step ? "rgba(31,181,165,0.1)" : "transparent",
                  border: `1px solid ${i === step ? "rgba(31,181,165,0.28)" : "transparent"}`,
                  transition: "all 0.35s ease",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background:
                      i < step
                        ? "linear-gradient(135deg, #1fb5a5, #0f8e80)"
                        : i === step
                          ? "rgba(31,181,165,0.2)"
                          : "rgba(255,255,255,0.06)",
                    border: `1px solid ${i === step ? "rgba(31,181,165,0.4)" : "transparent"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                    fontWeight: 700,
                    color: i < step ? "#fff" : i === step ? "#5bbfad" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {i < step ? "✓" : ["📝", "🔒", "🚀"][i]}
                </div>
                <div>
                  <div
                    style={{
                      color: i === step ? "#fff" : "rgba(255,255,255,0.35)",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Step {i + 1}: {label}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 12.5, marginTop: 2 }}>
                    {["Enter your personal information", "Create a secure password", "Confirm and create account"][i]}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Guarantee */}
          <div
            style={{
              marginTop: 48,
              background: "rgba(31,181,165,0.07)",
              border: "1px solid rgba(31,181,165,0.18)",
              borderRadius: 14,
              padding: "16px 20px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>🛡️</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                Your privacy matters
              </div>
              <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 13, lineHeight: 1.6 }}>
                We never sell your data. Your information is encrypted and used only to connect you with care seekers.
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Right Panel (Form) ──────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 40px",
          position: "relative",
          zIndex: 2,
          overflowY: "auto",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ width: "100%", maxWidth: 500 }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              border: `1px solid ${signupSuccess ? "rgba(78,201,184,0.35)" : "rgba(255,255,255,0.09)"}`,
              borderRadius: 28,
              padding: "46px 44px",
              boxShadow: "0 40px 90px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
              transition: "border-color 0.4s",
            }}
          >
            {/* Mobile logo */}
            <motion.div
              className="mobile-logo-signup"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.5, ease: "backOut" }}
              style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}
            >
              <div style={{ width: 42, height: 42, background: "linear-gradient(135deg, #1fb5a5, #0f8e80)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 8px 20px rgba(31,181,165,0.38)" }}>🤝</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>CareNest</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>Join as Companion</div>
              </div>
            </motion.div>

            {/* Header */}
            <StepIndicator currentStep={step} totalSteps={3} />

            <AnimatePresence mode="wait">
              <motion.div
                key={`heading-${step}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 900, margin: "0 0 5px", letterSpacing: "-0.035em" }}>
                  {signupSuccess
                    ? "🎉 Welcome aboard!"
                    : ["Create your account", "Set your password", "Almost done!"][step]}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, margin: "0 0 28px", lineHeight: 1.55 }}>
                  {signupSuccess
                    ? "Redirecting you to your dashboard…"
                    : [
                      "Tell us a bit about yourself — it takes under 2 minutes.",
                      "Create a strong password to protect your account.",
                      "Review your information and accept our terms to finish.",
                    ][step]}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* ── STEP 0: Account Info ─────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {step === 0 && !signupSuccess && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35 }}
                >
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{ display: "flex", flexDirection: "column", gap: 16 }}
                  >
                    {/* Full Name */}
                    <motion.div variants={slideLeft}>
                      <label style={labelStyle}>Full Name *</label>
                      <div style={inputWrapStyle("name")}>
                        <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 15 }}>👤</span>
                        <input
                          ref={nameRef}
                          type="text"
                          placeholder="Jane Smith"
                          value={name}
                          onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
                          onFocus={() => setFocused("name")}
                          onBlur={() => setFocused(null)}
                          style={baseInput}
                          autoComplete="name"
                        />
                        <AnimatePresence>
                          {name.trim().length >= 2 && (
                            <motion.span variants={popIn} initial="hidden" animate="show" exit="hidden" style={{ color: "#4ec9b8", fontSize: 15 }}>✓</motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      {fieldErrors.name && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#e07070", fontSize: 12, margin: "5px 0 0 2px" }}>
                          {fieldErrors.name}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* Email */}
                    <motion.div variants={slideLeft}>
                      <label style={{ ...labelStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Email Address *</span>
                        {emailChecking && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>Checking…</span>}
                        {!emailChecking && emailAvailable === true && isValidEmail(email) && (
                          <span style={{ color: "#4ec9b8", fontSize: 11, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>✓ Available</span>
                        )}
                      </label>
                      <div style={inputWrapStyle("email")}>
                        <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 15 }}>✉</span>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); setEmailAvailable(null); }}
                          onFocus={() => setFocused("email")}
                          onBlur={() => setFocused(null)}
                          style={baseInput}
                          autoComplete="email"
                        />
                        <AnimatePresence>
                          {emailChecking && (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                              style={{ display: "inline-block", color: "rgba(255,255,255,0.3)", fontSize: 14 }}
                            >
                              ⟳
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      {fieldErrors.email && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#e07070", fontSize: 12, margin: "5px 0 0 2px" }}>
                          {fieldErrors.email}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* Phone (optional) */}
                    <motion.div variants={slideLeft}>
                      <label style={labelStyle}>Phone Number <span style={{ color: "rgba(255,255,255,0.28)", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                      <div style={inputWrapStyle("phone")}>
                        <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 15 }}>📞</span>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: "" })); }}
                          onFocus={() => setFocused("phone")}
                          onBlur={() => setFocused(null)}
                          style={baseInput}
                          autoComplete="tel"
                        />
                      </div>
                      {fieldErrors.phone && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#e07070", fontSize: 12, margin: "5px 0 0 2px" }}>
                          {fieldErrors.phone}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* Skills */}
                    <motion.div variants={slideLeft}>
                      <label style={labelStyle}>
                        Skills & Specializations <span style={{ color: "rgba(255,255,255,0.28)", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {SKILLS_OPTIONS.map((skill) => (
                          <motion.button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              background: selectedSkills.includes(skill)
                                ? "linear-gradient(135deg, rgba(31,181,165,0.3), rgba(45,212,191,0.2))"
                                : "rgba(255,255,255,0.04)",
                              border: `1px solid ${selectedSkills.includes(skill) ? "rgba(31,181,165,0.5)" : "rgba(255,255,255,0.1)"}`,
                              borderRadius: 20,
                              padding: "6px 13px",
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: selectedSkills.includes(skill) ? "#5bbfad" : "rgba(255,255,255,0.4)",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              transition: "all 0.2s",
                            }}
                          >
                            {selectedSkills.includes(skill) ? "✓ " : ""}{skill}
                          </motion.button>
                        ))}
                      </div>
                      {selectedSkills.length > 0 && (
                        <p style={{ color: "rgba(91,191,173,0.7)", fontSize: 12, marginTop: 8 }}>
                          {selectedSkills.length} skill{selectedSkills.length > 1 ? "s" : ""} selected
                        </p>
                      )}
                    </motion.div>

                    {/* Bio */}
                    <motion.div variants={slideLeft}>
                      <label style={labelStyle}>
                        Professional Bio <span style={{ color: "rgba(255,255,255,0.28)", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                      </label>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.055)",
                          border: `1.5px solid ${getBorder("bio")}`,
                          borderRadius: 13,
                          transition: "border-color 0.22s, box-shadow 0.22s",
                          boxShadow: getShadow("bio"),
                        }}
                      >
                        <textarea
                          placeholder="Tell care seekers about your experience, approach, and what makes you a great companion…"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          onFocus={() => setFocused("bio")}
                          onBlur={() => setFocused(null)}
                          rows={3}
                          style={{
                            ...baseInput,
                            width: "100%",
                            padding: "14px",
                            resize: "vertical",
                            minHeight: 80,
                          }}
                        />
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 11.5, marginTop: 5 }}>
                        {bio.length}/500 characters
                      </p>
                    </motion.div>

                    {/* Next button */}
                    <motion.button
                      variants={itemVariants}
                      type="button"
                      onClick={handleNextStep}
                      whileHover={{ scale: 1.015, boxShadow: "0 18px 44px rgba(31,181,165,0.42)" }}
                      whileTap={{ scale: 0.975 }}
                      style={{
                        width: "100%",
                        padding: "15px",
                        background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 13,
                        fontSize: 15.5,
                        fontWeight: 800,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        letterSpacing: "-0.01em",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "0 10px 28px rgba(31,181,165,0.3)",
                        marginTop: 4,
                      }}
                    >
                      Continue to Password →
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {/* ── STEP 1: Password ─────────────────────────────────────────── */}
              {step === 1 && !signupSuccess && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35 }}
                >
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{ display: "flex", flexDirection: "column", gap: 18 }}
                  >
                    {/* Password field */}
                    <motion.div variants={slideLeft}>
                      <label style={labelStyle}>New Password *</label>
                      <div style={inputWrapStyle("password")}>
                        <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 14 }}>🔒</span>
                        <input
                          type={showPwd ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                          onFocus={() => setFocused("password")}
                          onBlur={() => setFocused(null)}
                          style={baseInput}
                          autoComplete="new-password"
                          autoFocus
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPwd((v) => !v)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: showPwd ? "#5bbfad" : "rgba(255,255,255,0.3)", fontSize: 15, padding: "6px", display: "flex", alignItems: "center", borderRadius: 8, transition: "color 0.2s" }}
                        >
                          {showPwd ? "🙈" : "👁"}
                        </motion.button>
                      </div>
                    </motion.div>

                    {/* Strength meter */}
                    <AnimatePresence>
                      {password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: "hidden" }}
                        >
                          {/* Bar */}
                          <div
                            style={{
                              height: 5,
                              background: "rgba(255,255,255,0.08)",
                              borderRadius: 3,
                              overflow: "hidden",
                              marginBottom: 12,
                            }}
                          >
                            <motion.div
                              animate={{ width: pwdStrength.width, background: pwdStrength.color }}
                              transition={{ duration: 0.4 }}
                              style={{ height: "100%", borderRadius: 3 }}
                            />
                          </div>

                          {/* Label */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 12.5 }}>Password strength</span>
                            {pwdStrength.label && (
                              <span style={{ color: pwdStrength.color, fontSize: 12.5, fontWeight: 700 }}>
                                {pwdStrength.label}
                              </span>
                            )}
                          </div>

                          {/* Requirements grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                            {Object.entries(pwdRequirements).map(([key, { met, label }]) => (
                              <motion.div
                                key={key}
                                animate={{ opacity: met ? 1 : 0.5 }}
                                style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: met ? "#4ec9b8" : "rgba(255,255,255,0.3)" }}
                              >
                                <motion.span
                                  animate={{ scale: met ? [1, 1.3, 1] : 1 }}
                                  transition={{ duration: 0.3 }}
                                  style={{ fontSize: 13 }}
                                >
                                  {met ? "✓" : "○"}
                                </motion.span>
                                {label}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {fieldErrors.password && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#e07070", fontSize: 12.5, margin: "-8px 0 0" }}>
                        ⚠️ {fieldErrors.password}
                      </motion.p>
                    )}

                    {/* Confirm password */}
                    <motion.div variants={slideLeft}>
                      <label style={{ ...labelStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Confirm Password *</span>
                        {confirmPassword && (
                          <span style={{ color: password === confirmPassword ? "#4ec9b8" : "#e07070", fontSize: 11, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>
                            {password === confirmPassword ? "✓ Passwords match" : "✗ Doesn't match"}
                          </span>
                        )}
                      </label>
                      <div style={inputWrapStyle("confirm")}>
                        <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 14 }}>🔒</span>
                        <input
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repeat your password"
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: "" })); }}
                          onFocus={() => setFocused("confirm")}
                          onBlur={() => setFocused(null)}
                          style={baseInput}
                          autoComplete="new-password"
                        />
                        <AnimatePresence>
                          {confirmPassword && (
                            <motion.span
                              variants={popIn}
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              style={{ color: password === confirmPassword ? "#4ec9b8" : "#e07070", fontSize: 15 }}
                            >
                              {password === confirmPassword ? "✓" : "✗"}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <motion.button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: showConfirm ? "#5bbfad" : "rgba(255,255,255,0.3)", fontSize: 15, padding: "6px", display: "flex", alignItems: "center", borderRadius: 8, transition: "color 0.2s" }}
                        >
                          {showConfirm ? "🙈" : "👁"}
                        </motion.button>
                      </div>
                      {fieldErrors.confirmPassword && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#e07070", fontSize: 12, margin: "5px 0 0 2px" }}>
                          {fieldErrors.confirmPassword}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* Nav buttons */}
                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      <motion.button
                        type="button"
                        onClick={() => setStep(0)}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.975 }}
                        style={{
                          flex: "0 0 auto",
                          padding: "15px 22px",
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.55)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 13,
                          fontSize: 15,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        ← Back
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={handleNextStep}
                        whileHover={{ scale: 1.015, boxShadow: "0 18px 44px rgba(31,181,165,0.42)" }}
                        whileTap={{ scale: 0.975 }}
                        style={{
                          flex: 1,
                          padding: "15px",
                          background: "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 13,
                          fontSize: 15.5,
                          fontWeight: 800,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          letterSpacing: "-0.01em",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          boxShadow: "0 10px 28px rgba(31,181,165,0.3)",
                        }}
                      >
                        Review & Finish →
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* ── STEP 2: Review & Submit ──────────────────────────────────── */}
              {step === 2 && !signupSuccess && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35 }}
                >
                  <form onSubmit={handleSignup}>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      style={{ display: "flex", flexDirection: "column", gap: 16 }}
                    >
                      {/* Summary card */}
                      <motion.div
                        variants={itemVariants}
                        style={{
                          background: "rgba(31,181,165,0.06)",
                          border: "1px solid rgba(31,181,165,0.2)",
                          borderRadius: 16,
                          padding: "20px 22px",
                        }}
                      >
                        <h4 style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>
                          📋 Account Summary
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {[
                            { icon: "👤", label: "Name", value: name },
                            { icon: "✉", label: "Email", value: email },
                            phone && { icon: "📞", label: "Phone", value: phone },
                            selectedSkills.length > 0 && { icon: "🏷️", label: "Skills", value: selectedSkills.slice(0, 3).join(", ") + (selectedSkills.length > 3 ? ` +${selectedSkills.length - 3} more` : "") },
                          ]
                            .filter(Boolean)
                            .map(({ icon, label, value }) => (
                              <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 13.5 }}>{label}:</span>
                                  <span style={{ color: "#fff", fontSize: 13.5, fontWeight: 600 }}>{value}</span>
                                </div>
                              </div>
                            ))}
                          <div style={{ display: "flex", gap: 10 }}>
                            <span style={{ fontSize: 14 }}>🔒</span>
                            <div style={{ display: "flex", gap: 8 }}>
                              <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 13.5 }}>Password:</span>
                              <span style={{ color: pwdStrength.color, fontSize: 13.5, fontWeight: 700 }}>{pwdStrength.label} ✓</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(0)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#5bbfad",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            marginTop: 12,
                            padding: 0,
                          }}
                        >
                          ✏️ Edit information
                        </button>
                      </motion.div>

                      {/* Terms */}
                      <motion.div variants={itemVariants} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                          {
                            key: "terms",
                            state: agreeTerms,
                            setter: setAgreeTerms,
                            error: fieldErrors.terms,
                            label: (
                              <>
                                I agree to CareNest's{" "}
                                <Link to="/terms" style={{ color: "#5bbfad", fontWeight: 700 }}>Terms of Service</Link>{" "}
                                and{" "}
                                <Link to="/guidelines" style={{ color: "#5bbfad", fontWeight: 700 }}>Companion Guidelines</Link>
                              </>
                            ),
                          },
                          {
                            key: "privacy",
                            state: agreePrivacy,
                            setter: setAgreePrivacy,
                            error: fieldErrors.privacy,
                            label: (
                              <>
                                I have read and agree to the{" "}
                                <Link to="/privacy" style={{ color: "#5bbfad", fontWeight: 700 }}>Privacy Policy</Link>{" "}
                                and consent to data processing
                              </>
                            ),
                          },
                        ].map(({ key, state, setter, error: fieldErr, label }) => (
                          <div key={key}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }} onClick={() => { setter((v) => !v); setFieldErrors((p) => ({ ...p, [key]: "" })); }}>
                              <motion.div
                                whileHover={{ scale: 1.08 }}
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 7,
                                  border: `2px solid ${state ? "#1fb5a5" : fieldErr ? "#e07070" : "rgba(255,255,255,0.2)"}`,
                                  background: state ? "linear-gradient(135deg, #1fb5a5, #0f8e80)" : "transparent",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  marginTop: 1,
                                  transition: "all 0.2s",
                                }}
                              >
                                <AnimatePresence>
                                  {state && (
                                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ color: "#fff", fontSize: 12 }}>✓</motion.span>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                              <span style={{ color: "rgba(255,255,255,0.48)", fontSize: 13.5, lineHeight: 1.55, userSelect: "none" }}>{label}</span>
                            </div>
                            {fieldErr && (
                              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#e07070", fontSize: 12, margin: "5px 0 0 34px" }}>
                                {fieldErr}
                              </motion.p>
                            )}
                          </div>
                        ))}
                      </motion.div>

                      {/* Global error */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
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
                            <span>⚠️</span><span>{error}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Nav */}
                      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                        <motion.button
                          type="button"
                          onClick={() => setStep(1)}
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.975 }}
                          style={{
                            flex: "0 0 auto",
                            padding: "15px 22px",
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.55)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 13,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          ← Back
                        </motion.button>
                        <motion.button
                          type="submit"
                          disabled={isSubmitting}
                          whileHover={!isSubmitting ? { scale: 1.015, boxShadow: "0 20px 50px rgba(31,181,165,0.46)" } : {}}
                          whileTap={!isSubmitting ? { scale: 0.975 } : {}}
                          style={{
                            flex: 1,
                            padding: "15px",
                            background: isSubmitting ? "rgba(91,191,173,0.45)" : "linear-gradient(135deg, #1fb5a5, #0f8e80)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 13,
                            fontSize: 15.5,
                            fontWeight: 800,
                            cursor: isSubmitting ? "not-allowed" : "pointer",
                            fontFamily: "inherit",
                            letterSpacing: "-0.01em",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 9,
                            boxShadow: "0 10px 28px rgba(31,181,165,0.3)",
                          }}
                        >
                          {isSubmitting ? (
                            <>
                              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }} style={{ display: "inline-block", fontSize: 16 }}>⟳</motion.span>
                              Creating your account…
                            </>
                          ) : (
                            "🚀 Create My Account"
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  </form>
                </motion.div>
              )}

              {/* ── Success State ────────────────────────────────────────────── */}
              {signupSuccess && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: "center", padding: "20px 0 10px" }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{ fontSize: 56, marginBottom: 16 }}
                  >
                    🎉
                  </motion.div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.7 }}>
                    Your account has been created successfully. Setting up your dashboard now…
                  </p>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ width: 36, height: 36, border: "3px solid rgba(31,181,165,0.2)", borderTopColor: "#1fb5a5", borderRadius: "50%", margin: "24px auto 0" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider & Footer */}
            {!signupSuccess && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0 18px" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                </div>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 11 }}>
                  <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, margin: 0 }}>
                    Already have an account?{" "}
                    <Link to="/companion-login" style={{ color: "#5bbfad", fontWeight: 700, textDecoration: "none" }}>
                      Sign in →
                    </Link>
                  </p>
                  <Link
                    to="/"
                    style={{ color: "rgba(255,255,255,0.22)", fontSize: 13, textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                  >
                    ← Back to home
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 900px) {
          .signup-left-panel { display: none !important; }
          .mobile-logo-signup { display: flex !important; }
        }
        @media (min-width: 901px) {
          .mobile-logo-signup { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default CompanionSignup;