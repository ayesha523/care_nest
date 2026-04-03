import React from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { loginUser } from "../services/authService";
import { useUser } from "../context/UserContext";

/**
 * CompanionLogin Component
 * Authentication page for companion caregivers
 * Handles login flow with validation, API calls, and context management
 * 
 * Flow:
 * 1. User enters email and password
 * 2. Credentials sent to backend for authentication
 * 3. JWT token received and stored in context + localStorage
 * 4. User navigated to companion dashboard
 * 
 * @returns {React.ReactNode} Login form for companion users
 */
function CompanionLogin() {
  const navigate = useNavigate();
  const { login } = useUser();

  /**
   * Handles login form submission
   * Authenticates user via API, stores token, and navigates to dashboard
   * 
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<{success: boolean, error?: string}>} Login result
   */
  const handleLogin = async ({ email, password }) => {
    try {
      const response = await loginUser({ email, password, role: "companion" });

      if (!response.success) {
        return response;
      }

      // Prepare user data with token
      const userData = {
        ...(response.data?.user || { email, role: "companion" }),
        token: response.data?.token || "",
      };

      // Store in context and localStorage
      login(userData);

      // Navigate to dashboard
      navigate("/companion-dashboard");
      return { success: true };
    } catch (error) {
      console.error("Companion login error:", error);
      return {
        success: false,
        error: "An unexpected error occurred during login. Please try again.",
      };
    }
  };

  return (
    <AuthForm
      mode="login"
      welcomeText="Welcome companion"
      title="Login to your account"
      submitText="Login"
      onSubmit={handleLogin}
      alternateText="Don't have an account?"
      alternateLinkText="Sign up"
      alternateLinkTo="/companion-signup"
    />
  );
}

export default CompanionLogin;
