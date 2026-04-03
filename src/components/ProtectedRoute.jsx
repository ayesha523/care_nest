import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

/**
 * ProtectedRoute Component
 * Guards routes that require authentication and optional role-based access control
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The component to render if access is granted
 * @param {Array<string>} [props.roles=[]] - Allowed user roles (if empty, any authenticated user can access)
 * @returns {React.ReactNode} Protected route component or redirect
 */
function ProtectedRoute({ children, roles = [] }) {
  const { user, authReady, error } = useUser();
  const location = useLocation();

  // Show loading state while authentication status is being determined
  if (!authReady) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5"
      }}>
        <div style={{
          textAlign: "center",
          color: "#666"
        }}>
          <div style={{
            fontSize: "18px",
            marginBottom: "10px",
            fontWeight: "500"
          }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    console.warn("ProtectedRoute: User not authenticated, redirecting to home");
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Check role-based access control if roles are specified
  if (roles.length > 0 && !roles.includes(user.role)) {
    console.warn(`ProtectedRoute: User role '${user.role}' not in allowed roles:`, roles);
    const fallbackPath = user.role === "elderly" ? "/elderly-dashboard" : "/companion-dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  // Log any authentication errors but allow render (user is authenticated)
  if (error) {
    console.warn("ProtectedRoute: Authentication error present:", error);
  }

  return children;
}

export default ProtectedRoute;
