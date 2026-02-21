import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/pages.css";

function CompanionLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Add login logic here
    console.log("Login attempt:", { email, password });
    navigate("/companion-landing");
  };

  return (
    <div className="login-main">
      <div className="login-container">
        <p className="line2">Welcome companion</p>
        <p className="line1">Login to your account</p>

        <form onSubmit={handleLogin}>
          <input
            className="mailbox"
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="passbox"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="blogin">
            Login
          </button>
        </form>

        <p>
          Don't have an account? <a href="#signup">Sign up</a>
        </p>

        <p style={{ marginTop: "20px" }}>
          <Link to="/" style={{ color: "#1fb5a5", textDecoration: "none" }}>
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default CompanionLogin;
