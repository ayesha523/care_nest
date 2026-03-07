import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/pages.css";

function MainPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    { icon: "💚", title: "Compassionate Care", desc: "Professional caregivers" },
    { icon: "🏠", title: "At Your Doorstep", desc: "Home-based services" },
    { icon: "⭐", title: "Verified Companions", desc: "Trusted professionals" },
  ];

  return (
    <div className="main">
      {/* Decorative background elements */}
      <div className="main-bg-decoration">
        <div className="circle-decoration circle-1"></div>
        <div className="circle-decoration circle-2"></div>
        <div className="circle-decoration circle-3"></div>
      </div>

      <div className={`dp ${isVisible ? 'fade-in-left' : ''}`}>
        <div className="image-container">
          <img
            className="photo1"
            src="/assests/photos/carenest-hero.png"
            alt="CareNest"
          />
          <div className="image-overlay"></div>
        </div>
      </div>

      <div className={`buttons ${isVisible ? 'fade-in-right' : ''}`}>
        <div className="hero-content">
          <p className="line1">
            Welcome to <span className="highlight">CareNest</span>
          </p>
          <p className="line2">
            Login as service giver <span className="highlight">(Companion)</span>{" "}
            or service taker <span className="highlight">(Elderly)</span> to get
            started
          </p>

          <div className="feature-cards">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="feature-icon">{feature.icon}</span>
                <div className="feature-text">
                  <h4>{feature.title}</h4>
                  <p>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="action-buttons">
            <Link to="/companion-login" className="button-link">
              <button className="bcompanion">
                <span className="button-icon">👥</span>
                <span className="button-content">
                  <span className="button-title">Companion</span>
                  <span className="button-subtitle">Provide Care</span>
                </span>
              </button>
            </Link>

            <Link to="/elderly-login" className="button-link">
              <button className="belderly">
                <span className="button-icon">🏡</span>
                <span className="button-content">
                  <span className="button-title">Elderly</span>
                  <span className="button-subtitle">Find Care</span>
                </span>
              </button>
            </Link>
          </div>

          <div className="signup-prompt">
            <p>Don't have an account?</p>
            <div className="signup-links">
              <Link to="/companion-signup" className="signup-link">Companion Signup</Link>
              <span className="divider">|</span>
              <Link to="/elderly-signup" className="signup-link">Elderly Signup</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
