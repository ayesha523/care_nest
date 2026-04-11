import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/pages.css";
import { validateLoginForm, validateSignupForm } from "../utils/authValidation";

/**
 * AuthForm Component
 * Reusable authentication form component for login and signup
 * Supports password strength validation, real-time requirements checking, and error handling
 * 
 * @param {Object} props - Component props
 * @param {string} props.mode - Authentication mode: "login" or "signup"
 * @param {string} props.welcomeText - Welcome message text displayed above title
 * @param {string} props.title - Main title for the form
 * @param {string} props.submitText - Text for submit button
 * @param {Function} props.onSubmit - Callback fired on form submission with ({ name, email, password, confirmPassword })
 * @param {string} props.alternateText - Text for alternate action link (e.g., "Don't have an account?")
 * @param {string} props.alternateLinkText - Link text for alternate action (e.g., "Sign up here")
 * @param {string} props.alternateLinkTo - Path for alternate action link
 * @returns {React.ReactNode} Authentication form component
 */
function AuthForm({
  mode,
  welcomeText,
  title,
  submitText,
  onSubmit,
  alternateText,
  alternateLinkText,
  alternateLinkTo,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  /**
   * Clears error and success messages when user starts typing
   */
  const clearError = () => {
    if (error) {
      setError("");
    }
    if (success) {
      setSuccess("");
    }
  };

  /**
   * Calculates password strength on a 6-level scale
   * Checks for length, uppercase, lowercase, numbers, and special characters
   * 
   * @param {string} pwd - Password to evaluate
   * @returns {number} Strength level 0-6
   */
  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;
    return strength;
  };

  useEffect(() => {
    if (mode === "signup" && password) {
      setPasswordStrength(calculatePasswordStrength(password));
    }
  }, [password, mode]);

  /**
   * Returns user-friendly password strength label
   * @returns {string} Strength label (Weak, Medium, Strong)
   */
  const getStrengthLabel = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 4) return "Medium";
    return "Strong";
  };

  /**
   * Returns color code matching password strength level
   * @returns {string} CSS color value
   */
  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "#e74c3c";
    if (passwordStrength <= 4) return "#f39c12";
    return "#27ae60";
  };

  /**
   * Handles form submission with validation
   * Validates form data, shows errors, and calls onSubmit callback
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setError("");

    const formValues = { name, email, password, confirmPassword };
    const validationError =
      mode === "signup"
        ? validateSignupForm(formValues)
        : validateLoginForm({ email, password });

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit({ name, email, password, confirmPassword });
      if (!result?.success) {
        setError(result?.error || "Something went wrong. Please try again.");
      }
    } catch (submitError) {
      setError("Unable to complete request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-main">
      <div className="login-container">
        <div className="auth-header">
          <h2 className="auth-welcome">{welcomeText}</h2>
          <h1 className="auth-title">{title}</h1>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <div className="input-group">
              <div className="input-icon">👤</div>
              <input
                className="auth-input"
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError();
                }}
                required
              />
            </div>
          )}

          <div className="input-group">
            <div className="input-icon">✉️</div>
            <input
              className="auth-input"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              required
            />
          </div>

          <div className="input-group">
            <div className="input-icon">🔒</div>
            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {mode === "signup" && password && (
            <div className="password-strength">
              <div className="strength-bars">
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <div
                    key={level}
                    className={`strength-bar ${
                      passwordStrength >= level ? "active" : ""
                    }`}
                    style={{
                      backgroundColor:
                        passwordStrength >= level
                          ? getStrengthColor()
                          : "#e0e0e0",
                    }}
                  />
                ))}
              </div>
              <span
                className="strength-label"
                style={{ color: getStrengthColor() }}
              >
                {getStrengthLabel()}
              </span>
            </div>
          )}

          {mode === "signup" && (
            <div className="password-requirements">
              <div className={password.length >= 8 ? "req-met" : "req-unmet"}>
                {password.length >= 8 ? "✓" : "○"} 8+ characters
              </div>
              <div className={/[A-Z]/.test(password) ? "req-met" : "req-unmet"}>
                {/[A-Z]/.test(password) ? "✓" : "○"} Uppercase
              </div>
              <div className={/[a-z]/.test(password) ? "req-met" : "req-unmet"}>
                {/[a-z]/.test(password) ? "✓" : "○"} Lowercase
              </div>
              <div className={/[0-9]/.test(password) ? "req-met" : "req-unmet"}>
                {/[0-9]/.test(password) ? "✓" : "○"} Number
              </div>
              <div
                className={
                  /[!@#$%^&*(),.?":{}|<>]/.test(password)
                    ? "req-met"
                    : "req-unmet"
                }
              >
                {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "✓" : "○"} Special
                char
              </div>
            </div>
          )}

          {mode === "signup" && (
            <div className="input-group">
              <div className="input-icon">🔒</div>
              <input
                className="auth-input"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearError();
                }}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          )}

          {error && (
            <div className="form-message error-message">
              <span className="message-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="form-message success-message">
              <span className="message-icon">✓</span>
              {success}
            </div>
          )}

          <button
            type="submit"
            className={`auth-submit ${isSubmitting ? "submitting" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              submitText
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="alternate-action">
            {alternateText}{" "}
            <Link to={alternateLinkTo} className="alternate-link">
              {alternateLinkText}
            </Link>
          </p>

          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;