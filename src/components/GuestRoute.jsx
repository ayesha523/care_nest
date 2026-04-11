import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";

function GuestRoute({ children }) {
  const { user, authReady } = useUser();
  const location = useLocation();

  if (!authReady) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0d1a19", flexDirection: "column", gap: 16 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
          style={{ width: 40, height: 40, border: "3px solid rgba(31,181,165,0.2)", borderTopColor: "#1fb5a5", borderRadius: "50%" }} />
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>Loading...</span>
      </div>
    );
  }

  if (user) {
    const normalizedUserRole = String(user.role || "").toLowerCase().trim();
    const path = String(location.pathname || "").toLowerCase();
    let targetAuthRole = "";

    if (path.includes("/elderly-login") || path.includes("/elderly-signup")) {
      targetAuthRole = "elderly";
    } else if (path.includes("/companion-login") || path.includes("/companion-signup")) {
      targetAuthRole = "companion";
    }

    // Allow role switch
    if (targetAuthRole && targetAuthRole !== normalizedUserRole) {
      return children;
    }

    const dashboardPath = normalizedUserRole === "elderly" ? "/elderly-dashboard" : "/companion-dashboard";
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}

export default GuestRoute;
