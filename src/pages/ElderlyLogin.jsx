<<<<<<< HEAD
import React from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { loginUser } from "../services/authService";
import { useUser } from "../context/UserContext";

function ElderlyLogin() {
  const navigate = useNavigate();
  const { login } = useUser();

  const handleLogin = async ({ email, password }) => {
    const response = await loginUser({ email, password, role: "elderly" });

    if (!response.success) {
      return response;
    }

    const userData = {
      ...(response.data?.user || { email, role: "elderly" }),
      token: response.data?.token || "",
    };
    login(userData);
    navigate("/home");
    return { success: true };
  };

  return (
    <AuthForm
      mode="login"
      welcomeText="Welcome elderly user!"
      title="Login to your account"
      submitText="Login"
      onSubmit={handleLogin}
      alternateText="Don't have an account?"
      alternateLinkText="Sign up"
      alternateLinkTo="/elderly-signup"
    />
  );
}

export default ElderlyLogin;
=======
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/pages.css";

function ElderlyLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Navigate to Home page on login
    console.log("Login clicked, navigating to /home");
    navigate("/home");
  };

  return (
    <div className="login-main">
      <div className="login-container">
        <p className="line2">Welcome elderly user!</p>
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

export default ElderlyLogin;
>>>>>>> d621a4f30e9541290718ed33ccc43e99faf7860e
