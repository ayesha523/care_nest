import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";

function ProtectedRoute({ children, roles = [] }) {
  const { user, authReady, error } = useUser();
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

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    const fallbackPath = user.role === "elderly" ? "/elderly-dashboard" : "/companion-dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

export default ProtectedRoute;
