import React, { createContext, useState, useContext, useCallback, useEffect } from "react";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback((userData) => {
    try {
      if (!userData.email || !userData.role) throw new Error("Invalid user data: email and role are required");

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

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem("carenest_user");
    localStorage.removeItem("user");
    localStorage.removeItem("carenest_token");
    localStorage.removeItem("token");
  }, []);

  /**
   * Tries to validate token with backend, but GRACEFULLY falls back to
   * stored session if the backend is unreachable (network error / server down).
   * This fixes the core login issue where users were being logged out when
   * the backend server wasn't running.
   */
  const validateTokenWithBackend = useCallback(async (token) => {
    const endpoints = [
      process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL.replace(/\/$/, "")}/api/auth/validate-token`
        : "/api/auth/validate-token",
      "/api/auth/validate-token",
      "http://localhost:5000/api/auth/validate-token",
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return { valid: data.success, user: data.data?.user, reachable: true };
        }
        // Got a real HTTP error (401, 403 etc) — token is explicitly rejected
        if (response.status === 401 || response.status === 403) {
          return { valid: false, reachable: true };
        }
      } catch (e) {
        // Network error / timeout — try next endpoint
        continue;
      }
    }
    // All endpoints unreachable — backend is down, gracefully allow stored session
    console.warn("Backend unreachable during token validation — restoring stored session.");
    return { valid: true, reachable: false };
  }, []);

  const restoreUser = useCallback(async () => {
    try {
      const stored = localStorage.getItem("carenest_user") || localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.email || !parsed.role) throw new Error("Invalid stored user data");

        if (parsed.token) {
          const validation = await validateTokenWithBackend(parsed.token);

          if (!validation.valid) {
            // Token was explicitly rejected by backend — clear session
            console.warn("Stored token rejected by server. Clearing session.");
            logout();
            setAuthReady(true);
            return;
          }

          // Valid or backend unreachable — restore session
          const restoredUser = validation.user
            ? { ...parsed, ...validation.user, token: parsed.token }
            : parsed;
          setUser(restoredUser);
          localStorage.setItem("carenest_user", JSON.stringify(restoredUser));
          localStorage.setItem("user", JSON.stringify(restoredUser));
          setError(null);
        } else {
          // No token — clear session
          logout();
        }
      }
    } catch (err) {
      console.warn("Failed to restore session:", err);
      logout();
    } finally {
      setAuthReady(true);
    }
  }, [validateTokenWithBackend, logout]);

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
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
