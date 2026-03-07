import React, { createContext, useState, useContext, useCallback, useEffect } from "react";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const login = useCallback((userData) => {
    const userWithDefaults = {
      email: userData.email,
      name: userData.name || "",
      role: userData.role,
      id: userData.id || null,
      ...userData,
    };
    setUser(userWithDefaults);
    localStorage.setItem("carenest_user", JSON.stringify(userWithDefaults));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("carenest_user");
  }, []);

  const restoreUser = useCallback(() => {
    const stored = localStorage.getItem("carenest_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.warn("Failed to restore user session:", e);
      }
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    restoreUser();
  }, [restoreUser]);

  return (
    <UserContext.Provider value={{ user, login, logout, restoreUser, authReady }}>
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
