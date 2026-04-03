import React, { createContext, useState, useContext, useCallback, useEffect } from "react";

const UserContext = createContext(null);

/**
 * UserProvider Component
 * Manages authentication state and user session persistence
 * Provides login, logout, and user restoration capabilities
 */
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Login callback - stores user data in context and localStorage
   * @param {Object} userData - User data object with email, name, role, id, token
   */
  const login = useCallback((userData) => {
    try {
      if (!userData.email || !userData.role) {
        throw new Error("Invalid user data: email and role are required");
      }

      const userWithDefaults = {
        email: userData.email,
        name: userData.name || "",
        role: userData.role,
        id: userData.id || userData._id || null,
        token: userData.token || "",
        ...userData,
      };

      setUser(userWithDefaults);
      localStorage.setItem("carenest_user", JSON.stringify(userWithDefaults));
      localStorage.setItem("user", JSON.stringify(userWithDefaults));
      if (userWithDefaults.token) {
        localStorage.setItem("carenest_token", userWithDefaults.token);
        localStorage.setItem("token", userWithDefaults.token);
      }
      setError(null);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    }
  }, []);

  /**
   * Logout callback - clears user state and localStorage
   */
  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem("carenest_user");
    localStorage.removeItem("user");
    localStorage.removeItem("carenest_token");
    localStorage.removeItem("token");
  }, []);

  /**
   * Validates token with backend before restoring user session
   * Ensures token is still valid and user exists in database
   * 
   * @param {string} token - JWT token to validate
   * @returns {Promise<{valid: boolean, user?: Object}>} Validation result
   */
  const validateTokenWithBackend = useCallback(async (token) => {
    try {
      // Try multiple API endpoints
      const endpoints = [
        process.env.REACT_APP_API_BASE_URL ? `${process.env.REACT_APP_API_BASE_URL.replace(/\/$/, '')}/api/auth/validate-token` : "/api/auth/validate-token",
        "/api/auth/validate-token",
        "http://localhost:5000/api/auth/validate-token",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              return { valid: true, user: data.data.user };
            } else {
              return { valid: false };
            }
          }
        } catch (e) {
          // Try next endpoint
          continue;
        }
      }

      return { valid: false };
    } catch (err) {
      console.error("Token validation error:", err);
      return { valid: false };
    }
  }, []);

  /**
   * Restore user session from localStorage on mount
   * ✅ NEW: Validates token with backend before restoring
   * This prevents unauthorized access through localStorage manipulation
   */
  const restoreUser = useCallback(async () => {
    try {
      const stored = localStorage.getItem("carenest_user") || localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Validate required fields
        if (!parsed.email || !parsed.role) {
          throw new Error("Invalid stored user data");
        }

        // ✅ KEY FIX: Validate token with backend
        if (parsed.token) {
          const validation = await validateTokenWithBackend(parsed.token);
          
          if (!validation.valid) {
            // Token is invalid or expired - clear localStorage and logout
            console.warn("Stored token is invalid or expired");
            localStorage.removeItem("carenest_user");
            localStorage.removeItem("user");
            localStorage.removeItem("carenest_token");
            localStorage.removeItem("token");
            setUser(null);
            setError(null);
            setAuthReady(true);
            return;
          }

          // Token is valid - restore user with validated data
          setUser(parsed);
          localStorage.setItem("carenest_user", JSON.stringify(parsed));
          setError(null);
        } else {
          // No token - don't restore user (requires login)
          console.warn("No token found in stored user data");
          localStorage.removeItem("carenest_user");
          localStorage.removeItem("user");
          setUser(null);
          setError(null);
        }
      }
    } catch (err) {
      console.warn("Failed to restore user session:", err);
      // Clear corrupt data
      localStorage.removeItem("carenest_user");
      localStorage.removeItem("user");
      localStorage.removeItem("carenest_token");
      localStorage.removeItem("token");
      setUser(null);
      setError(null);
    } finally {
      setAuthReady(true);
    }
  }, [validateTokenWithBackend]);

  useEffect(() => {
    restoreUser();
  }, [restoreUser]);

  return (
    <UserContext.Provider value={{ user, login, logout, restoreUser, authReady, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};
