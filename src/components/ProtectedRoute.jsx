import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

function ProtectedRoute({ children, roles = [] }) {
  const { user, authReady } = useUser();
  const location = useLocation();

  if (!authReady) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    const fallbackPath = user.role === "elderly" ? "/home" : "/companion-landing";
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

export default ProtectedRoute;
