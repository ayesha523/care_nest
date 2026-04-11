import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function Drawer({ open, onClose }) {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useUser();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    onClose();
  };

  const goToDashboard = () => {
    if (currentUser?.role === "elderly") {
      handleNavigation("/elderly-dashboard");
    } else {
      handleNavigation("/companion-dashboard");
    }
  };

  return (
    <div className={`drawer ${open ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose}>
        ✕
      </button>

      {currentUser ? (
        <nav className="drawer-nav">
          <div className="drawer-header">
            <p>{currentUser.fullName || currentUser.name}</p>
            <small>{currentUser.role === "elderly" ? "👵 Elderly" : "🩺 Companion"}</small>
          </div>

          <div className="drawer-divider"></div>

          <button 
            onClick={goToDashboard}
            className="drawer-link"
            style={{ background: "none", border: "none", width: "100%", textAlign: "left" }}
          >
            📊 Dashboard
          </button>

          <a href="/notifications" onClick={onClose} className="drawer-link">
            📢 Notifications
          </a>

          <a href="/profile-edit" onClick={onClose} className="drawer-link">
            ✏️ Edit Profile
          </a>

          {currentUser.role === "elderly" && (
            <a href="/emergency-contacts" onClick={onClose} className="drawer-link">
              🆘 Emergency Contacts
            </a>
          )}

          {currentUser.role === "companion" && (
            <a href="/availability" onClick={onClose} className="drawer-link">
              📅 Manage Availability
            </a>
          )}

          <div className="drawer-divider"></div>

          <button className="drawer-link logout-link" onClick={handleLogout}>
            🚪 Logout
          </button>
        </nav>
      ) : (
        <nav className="drawer-nav">
          <div className="drawer-divider"></div>
          <a href="/elderly-login" onClick={onClose} className="drawer-link">
            👵 Elderly Login
          </a>
          <a href="/companion-login" onClick={onClose} className="drawer-link">
            🩺 Companion Login
          </a>
          <div className="drawer-divider"></div>
          <a href="#home" onClick={onClose} className="drawer-link">
            Home
          </a>
          <a href="#about" onClick={onClose} className="drawer-link">
            About Us
          </a>
          <a href="#hire" onClick={onClose} className="drawer-link">
            Hire
          </a>
        </nav>
      )}
    </div>
  );
}

export default Drawer;
