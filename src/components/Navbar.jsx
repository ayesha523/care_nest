import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Drawer from "./Drawer";

/**
 * Navbar Component
 * Main navigation bar with user authentication status, search functionality, and notifications
 * Supports both authenticated and unauthenticated users with role-based navigation
 * 
 * Features:
 * - User authentication state display
 * - Real-time notification polling (10s intervals)
 * - Search companion functionality
 * - Role-based navigation (Elderly vs Companion)
 * - Mobile responsive with hamburger menu
 * - User dropdown with profile management
 * 
 * @returns {React.ReactNode} Navigation bar component
 */
function Navbar() {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useUser();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  /**
   * Fetches unread notification count from API
   * Polls every 10 seconds to update notification badge
   */
  useEffect(() => {
    if (!currentUser) return;

    const fetchUnreadCounts = async () => {
      try {
        const token = localStorage.getItem("carenest_token") || localStorage.getItem("token");
        if (!token) {
          console.warn("No authentication token found for notification fetch");
          return;
        }

        const notifRes = await fetch("/api/notifications?unread=true", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setUnreadNotifications(Array.isArray(notifData) ? notifData.length : 0);
        } else if (notifRes.status === 401) {
          // Token may have expired
          console.warn("Unauthorized - notification fetch failed");
          logout();
        }
      } catch (error) {
        console.log("Error fetching unread counts:", error);
      }
    };

    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [currentUser, logout]);

  /**
   * Handles search form submission
   * Navigates to companion search page with query
   * @param {Event} e - Form submit event
   */
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-companions?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  /**
   * Handles user logout
   * Clears authentication state and redirects to home
   */
  const handleLogout = () => {
    logout();
    navigate("/");
    setDropdownOpen(false);
  };

  /**
   * Navigates to user's role-specific dashboard
   * @param {Event} e - Click event
   */
  const goToDashboard = (e) => {
    e.preventDefault();
    if (currentUser?.role === "elderly") {
      navigate("/elderly-dashboard");
    } else {
      navigate("/companion-dashboard");
    }
    setDropdownOpen(false);
  };

  /**
   * Extracts initials from user name for avatar display
   * @param {string} name - User's full name
   * @returns {string} Up to 2 character initials in uppercase
   */
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="navbar-new">
        {/* Left: Logo & Brand */}
        <div className="navbar-left">
          <div className="navbar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <div className="logo-icon">CN</div>
            <span className="logo-text">CareNest</span>
          </div>

          {/* Search bar - visible only when logged in */}
          {currentUser && (
            <form className="navbar-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search companions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search companions"
              />
              <button type="submit" className="search-btn" aria-label="Search">🔍</button>
            </form>
          )}
        </div>

        {/* Center: Quick Navigation (desktop) */}
        {currentUser && (
          <nav className="navbar-center">
            <button 
              onClick={goToDashboard}
              className="nav-link"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Dashboard
            </button>
            {currentUser.role === "elderly" && (
              <>
                <a href="/care-assessment" className="nav-link">
                  📋 Assessment
                </a>
                <a href="/job-postings" className="nav-link">
                  💼 Jobs
                </a>
              </>
            )}
            <a href="/notifications" className="nav-link notification-link">
              📢 Notifications
              {unreadNotifications > 0 && <span className="badge">{unreadNotifications}</span>}
            </a>
            <a href="/profile-edit" className="nav-link">
              👤 Profile
            </a>
          </nav>
        )}

        {/* Right: User Menu or Auth Links */}
        <div className="navbar-right">
          {currentUser ? (
            <div className="user-menu">
              {/* User Avatar Button */}
              <button
                className="user-avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title={currentUser.fullName || currentUser.name}
              >
                <div className="user-avatar">
                  {getInitials(currentUser.fullName || currentUser.name)}
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <p>{currentUser.fullName || currentUser.name}</p>
                    <small>{currentUser.role === "elderly" ? "👵 Elderly" : "🩺 Companion"}</small>
                  </div>

                  <div className="dropdown-divider"></div>

                  <button className="dropdown-item" onClick={goToDashboard}>
                    📊 Go to Dashboard
                  </button>

                  <a href="/profile-edit" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    ✏️ Edit Profile
                  </a>

                  <a href="/notifications" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    📢 Notifications ({unreadNotifications})
                  </a>

                  {currentUser.role === "elderly" && (
                    <>
                      <a href="/care-assessment" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        📋 Care Assessment
                      </a>
                      <a href="/job-postings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        💼 Job Postings
                      </a>
                    </>
                  )}

                  {currentUser.role === "elderly" && (
                    <a href="/emergency-contacts" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      🆘 Emergency Contacts
                    </a>
                  )}

                  {currentUser.role === "companion" && (
                    <a href="/availability" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      📅 Manage Availability
                    </a>
                  )}

                  <div className="dropdown-divider"></div>

                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <nav className="auth-links">
              <a href="/elderly-login" className="auth-link elderly-login">
                👵 Elderly Login
              </a>
              <a href="/companion-login" className="auth-link companion-login">
                🩺 Companion Login
              </a>
            </nav>
          )}

          {/* Mobile hamburger */}
          <button className="hamburger-new" onClick={() => setOpen(!open)}>
            ☰
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <Drawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default Navbar;
