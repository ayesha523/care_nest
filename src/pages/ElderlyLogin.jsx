import React from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { loginUser } from "../services/authService";
import { useUser } from "../context/UserContext";

/**
 * ElderlyLogin Component
 * Authentication page for elderly care seekers
 * Handles login flow with validation, API calls, and context management
 * 
 * Flow:
 * 1. User enters email and password
 * 2. Credentials sent to backend for authentication
 * 3. JWT token received and stored in context + localStorage
 * 4. User navigated to elderly dashboard
 * 
 * @returns {React.ReactNode} Login form for elderly users
 */
function ElderlyLogin() {
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
      const response = await loginUser({ email, password, role: "elderly" });

      if (!response.success) {
        return response;
      }

      // Prepare user data with token
      const userData = {
        ...(response.data?.user || { email, role: "elderly" }),
        token: response.data?.token || "",
      };

      // Store in context and localStorage
      login(userData);

      // Navigate to dashboard
      navigate("/elderly-dashboard");
      return { success: true };
    } catch (error) {
      console.error("Elderly login error:", error);
      return {
        success: false,
        error: "An unexpected error occurred during login. Please try again.",
      };
    }
  };

  return (
    <AuthForm
      mode="login"
      welcomeText="Welcome elderly user!"
      title="Login to your account"
      submitText="Login"
      onSubmit={handleLogin}
      alternateText="Don't have an account?"
      alternateLinkText="Sign up"
      alternateLinkTo="/elderly-signup"
    />
  );
}

export default ElderlyLogin;
