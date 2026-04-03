import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

/**
 * GuestRoute Component
 * Prevents authenticated users from accessing login/signup pages
 * Redirects logged-in users to their appropriate dashboard
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The login/signup component to render if user is not authenticated
 * @returns {React.ReactNode} Login page or redirect to dashboard
 */
function GuestRoute({ children }) {
  const { user, authReady, error } = useUser();

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

  // If user is logged in, redirect to their dashboard
  if (user) {
    const dashboardPath = user.role === "elderly" ? "/elderly-dashboard" : "/companion-dashboard";
    console.log(`GuestRoute: User is authenticated, redirecting to ${dashboardPath}`);
    return <Navigate to={dashboardPath} replace />;
  }

  // Log any authentication errors but allow render (user is not authenticated)
  if (error) {
    console.warn("GuestRoute: Authentication error present:", error);
  }

  // If user is not logged in, show the login/signup page
  return children;
}

export default GuestRoute;
