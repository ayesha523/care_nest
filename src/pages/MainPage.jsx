import React from "react";
import { Link } from "react-router-dom";
import "../styles/pages.css";

function MainPage() {
  return (
    <div className="main">
      <div className="dp">
        <img
          className="photo1"
          src="/assests/photos/ChatGPT Image Feb 13, 2026, 01_10_56 PM.png"
          alt="CareNest"
        />
      </div>

      <div className="buttons">
        <p className="line1">
          Welcome to <span className="highlight">CareNest</span>
        </p>
        <p className="line2">
          login as a <span className="highlight">companion</span> or an{" "}
          <span className="highlight">elderly</span> to get started
        </p>

        <Link to="/companion-login">
          <button className="bcompanion">Companion</button>
        </Link>

        <Link to="/elderly-login">
          <button className="belderly">Elderly</button>
        </Link>
      </div>
    </div>
  );
}

export default MainPage;
